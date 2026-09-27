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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ImageField, MediaPicker } from '@/components/admin/MediaPicker'
import { ItineraryEditor, type ItineraryDayForm } from '@/components/admin/ItineraryEditor'
import { StringListEditor } from '@/components/admin/StringListEditor'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Trash2,
  Globe,
  Mountain,
  Clock,
  MapPin,
  Eye,
  GripVertical,
  Images,
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Search,
  Sparkles,
  Car,
  Hotel,
  ShieldCheck,
  UtensilsCrossed,
  Share2,
  Sliders,
  FileText
} from 'lucide-react'
import {
  getDestinationById,
  createDestination,
  updateDestination,
} from '@/lib/queries/destinations'
import { useAdminAuth } from '@/hooks/use-admin-auth'
import type { FaqItem } from '@/types/supabase'

export const Route = createFileRoute('/admin/destinations_/$id')({
  component: DestinationFormPage,
})

// ==========================================
// SCHEMA
// ==========================================
const destinationSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  slug: z.string().min(2, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes'),
  subtitle: z.string().optional(),
  country: z.string().default('India'),
  state: z.string().optional(),
  region: z.string().optional(),
  category: z.string().optional(),
  starting_point: z.string().optional(),
  difficulty: z.string().optional(),
  group_type: z.string().optional(),
  hero_image: z.string().optional(),
  thumbnail_image: z.string().optional(),
  hero_video: z.string().optional(),
  description: z.string().optional(),
  best_time: z.string().optional(),
  google_map_url: z.string().optional(),
  weather_summer: z.string().optional(),
  weather_monsoon: z.string().optional(),
  weather_winter: z.string().optional(),
  reach_road: z.string().optional(),
  reach_rail: z.string().optional(),
  reach_air: z.string().optional(),
  status: z.preprocess((val) => {
    if (typeof val === 'string') return val.toUpperCase().trim();
    return val;
  }, z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT')),
  is_featured: z.boolean().default(false),
  priority: z.number().int().min(0).default(0),
  // Journey Details
  duration: z.string().optional(),
  starting_price: z.preprocess((val) => val === '' ? undefined : Number(val), z.number().min(0).optional()),
  selling_price: z.preprocess((val) => val === '' ? undefined : Number(val), z.number().min(0).optional()),
  original_price: z.preprocess((val) => val === '' ? undefined : Number(val), z.number().min(0).optional()),
  discount_percent: z.preprocess((val) => val === '' ? undefined : Number(val), z.number().min(0).optional()),
  gst_percent: z.preprocess((val) => val === '' ? undefined : Number(val), z.number().min(0).optional()),
  transport: z.string().optional(),
  accommodation: z.string().optional(),
  meals: z.string().optional(),
  pricing_notes: z.string().optional(),
  // SEO
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  seo_keywords: z.string().optional(),
  canonical_url: z.string().optional(),
  og_title: z.string().optional(),
  og_description: z.string().optional(),
  og_image: z.string().optional(),
  twitter_title: z.string().optional(),
  twitter_description: z.string().optional(),
  twitter_image: z.string().optional(),
})

type DestinationFormValues = z.infer<typeof destinationSchema>

// ==========================================
// COMPONENT
// ==========================================
function DestinationFormPage() {
  const { id } = Route.useParams()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { admin } = useAdminAuth()

  // Default tab based on query param if present
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const tabParam = p.get('tab');
      if (tabParam) return tabParam;
    }
    return 'general';
  })

  // State for dynamic repeatable sections
  const [highlights, setHighlights] = useState<string[]>([])
  const [inclusions, setInclusions] = useState<string[]>([])
  const [exclusions, setExclusions] = useState<string[]>([])
  const [faqs, setFaqs] = useState<FaqItem[]>([])
  const [itineraryDays, setItineraryDays] = useState<ItineraryDayForm[]>([])
  const [gallery, setGallery] = useState<{ url: string; caption: string }[]>([])
  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false)

  // Fetch Destination
  const { data: destination, isLoading: loadingDest } = useQuery({
    queryKey: ['destination', id],
    queryFn: () => getDestinationById(id),
    enabled: !isNew,
  })

  // Fetch Connected Journey & Itinerary Days
  const { data: journey } = useQuery({
    queryKey: ['destination_journey', id, destination?.slug],
    queryFn: async () => {
      if (!id || id === 'new') return null;
      let { data } = await supabase
        .from('journeys')
        .select('*, itinerary_days(*)')
        .eq('destination_id', id)
        .maybeSingle();

      if (!data && destination?.slug) {
        const { data: bySlug } = await supabase
          .from('journeys')
          .select('*, itinerary_days(*)')
          .eq('slug', destination.slug)
          .maybeSingle();
        data = bySlug;
      }
      return data;
    },
    enabled: !isNew && !!destination,
  })

  // Fetch Destination FAQs from faqs table
  const { data: dbFaqs } = useQuery({
    queryKey: ['destination_faqs', id],
    queryFn: async () => {
      if (!id || id === 'new') return [];
      const { data } = await supabase
        .from('faqs')
        .select('*')
        .eq('destination_id', id)
        .order('sort_order', { ascending: true });
      return data || [];
    },
    enabled: !isNew,
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<DestinationFormValues>({
    resolver: zodResolver(destinationSchema) as any,
    defaultValues: {
      country: 'India',
      status: 'DRAFT',
      is_featured: false,
      priority: 0,
      difficulty: 'Moderate',
      group_type: 'Solo / Couple / Friends / Group',
      transport: 'AC Luxury Pushback Tempo Traveller',
      accommodation: 'Handpicked Boutique Stays & Riverside Wooden Cottages',
      meals: 'Breakfast & Dinner Included (MAP Plan)',
      gst_percent: 5,
    },
  })

  // Populate form when data arrives
  useEffect(() => {
    if (destination) {
      const seo = destination.seo as any || {}
      const weather = (destination as any).weather || {}
      const howToReach = (destination as any).how_to_reach || {}

      reset({
        name: destination.name,
        slug: destination.slug,
        subtitle: destination.subtitle ?? '',
        description: destination.description ?? '',
        country: destination.country ?? 'India',
        state: destination.state ?? '',
        region: destination.region ?? '',
        category: (journey as any)?.category ?? 'Mountain / Road Trip / Himalayan Escape',
        starting_point: (journey as any)?.pickup_point ?? 'Delhi NCR',
        difficulty: (journey as any)?.difficulty ?? 'Moderate',
        group_type: 'Solo / Couple / Friends / Group',
        priority: destination.priority ?? 0,
        status: destination.status as any,
        is_featured: destination.is_featured ?? false,
        hero_image: destination.hero_image ?? '',
        thumbnail_image: (destination as any).thumbnail || destination.hero_image || '',
        hero_video: destination.hero_video ?? '',
        best_time: (destination as any).best_time_to_visit || destination.best_time || '',
        google_map_url: (destination as any).map_embed_url || destination.google_map_url || '',
        weather_summer: weather.summer ?? '',
        weather_monsoon: weather.monsoon ?? '',
        weather_winter: weather.winter ?? '',
        reach_road: howToReach.road ?? '',
        reach_rail: howToReach.rail ?? '',
        reach_air: howToReach.air ?? '',
        // Journey pricing
        duration: journey?.duration ?? '4 Nights / 5 Days',
        starting_price: journey?.starting_price ?? journey?.price ?? 9499,
        selling_price: journey?.price ?? journey?.starting_price ?? 9499,
        original_price: (journey as any)?.maximum_price ?? 12999,
        discount_percent: 25,
        gst_percent: 5,
        transport: journey?.transport ?? 'AC Luxury Pushback Tempo Traveller',
        accommodation: journey?.hotel ?? 'Handpicked Boutique Stays & Riverside Wooden Cottages',
        meals: journey?.food ?? 'Breakfast & Dinner Included (MAP Plan)',
        pricing_notes: 'All government taxes, permits and toll fees included.',
        // SEO
        seo_title: seo.title ?? '',
        seo_description: seo.description ?? '',
        seo_keywords: Array.isArray(seo.keywords) ? seo.keywords.join(', ') : (seo.keywords ?? ''),
        canonical_url: seo.canonical_url ?? `https://www.gonomadik.in/destinations/${destination.slug}`,
        og_title: seo.og_title ?? seo.title ?? '',
        og_description: seo.og_description ?? seo.description ?? '',
        og_image: seo.og_image ?? destination.hero_image ?? '',
        twitter_title: seo.twitter_title ?? seo.og_title ?? '',
        twitter_description: seo.twitter_description ?? seo.og_description ?? '',
        twitter_image: seo.twitter_image ?? seo.og_image ?? '',
      })

      // Gallery
      const rawGallery = (destination as any).gallery ?? []
      setGallery(rawGallery.map((item: any) =>
        typeof item === 'string' ? { url: item, caption: '' } : { url: item.url || '', caption: item.caption || '' }
      ))

      // Highlights
      if (Array.isArray((destination as any).highlights) && (destination as any).highlights.length > 0) {
        setHighlights((destination as any).highlights)
      } else if (Array.isArray(journey?.highlights) && journey.highlights.length > 0) {
        setHighlights(journey.highlights)
      }

      // Inclusions & Exclusions
      if (Array.isArray(journey?.inclusions) && journey.inclusions.length > 0) {
        setInclusions(journey.inclusions)
      }
      if (Array.isArray(journey?.exclusions) && journey.exclusions.length > 0) {
        setExclusions(journey.exclusions)
      }

      // Itinerary Days
      const days = (journey as any)?.itinerary_days || (journey as any)?.itinerary || []
      if (Array.isArray(days) && days.length > 0) {
        setItineraryDays(days.map((d: any, idx: number) => ({
          day_number: d.day || d.day_number || idx + 1,
          title: d.title || `Day ${idx + 1}`,
          description: d.description || '',
          meals: Array.isArray(d.meals) 
            ? { breakfast: d.meals.includes('Breakfast'), lunch: d.meals.includes('Lunch'), dinner: d.meals.includes('Dinner') }
            : (d.meals || { breakfast: true, lunch: false, dinner: true }),
          stay: d.stay || d.accommodation || '',
          transport: d.transport || '',
          image_url: d.image_url || null,
          is_highlight: d.is_highlight ?? false,
          sort_order: d.sort_order ?? idx,
        })))
      }

      // FAQs
      if (Array.isArray(dbFaqs) && dbFaqs.length > 0) {
        setFaqs(dbFaqs.map((f: any) => ({ question: f.question, answer: f.answer })))
      } else if (Array.isArray(destination.faqs) && destination.faqs.length > 0) {
        setFaqs(destination.faqs)
      }
    }
  }, [destination, journey, dbFaqs, reset])

  // Auto-generate slug from name if new
  const nameValue = watch('name')
  const slugValue = watch('slug')
  useEffect(() => {
    if (isNew && nameValue) {
      const generatedSlug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      setValue('slug', generatedSlug)
    }
  }, [isNew, nameValue, setValue])

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async (values: DestinationFormValues) => {
      const statusUpper = (values.status || 'DRAFT').toUpperCase().trim()
      const isPublished = statusUpper === 'PUBLISHED'

      const weatherObj = {
        summer: values.weather_summer || '',
        monsoon: values.weather_monsoon || '',
        winter: values.weather_winter || '',
      }

      const howToReachObj = {
        road: values.reach_road || '',
        rail: values.reach_rail || '',
        air: values.reach_air || '',
      }

      const seoKeywordsArr = values.seo_keywords
        ? values.seo_keywords.split(',').map((s) => s.trim()).filter(Boolean)
        : []

      const seoObj = {
        title: values.seo_title || `${values.name} Trip Package from Delhi | GoNomadik`,
        description: values.seo_description || values.description || '',
        keywords: seoKeywordsArr,
        canonical_url: values.canonical_url || `https://www.gonomadik.in/destinations/${values.slug}`,
        og_title: values.og_title || values.seo_title || values.name,
        og_description: values.og_description || values.seo_description || values.description || '',
        og_image: values.og_image || values.hero_image || '',
        twitter_title: values.twitter_title || values.og_title || values.seo_title || values.name,
        twitter_description: values.twitter_description || values.og_description || values.seo_description || '',
        twitter_image: values.twitter_image || values.og_image || values.hero_image || '',
      }

      const destinationPayload: any = {
        name: values.name,
        slug: values.slug,
        subtitle: values.subtitle || null,
        country: values.country || 'India',
        state: values.state || null,
        description: values.description || null,
        hero_image: values.hero_image || null,
        hero_video: values.hero_video || null,
        gallery: gallery.filter((g) => g.url),
        highlights: highlights.filter(Boolean),
        weather: weatherObj,
        how_to_reach: howToReachObj,
        seo: seoObj,
        best_time_to_visit: values.best_time || null,
        map_embed_url: values.google_map_url || null,
        is_published: isPublished,
        created_by: admin?.id ?? null,
        updated_by: admin?.id ?? null,
        updated_at: new Date().toISOString(),
      }

      // 1. Save Destination
      let savedDest: any;
      if (isNew) {
        savedDest = await createDestination(destinationPayload)
      } else {
        savedDest = await updateDestination(id, destinationPayload)
      }
      const activeDestId = isNew ? savedDest.id : id

      // 2. Sync Journey / Package
      const priceVal = values.selling_price || values.starting_price || 9499
      const journeyPayload: any = {
        destination_id: activeDestId,
        name: `${values.name} Road Trip`,
        slug: values.slug,
        duration: values.duration || '4 Nights / 5 Days',
        price: priceVal,
        starting_price: values.starting_price || priceVal,
        maximum_price: values.original_price || Math.round(priceVal * 1.3),
        difficulty: values.difficulty || 'Moderate',
        category: values.category || 'Road Trip',
        pickup_point: values.starting_point || 'Delhi NCR',
        drop_point: values.starting_point || 'Delhi NCR',
        transport: values.transport || 'AC Luxury Pushback Tempo Traveller',
        hotel: values.accommodation || 'Handpicked Boutique Stays & Riverside Wooden Cottages',
        food: values.meals || 'Breakfast & Dinner Included (MAP Plan)',
        highlights: highlights.filter(Boolean),
        inclusions: inclusions.filter(Boolean),
        exclusions: exclusions.filter(Boolean),
        hero_banner: values.hero_image || null,
        gallery: gallery.filter((g) => g.url),
        status: statusUpper,
        is_published: isPublished,
        is_deleted: false,
        itinerary: itineraryDays.map((d) => ({
          day: d.day_number,
          title: d.title,
          description: d.description,
          meals: d.meals,
          stay: d.stay,
          transport: d.transport,
          image_url: d.image_url,
        })),
        updated_at: new Date().toISOString(),
      }

      let activeJourneyId = journey?.id
      if (activeJourneyId) {
        await supabase.from('journeys').update(journeyPayload).eq('id', activeJourneyId)
      } else {
        const { data: newJ } = await supabase.from('journeys').insert(journeyPayload).select('id').single()
        if (newJ) activeJourneyId = newJ.id
      }

      // 3. Sync Itinerary Days in itinerary_days table
      if (activeJourneyId && itineraryDays.length > 0) {
        await supabase.from('itinerary_days').delete().eq('journey_id', activeJourneyId)
        const itineraryRows = itineraryDays.map((d, i) => {
          const mealArr: string[] = []
          if (d.meals?.breakfast) mealArr.push('Breakfast')
          if (d.meals?.lunch) mealArr.push('Lunch')
          if (d.meals?.dinner) mealArr.push('Dinner')

          return {
            journey_id: activeJourneyId,
            day_number: d.day_number || i + 1,
            sort_order: i + 1,
            title: d.title,
            description: d.description || '',
            meals: mealArr,
            stay: d.stay || '',
            transport: d.transport || '',
            image_url: d.image_url || null,
            is_highlight: d.is_highlight ?? false,
          }
        })
        await supabase.from('itinerary_days').insert(itineraryRows)
      }

      // 4. Sync FAQs in faqs table
      if (activeDestId && faqs.length > 0) {
        await supabase.from('faqs').delete().eq('destination_id', activeDestId)
        const faqRows = faqs.map((f, i) => ({
          destination_id: activeDestId,
          journey_id: activeJourneyId || null,
          question: f.question,
          answer: f.answer,
          category: 'General',
          sort_order: i + 1,
          page: 'destination',
          is_active: true,
        }))
        await supabase.from('faqs').insert(faqRows)
      }

      return savedDest
    },
    onSuccess: async (dest) => {
      const activeId = isNew ? dest.id : id
      await qc.invalidateQueries({ queryKey: ['destinations'] })
      await qc.invalidateQueries({ queryKey: ['destination', activeId] })
      await qc.invalidateQueries({ queryKey: ['destination_journey'] })
      await qc.invalidateQueries({ queryKey: ['journeys'] })
      toast.success(isNew ? 'Destination and Itinerary created successfully!' : 'Destination and Itinerary updated!')
      if (isNew) navigate({ to: '/admin/destinations/$id', params: { id: dest.id } })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const onSubmit = (values: DestinationFormValues) => saveMutation.mutate(values)

  const onInvalid = (validationErrors: any) => {
    console.error('Validation errors:', validationErrors)
    const errList = Object.entries(validationErrors)
    if (errList.length > 0) {
      const [field, err] = errList[0]
      const msg = (err as any)?.message || 'Invalid value'
      toast.error(`Validation Error (${field}): ${msg}`)
    } else {
      toast.error('Please check the form for errors.')
    }
  }

  if (!isNew && loadingDest) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 bg-card border rounded-2xl p-4 shadow-sm"
      >
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/admin/destinations' })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-poppins truncate">
              {isNew ? 'New Destination' : `Edit: ${destination?.name ?? '...'}`}
            </h1>
            <Badge variant="outline" className="text-xs uppercase font-mono">
              {watch('status')}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage complete destination content, itinerary, pricing, media, inclusions and SEO without touching code.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <a href={`/destinations/${slugValue}`} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Eye className="h-3.5 w-3.5" /> View Live Page
              </Button>
            </a>
          )}
          <Button
            onClick={handleSubmit(onSubmit as any, onInvalid)}
            disabled={saveMutation.isPending}
            className="gap-1.5 text-xs font-semibold"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isNew ? 'Create Destination' : 'Save Changes'}
          </Button>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit as any, onInvalid)}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap w-full h-auto p-1.5 bg-muted/60 rounded-xl gap-1">
            <TabsTrigger value="general" className="text-xs py-2 px-3">General</TabsTrigger>
            <TabsTrigger value="images" className="text-xs py-2 px-3">Images</TabsTrigger>
            <TabsTrigger value="overview" className="text-xs py-2 px-3">Overview</TabsTrigger>
            <TabsTrigger value="highlights" className="text-xs py-2 px-3">Highlights</TabsTrigger>
            <TabsTrigger value="itinerary" className="text-xs py-2 px-3">Itinerary</TabsTrigger>
            <TabsTrigger value="pricing" className="text-xs py-2 px-3">Pricing</TabsTrigger>
            <TabsTrigger value="inclusions" className="text-xs py-2 px-3">Inclusions</TabsTrigger>
            <TabsTrigger value="exclusions" className="text-xs py-2 px-3">Exclusions</TabsTrigger>
            <TabsTrigger value="faqs" className="text-xs py-2 px-3">FAQs</TabsTrigger>
            <TabsTrigger value="seo" className="text-xs py-2 px-3">SEO</TabsTrigger>
            <TabsTrigger value="publishing" className="text-xs py-2 px-3">Publishing</TabsTrigger>
          </TabsList>

          {/* ==================== 1. GENERAL ==================== */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" /> Destination & Journey Basics
                </CardTitle>
                <CardDescription className="text-xs">
                  Primary identification, geography and travel classification.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Destination Name *</Label>
                    <Input {...register('name')} placeholder="e.g. Chitkul & Kalpa" />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">URL Slug * (auto-generated)</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono">/destinations/</span>
                      <Input {...register('slug')} placeholder="chitkul-kalpa" className="font-mono text-xs" />
                    </div>
                    {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Short Subtitle / Tagline</Label>
                  <Input {...register('subtitle')} placeholder="e.g. A scenic Himalayan road trip through remote Kinnaur..." />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">State / Province</Label>
                    <Input {...register('state')} placeholder="e.g. Himachal Pradesh" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Region</Label>
                    <Input {...register('region')} placeholder="e.g. Kinnaur / Himalayas" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Country</Label>
                    <Input {...register('country')} placeholder="India" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Category</Label>
                    <Input {...register('category')} placeholder="e.g. Mountain / Road Trip / Himalayan Escape" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Starting Location</Label>
                    <Input {...register('starting_point')} placeholder="e.g. Delhi NCR" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Difficulty</Label>
                    <Select
                      value={watch('difficulty')}
                      onValueChange={(val) => setValue('difficulty', val)}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Select Difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Easy">Easy</SelectItem>
                        <SelectItem value="Moderate">Moderate</SelectItem>
                        <SelectItem value="Difficult">Difficult</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Group Type</Label>
                    <Input {...register('group_type')} placeholder="e.g. Solo / Couple / Friends / Group" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-accent" /> Best Season / Time to Visit
                    </Label>
                    <Input {...register('best_time')} placeholder="e.g. April to October (Pleasant Vistas) & Dec-Mar (Snow)" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== 2. IMAGES ==================== */}
          <TabsContent value="images" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Images className="h-4 w-4 text-primary" /> Visual Assets & Gallery
                </CardTitle>
                <CardDescription className="text-xs">
                  Upload and manage thumbnail, hero background, and photo gallery with captions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <ImageField
                      label="Hero / Banner Image (High-res background for destination header)"
                      value={watch('hero_image') ?? ''}
                      onChange={(url) => setValue('hero_image', url, { shouldDirty: true })}
                      folder="/destinations"
                    />
                  </div>
                  <div className="space-y-2">
                    <ImageField
                      label="Card Thumbnail Image (Shown on cards and listings)"
                      value={watch('thumbnail_image') ?? ''}
                      onChange={(url) => setValue('thumbnail_image', url, { shouldDirty: true })}
                      folder="/destinations"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Hero Video URL (Optional direct MP4 / YouTube)</Label>
                  <Input {...register('hero_video')} placeholder="https://..." />
                </div>

                {/* Gallery */}
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold">Photo Gallery ({gallery.length})</h4>
                      <p className="text-xs text-muted-foreground">Add high resolution photos to show travelers the beauty of this destination.</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setGalleryPickerOpen(true)}
                      className="gap-1 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Photo
                    </Button>
                  </div>

                  {gallery.length === 0 ? (
                    <div
                      className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 transition-colors bg-muted/10 text-center"
                      onClick={() => setGalleryPickerOpen(true)}
                    >
                      <Images className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-xs font-semibold">No gallery images added yet</p>
                      <p className="text-[11px] text-muted-foreground">Click to upload from your device or select from media assets</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {gallery.map((img, i) => (
                        <div key={i} className="group relative rounded-xl overflow-hidden border bg-muted aspect-[4/3] flex flex-col justify-between">
                          <img src={img.url} alt="" className="h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                          <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              title="Set as Hero"
                              className="p-1 rounded bg-black/60 text-white hover:bg-primary text-[10px]"
                              onClick={() => setValue('hero_image', img.url, { shouldDirty: true })}
                            >
                              Hero
                            </button>
                            <button
                              type="button"
                              title="Set as Thumbnail"
                              className="p-1 rounded bg-black/60 text-white hover:bg-primary text-[10px]"
                              onClick={() => setValue('thumbnail_image', img.url, { shouldDirty: true })}
                            >
                              Thumb
                            </button>
                            <button
                              type="button"
                              className="p-1 rounded bg-black/60 text-white hover:bg-destructive"
                              onClick={() => setGallery(gallery.filter((_, j) => j !== i))}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="absolute bottom-0 inset-x-0 p-1.5 bg-black/60">
                            <input
                              type="text"
                              value={img.caption}
                              onChange={(e) => setGallery(gallery.map((g, j) => j === i ? { ...g, caption: e.target.value } : g))}
                              placeholder="Photo caption..."
                              className="w-full text-[10px] bg-transparent text-white placeholder-white/60 border-none outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <MediaPicker
              open={galleryPickerOpen}
              onClose={() => setGalleryPickerOpen(false)}
              onSelect={(asset) => {
                setGallery([...gallery, { url: asset.url, caption: asset.alt_text || '' }])
                setGalleryPickerOpen(false)
              }}
              accept="image"
            />
          </TabsContent>

          {/* ==================== 3. OVERVIEW ==================== */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Destination Descriptions & Travel Logistics
                </CardTitle>
                <CardDescription className="text-xs">
                  Rich narrative, seasonal weather guide, and arrival instructions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Short Teaser Description (Shown on cards and summaries)</Label>
                  <Textarea
                    {...register('subtitle')}
                    placeholder="2-3 sentence teaser for cards..."
                    rows={2}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Full Comprehensive Description / Narrative</Label>
                  <Textarea
                    {...register('description')}
                    placeholder="In-depth storytelling of the destination, valleys, rivers, culture, food, and experience..."
                    rows={6}
                  />
                </div>

                <div className="pt-4 border-t space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Weather by Season</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Summer Weather</Label>
                      <Textarea {...register('weather_summer')} rows={2} placeholder="e.g. 12°C to 24°C · Pleasant mountain weather..." />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Monsoon Weather</Label>
                      <Textarea {...register('weather_monsoon')} rows={2} placeholder="e.g. 14°C to 20°C · Lush green valleys..." />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Winter Weather</Label>
                      <Textarea {...register('weather_winter')} rows={2} placeholder="e.g. -8°C to 5°C · Heavy snow blankets..." />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">How to Reach</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">By Road</Label>
                      <Textarea {...register('reach_road')} rows={2} placeholder="e.g. Delhi NCR to Shimla via NH05..." />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">By Train</Label>
                      <Textarea {...register('reach_rail')} rows={2} placeholder="e.g. Nearest station is Chandigarh..." />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">By Flight</Label>
                      <Textarea {...register('reach_air')} rows={2} placeholder="e.g. Nearest airport is Chandigarh (IXC)..." />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <Label className="text-xs flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-accent" /> Google Maps Embed / Location URL
                  </Label>
                  <Input {...register('google_map_url')} placeholder="https://maps.google.com/..." />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== 4. HIGHLIGHTS ==================== */}
          <TabsContent value="highlights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Key Experience Highlights
                </CardTitle>
                <CardDescription className="text-xs">
                  Bullet points displayed as top badges and featured experience highlights on the destination page.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StringListEditor
                  label="Destination Highlights"
                  list={highlights}
                  setList={setHighlights}
                  placeholder="e.g. Chitkul village — The last inhabited village on the Indo-Tibetan border"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== 5. ITINERARY BUILDER ==================== */}
          <TabsContent value="itinerary" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" /> Dynamic Itinerary Builder
                </CardTitle>
                <CardDescription className="text-xs">
                  Create and manage day-by-day itineraries with day titles, descriptions, transport, meals, stays and day photos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ItineraryEditor
                  value={itineraryDays}
                  onChange={setItineraryDays}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== 6. PRICING ==================== */}
          <TabsContent value="pricing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" /> Pricing & Commercials
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure package pricing, per-person rates, discounts, and GST.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Starting / Selling Price (₹) *</Label>
                    <Input
                      type="number"
                      {...register('starting_price', { valueAsNumber: true })}
                      placeholder="9499"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Original / Strike Price (₹)</Label>
                    <Input
                      type="number"
                      {...register('original_price', { valueAsNumber: true })}
                      placeholder="12999"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">GST (%)</Label>
                    <Input
                      type="number"
                      {...register('gst_percent', { valueAsNumber: true })}
                      placeholder="5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Trip Duration</Label>
                    <Input {...register('duration')} placeholder="e.g. 4 Nights / 5 Days" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Transportation Mode</Label>
                    <Input {...register('transport')} placeholder="e.g. AC Luxury Pushback Tempo Traveller" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Accommodation Style</Label>
                    <Input {...register('accommodation')} placeholder="e.g. Boutique Mountain Stays & Riverside Wooden Cottages" />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <Label className="text-xs">Meal Plan Info</Label>
                  <Input {...register('meals')} placeholder="e.g. Breakfast & Dinner Included (MAP Plan)" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Pricing Notes</Label>
                  <Input {...register('pricing_notes')} placeholder="e.g. Triple sharing basis. Double occupancy supplement available upon request." />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== 7. INCLUSIONS ==================== */}
          <TabsContent value="inclusions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Package Inclusions
                </CardTitle>
                <CardDescription className="text-xs">
                  List services, stays, meals, transport, and captain support included in this trip.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StringListEditor
                  label="Inclusions"
                  list={inclusions}
                  setList={setInclusions}
                  placeholder="e.g. 4 Nights boutique mountain hotel & riverside wooden cottage accommodation"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== 8. EXCLUSIONS ==================== */}
          <TabsContent value="exclusions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-destructive" /> Package Exclusions
                </CardTitle>
                <CardDescription className="text-xs">
                  List items not included to ensure 100% transparency with travelers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StringListEditor
                  label="Exclusions"
                  list={exclusions}
                  setList={setExclusions}
                  placeholder="e.g. Lunches and personal shopping expenses"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== 9. FAQS ==================== */}
          <TabsContent value="faqs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-primary" /> Destination FAQs ({faqs.length})
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setFaqs([...faqs, { question: '', answer: '' }])}
                    className="gap-1 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add FAQ
                  </Button>
                </CardTitle>
                <CardDescription className="text-xs">
                  Answers to top traveler questions displayed in the FAQ accordion on this destination's page.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {faqs.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6 border border-dashed rounded-xl">
                    No FAQs added yet. Click &apos;Add FAQ&apos; to add route answers.
                  </p>
                )}
                {faqs.map((faq, i) => (
                  <div key={i} className="p-3 border rounded-xl bg-card space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-2">
                        <Input
                          value={faq.question}
                          onChange={(e) => setFaqs(faqs.map((f, j) => (j === i ? { ...f, question: e.target.value } : f)))}
                          placeholder="Question (e.g. Is Chitkul safe for solo travelers?)"
                          className="text-xs font-semibold"
                        />
                        <Textarea
                          value={faq.answer}
                          onChange={(e) => setFaqs(faqs.map((f, j) => (j === i ? { ...f, answer: e.target.value } : f)))}
                          placeholder="Detailed helpful answer..."
                          rows={2}
                          className="text-xs"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive h-8 w-8 mt-1"
                        onClick={() => setFaqs(faqs.filter((_, j) => j !== i))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== 10. SEO ==================== */}
          <TabsContent value="seo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Search className="h-4 w-4 text-primary" /> Search Engine Optimization & Social Sharing
                </CardTitle>
                <CardDescription className="text-xs">
                  Fine-tune meta tags, OpenGraph visuals, Twitter cards, and canonical links.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs">SEO Title</Label>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {(watch('seo_title') || '').length} / 70
                    </span>
                  </div>
                  <Input
                    {...register('seo_title')}
                    placeholder="Chitkul & Kalpa Trip Package from Delhi — Kinnaur Road Trip | GoNomadik"
                    maxLength={80}
                    className="text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">Recommended: 50–70 characters for best Google display.</p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs">Meta Description</Label>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {(watch('seo_description') || '').length} / 160
                    </span>
                  </div>
                  <Textarea
                    {...register('seo_description')}
                    placeholder="Book curated Chitkul & Kalpa road trips from Delhi. Experience Baspa Valley, Kinnaur Kailash views, the last village of India & verified stays with Trip Captains..."
                    rows={3}
                    maxLength={180}
                    className="text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">Recommended: 120–160 characters.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">SEO Keywords (comma separated)</Label>
                  <Input
                    {...register('seo_keywords')}
                    placeholder="Chitkul trip, Kalpa road trip, Kinnaur tour package from Delhi, Chitkul last village of India"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Canonical URL</Label>
                  <Input
                    {...register('canonical_url')}
                    placeholder="https://www.gonomadik.in/destinations/chitkul-kalpa"
                    className="font-mono text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Share2 className="h-3.5 w-3.5" /> OpenGraph (Facebook / WhatsApp / LinkedIn)
                    </h4>
                    <div className="space-y-1.5">
                      <Label className="text-xs">OG Title</Label>
                      <Input {...register('og_title')} placeholder="Chitkul & Kalpa Trip Package | GoNomadik" className="text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">OG Description</Label>
                      <Textarea {...register('og_description')} rows={2} placeholder="OG summary description..." className="text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">OG Image URL</Label>
                      <Input {...register('og_image')} placeholder="https://..." className="text-xs font-mono" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Share2 className="h-3.5 w-3.5" /> Twitter Card
                    </h4>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Twitter Title</Label>
                      <Input {...register('twitter_title')} placeholder="Twitter title..." className="text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Twitter Description</Label>
                      <Textarea {...register('twitter_description')} rows={2} placeholder="Twitter summary description..." className="text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Twitter Image URL</Label>
                      <Input {...register('twitter_image')} placeholder="https://..." className="text-xs font-mono" />
                    </div>
                  </div>
                </div>

                {/* Google Search Snippet Preview */}
                <div className="mt-4 p-4 border rounded-xl bg-slate-50 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Google Search Preview</span>
                  <p className="text-xs text-[#202124] font-mono truncate">{watch('canonical_url') || `https://www.gonomadik.in/destinations/${slugValue}`}</p>
                  <p className="text-sm font-semibold text-[#1a0dab] hover:underline cursor-pointer truncate">
                    {watch('seo_title') || `${watch('name') || 'Destination'} Road Trip Package | GoNomadik`}
                  </p>
                  <p className="text-xs text-[#4d5156] line-clamp-2">
                    {watch('seo_description') || watch('description') || 'Explore curated road trips and verified stays with GoNomadik.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== 11. PUBLISHING ==================== */}
          <TabsContent value="publishing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-primary" /> Publishing & Visibility Controls
                </CardTitle>
                <CardDescription className="text-xs">
                  Controls whether this destination is visible to public visitors, featured on homepage, and indexed in the sitemap.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/10">
                  <div>
                    <Label className="text-sm font-semibold">Publishing Status</Label>
                    <p className="text-xs text-muted-foreground">Draft destinations remain hidden from public users & search engines.</p>
                  </div>
                  <Select
                    value={watch('status')}
                    onValueChange={(v) => setValue('status', v as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED', { shouldDirty: true })}
                  >
                    <SelectTrigger className="w-36 text-xs font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLISHED">Published (Active)</SelectItem>
                      <SelectItem value="DRAFT">Draft (Hidden)</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/10">
                  <div>
                    <Label className="text-sm font-semibold">Featured on Homepage</Label>
                    <p className="text-xs text-muted-foreground">Display card prominently in the Popular Destinations homepage grid.</p>
                  </div>
                  <Switch
                    checked={watch('is_featured')}
                    onCheckedChange={(v) => setValue('is_featured', v, { shouldDirty: true })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/10">
                  <div>
                    <Label className="text-sm font-semibold">Display Priority</Label>
                    <p className="text-xs text-muted-foreground">Higher number appears earlier in destination listings and navigation.</p>
                  </div>
                  <Input
                    type="number"
                    className="w-24 text-center font-mono text-sm"
                    {...register('priority', { valueAsNumber: true })}
                    min={0}
                    max={100}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  )
}
