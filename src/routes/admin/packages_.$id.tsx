import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImageField, MediaPicker, type MediaAsset } from '@/components/admin/MediaPicker'
import { supabase } from '@/lib/supabase'
import { ItineraryEditor } from '@/components/admin/ItineraryEditor'
import type { ItineraryDayForm } from '@/components/admin/ItineraryEditor'
import { DynamicListEditor } from '@/components/admin/DynamicListEditor'
import { StringListEditor } from '@/components/admin/StringListEditor'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Trash2,
  Eye,
  Package,
  History,
  Lock,
  Unlock,
  FileDown,
  CheckCircle2,
  Archive,
  RefreshCw,
  Printer,
  Copy,
  FileText,
  Upload,
  Smile,
  Sparkles,
  Camera,
  Video,
  Instagram,
  Youtube,
  Image as ImageIcon,
  Heart,
  TrendingUp,
  Globe,
  Star,
  Check,
  AlertCircle,
  CircleHelp,
  Search,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import {
  getPackageDocumentsFn,
  createOrUpdateDocumentFn,
  archiveDocumentFn,
  restoreDocumentFn,
  uploadDocumentFileFn
} from '@/lib/itinerary-pdf-fns'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  getPackageById,
  createPackage,
  updatePackage,
  replaceItineraryDays,
  savePackageRevision,
} from '@/lib/queries/packages'
import { getPublishedDestinations } from '@/lib/queries/destinations'
import { getAllTripCaptains } from '@/lib/queries/admin'
import { getFaqLibraryPresets } from '@/lib/queries/cms'
import { getAllHotels } from '@/lib/queries/hotels-buses'
import { useAdminAuth } from '@/hooks/use-admin-auth'
import type { FaqItem, PolicyItem } from '@/types/supabase'

export const Route = createFileRoute('/admin/packages_/$id')({
  component: PackageFormPage,
})

const CATEGORIES = [
  'Booking', 'Transport', 'Stay', 'Meals', 'Safety', 'Cancellation', 'Payment', 'Packing', 'Food', 'Weather', 'Activities'
]

const CATEGORY_COLORS: Record<string, string> = {
  Booking: 'bg-indigo-50 text-indigo-700 border-indigo-200/50',
  Transport: 'bg-blue-50 text-blue-700 border-blue-200/50',
  Stay: 'bg-emerald-50 text-emerald-700 border-emerald-200/50',
  Meals: 'bg-orange-50 text-orange-700 border-orange-200/50',
  Safety: 'bg-rose-50 text-rose-700 border-rose-200/50',
  Cancellation: 'bg-red-50 text-red-700 border-red-200/50',
  Payment: 'bg-amber-50 text-amber-700 border-amber-200/50',
  Packing: 'bg-purple-50 text-purple-700 border-purple-200/50',
  Food: 'bg-teal-50 text-teal-700 border-teal-200/50',
  Weather: 'bg-sky-50 text-sky-700 border-sky-200/50',
  Activities: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/50',
}

const packageSchema = z.object({
  destination_id: z.string().min(1, 'Destination is required'),
  trip_captain_id: z.string().optional(),
  name: z.string().min(2, 'Package name is required'),
  slug: z.string().min(2, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with dashes'),
  tagline: z.string().optional(),
  duration: z.string().optional(),
  duration_days: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : Math.round(num);
  }, z.number().int().min(1).optional()),
  duration_nights: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : Math.round(num);
  }, z.number().int().min(0).optional()),
  difficulty: z.enum(['EASY', 'MODERATE', 'DIFFICULT', 'EXTREME']).default('EASY'),
  group_size_min: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : Math.round(num);
  }, z.number().int().min(1).optional()).default(1),
  group_size_max: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : Math.round(num);
  }, z.number().int().min(1).optional()).default(25),
  starting_price: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  }, z.number().min(0).optional()),
  maximum_price: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  }, z.number().min(0).optional()),
  pickup_point: z.string().optional(),
  drop_point: z.string().optional(),
  short_description: z.string().optional(),
  overview: z.string().optional(),
  category: z.string().optional(),
  status: z.preprocess((val) => {
    if (typeof val === 'string') return val.toUpperCase().trim();
    return val;
  }, z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT')),
  is_featured: z.boolean().default(false),
  priority: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : Math.round(num);
  }, z.number().int().min(0).optional()).default(0),
  hero_banner: z.string().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  hotel_id: z.string().optional().nullable(),
})

type PackageFormValues = z.infer<typeof packageSchema>

const PACKAGE_TEMPLATES = {
  WEEKEND: {
    name: "Weekend Trip",
    duration: "2 Nights / 3 Days",
    duration_days: 3,
    duration_nights: 2,
    difficulty: "EASY" as const,
    group_size_min: 10,
    group_size_max: 20,
    short_description: "A perfect 3-day weekend road trip getaway with a close-knit group of explorers.",
    overview: "Escape the city hustle and embark on a curated 3-day road travel experience designed around slow travel, verified stays, and authentic local experiences with an experienced Nomadik Trip Captain.",
    inclusions: [
      "Tempo Traveller transport for entire route",
      "2 Nights stay in premium verified boutique properties",
      "2 Breakfasts and 2 Dinners (Buffet style)",
      "Nomadik Trip Captain support & storytelling session",
      "All entry fees and local permissions"
    ],
    exclusions: [
      "Lunches and any mid-day snacks",
      "Personal expenses or shopping",
      "Any adventure activities (e.g. paragliding, rafting)",
      "Travel Insurance"
    ],
    packing_list: [
      "Comfortable walking shoes & extra socks",
      "Reusable water bottle (eco-friendly)",
      "Personal toiletries & medicine kit",
      "Power bank (minimum 10000 mAh)",
      "Comfortable backpack (no heavy suitcases)"
    ],
    faqs: [
      { question: "What is the typical age group for this trip?", answer: "Most of our co-travelers are between 20 to 38 years old. We curate our groups to ensure shared vibes and interests." },
      { question: "Is this trip suitable for solo travelers?", answer: "Absolutely! Over 60% of our travelers join solo. The convoy style and group activities make it easy to connect and build bonds." }
    ]
  },
  SPIRITUAL: {
    name: "Spiritual Trip",
    duration: "3 Nights / 4 Days",
    duration_days: 4,
    duration_nights: 3,
    difficulty: "EASY" as const,
    group_size_min: 8,
    group_size_max: 18,
    short_description: "A soul-stirring spiritual journey curated for deep connection, sacred rituals, and historic ghats.",
    overview: "Walk the path of the mystics. This caravan experience is curated for spiritual seekers seeking temple visits, local history, private Ganga Aarti viewings, and evening stories under the stars.",
    inclusions: [
      "Air-conditioned AC vehicle for all transfers",
      "3 Nights stay in premium heritage hotels",
      "All breakfasts and dinners (100% vegetarian)",
      "Local spiritual coordinator & entry guide",
      "Reserved boat seating for evening Aarti"
    ],
    exclusions: [
      "Lunches",
      "Individual ritual fees or donations",
      "Personal guides or porter fees"
    ],
    packing_list: [
      "Traditional Indian ethnic wear (white/light colors recommended)",
      "Slip-on shoes or sandals (easy to remove at temples)",
      "Small shoulder bag for carrying keys/water",
      "Personal hand sanitizer & mask"
    ],
    faqs: [
      { question: "What is the dress code for temple entries?", answer: "We recommend traditional modest clothing. Men can wear Kurta-Pyjamas and women Salwar-Kameez or sarees. Avoid shorts or sleeveless tops." },
      { question: "Will food be pure vegetarian?", answer: "Yes, all meals provided during spiritual trips are 100% vegetarian, prepared cleanly in local heritage kitchens." }
    ]
  },
  BACKPACKING: {
    name: "Backpacking Adventure",
    duration: "5 Nights / 6 Days",
    duration_days: 6,
    duration_nights: 5,
    difficulty: "MODERATE" as const,
    group_size_min: 6,
    group_size_max: 16,
    short_description: "An intensive adventure route crossing majestic passes, staying in local homestays, and day treks.",
    overview: "For the wild at heart. Hit the roads, cross rivers, hike to hidden waterfalls, and spend evenings sharing stories around bonfire circles at rustic local host homestays.",
    inclusions: [
      "Convoy shared vehicle (4x4 or high clearance)",
      "5 Nights stay in rustic homestays / eco-camps",
      "All meals (Breakfast, Packed lunch, Dinner) on trekking days",
      "Certified wilderness guide and first responder",
      "Trekking gear (walking poles, gaiters, sleeping bag liners)"
    ],
    exclusions: [
      "Alcoholic beverages and cold drinks",
      "Any off-route sightseeing or cab bookings",
      "Porter charges for carrying personal luggage"
    ],
    packing_list: [
      "Backpack (50L to 65L) with rain cover",
      "Sturdy hiking boots (broken in) with good grip",
      "Windproof & waterproof jacket (Gore-Tex or similar)",
      "Quick-dry towels and change of active clothes",
      "Personal water bottle with purification filter"
    ],
    faqs: [
      { question: "How physically fit do I need to be?", answer: "This trip involves walking 5-8 km daily on hilly terrain. Regular cardio exercises 2 weeks before the trip are highly recommended." },
      { question: "What is the mobile connectivity like on the trail?", answer: "Connectivity will be patchy. Only BSNL/Jio work in most remote valleys, so prepare for a digital detox." }
    ]
  },
  LUXURY: {
    name: "Luxury Escapade",
    duration: "4 Nights / 5 Days",
    duration_days: 5,
    duration_nights: 4,
    difficulty: "EASY" as const,
    group_size_min: 4,
    group_size_max: 12,
    short_description: "Premium handpicked resorts, private SUV transfers, and gourmet culinary experiences.",
    overview: "Travel in ultimate comfort. We have combined Nomadik's signature road convoys with premium 5-star properties, private SUVs, and customized gourmet dining experiences.",
    inclusions: [
      "Luxury private SUVs (Innova Crysta / Fortuner)",
      "4 Nights stay in handpicked 5-star boutique resorts",
      "All meals including gourmet chef-curated menus",
      "Dedicated premium concierge and captain support",
      "Private boat cruises or monument entries with skip-the-line access"
    ],
    exclusions: [
      "Airport airfare",
      "Spa sessions and personal salon services",
      "Premium imported liquor"
    ],
    packing_list: [
      "Smart-casuals for dining",
      "Sunglasses & wide-brimmed sun hat",
      "High SPF sunscreen & lip balm",
      "Swimwear for resort pools"
    ],
    faqs: [
      { question: "Can this package be customized further?", answer: "Yes! Since this is a luxury private layout, we can adjust dates, stays, or itinerary flows to match your requirements." }
    ]
  },
  INTERNATIONAL: {
    name: "International Convoy",
    duration: "6 Nights / 7 Days",
    duration_days: 7,
    duration_nights: 6,
    difficulty: "EASY" as const,
    group_size_min: 8,
    group_size_max: 14,
    short_description: "Cross borders on an epic road travel adventure. Premium stays, visa support, and local hosts.",
    overview: "Explore a new culture from the road. Our international convoys feature local guides, border transfers, unique stays, and deep local integration.",
    inclusions: [
      "Private transfers for entire international loop",
      "6 Nights stay in premium boutique city-center hotels",
      "Local sim cards with active data pack",
      "Bilingual local guide and Nomadik coordinator",
      "Visa guidance and document compilation support"
    ],
    exclusions: [
      "International flights",
      "Visa application fees",
      "Mandatory travel insurance"
    ],
    packing_list: [
      "Passport validation folder and printouts of visas",
      "Universal travel adapter plug",
      "Light windbreaker or shell jacket",
      "Multi-currency travel card"
    ],
    faqs: [
      { question: "Do you book flight tickets?", answer: "No, we do not book flights directly. However, we will coordinate the group arrivals and suggest flight paths that match our convoy start times." },
      { question: "Is the tourist visa guaranteed?", answer: "While we provide all invitation letters and booking vouchers, the visa issuance remains at the sole discretion of the embassy." }
    ]
  }
}

function PackageFormPage() {
  const { id } = Route.useParams()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { admin } = useAdminAuth()

  const [itinerary, setItinerary] = useState<ItineraryDayForm[]>([])
  const [highlights, setHighlights] = useState<string[]>([])
  const [inclusions, setInclusions] = useState<string[]>([])
  const [exclusions, setExclusions] = useState<string[]>([])
  const [packingList, setPackingList] = useState<string[]>([])
  const [gallery, setGallery] = useState<any[]>([])
  const [isSavedRecently, setIsSavedRecently] = useState(false)


  const [videos, setVideos] = useState<any[]>([])
  const [reels, setReels] = useState<any[]>([])
  const [memories, setMemories] = useState<any[]>([])
  const [tripMoments, setTripMoments] = useState<any[]>([])
  const [experienceStats, setExperienceStats] = useState<any>({
    travelers: 420,
    stories: 178,
    photos: 980,
    videos: 56,
    reels: 32,
    avg_rating: 4.9
  })
  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false)
  const [policies, setPolicies] = useState<PolicyItem[]>([])
  const [faqs, setFaqs] = useState<FaqItem[]>([])
  const [mappedFaqIds, setMappedFaqIds] = useState<string[]>([])
  const [customFaqs, setCustomFaqs] = useState<any[]>([])
  const [librarySearch, setLibrarySearch] = useState('')
  const [transport, setTransport] = useState<any>({
    vehicle_name: '',
    vehicle_type: '',
    cover_image: '',
    gallery: [],
    features: [],
    pickup_points: [],
    drop_points: [],
    departure_time: '',
    arrival_time: '',
    seat_capacity: 17,
    available_seats: 17,
    trip_captain: true,
    ac: true,
    music: true,
    charging_ports: true
  })
  const [accommodation, setAccommodation] = useState<any>({
    hotel_name: '',
    hotel_category: '3 Star',
    location: '',
    cover_image: '',
    gallery: [],
    room_types: ['Double Sharing', 'Triple Sharing', 'Quad Sharing'],
    amenities: ['Wifi', 'Geyser', 'TV', 'Parking', 'Room Service'],
    google_maps: '',
    check_in: '12:00 PM',
    check_out: '11:00 AM'
  })

  const { data: pkg, isLoading: loadingPkg } = useQuery({
    queryKey: ['package', id],
    queryFn: () => getPackageById(id),
    enabled: !isNew,
  })

  const { data: destinations = [] } = useQuery({
    queryKey: ['destinations_dropdown'],
    queryFn: getPublishedDestinations,
  })

  const { data: captains = [] } = useQuery({
    queryKey: ['trip_captains_dropdown'],
    queryFn: getAllTripCaptains,
  })

  const { data: hotels = [] } = useQuery({
    queryKey: ['hotels_dropdown_active'],
    queryFn: getAllHotels,
  })

  const { data: libraryPresets = [] } = useQuery({
    queryKey: ['faq_library_presets'],
    queryFn: getFaqLibraryPresets
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
    reset,
  } = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema) as any,
      defaultValues: {
        difficulty: 'EASY',
        group_size_min: 1,
        group_size_max: 25,
        status: 'DRAFT',
        is_featured: false,
        priority: 0,
        category: 'WEEKEND',
        hotel_id: '',
      },
    })

  useEffect(() => {
    const hasUnsavedChanges = 
      isDirty || 
      JSON.stringify(inclusions) !== JSON.stringify(pkg?.inclusions ?? []) ||
      JSON.stringify(exclusions) !== JSON.stringify(pkg?.exclusions ?? [])

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty, inclusions, exclusions, pkg])

  const hasUnsavedChanges = 
    isDirty || 
    JSON.stringify(inclusions) !== JSON.stringify(pkg?.inclusions ?? []) ||
    JSON.stringify(exclusions) !== JSON.stringify(pkg?.exclusions ?? [])

  const handleBackClick = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Discard them and leave?')) {
        navigate({ to: '/admin/packages' })
      }
    } else {
      navigate({ to: '/admin/packages' })
    }
  }

  // Populate on edit
  useEffect(() => {
    if (pkg) {
      reset({
        destination_id: pkg.destination_id,
        trip_captain_id: pkg.trip_captain_id ?? '',
        name: pkg.name,
        slug: pkg.slug,
        tagline: pkg.tagline ?? '',
        duration: pkg.duration ?? '',
        duration_days: pkg.duration_days ?? undefined,
        duration_nights: pkg.duration_nights ?? undefined,
        difficulty: (pkg.difficulty as PackageFormValues['difficulty']) ?? 'EASY',
        group_size_min: pkg.group_size_min,
        group_size_max: pkg.group_size_max,
        starting_price: pkg.starting_price ?? undefined,
        maximum_price: pkg.maximum_price ?? undefined,
        pickup_point: pkg.pickup_point ?? '',
        drop_point: pkg.drop_point ?? '',
        short_description: pkg.short_description ?? '',
        overview: pkg.overview ?? '',
        status: pkg.status ? (pkg.status.toUpperCase().trim() as any) : 'DRAFT',
        is_featured: pkg.is_featured,
        priority: pkg.priority,
        hero_banner: pkg.hero_banner ?? '',
        seo_title: pkg.seo?.title ?? '',
        seo_description: pkg.seo?.description ?? '',
        category: pkg.category ?? 'WEEKEND',
        hotel_id: pkg.hotel_id ?? '',
      })
      setItinerary((pkg.itinerary_days ?? []).map((d) => ({
        day_number: d.day_number,
        title: d.title,
        description: d.description,
        meals: d.meals,
        stay: d.stay,
        transport: d.transport,
        image_url: d.image_url,
        is_highlight: d.is_highlight,
        sort_order: d.sort_order,
      })))
      setHighlights(pkg.highlights ?? [])
      setInclusions(pkg.inclusions ?? [])
      setExclusions(pkg.exclusions ?? [])
      setPackingList(pkg.packing_list ?? [])
      setPolicies(pkg.policies ?? [])
      setFaqs(pkg.faqs ?? [])
      const mappedIds = (pkg as any).package_faqs?.map((pf: any) => pf.faq_id).filter(Boolean) || []
      setMappedFaqIds(mappedIds)
      setCustomFaqs((pkg as any).custom_package_faqs || [])
      if ((pkg as any).transport && (pkg as any).transport.length > 0) {
        setTransport((pkg as any).transport[0])
      }
      if ((pkg as any).accommodation && (pkg as any).accommodation.length > 0) {
        setAccommodation((pkg as any).accommodation[0])
      }
      setGallery((pkg.gallery ?? []).map((item: any) => typeof item === 'string' ? { url: item, caption: '', day: null } : { url: item.url || '', caption: item.caption || '', day: item.day || null }))
      setVideos((pkg.videos ?? []).map((item: any) => typeof item === 'string' ? { url: item, title: '', day: null, type: 'youtube' } : { url: item.url || '', title: item.title || '', day: item.day || null, type: item.type || 'youtube' }))
      setReels(((pkg as any).reels ?? []).map((item: any) => typeof item === 'string' ? { url: item, caption: '', day: null } : { url: item.url || '', caption: item.caption || '', day: item.day || null }))
      setMemories((pkg as any).memories ?? [])
      setTripMoments((pkg as any).trip_moments ?? [])
      setExperienceStats((pkg as any).experience_stats ?? {
        travelers: 420,
        stories: 178,
        photos: 980,
        videos: 56,
        reels: 32,
        avg_rating: 4.9
      })
    }
  }, [pkg, reset])

  // Auto-slug from name
  const nameValue = watch('name')
  useEffect(() => {
    if (isNew && nameValue) {
      setValue('slug', nameValue.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim())
    }
  }, [isNew, nameValue, setValue])

  const saveMutation = useMutation({
    mutationFn: async (values: PackageFormValues) => {
      const { seo_title, seo_description, ...rest } = values

      // Ensure duration_days is never NaN and defaults to itinerary.length if empty/NaN
      let days = values.duration_days;
      if (days === undefined || days === null || isNaN(days)) {
        days = itinerary.length || 1;
      }

      // Ensure duration_nights is never NaN and defaults to days - 1 (min 0)
      let nights = values.duration_nights;
      if (nights === undefined || nights === null || isNaN(nights)) {
        nights = Math.max(0, days - 1);
      }

      // Ensure start_price and max_price are safe numbers
      const startPrice = values.starting_price === undefined || values.starting_price === null || isNaN(values.starting_price)
        ? 0
        : values.starting_price;

      const maxPrice = values.maximum_price === undefined || values.maximum_price === null || isNaN(values.maximum_price)
        ? 0
        : values.maximum_price;

      const statusUpper = (values.status || 'DRAFT').toUpperCase().trim();

      const payload = {
        ...rest,
        status: statusUpper,
        duration_days: days,
        duration_nights: nights,
        duration: rest.duration || `${days} Days / ${nights} Nights`,
        starting_price: startPrice,
        maximum_price: maxPrice,
        trip_captain_id: rest.trip_captain_id || null,
        highlights,
        inclusions: inclusions.map(item => item.trim()).filter(Boolean).filter((val, i, self) => self.indexOf(val) === i),
        exclusions: exclusions.map(item => item.trim()).filter(Boolean).filter((val, i, self) => self.indexOf(val) === i),
        packing_list: packingList,
        policies,
        faqs,
        gallery,
        videos,
        reels,
        memories,
        trip_moments: tripMoments,
        experience_stats: experienceStats,
        seo: seo_title || seo_description ? { title: seo_title, description: seo_description } : null,
        created_by: admin?.id ?? null,
        updated_by: admin?.id ?? null,
        hotel_id: rest.hotel_id === 'NONE' || !rest.hotel_id ? null : rest.hotel_id,
      }

      let savedPkg
      if (isNew) {
        savedPkg = await createPackage(payload as Parameters<typeof createPackage>[0])
      } else {
        // Save revision before updating
        if (pkg) await savePackageRevision(id, pkg, admin?.id)
        savedPkg = await updatePackage(id, payload as any)
      }

      // Save itinerary and capture the verified rows
      const savedDays = await replaceItineraryDays(savedPkg.id, itinerary)

      // Sync mapped library FAQs (with try-catch safety wrapper)
      try {
        await supabase.from('package_faqs').delete().eq('package_id', savedPkg.id)
        if (mappedFaqIds.length > 0) {
          const mappings = mappedFaqIds.map((faqId, idx) => ({
            package_id: savedPkg.id,
            faq_id: faqId,
            display_order: idx
          }))
          const { error } = await supabase.from('package_faqs').insert(mappings)
          if (error) throw error
        }
      } catch (err) {
        console.warn("Failed to sync package_faqs (normal if schema is not applied yet):", err)
      }

      // Sync custom FAQs (with try-catch safety wrapper)
      try {
        await supabase.from('custom_package_faqs').delete().eq('package_id', savedPkg.id)
        if (customFaqs.length > 0) {
          const customs = customFaqs.map((cf, idx) => ({
            package_id: savedPkg.id,
            question: cf.question,
            answer: cf.answer,
            category: cf.category || 'Booking',
            display_order: idx
          }))
          const { error } = await supabase.from('custom_package_faqs').insert(customs)
          if (error) throw error
        }
      } catch (err) {
        console.warn("Failed to sync custom_package_faqs (normal if schema is not applied yet):", err)
      }

      // Sync transport (with try-catch safety wrapper)
      try {
        if (transport.vehicle_name) {
          const transPayload = {
            package_id: savedPkg.id,
            vehicle_name: transport.vehicle_name,
            vehicle_type: transport.vehicle_type || '',
            cover_image: transport.cover_image || '',
            gallery: transport.gallery || [],
            features: transport.features || [],
            pickup_points: transport.pickup_points || [],
            drop_points: transport.drop_points || [],
            departure_time: transport.departure_time || '',
            arrival_time: transport.arrival_time || '',
            seat_capacity: Number(transport.seat_capacity || 0),
            available_seats: Number(transport.available_seats || 0),
            trip_captain: !!transport.trip_captain,
            ac: !!transport.ac,
            music: !!transport.music,
            charging_ports: !!transport.charging_ports
          }

          if (transport.id) {
            const { error } = await supabase.from('transport').update(transPayload).eq('id', transport.id)
            if (error) throw error
          } else {
            const { error } = await supabase.from('transport').insert(transPayload)
            if (error) throw error
          }
        } else {
          // If name is cleared, delete transport row
          await supabase.from('transport').delete().eq('package_id', savedPkg.id)
        }
      } catch (err) {
        console.warn("Failed to sync transport (normal if schema is not applied yet):", err)
      }

      // Sync accommodation (with try-catch safety wrapper)
      try {
        if (accommodation.hotel_name) {
          const accPayload = {
            package_id: savedPkg.id,
            hotel_name: accommodation.hotel_name,
            hotel_category: accommodation.hotel_category || '3 Star',
            location: accommodation.location || '',
            cover_image: accommodation.cover_image || '',
            gallery: accommodation.gallery || [],
            room_types: accommodation.room_types || [],
            amenities: accommodation.amenities || [],
            google_maps: accommodation.google_maps || '',
            check_in: accommodation.check_in || '',
            check_out: accommodation.check_out || ''
          }

          if (accommodation.id) {
            const { error } = await supabase.from('accommodation').update(accPayload).eq('id', accommodation.id)
            if (error) throw error
          } else {
            const { error } = await supabase.from('accommodation').insert(accPayload)
            if (error) throw error
          }
        } else {
          // If hotel_name is cleared, delete accommodation row
          await supabase.from('accommodation').delete().eq('package_id', savedPkg.id)
        }
      } catch (err) {
        console.warn("Failed to sync accommodation (normal if schema is not applied yet):", err)
      }

      return { savedPkg, savedDays }
    },
    onSuccess: ({ savedPkg, savedDays }) => {
      // Invalidate all relevant query caches so both admin and public see fresh data
      qc.invalidateQueries({ queryKey: ['packages'] })
      qc.invalidateQueries({ queryKey: ['package', savedPkg.id] })
      qc.invalidateQueries({ queryKey: ['package', id] })
      if (savedPkg.slug) {
        qc.invalidateQueries({ queryKey: ['package', savedPkg.slug] })
      }

      // Re-hydrate itinerary state from the verified database rows
      if (savedDays && savedDays.length > 0) {
        setItinerary(savedDays.map((d: any) => ({
          day_number: d.day_number,
          title: d.title,
          description: d.description,
          meals: d.meals,
          stay: d.stay,
          transport: d.transport,
          image_url: d.image_url,
          is_highlight: d.is_highlight,
          sort_order: d.sort_order,
        })))
      }

      toast.success(isNew ? 'Package created!' : 'Package updated!')
      setIsSavedRecently(true)
      setTimeout(() => setIsSavedRecently(false), 2000)
      if (isNew) navigate({ to: '/admin/packages/$id', params: { id: savedPkg.id } })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const onInvalid = (errors: any) => {
    console.error('Validation errors:', errors)
    const errList = Object.entries(errors)
    if (errList.length > 0) {
      const [field, err] = errList[0]
      const msg = (err as any)?.message || 'Invalid value'
      toast.error(`Validation Error (${field}): ${msg}`)
    } else {
      toast.error('Please check the form for errors.')
    }
  }

  if (!isNew && loadingPkg) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  const slugValue = watch('slug')

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" size="icon" onClick={handleBackClick}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Package className="h-4 w-4 text-primary" />
          </div>
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold font-poppins">
            {isNew ? 'New Package' : `Edit: ${pkg?.name ?? '...'}`}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <a href={`/packages/${slugValue}`} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5 font-poppins">
                <Eye className="h-4 w-4" /> Preview
              </Button>
            </a>
          )}
          <Button
            onClick={handleSubmit((v) => saveMutation.mutate(v as any), onInvalid)}
            disabled={saveMutation.isPending}
            className="gap-1.5 font-poppins"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isSavedRecently ? (
              <>
                <Check className="h-4 w-4 text-emerald-500" />
                Saved
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isNew ? 'Create Package' : 'Save Changes'}
              </>
            )}
          </Button>
        </div>
      </motion.div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="flex flex-wrap w-full bg-slate-100 p-1 rounded-lg gap-1 border h-auto">
          <TabsTrigger value="basic" className="px-3 py-1.5 text-xs">Basic</TabsTrigger>
          <TabsTrigger value="itinerary" className="px-3 py-1.5 text-xs">Itinerary</TabsTrigger>
          <TabsTrigger value="inclusions" className="px-3 py-1.5 text-xs">Inclusions</TabsTrigger>
          <TabsTrigger value="media" className="px-3 py-1.5 text-xs">Media</TabsTrigger>
          <TabsTrigger value="transport" className="px-3 py-1.5 text-xs">Transport 🚍</TabsTrigger>
          <TabsTrigger value="accommodation" className="px-3 py-1.5 text-xs">Stay 🏨</TabsTrigger>
          <TabsTrigger value="experiences" className="px-3 py-1.5 text-xs">Community Hub</TabsTrigger>
          <TabsTrigger value="faqs" className="px-3 py-1.5 text-xs">FAQs</TabsTrigger>
          <TabsTrigger value="seo" className="px-3 py-1.5 text-xs">SEO</TabsTrigger>
          <TabsTrigger value="documents" className="px-3 py-1.5 text-xs">Premium PDFs</TabsTrigger>
        </TabsList>

        {/* ==================== BASIC ==================== */}
        <TabsContent value="basic" className="space-y-4">
          {isNew && (
            <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-amber-900">Autofill with Package Template</h4>
                  <p className="text-xs text-amber-700/80 mt-0.5">Select a pre-configured template to fill up to 80% of form inputs automatically.</p>
                </div>
                <Select
                  onValueChange={(val) => {
                    const t = PACKAGE_TEMPLATES[val as keyof typeof PACKAGE_TEMPLATES]
                    if (t) {
                      setValue('duration', t.duration)
                      setValue('duration_days', t.duration_days)
                      setValue('duration_nights', t.duration_nights)
                      setValue('difficulty', t.difficulty)
                      setValue('group_size_min', t.group_size_min)
                      setValue('group_size_max', t.group_size_max)
                      setValue('short_description', t.short_description)
                      setValue('overview', t.overview)
                      
                      setInclusions(t.inclusions)
                      setExclusions(t.exclusions)
                      setPackingList(t.packing_list)
                      setFaqs(t.faqs)
                      setPolicies([
                        { title: "Booking Confirmation Policy", content: "A booking is confirmed only after receiving the advance payment of ₹2,000 per traveler." },
                        { title: "Cancellation & Refund", content: "Cancellations made 15 days before departure are eligible for a 50% refund. Cancellations under 7 days are non-refundable." }
                      ])

                      toast.success(`Template "${t.name}" loaded successfully!`)
                    }
                  }}
                >
                  <SelectTrigger className="w-52 bg-white border-amber-200">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEEKEND">Weekend Trip</SelectItem>
                    <SelectItem value="SPIRITUAL">Spiritual Journey</SelectItem>
                    <SelectItem value="BACKPACKING">Backpacking Adventure</SelectItem>
                    <SelectItem value="LUXURY">Luxury Escapade</SelectItem>
                    <SelectItem value="INTERNATIONAL">International Convoy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Destination *</Label>
                  <Select
                    value={watch('destination_id') ?? ''}
                    onValueChange={(v) => setValue('destination_id', v, { shouldDirty: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {destinations.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.destination_id && <p className="text-xs text-destructive">{errors.destination_id.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Trip Captain</Label>
                  <Select
                    value={watch('trip_captain_id') ?? ''}
                    onValueChange={(v) => setValue('trip_captain_id', v, { shouldDirty: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Assign captain (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {captains.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Package Name *</Label>
                  <Input {...register('name')} placeholder="e.g., Manali Winter Expedition" />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>URL Slug *</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">packages/</span>
                    <Input {...register('slug')} placeholder="manali-winter" className="font-mono" />
                  </div>
                  {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Tagline</Label>
                  <Input {...register('tagline')} placeholder="e.g., Where the mountains whisper your name" />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select
                    value={watch('category') ?? 'WEEKEND'}
                    onValueChange={(v) => setValue('category', v, { shouldDirty: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEEKEND">Weekend Trip</SelectItem>
                      <SelectItem value="SPIRITUAL">Spiritual Journey</SelectItem>
                      <SelectItem value="BACKPACKING">Backpacking Adventure</SelectItem>
                      <SelectItem value="LUXURY">Luxury Escapade</SelectItem>
                      <SelectItem value="INTERNATIONAL">International Convoy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label>Duration (display)</Label>
                  <Input {...register('duration')} placeholder="5D/4N" />
                </div>
                <div className="space-y-1.5">
                  <Label>Days</Label>
                  <Input type="number" {...register('duration_days', { valueAsNumber: true })} min={1} />
                </div>
                <div className="space-y-1.5">
                  <Label>Nights</Label>
                  <Input type="number" {...register('duration_nights', { valueAsNumber: true })} min={0} />
                </div>
                <div className="space-y-1.5">
                  <Label>Difficulty</Label>
                  <Select
                    value={watch('difficulty')}
                    onValueChange={(v) => setValue('difficulty', v as PackageFormValues['difficulty'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EASY">Easy</SelectItem>
                      <SelectItem value="MODERATE">Moderate</SelectItem>
                      <SelectItem value="DIFFICULT">Difficult</SelectItem>
                      <SelectItem value="EXTREME">Extreme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label>Starting Price (₹)</Label>
                  <Input type="number" {...register('starting_price', { valueAsNumber: true })} min={0} />
                </div>
                <div className="space-y-1.5">
                  <Label>Max Price (₹)</Label>
                  <Input type="number" {...register('maximum_price', { valueAsNumber: true })} min={0} />
                </div>
                <div className="space-y-1.5">
                  <Label>Min Group Size</Label>
                  <Input type="number" {...register('group_size_min', { valueAsNumber: true })} min={1} />
                </div>
                <div className="space-y-1.5">
                  <Label>Max Group Size</Label>
                  <Input type="number" {...register('group_size_max', { valueAsNumber: true })} min={1} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Pickup Point</Label>
                  <Input {...register('pickup_point')} placeholder="e.g., Kashmere Gate, Delhi" />
                </div>
                <div className="space-y-1.5">
                  <Label>Drop Point</Label>
                  <Input {...register('drop_point')} placeholder="e.g., Kashmere Gate, Delhi" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Short Description</Label>
                <Textarea {...register('short_description')} placeholder="2-3 sentences for package cards..." rows={3} />
              </div>

              <div className="space-y-1.5">
                <Label>Overview</Label>
                <Textarea {...register('overview')} placeholder="Full package overview..." rows={6} />
              </div>

              <StringListEditor
                label="Highlights"
                list={highlights}
                setList={setHighlights}
                placeholder="Add a highlight point..."
              />
            </CardContent>
          </Card>

          {/* Publishing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Publishing Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Status</Label>
                <Select
                  value={watch('status')}
                  onValueChange={(v) => setValue('status', v as PackageFormValues['status'])}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>Featured Package</Label>
                <Switch
                  checked={watch('is_featured')}
                  onCheckedChange={(v) => setValue('is_featured', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Priority</Label>
                <Input
                  type="number"
                  className="w-24 text-center"
                  {...register('priority', { valueAsNumber: true })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== ITINERARY ==================== */}
        <TabsContent value="itinerary">
          <Card>
            <CardContent className="pt-6">
              <ItineraryEditor value={itinerary} onChange={setItinerary} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== INCLUSIONS ==================== */}
        <TabsContent value="inclusions" className="space-y-4">
          <div className="space-y-6">
            <DynamicListEditor
              title="What's Included"
              list={inclusions}
              originalList={pkg?.inclusions ?? []}
              onChange={setInclusions}
              iconType="check"
              placeholder="e.g., Comfortable AC Tempo Traveller transportation from Delhi"
            />

            <DynamicListEditor
              title="Not Included"
              list={exclusions}
              originalList={pkg?.exclusions ?? []}
              onChange={setExclusions}
              iconType="x"
              placeholder="e.g., Lunches during the trip"
            />

            <Card>
              <CardContent className="pt-6">
                <StringListEditor
                  label="Packing List"
                  list={packingList}
                  setList={setPackingList}
                  placeholder="e.g., Warm jacket, sunscreen"
                />
              </CardContent>
            </Card>
          </div>

          {/* Policies */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                Policies
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setPolicies([...policies, { title: '', content: '' }])}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Policy
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {policies.map((p, i) => (
                <div key={i} className="p-3 border rounded-lg space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={p.title}
                      onChange={(e) => setPolicies(policies.map((pol, j) => j === i ? { ...pol, title: e.target.value } : pol))}
                      placeholder="Policy title"
                      className="flex-1"
                    />
                    <Button type="button" variant="ghost" size="icon" className="text-destructive h-9 w-9"
                      onClick={() => setPolicies(policies.filter((_, j) => j !== i))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Textarea
                    value={p.content}
                    onChange={(e) => setPolicies(policies.map((pol, j) => j === i ? { ...pol, content: e.target.value } : pol))}
                    placeholder="Policy content..."
                    rows={3}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== MEDIA ==================== */}
        <TabsContent value="media">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <ImageField
                label="Hero Banner"
                value={watch('hero_banner') ?? ''}
                onChange={(url) => setValue('hero_banner', url)}
                folder="/packages"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== TRANSPORT ==================== */}
        <TabsContent value="transport" className="space-y-6">
          <Card className="rounded-2xl border-border shadow-sm font-poppins">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <CircleHelp className="h-5 w-5 text-indigo-500 shrink-0" />
                Transport Vehicle Configuration
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Configure transport specifications, timings, features, and galleries.</p>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Vehicle Name *</Label>
                  <Input
                    value={transport.vehicle_name || ''}
                    onChange={(e) => setTransport({ ...transport, vehicle_name: e.target.value })}
                    placeholder="e.g., Tempo Traveller 17 Seater"
                  />
                  <p className="text-[10px] text-muted-foreground">Clear this field to disable/delete transport details for this package.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Vehicle Type</Label>
                  <Input
                    value={transport.vehicle_type || ''}
                    onChange={(e) => setTransport({ ...transport, vehicle_type: e.target.value })}
                    placeholder="e.g., Luxury Force Traveller or Sleeper Volvo Bus"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label>Total Seats</Label>
                  <Input
                    type="number"
                    value={transport.seat_capacity ?? 17}
                    onChange={(e) => setTransport({ ...transport, seat_capacity: Number(e.target.value) })}
                    min={0}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Available Seats</Label>
                  <Input
                    type="number"
                    value={transport.available_seats ?? 17}
                    onChange={(e) => setTransport({ ...transport, available_seats: Number(e.target.value) })}
                    min={0}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Departure Time</Label>
                  <Input
                    value={transport.departure_time || ''}
                    onChange={(e) => setTransport({ ...transport, departure_time: e.target.value })}
                    placeholder="e.g., 06:30 PM"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Return Time</Label>
                  <Input
                    value={transport.arrival_time || ''}
                    onChange={(e) => setTransport({ ...transport, arrival_time: e.target.value })}
                    placeholder="e.g., 08:30 AM (Next Day)"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="ac-toggle"
                    checked={!!transport.ac}
                    onChange={(e) => setTransport({ ...transport, ac: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                  />
                  <Label htmlFor="ac-toggle" className="cursor-pointer">AC Vehicle</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="music-toggle"
                    checked={!!transport.music}
                    onChange={(e) => setTransport({ ...transport, music: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                  />
                  <Label htmlFor="music-toggle" className="cursor-pointer">Audio/Music System</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="ports-toggle"
                    checked={!!transport.charging_ports}
                    onChange={(e) => setTransport({ ...transport, charging_ports: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                  />
                  <Label htmlFor="ports-toggle" className="cursor-pointer">Charging Ports</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="captain-toggle"
                    checked={!!transport.trip_captain}
                    onChange={(e) => setTransport({ ...transport, trip_captain: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                  />
                  <Label htmlFor="captain-toggle" className="cursor-pointer">Trip Captain Included</Label>
                </div>
              </div>

              {/* Cover Image & Gallery */}
              <div className="space-y-4">
                <ImageField
                  label="Vehicle Cover Image"
                  value={transport.cover_image ?? ''}
                  onChange={(url) => setTransport({ ...transport, cover_image: url })}
                  folder="/transport"
                />

                <div className="space-y-2">
                  <Label>Vehicle Slider Gallery Images</Label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {(transport.gallery || []).map((url: string, idx: number) => (
                      <div key={idx} className="relative h-20 rounded-lg overflow-hidden border">
                        <img src={url} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (transport.gallery || []).filter((_: any, i: number) => i !== idx)
                            setTransport({ ...transport, gallery: updated })
                          }}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <div className="h-20 rounded-lg border-2 border-dashed flex items-center justify-center bg-slate-50 hover:bg-slate-100 cursor-pointer">
                      <ImageField
                        label=""
                        value=""
                        onChange={(url) => {
                          if (url) {
                            const updated = [...(transport.gallery || []), url]
                            setTransport({ ...transport, gallery: updated })
                          }
                        }}
                        folder="/transport"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Lists */}
              <div className="space-y-4">
                <StringListEditor
                  label="Vehicle Features"
                  list={transport.features || []}
                  setList={(items) => setTransport({ ...transport, features: items })}
                  placeholder="e.g., Pushback Seats"
                />
                <StringListEditor
                  label="Pickup Points"
                  list={transport.pickup_points || []}
                  setList={(items) => setTransport({ ...transport, pickup_points: items })}
                  placeholder="e.g., Delhi Kashmere Gate ISBT"
                />
                <StringListEditor
                  label="Drop Points"
                  list={transport.drop_points || []}
                  setList={(items) => setTransport({ ...transport, drop_points: items })}
                  placeholder="e.g., Gurgaon IFFCO Chowk Metro"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== ACCOMMODATION ==================== */}
        <TabsContent value="accommodation" className="space-y-6">
          <Card className="rounded-2xl border-border shadow-sm font-poppins">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-indigo-500 shrink-0" />
                Accommodation Stay Assignment
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Select a verified property from the centralized Hotels Database CRM.</p>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-1.5 max-w-md">
                <Label htmlFor="hotel_id"> CENTRAL HOTEL / STAY </Label>
                <Select
                  value={watch('hotel_id') || 'NONE'}
                  onValueChange={(val) => setValue('hotel_id', val === 'NONE' ? null : val, { shouldDirty: true })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="No Stay Assigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">No Accommodation Assigned</SelectItem>
                    {hotels.map((h: any) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.name} ({h.city}, {h.state} • {h.star_rating}★)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  The selected hotel's check-in/out times, location maps, gallery, category, and room share policies will load dynamically.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== COMMUNITY HUB / TRIP EXPERIENCES ==================== */}
        <TabsContent value="experiences" className="space-y-6">
          {/* Stats Overwrite */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Community Stats Override
              </CardTitle>
              <p className="text-xs text-muted-foreground">Configure the stats displayed on the trip page. Customize to highlight social proof.</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="space-y-1.5">
                  <Label>Total Travelers</Label>
                  <Input
                    type="number"
                    value={experienceStats.travelers || 0}
                    onChange={(e) => setExperienceStats({ ...experienceStats, travelers: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Stories Count</Label>
                  <Input
                    type="number"
                    value={experienceStats.stories || 0}
                    onChange={(e) => setExperienceStats({ ...experienceStats, stories: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Photos Count</Label>
                  <Input
                    type="number"
                    value={experienceStats.photos || 0}
                    onChange={(e) => setExperienceStats({ ...experienceStats, photos: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Videos Count</Label>
                  <Input
                    type="number"
                    value={experienceStats.videos || 0}
                    onChange={(e) => setExperienceStats({ ...experienceStats, videos: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Reels Count</Label>
                  <Input
                    type="number"
                    value={experienceStats.reels || 0}
                    onChange={(e) => setExperienceStats({ ...experienceStats, reels: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Average Rating</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={experienceStats.avg_rating || 0}
                    onChange={(e) => setExperienceStats({ ...experienceStats, avg_rating: Number(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trip Moments (Badges) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Smile className="h-5 w-5 text-primary" />
                    Trip Moments & Vibes
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Add moment cards highlighted on the page (e.g. 📸 Sunset, 🎉 DJ night).</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setTripMoments([...tripMoments, { emoji: '📸', title: 'New Moment' }])}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Moment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tripMoments.length === 0 ? (
                <div className="text-center p-6 border-2 border-dashed rounded-xl text-muted-foreground">
                  No vibe moments added yet. Click Add Moment.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {tripMoments.map((moment, idx) => (
                    <div key={idx} className="flex gap-2 items-center p-3 border rounded-xl bg-card">
                      <Input
                        value={moment.emoji}
                        onChange={(e) => setTripMoments(tripMoments.map((m, i) => i === idx ? { ...m, emoji: e.target.value } : m))}
                        placeholder="Emoji"
                        className="w-16 text-center"
                      />
                      <Input
                        value={moment.title}
                        onChange={(e) => setTripMoments(tripMoments.map((m, i) => i === idx ? { ...m, title: e.target.value } : m))}
                        placeholder="Moment Title"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive h-9 w-9 shrink-0"
                        onClick={() => setTripMoments(tripMoments.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Photo Gallery (Linked to Days) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    Trip Gallery (Real Photos)
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Upload traveler photos. Link them to specific day itineraries to show them day-by-day.</p>
                </div>
                <Button type="button" size="sm" variant="outline" className="gap-1" onClick={() => setGalleryPickerOpen(true)}>
                  <Plus className="h-4 w-4" /> Add Photos
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {gallery.length === 0 ? (
                <div
                  className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => setGalleryPickerOpen(true)}
                >
                  <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-semibold text-muted-foreground font-poppins">Click to add photos from Media Library</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gallery.map((item, idx) => (
                    <div key={idx} className="flex gap-4 p-3 border rounded-xl bg-card items-start">
                      <div className="h-20 w-28 rounded-lg overflow-hidden shrink-0 bg-muted border">
                        <img src={item.url} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Input
                          value={item.caption || ''}
                          onChange={(e) => setGallery(gallery.map((g, i) => i === idx ? { ...g, caption: e.target.value } : g))}
                          placeholder="Caption..."
                          className="h-8 text-xs font-poppins"
                        />
                        <div className="flex gap-2">
                          <select
                            value={item.day === null || item.day === undefined ? '' : String(item.day)}
                            onChange={(e) => {
                              const dayVal = e.target.value === '' ? null : Number(e.target.value)
                              setGallery(gallery.map((g, i) => i === idx ? { ...g, day: dayVal } : g))
                            }}
                            className="flex-1 h-8 border border-input rounded-md px-2 text-xs font-poppins bg-white"
                          >
                            <option value="">General (No day link)</option>
                            {itinerary.map((d) => (
                              <option key={d.day_number} value={String(d.day_number)}>
                                Day {d.day_number}: {d.title}
                              </option>
                            ))}
                          </select>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setGallery(gallery.filter((_, i) => i !== idx))}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Videos & Reels (Linked to Days) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Video className="h-5 w-5 text-primary" />
                    Trip Videos & Reels
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Embed YouTube, Custom MP4, or Instagram Reels.</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setVideos([...videos, { url: '', title: '', type: 'youtube', day: null }])}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Video / Reel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {videos.length === 0 ? (
                <div className="text-center p-6 border-2 border-dashed rounded-xl text-muted-foreground">
                  No videos or reels added yet. Click Add Video.
                </div>
              ) : (
                <div className="space-y-4">
                  {videos.map((vid, idx) => (
                    <div key={idx} className="p-4 border rounded-xl space-y-3 bg-card relative">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 text-destructive h-8 w-8"
                        onClick={() => setVideos(videos.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold">Video / Reel URL</Label>
                          <Input
                            value={vid.url || ''}
                            onChange={(e) => setVideos(videos.map((v, i) => i === idx ? { ...v, url: e.target.value } : v))}
                            placeholder="e.g. https://www.youtube.com/watch?v=... or Instagram Reel link"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold">Title</Label>
                          <Input
                            value={vid.title || ''}
                            onChange={(e) => setVideos(videos.map((v, i) => i === idx ? { ...v, title: e.target.value } : v))}
                            placeholder="e.g. DJ Night Highlight"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold">Platform / Type</Label>
                          <Select
                            value={vid.type || 'youtube'}
                            onValueChange={(val) => setVideos(videos.map((v, i) => i === idx ? { ...v, type: val } : v))}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="youtube">YouTube Video</SelectItem>
                              <SelectItem value="instagram">Instagram Reel</SelectItem>
                              <SelectItem value="raw">Custom MP4 URL</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold">Link to Day</Label>
                          <select
                            value={vid.day === null || vid.day === undefined ? '' : String(vid.day)}
                            onChange={(e) => {
                              const dayVal = e.target.value === '' ? null : Number(e.target.value)
                              setVideos(videos.map((v, i) => i === idx ? { ...v, day: dayVal } : v))
                            }}
                            className="w-full h-10 border border-input rounded-md px-3 text-sm font-poppins bg-white"
                          >
                            <option value="">General (No day link)</option>
                            {itinerary.map((d) => (
                              <option key={d.day_number} value={String(d.day_number)}>
                                Day {d.day_number}: {d.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Memories */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    Traveler Memories
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Manage user-submitted stories and quick quotes (e.g. "Best Trip Ever ❤️").</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setMemories([...memories, { text: '', author: 'Explorer', rating: 5 }])}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Memory
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {memories.length === 0 ? (
                <div className="text-center p-6 border-2 border-dashed rounded-xl text-muted-foreground">
                  No quick memories added yet. Click Add Memory.
                </div>
              ) : (
                <div className="space-y-4">
                  {memories.map((mem, idx) => (
                    <div key={idx} className="flex gap-4 p-4 border rounded-xl bg-card items-start relative">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 text-destructive h-8 w-8"
                        onClick={() => setMemories(memories.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="flex-1 space-y-3 pt-2">
                        <Textarea
                          value={mem.text || ''}
                          onChange={(e) => setMemories(memories.map((m, i) => i === idx ? { ...m, text: e.target.value } : m))}
                          placeholder="Write memory quote here (e.g. 'Loved the DJ night, captain was awesome!')..."
                          rows={2}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label className="text-[10px]">Author (e.g. Name, College)</Label>
                            <Input
                              value={mem.author || ''}
                              onChange={(e) => setMemories(memories.map((m, i) => i === idx ? { ...m, author: e.target.value } : m))}
                              placeholder="Ansh (BPIT)"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">Vibe Rating (1-5)</Label>
                            <Input
                              type="number"
                              min="1"
                              max="5"
                              value={mem.rating || 5}
                              onChange={(e) => setMemories(memories.map((m, i) => i === idx ? { ...m, rating: Number(e.target.value) } : m))}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Features simulation */}
          <Card className="border-amber-200 bg-amber-50/15 overflow-hidden">
            <CardHeader className="bg-amber-500/10 border-b border-amber-200/40">
              <CardTitle className="text-base flex items-center gap-2 text-amber-900">
                <Sparkles className="h-5 w-5 text-amber-600" />
                AI Content Creator (Community Drafts)
              </CardTitle>
              <p className="text-xs text-amber-800/80">Analyze your package details and itinerary to automatically generate promotional posts, blog stories, hashtags, and captions.</p>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <Button
                type="button"
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold font-poppins gap-2"
                onClick={() => {
                  const itineraryText = itinerary.map(d => `Day ${d.day_number}: ${d.title}`).join(', ');
                  toast.promise(
                    new Promise((resolve) => setTimeout(resolve, 1500)),
                    {
                      loading: 'AI analyzing itinerary and generating copy...',
                      success: () => {
                        setExperienceStats(prev => ({ ...prev, stories: prev.stories > 0 ? prev.stories : 12 }));
                        return 'AI drafts created successfully!';
                      },
                      error: 'AI generation failed',
                    }
                  );
                  setTimeout(() => {
                    const statsUpdate = {
                      travelers: experienceStats.travelers || 420,
                      stories: experienceStats.stories || 12,
                      photos: experienceStats.photos || 180,
                      videos: experienceStats.videos || 35,
                      reels: experienceStats.reels || 15,
                      avg_rating: experienceStats.avg_rating || 4.9
                    };
                    setExperienceStats(statsUpdate);
                    if (memories.length === 0) {
                      setMemories([
                        { text: `Absolutely loved the road journey organized by Nomadik. The captain made everyone feel at home!`, author: "Sneha (NSUT)", rating: 5 }
                      ]);
                    }
                  }, 1500);
                }}
              >
                <Sparkles className="h-4 w-4" /> Run AI Assistant
              </Button>

              <div className="space-y-3 bg-white p-4 rounded-xl border border-amber-200/50 shadow-sm text-xs font-poppins text-slate-700">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="font-bold text-[#E53E3E]">📢 AI Generated Caption Draft</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Ready</span>
                </div>
                <p className="whitespace-pre-wrap leading-relaxed text-slate-600 bg-muted/30 p-2.5 rounded-lg font-mono">
                  {`Lost in ${nameValue || 'Udaipur'} ⛰️✨ From DJ nights under the stars to secret sunset lookouts, this wasn't just a trip—it was a community in motion. Swipe to see the real vibes! 👉\n\n${itinerary.map(d => `Day ${d.day_number}: ${d.title}`).join('\n')}\n\n#Nomadik #RoadTravel #CollegeTrip #${(nameValue || 'Udaipur').replace(/\s+/g, '')}Diaries #ExplorerCommunity`}
                </p>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1.5">
                  <span>✨ Copied to clipboard automatically</span>
                  <span>Press Save to persist stats & memories</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== FAQs ==================== */}
        <TabsContent value="faqs" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-poppins">
            {/* Left Column: FAQ Master Library Preset Selector */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="rounded-2xl border-border shadow-sm">
                <CardHeader className="pb-3 border-b border-border/60">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <CircleHelp className="h-5 w-5 text-indigo-500 shrink-0" />
                    Select from FAQ Library
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Choose common presets to map them to this package.</p>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {/* Search and Category Group Filter */}
                  <div className="space-y-2.5">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <Input
                        placeholder="Search master library..."
                        value={librarySearch}
                        onChange={(e) => setLibrarySearch(e.target.value)}
                        className="pl-8.5 h-8 text-xs w-full"
                      />
                    </div>
                  </div>

                  {/* Preset List grouped by Category */}
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {libraryPresets.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic text-center py-6">No presets found in library.</p>
                    ) : (() => {
                      const filteredPresets = libraryPresets.filter((item: any) =>
                        item.question.toLowerCase().includes(librarySearch.toLowerCase()) ||
                        item.answer.toLowerCase().includes(librarySearch.toLowerCase())
                      )

                      if (filteredPresets.length === 0) {
                        return <p className="text-xs text-muted-foreground italic text-center py-6">No matching presets.</p>
                      }

                      // Group library items by category
                      const grouped: Record<string, any[]> = {}
                      filteredPresets.forEach((item: any) => {
                        const cat = item.category || 'General'
                        if (!grouped[cat]) grouped[cat] = []
                        grouped[cat].push(item)
                      })

                      return Object.entries(grouped).map(([category, items]) => (
                        <div key={category} className="space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/40 px-2 py-0.5 rounded">
                            {category}
                          </span>
                          <div className="space-y-1.5 pl-0.5">
                            {items.map((item: any) => {
                              const isChecked = mappedFaqIds.includes(item.id)
                              return (
                                <div key={item.id} className="flex items-start gap-2 text-xs p-2 border rounded-xl hover:bg-slate-50 transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setMappedFaqIds([...mappedFaqIds, item.id])
                                      } else {
                                        setMappedFaqIds(mappedFaqIds.filter(id => id !== item.id))
                                      }
                                    }}
                                    className="mt-0.5 h-3.5 w-3.5 border-gray-300 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                                  />
                                  <div className="flex-1 space-y-0.5 leading-snug">
                                    <p className="font-semibold text-slate-800 flex items-center gap-1">
                                      {item.featured && <Star className="h-3 w-3 fill-amber-400 text-amber-500 shrink-0" />}
                                      {item.question}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground line-clamp-1">{item.answer}</p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Selected Library FAQs and Custom FAQs */}
            <div className="lg:col-span-2 space-y-6">
              {/* Selected Library Presets list */}
              <Card className="rounded-2xl border-border shadow-sm">
                <CardHeader className="pb-3 border-b border-border/60">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Star className="h-5 w-5 text-amber-500 shrink-0" />
                      Active Library FAQs ({mappedFaqIds.length})
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">These mapped library presets will show on this package.</p>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {mappedFaqIds.length === 0 ? (
                    <div className="text-center py-8 text-xs text-muted-foreground bg-muted/10 rounded-2xl border border-dashed border-border p-4">
                      Select library FAQs from the left column to add them to this trip.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {mappedFaqIds.map((id, index) => {
                        const item = libraryPresets.find((preset: any) => preset.id === id)
                        if (!item) return null
                        return (
                          <div key={id} className="flex gap-3 p-3 border rounded-xl bg-slate-50 border-slate-200/60 shadow-sm items-start">
                            {/* Drag / Reorder arrows */}
                            <div className="flex flex-col gap-1 mt-1 shrink-0">
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => {
                                  const updated = [...mappedFaqIds]
                                  const temp = updated[index]
                                  updated[index] = updated[index - 1]
                                  updated[index - 1] = temp
                                  setMappedFaqIds(updated)
                                }}
                                className="h-5 w-5 rounded bg-white border flex items-center justify-center hover:bg-slate-100 disabled:opacity-40"
                              >
                                <ChevronUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={index === mappedFaqIds.length - 1}
                                onClick={() => {
                                  const updated = [...mappedFaqIds]
                                  const temp = updated[index]
                                  updated[index] = updated[index + 1]
                                  updated[index + 1] = temp
                                  setMappedFaqIds(updated)
                                }}
                                className="h-5 w-5 rounded bg-white border flex items-center justify-center hover:bg-slate-100 disabled:opacity-40"
                              >
                                <ChevronDown className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <div className="flex-1 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[item.category] ?? 'bg-slate-100 text-slate-700'}`}>
                                  {item.category}
                                </span>
                                <span className="text-[10px] text-muted-foreground">Order: {index + 1}</span>
                              </div>
                              <p className="font-semibold text-xs text-primary flex items-start gap-1 leading-snug">
                                {item.featured && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500 shrink-0 mt-0.5" />}
                                {item.question}
                              </p>
                              <p className="text-[11px] text-muted-foreground leading-relaxed">{item.answer}</p>
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setMappedFaqIds(mappedFaqIds.filter(faqId => faqId !== id))}
                              className="text-destructive h-8 w-8 hover:bg-red-50 hover:text-destructive shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Custom FAQs list */}
              <Card className="rounded-2xl border-border shadow-sm">
                <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Plus className="h-5 w-5 text-indigo-500 shrink-0" />
                      Trip-Specific Custom FAQs ({customFaqs.length})
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">These FAQs only exist for this package (e.g. Udaipur boating, Kasol riverside camps).</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setCustomFaqs([...customFaqs, { question: '', answer: '', category: 'Booking', display_order: customFaqs.length }])}
                    className="h-8 gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Custom FAQ
                  </Button>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {customFaqs.length === 0 ? (
                    <div className="text-center py-8 text-xs text-muted-foreground bg-muted/10 rounded-2xl border border-dashed border-border p-4">
                      Create trip-specific FAQs here using the "+ Custom FAQ" button.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customFaqs.map((cf, index) => (
                        <div key={index} className="p-3 border rounded-xl bg-white border-border/80 flex gap-3 items-start relative shadow-soft">
                          {/* Drag / Reorder arrows */}
                          <div className="flex flex-col gap-1 mt-1 shrink-0">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => {
                                const updated = [...customFaqs]
                                const temp = updated[index]
                                updated[index] = updated[index - 1]
                                updated[index - 1] = temp
                                setCustomFaqs(updated)
                              }}
                              className="h-5 w-5 rounded bg-white border flex items-center justify-center hover:bg-slate-100 disabled:opacity-40"
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={index === customFaqs.length - 1}
                              onClick={() => {
                                const updated = [...customFaqs]
                                const temp = updated[index]
                                updated[index] = updated[index + 1]
                                updated[index + 1] = temp
                                setCustomFaqs(updated)
                              }}
                              className="h-5 w-5 rounded bg-white border flex items-center justify-center hover:bg-slate-100 disabled:opacity-40"
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="flex-1 space-y-2">
                            <div className="grid grid-cols-3 gap-2 items-center">
                              <Input
                                value={cf.question}
                                onChange={(e) => setCustomFaqs(customFaqs.map((item, i) => i === index ? { ...item, question: e.target.value } : item))}
                                placeholder="Custom question title"
                                className="col-span-2 h-8 text-xs"
                              />
                              <Select
                                value={cf.category || 'Booking'}
                                onValueChange={(val) => setCustomFaqs(customFaqs.map((item, i) => i === index ? { ...item, category: val } : item))}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {CATEGORIES.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Textarea
                              value={cf.answer}
                              onChange={(e) => setCustomFaqs(customFaqs.map((item, i) => i === index ? { ...item, answer: e.target.value } : item))}
                              placeholder="Write the custom FAQ answer response..."
                              rows={2}
                              className="text-xs"
                            />
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setCustomFaqs(customFaqs.filter((_, i) => i !== index))}
                            className="text-destructive h-8 w-8 hover:bg-red-50 hover:text-destructive shrink-0 mt-0.5"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ==================== SEO ==================== */}
        <TabsContent value="seo">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-1.5">
                <Label>SEO Title</Label>
                <Input {...register('seo_title')} maxLength={70} placeholder="Package Name — Duration | Starting Price" />
              </div>
              <div className="space-y-1.5">
                <Label>Meta Description</Label>
                <Textarea {...register('seo_description')} maxLength={160} rows={3} placeholder="Compelling meta description for search engines..." />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== DOCUMENTS ==================== */}
        <TabsContent value="documents">
          <PackageDocumentsTab 
            packageId={id} 
            packageSlug={pkg?.slug} 
            isNew={isNew} 
            adminId={admin?.id} 
          />
        </TabsContent>
      </Tabs>

      {/* Gallery MediaPicker */}
      <MediaPicker
        open={galleryPickerOpen}
        onClose={() => setGalleryPickerOpen(false)}
        onSelect={(asset: MediaAsset) => {
          if (asset.url) {
            setGallery((prev) => [...prev, { url: asset.url, caption: '', day: null }]);
          }
          setGalleryPickerOpen(false);
        }}
        accept="image"
      />
    </div>
  )
}

import { useRef } from 'react';

interface PackageDocumentsTabProps {
  packageId: string;
  packageSlug?: string;
  isNew: boolean;
  adminId?: string;
}

function PackageDocumentsTab({ packageId, packageSlug, isNew, adminId }: PackageDocumentsTabProps) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documentType, setDocumentType] = useState<'ITINERARY' | 'PACKING' | 'GUIDE' | 'TERMS' | 'OTHER' | 'VOUCHER' | 'INVOICE'>('ITINERARY');
  const [title, setTitle] = useState('');
  const [allowDownload, setAllowDownload] = useState(true);
  const [allowPrint, setAllowPrint] = useState(true);
  const [allowCopy, setAllowCopy] = useState(true);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['package_documents', packageId],
    queryFn: () => getPackageDocumentsFn({ data: packageId }),
    enabled: !isNew
  });

  const archiveMutation = useMutation({
    mutationFn: (docId: string) => archiveDocumentFn({ data: docId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['package_documents', packageId] });
      toast.success('Document archived successfully');
    },
    onError: (err: Error) => toast.error(err.message)
  });

  const restoreMutation = useMutation({
    mutationFn: (docId: string) => restoreDocumentFn({ data: docId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['package_documents', packageId] });
      toast.success('Document restored successfully');
    },
    onError: (err: Error) => toast.error(err.message)
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (payload: any) => createOrUpdateDocumentFn(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['package_documents', packageId] });
      toast.success('Settings updated');
    },
    onError: (err: Error) => toast.error(err.message)
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are supported');
        return;
      }
      if (file.size > 30 * 1024 * 1024) {
        toast.error('File size cannot exceed 30 MB');
        return;
      }
      setSelectedFile(file);
      if (!title) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        setTitle(nameWithoutExt.split('-').join(' ').split('_').join(' '));
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNew) {
      toast.error('Please save the package before uploading documents.');
      return;
    }
    if (!title || !selectedFile) {
      toast.error('Please specify a title and select a PDF file.');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onload = async () => {
        const base64String = (reader.result as string).split(',')[1];
        
        await uploadDocumentFileFn({
          data: {
            packageId,
            documentType,
            title,
            fileName: selectedFile.name,
            fileBase64: base64String,
            fileSize: selectedFile.size,
            allowDownload,
            allowPrint,
            allowCopy,
            watermarkEnabled,
            uploadedBy: adminId
          }
        });

        toast.success('Premium PDF uploaded successfully!');
        qc.invalidateQueries({ queryKey: ['package_documents', packageId] });
        
        // Reset states
        setTitle('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (isNew) {
    return (
      <Card>
        <CardContent className="pt-8 text-center text-muted-foreground font-poppins">
          <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/60" />
          <p>You must save this package first before you can manage its Premium PDF Documents.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Upload/Add document Form */}
      <Card className="lg:col-span-1 rounded-2xl border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold font-poppins">Add Premium Document</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Document Type *</Label>
              <Select value={documentType} onValueChange={(v: any) => setDocumentType(v)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ITINERARY">Main Itinerary</SelectItem>
                  <SelectItem value="PACKING">Packing Checklist</SelectItem>
                  <SelectItem value="GUIDE">Travel Guide</SelectItem>
                  <SelectItem value="TERMS">Terms & Policies</SelectItem>
                  <SelectItem value="OTHER">Other PDF</SelectItem>
                  <SelectItem value="VOUCHER">Trip Voucher</SelectItem>
                  <SelectItem value="INVOICE">Invoice Sample</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Document Title *</Label>
              <Input
                placeholder="e.g. Complete Udaipur Guide"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-3 p-3 bg-muted/20 border border-border/60 rounded-xl">
              <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Security Flags</Label>
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-primary">Allow Download</span>
                <Switch checked={allowDownload} onCheckedChange={setAllowDownload} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-primary">Allow Print</span>
                <Switch checked={allowPrint} onCheckedChange={setAllowPrint} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-primary">Allow Text Selection</span>
                <Switch checked={allowCopy} onCheckedChange={setAllowCopy} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-primary">User Details Watermark</span>
                <Switch checked={watermarkEnabled} onCheckedChange={setWatermarkEnabled} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Select PDF File (Max 30MB) *</Label>
              <Input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                required
                ref={fileInputRef}
                className="cursor-pointer pt-1.5 bg-muted/10 border"
              />
            </div>

            <Button type="submit" disabled={uploading} className="w-full gap-2 font-poppins">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? 'Uploading PDF...' : 'Upload PDF Document'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Uploaded Documents List */}
      <Card className="lg:col-span-2 rounded-2xl border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold font-poppins">Active Package Documents</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
          ) : docs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm font-poppins">
              No premium documents configured for this package.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Specs</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((doc: any) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <span className="text-[10px] uppercase font-poppins font-bold bg-secondary/10 text-secondary px-2.5 py-1 rounded-full border border-secondary/20">
                        {doc.document_type}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold text-primary">{doc.title}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      Size: {Math.round(doc.size / 1024)} KB · Ver: v{doc.version}
                    </TableCell>
                    <TableCell className="space-y-1">
                      <div className="flex flex-wrap gap-1">
                        <span className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded ${doc.allow_download ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                          Down: {doc.allow_download ? 'ON' : 'OFF'}
                        </span>
                        <span className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded ${doc.allow_print ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                          Print: {doc.allow_print ? 'ON' : 'OFF'}
                        </span>
                        <span className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded ${doc.watermark_enabled ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-500'}`}>
                          Watermark: {doc.watermark_enabled ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            updateSettingsMutation.mutate({
                              package_id: doc.package_id,
                              document_type: doc.document_type,
                              title: doc.title,
                              file_url: doc.file_url,
                              allow_download: !doc.allow_download,
                              version: doc.version,
                              is_active: doc.is_active
                            });
                          }}
                          className="h-8 w-8 text-primary"
                          title={doc.allow_download ? 'Disable download' : 'Enable download'}
                        >
                          {doc.allow_download ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                        </Button>
                        <a href={`/account/itinerary/${packageSlug}?type=${doc.document_type}`} target="_blank" rel="noreferrer">
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Preview inside App">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </a>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => archiveMutation.mutate(doc.id)}
                          className="h-8 w-8 text-yellow-600 hover:text-yellow-700"
                          title="Archive"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
