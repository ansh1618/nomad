'use client'

import { useState, useEffect } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'motion/react'
import { useQuery } from '@tanstack/react-query'
import {
  Check,
  X,
  ArrowLeft,
  Loader2,
  Mountain,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Star,
  Camera,
  Video,
  Users,
  Heart,
  Eye,
  MapPin,
  Flame,
  Music,
  Download,
  Building2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
  HelpCircle,
  Bus,
  Map,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { getPackageBySlug, getRelatedPackages } from '@/lib/queries/packages'
import { getStoriesByPackage } from '@/lib/queries/stories'
import { getUpcomingDepartures } from '@/lib/queries/departures'
import { getApprovedReviews } from '@/lib/queries/admin'
import type { Departure, ItineraryDay } from '@/types/supabase'
import { toast } from 'sonner'
import { validateCoupon } from '@/lib/booking-api'
import { createGuestBookingFn } from '@/lib/booking-fns'
import { useAuth } from './AuthContext'
import { getPackageDocumentBySlugFn } from '@/lib/itinerary-pdf-fns'
const getFallbackTransport = (slug: string) => {
  const s = slug.toLowerCase()
  if (s.includes('jibhi')) {
    return {
      vehicle_name: "Force Traveller (17 Seater)",
      vehicle_type: "Super Deluxe AC Traveller",
      seat_capacity: 17,
      available_seats: 6,
      departure_time: "06:30 PM",
      arrival_time: "08:30 AM (Next Day)",
      ac: true,
      music: true,
      charging_ports: true,
      trip_captain: true,
      cover_image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&w=600&q=80"
      ],
      features: ["Pushback Seats", "Charging Points", "Music System", "AC", "First Aid Kit", "Ample Legroom"]
    }
  }
  if (s.includes('manali')) {
    return {
      vehicle_name: "Volvo Sleeper Coach / Tempo Traveller",
      vehicle_type: "Premium AC Volvo Multi-Axle",
      seat_capacity: 40,
      available_seats: 12,
      departure_time: "05:30 PM",
      arrival_time: "09:00 AM (Next Day)",
      ac: true,
      music: true,
      charging_ports: true,
      trip_captain: true,
      cover_image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&w=600&q=80"
      ],
      features: ["Premium Volvo Suspension", "Pushback Seats", "Individual AC Vents", "USB Charging", "Music System", "LED Cabin Lights"]
    }
  }
  // Default to Udaipur / general
  return {
    vehicle_name: "Luxury AC Tempo Traveller",
    vehicle_type: "17-Seater Premium Cruiser",
    seat_capacity: 17,
    available_seats: 5,
    departure_time: "07:30 PM",
    arrival_time: "07:30 AM (Next Day)",
    ac: true,
    music: true,
    charging_ports: true,
    trip_captain: true,
    cover_image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&w=600&q=80"
    ],
    features: ["Pushback Seats", "Personal USB Charging", "High-Fidelity Audio System", "Safety GPS Tracking", "AC Vents", "Luggage Space"]
  }
}

const getFallbackAccommodation = (slug: string) => {
  const s = slug.toLowerCase()
  if (s.includes('jibhi')) {
    return {
      hotel_name: "Riverview Cottage / Swiss Camps",
      hotel_category: "3 Star Premium Stay",
      location: "Jibhi Valley, Himachal Pradesh",
      google_maps: "https://maps.google.com",
      check_in: "12:00 PM",
      check_out: "11:00 AM",
      cover_image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80"
      ],
      room_types: ["Double Sharing", "Triple Sharing", "Quad Sharing"],
      amenities: ["Wi-Fi", "Geyser / Hot Water", "Bonfire Area", "In-house Cafe", "Room Service", "Power Backup"]
    }
  }
  if (s.includes('manali')) {
    return {
      hotel_name: "Hotel Snow Crest Manor / Similar",
      hotel_category: "3 Star Premium Hotel",
      location: "Near Mall Road, Manali",
      google_maps: "https://maps.google.com",
      check_in: "12:00 PM",
      check_out: "11:00 AM",
      cover_image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80"
      ],
      room_types: ["Double Sharing", "Triple Sharing", "Quad Sharing"],
      amenities: ["Wi-Fi", "Geyser / Heater", "Multi-Cuisine Restaurant", "Mountain Views", "LED TV", "Parking"]
    }
  }
  // Default to Udaipur / general
  return {
    hotel_name: "Hotel Raj Palace / Heritage Resort",
    hotel_category: "3 Star Premium Hotel",
    location: "Lake City, Udaipur",
    google_maps: "https://maps.google.com",
    check_in: "12:00 PM",
    check_out: "11:00 AM",
    cover_image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80"
    ],
    room_types: ["Double Sharing", "Triple Sharing", "Quad Sharing"],
    amenities: ["Wi-Fi", "Geyser / Hot Water", "Rooftop Restaurant", "Lake View Rooms", "Laundry service", "Travel Desk"]
  }
}

import { ItineraryUnlockModal } from './ItineraryUnlockModal'

interface JourneyDetailTemplateProps {
  slug: string
}

export function JourneyDetailTemplate({ slug }: JourneyDetailTemplateProps) {
  const navigate = useNavigate()
  const [activeDay, setActiveDay] = useState<number | null>(1)
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null)
  const [activeFaqKey, setActiveFaqKey] = useState<string | null>(null)
  const [faqSearchQuery, setFaqSearchQuery] = useState('')
  const [selectedDepartureId, setSelectedDepartureId] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'itinerary' | 'includes' | 'faqs'>('itinerary')
  
  // Hero Gallery Image index
  const [heroImageIndex, setHeroImageIndex] = useState(0)

  // Lightbox & Video states
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [lightboxDayFilter, setLightboxDayFilter] = useState<number | null>(null)

  // Integrated Booking Wizard Step State
  const [bookingStep, setBookingStep] = useState(1) // Steps: 1, 2, 3, 4
  const [showValError, setShowValError] = useState(false)

  // Form Field States (Step 2)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isWhatsapp, setIsWhatsapp] = useState(true)
  const [address, setAddress] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [guardianNumber, setGuardianNumber] = useState('')
  const [aadharFile, setAadharFile] = useState<File | null>(null)
  const [aadharFileName, setAadharFileName] = useState('')
  const [profileFile, setProfileFile] = useState<File | null>(null)
  const [profileFileName, setProfileFileName] = useState('')
  const [referredBy, setReferredBy] = useState('')
  const [howHeard, setHowHeard] = useState('')
  const [step2Errors, setStep2Errors] = useState<Record<string, string>>({})

  // Transport Selection (Step 3)
  const [transportType, setTransportType] = useState<'standard' | 'sleeper'>('standard')
  const [seatPreference, setSeatPreference] = useState<'window' | 'aisle' | 'none'>('none')

  // Step 4 final package choices & coupon
  const [sharingType, setSharingType] = useState<'double' | 'triple' | 'quad'>('quad')
  const [paymentSchedule, setPaymentSchedule] = useState<'full' | 'slot'>('full')
  // Coupon applied state
  const [appliedCouponId, setAppliedCouponId] = useState<string | null>(null)
  const [couponValidating, setCouponValidating] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [couponError, setCouponError] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [termsError, setTermsError] = useState(false)

  // Checkout submission states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [successBookingId, setSuccessBookingId] = useState('')

  // Payment initiation state
  const [paymentSessionId, setPaymentSessionId] = useState('')
  const [pendingBookingId, setPendingBookingId] = useState('')
  const [pendingBookingRef, setPendingBookingRef] = useState('')

  const { data: journey, isLoading } = useQuery({
    queryKey: ['package', slug],
    queryFn: () => getPackageBySlug(slug),
  })

  const { data: departures = [] } = useQuery({
    queryKey: ['departures', journey?.id],
    queryFn: () => getUpcomingDepartures(journey!.id),
    enabled: !!journey?.id,
  })

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', journey?.id],
    queryFn: () => getApprovedReviews(journey!.id, 6),
    enabled: !!journey?.id,
  })

  const { data: packageStories = [] } = useQuery({
    queryKey: ['package_stories', journey?.id],
    queryFn: () => getStoriesByPackage(journey!.id, 3),
    enabled: !!journey?.id,
  })

  const { user } = useAuth()
  const [unlockModalOpen, setUnlockModalOpen] = useState(false)

  const { data: premiumDoc } = useQuery({
    queryKey: ['package_premium_doc', journey?.id],
    queryFn: () => getPackageDocumentBySlugFn({ data: { slug, type: 'ITINERARY' } }),
    enabled: !!journey?.id
  })

  const handleViewPdf = () => {
    const targetUrl = `/account/itinerary/${slug}?type=ITINERARY`
    if (!user) {
      sessionStorage.setItem("auth_redirect_target", targetUrl)
      setUnlockModalOpen(true)
    } else {
      window.open(targetUrl, "_blank")
    }
  }

  const { data: relatedPackages = [] } = useQuery({
    queryKey: ['related', journey?.id, journey?.destination_id],
    queryFn: () => getRelatedPackages(journey!.id, journey!.destination_id),
    enabled: !!journey?.id && !!journey?.destination_id,
  })

  // Automatically select the first departure
  useEffect(() => {
    if (departures.length > 0 && !selectedDepartureId) {
      setSelectedDepartureId(departures[0].id)
    }
  }, [departures, selectedDepartureId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F8F7F3]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-poppins">Loading journey details...</p>
        </div>
      </div>
    )
  }

  if (!journey) {
    return (
      <div className="flex h-screen items-center justify-center text-center px-5 bg-[#F8F7F3]">
        <div className="space-y-4">
          <Mountain className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-3xl font-display font-bold">Journey Not Found</h1>
          <p className="text-muted-foreground font-poppins">The road you seek hasn't been mapped yet.</p>
          <Link to="/">
            <Button>← Back to Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  const selectedDeparture = departures.find((d) => d.id === selectedDepartureId) ?? departures[0] ?? null
  
  // Calculate price dynamics based on step inputs
  const basePrice = selectedDeparture
    ? (selectedDeparture.dynamic_price ?? selectedDeparture.base_price)
    : (journey.starting_price ?? 6500)

  // Room sharing price offsets (double +800, triple +500, quad +0)
  const getSharingPrice = () => {
    if (sharingType === 'double') return basePrice + 800
    if (sharingType === 'triple') return basePrice + 500
    return basePrice // quad sharing is base price
  }

  const sharingPrice = getSharingPrice()
  const transportModifier = transportType === 'sleeper' ? 1000 : 0
  const priceBeforeDiscount = sharingPrice + transportModifier
  const finalPrice = Math.max(0, priceBeforeDiscount - discountAmount)

  // Payment schedule dynamic amounts
  const payableNow = paymentSchedule === 'full' ? finalPrice : 2000

  const itineraryDays: ItineraryDay[] = journey.itinerary_days ?? []
  const inclusions: string[] = journey.inclusions ?? []
  const exclusions: string[] = journey.exclusions ?? []

  const transport = (journey.transport && journey.transport.length > 0)
    ? journey.transport[0]
    : getFallbackTransport(slug)

  const stay = (journey.accommodation && journey.accommodation.length > 0)
    ? journey.accommodation[0]
    : getFallbackAccommodation(slug)
  // Combine mapped library FAQs and custom FAQs, fallback to journeys.faqs JSONB array
  const packageFaqsList = (journey as any).package_faqs?.map((pf: any) => pf.faq_library).filter(Boolean) || []
  const customFaqsList = (journey as any).custom_package_faqs || []
  const allFaqsRaw = [...packageFaqsList, ...customFaqsList]
  const parsedFaqs = allFaqsRaw.length > 0
    ? allFaqsRaw.map((f: any) => ({
        id: f.id || f.question,
        question: f.question,
        answer: f.answer,
        category: f.category || 'General',
        featured: f.featured || false
      }))
    : (journey.faqs || []).map((f: any) => ({
        id: f.question,
        question: f.question,
        answer: f.answer,
        category: 'General',
        featured: false
      }))

  // Collect images for Hero slider
  const galleryImages = journey.gallery && journey.gallery.length > 0
    ? journey.gallery
    : [journey.hero_banner || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b']

  const currentHeroImage = (typeof (galleryImages[heroImageIndex] || journey.hero_banner) === 'string'
    ? (galleryImages[heroImageIndex] || journey.hero_banner)
    : (galleryImages[heroImageIndex] as any)?.url || journey.hero_banner || '') as string

  const formatDepartureDateRange = (startStr: string, endStr: string) => {
    if (!startStr) return ''
    const start = new Date(startStr)
    let end = endStr ? new Date(endStr) : null

    const durationDays = journey.duration_days || 3
    if (!end || isNaN(end.getTime()) || end.getTime() === start.getTime() || end.getFullYear() > 2100) {
      end = new Date(start)
      end.setDate(start.getDate() + Math.max(0, durationDays - 1))
    }

    const startDay = start.getDate()
    const endDay = end.getDate()

    const startMonth = start.toLocaleDateString('en-US', { month: 'short' })
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' })

    const startYear = start.getFullYear()
    const endYear = end.getFullYear()

    if (startYear !== endYear) {
      return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`
    }

    if (startMonth !== endMonth) {
      return `${startDay} ${startMonth} - ${endDay} ${endMonth}`
    }

    return `${startDay} ${startMonth} - ${endDay} ${startMonth}`
  }

  // Calendar dates matching departures
  const departureDates = departures.map((d) => new Date(d.departure_date))

  const handleCalendarSelect = (date: Date | undefined) => {
    if (!date) return
    const matched = departures.find((d) => {
      const depDate = new Date(d.departure_date)
      return (
        depDate.getDate() === date.getDate() &&
        depDate.getMonth() === date.getMonth() &&
        depDate.getFullYear() === date.getFullYear()
      )
    })
    if (matched) {
      setSelectedDepartureId(matched.id)
    }
  }

  // Handle Step progression
  const handleStep1Continue = () => {
    if (!selectedDeparture) {
      setShowValError(true)
      return
    }
    setShowValError(false)
    setBookingStep(2)
  }

  const handleStep2Continue = () => {
    const errors: Record<string, string> = {}
    if (!fullName.trim()) errors.fullName = 'Full Name is required'
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) errors.email = 'Valid Email Address is required'
    if (!phone.trim() || phone.length < 8) errors.phone = 'Valid Phone Number is required'
    if (!address.trim()) errors.address = 'Address is required'
    if (!age.trim() || isNaN(Number(age)) || Number(age) <= 0) errors.age = 'Valid Age is required'
    if (!gender) errors.gender = 'Gender selection is required'
    if (!aadharFile) errors.aadhar = 'Aadhar Card Photo is required'
    if (!profileFile) errors.profile = 'Profile Photo is required'

    if (Object.keys(errors).length > 0) {
      setStep2Errors(errors)
      return
    }

    setStep2Errors({})
    setBookingStep(3)
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponValidating(true)
    setCouponError('')
    try {
      const result = await validateCoupon(couponCode, priceBeforeDiscount)
      if (result.valid) {
        setDiscountAmount(result.discountAmount)
        setCouponApplied(true)
        setAppliedCouponId(result.couponId ?? null)
        toast.success(result.message)
      } else {
        setCouponError(result.message)
        setCouponApplied(false)
        setDiscountAmount(0)
        setAppliedCouponId(null)
      }
    } catch {
      setCouponError('Failed to validate coupon. Please try again.')
    } finally {
      setCouponValidating(false)
    }
  }

  const handleFinalSubmit = async () => {
    if (!agreeTerms) {
      setTermsError(true)
      return
    }
    setTermsError(false)
    setIsSubmitting(true)

    try {
      // 1. Upload traveler documents to Supabase Storage
      let aadharUrl: string | null = null
      let profileUrl: string | null = null

      if (aadharFile && profileFile) {
        const { uploadTravelerDocuments } = await import('@/lib/storage-fns')
        const uploadRes = await uploadTravelerDocuments(aadharFile, profileFile, `temp-${Date.now()}`)
        aadharUrl = uploadRes.aadharUrl
        profileUrl = uploadRes.profileUrl
      }

      // 2. Submit booking securely via server-side function
      const response = await createGuestBookingFn({
        data: {
          fullName,
          email: email || '',
          phone,
          isWhatsapp,
          address: address || undefined,
          age: age || undefined,
          gender: gender || 'MALE',
          guardianNumber: guardianNumber || undefined,
          aadharUrl: aadharUrl ?? undefined,
          profileUrl: profileUrl ?? undefined,
          referredBy: referredBy || undefined,
          howHeard: howHeard || undefined,
          sharingType,
          seatPreference: seatPreference !== 'none' ? seatPreference : 'NONE',
          paymentSchedule,
          couponId: appliedCouponId ?? undefined,
          discountAmount,
          priceBeforeDiscount,
          departureId: selectedDeparture?.id ?? undefined,
          journeyId: journey?.id ?? undefined,
          specialRequests: specialRequests || undefined,
        }
      })

      if (!response.success) {
        throw new Error(response.error || 'Failed to create booking on the server.')
      }

      setPendingBookingId(response.bookingId)
      setPendingBookingRef(response.bookingRef)
      setPaymentSessionId(response.paymentSessionId)
      setBookingStep(5) // Show payment / verification screen

      // 3. Load Cashfree SDK and open payment modal
      await loadCashfreeAndPay(response.paymentSessionId, response.bookingRef)

    } catch (e: any) {
      console.error('Booking failed:', e)
      toast.error(e.message || 'Failed to create booking. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Dynamically load Cashfree JS SDK and open Drop-in checkout.
   * On payment success, navigate to booking success page.
   * Frontend does NOT update booking status — webhook does that.
   */
  const loadCashfreeAndPay = async (sessionId: string, bookingRef: string) => {
    try {
      // Load Cashfree SDK dynamically
      if (!document.getElementById('cashfree-sdk')) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.id = 'cashfree-sdk'
          script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js'
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Failed to load Cashfree SDK'))
          document.head.appendChild(script)
        })
      }

      const cashfree = (window as any).Cashfree({
        mode: (import.meta.env.VITE_CASHFREE_ENVIRONMENT ?? 'SANDBOX').toLowerCase() === 'production'
          ? 'production'
          : 'sandbox',
      })

      cashfree.checkout({
        paymentSessionId: sessionId,
        redirectTarget: '_modal',
      }).then((result: any) => {
        if (result.error) {
          toast.error('Payment failed: ' + result.error.message)
          setIsSubmitting(false)
          setBookingStep(4) // Go back to review step
        } else if (result.paymentDetails) {
          // Payment initiated — navigate to success/verify page
          // Webhook will confirm the booking
          navigate({ to: '/booking/success', search: { booking_id: pendingBookingId } })
        }
      }).catch((err: any) => {
        toast.error('Payment error: ' + err.message)
        setBookingStep(4)
      })
    } catch (err: any) {
      toast.error('Could not load payment gateway: ' + err.message)
      setBookingStep(4)
    }
  }

  return (
    <div className="bg-[#F8F7F3] min-h-screen text-foreground font-sans">
      {/* ==================== HERO SECTION ==================== */}
      <section className="relative h-[80vh] min-h-[500px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={currentHeroImage}
            alt={journey.name}
            className="w-full h-full object-cover transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-5 pb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4 max-w-3xl">
            <button
              onClick={() => navigate({ to: '/destinations' })}
              className="flex items-center gap-1.5 text-white/80 hover:text-white text-xs font-semibold uppercase tracking-wider font-poppins transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Trips
            </button>

            <div className="space-y-2">
              <Badge className="bg-[#E53E3E] text-white font-poppins font-bold text-[10px] tracking-wider uppercase px-3 py-1 border-0">
                Popular Group Trip
              </Badge>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                {journey.name}
              </h1>
              {journey.tagline && (
                <p className="text-white/80 text-sm sm:text-base font-poppins max-w-2xl">
                  {journey.tagline}
                </p>
              )}
              {(() => {
                const experienceStats = (journey as any).experience_stats ?? {
                  travelers: 420,
                  stories: 178,
                  photos: 980,
                  videos: 56,
                  reels: 32,
                  avg_rating: 4.9
                };
                return (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 border-t border-white/20 text-white/95 text-xs sm:text-sm font-poppins font-medium mt-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-[#C8A96A]" /> {journey.destinations?.name || 'India'} Trip Experience
                    </span>
                    <span className="flex items-center gap-1 border-l border-white/20 pl-4">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {experienceStats.avg_rating || '4.9'}
                    </span>
                    <span className="flex items-center gap-1 border-l border-white/20 pl-4">
                      <strong>{experienceStats.travelers?.toLocaleString('en-IN') || '420'}</strong> Travelers
                    </span>
                    <span className="flex items-center gap-1 border-l border-white/20 pl-4">
                      <strong>{experienceStats.stories || '178'}</strong> Stories
                    </span>
                    <span className="flex items-center gap-1 border-l border-white/20 pl-4">
                      <strong>{experienceStats.photos || '980'}</strong> Photos
                    </span>
                    <span className="flex items-center gap-1 border-l border-white/20 pl-4">
                      <strong>{experienceStats.videos || '56'}</strong> Videos
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Hero Gallery Slider Thumbnails (overlay bottom right) */}
          {galleryImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto max-w-sm bg-black/45 backdrop-blur-sm p-2 rounded-xl border border-white/10 shrink-0 self-start md:self-end">
              {galleryImages.slice(0, 6).map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setHeroImageIndex(idx)}
                  className={`h-11 w-16 rounded-md overflow-hidden border-2 transition-all ${
                    heroImageIndex === idx ? 'border-[#C8A96A] scale-95 shadow' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ==================== MAIN CONTENT & BOOKING SIDEBAR ==================== */}
      <div className="max-w-7xl mx-auto px-5 py-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Trip Details */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* Details Specifications Grid Block */}
          <div className="bg-white rounded-2xl border border-[#E4E2DA] overflow-hidden grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-[#E4E2DA] shadow-soft">
            <div className="p-5 text-center md:text-left space-y-1">
              <span className="block text-[9px] uppercase tracking-wider text-muted-foreground font-poppins font-semibold">Duration</span>
              <span className="block text-sm font-bold text-primary font-poppins">
                {journey.duration ?? `${journey.duration_days} Days / ${journey.duration_nights} Nights`}
              </span>
            </div>
            <div className="p-5 text-center md:text-left space-y-1">
              <span className="block text-[9px] uppercase tracking-wider text-muted-foreground font-poppins font-semibold">Group Size</span>
              <span className="block text-sm font-bold text-primary font-poppins">
                {journey.group_size_max || '25'} Explorers
              </span>
            </div>
            <div className="p-5 text-center md:text-left space-y-1">
              <span className="block text-[9px] uppercase tracking-wider text-muted-foreground font-poppins font-semibold">Best Time</span>
              <span className="block text-sm font-bold text-primary font-poppins">
                {(journey as any).season || 'April – July'}
              </span>
            </div>
            <div className="p-5 text-center md:text-left space-y-1">
              <span className="block text-[9px] uppercase tracking-wider text-muted-foreground font-poppins font-semibold">Difficulty</span>
              <span className="block text-sm font-bold text-primary font-poppins">
                {journey.difficulty || 'Easy'}
              </span>
            </div>
          </div>

          {/* Overview text */}
          {journey.overview && (
            <div className="bg-white p-6 rounded-2xl border border-[#E4E2DA] shadow-soft space-y-3">
              <h3 className="font-display text-xl font-bold text-primary">About the Trip</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap font-poppins">
                {journey.overview}
              </p>
            </div>
          )}

          {/* Highlights & Tabs timeline section */}
          <div className="bg-white p-6 rounded-2xl border border-[#E4E2DA] shadow-soft space-y-6">
            <h2 className="font-display text-2xl font-bold text-primary">Trip Highlights</h2>

            {/* Custom Tab Selectors */}
            <div className="flex border-b border-[#E4E2DA] gap-6">
              {(['itinerary', 'includes', 'faqs'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-sm font-poppins font-bold tracking-wider uppercase border-b-2 transition-all ${
                    activeTab === tab ? 'border-[#C8A96A] text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab === 'includes' ? 'Inclusions' : tab}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="pt-2">
              {activeTab === 'itinerary' && (
                <div className="space-y-6">
                  {itineraryDays.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic font-poppins">Itinerary details coming soon.</p>
                  ) : (
                    <div className="space-y-6 border-l-2 border-[#E4E2DA] pl-6 ml-4">
                      {itineraryDays.map((day) => (
                        <div key={day.id} className="relative space-y-2">
                          {/* Timeline node */}
                          <div className="absolute -left-[33px] top-1.5 w-4 h-4 rounded-full bg-[#C8A96A] border-2 border-white" />
                          <span className="text-[10px] uppercase tracking-wider text-[#C8A96A] font-poppins font-bold">
                            Day {day.day_number}
                          </span>
                          <h3 className="font-display text-lg font-bold text-primary">{day.title}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed font-poppins">
                            {day.description}
                          </p>
                          {day.image_url && (
                            <img src={day.image_url} alt="" className="w-full max-h-60 object-cover rounded-xl mt-3" />
                          )}
                          {/* Day Wise Linked Media */}
                          {(() => {
                            const dayPhotos = (journey.gallery ?? []).filter((g: any) => typeof g === 'object' && g.day === day.day_number);
                            const dayVideos = (journey.videos ?? []).filter((v: any) => typeof v === 'object' && v.day === day.day_number);
                            
                            if (dayPhotos.length === 0 && dayVideos.length === 0) return null;
                            
                            return (
                              <div className="mt-3.5 space-y-2 bg-muted/40 p-3 rounded-xl border border-dashed border-[#E4E2DA]">
                                <span className="block text-[9px] uppercase tracking-wider text-muted-foreground font-poppins font-bold">
                                  Captured on Day {day.day_number}
                                </span>
                                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                                  {dayPhotos.map((photo: any, pIdx: number) => (
                                    <div 
                                      key={pIdx} 
                                      className="h-16 w-24 rounded-lg overflow-hidden shrink-0 border bg-muted cursor-pointer"
                                      onClick={() => {
                                        const actualIndex = (journey.gallery ?? []).findIndex((img: any) => img.url === photo.url);
                                        setLightboxIndex(actualIndex >= 0 ? actualIndex : 0);
                                        setLightboxDayFilter(day.day_number);
                                        setLightboxOpen(true);
                                      }}
                                    >
                                      <img src={photo.url} alt={photo.caption || ""} className="h-full w-full object-cover hover:scale-105 transition-transform duration-300" />
                                    </div>
                                  ))}
                                  {dayVideos.map((video: any, vIdx: number) => (
                                    <a 
                                      key={vIdx} 
                                      href={video.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="h-16 w-24 rounded-lg overflow-hidden shrink-0 border bg-black flex items-center justify-center relative cursor-pointer group"
                                    >
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors z-10">
                                        <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center">
                                          <Video className="h-3 w-3 text-[#E53E3E] fill-[#E53E3E]" />
                                        </div>
                                      </div>
                                      <span className="absolute bottom-1 left-1 right-1 text-[8px] text-white truncate z-10 text-center font-poppins">{video.title || "Video"}</span>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                          <div className="flex flex-wrap gap-4 pt-1.5 text-xs text-muted-foreground">
                            {day.stay && <span>🏨 {day.stay}</span>}
                            {day.transport && <span>🚌 {day.transport}</span>}
                            <span className="flex gap-1.5 font-semibold">
                              {day.meals?.breakfast && '☕ B'}
                              {day.meals?.lunch && '🍱 L'}
                              {day.meals?.dinner && '🌙 D'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ==================== 🚍 TRANSPORT SECTION ==================== */}
                  {transport && transport.vehicle_name && (
                    <div className="mt-8 bg-white border border-[#E4E2DA] rounded-3xl p-6 shadow-soft space-y-6 font-poppins text-left">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#E4E2DA]">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#C8A96A] bg-[#C8A96A]/10 px-2.5 py-1 rounded-full">
                            🚍 Comfort Transport
                          </span>
                          <h3 className="font-display text-xl font-bold text-primary mt-1">{transport.vehicle_name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{transport.vehicle_type || 'Standard AC Coach'}</p>
                        </div>
                        <div className="text-left sm:text-right shrink-0">
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Batch Capacity</span>
                          <span className="text-sm font-bold text-primary">{transport.available_seats || 5} Spots Left / {transport.seat_capacity || 17} Total</span>
                        </div>
                      </div>

                      {/* Cover Banner */}
                      {transport.cover_image && (
                        <div className="relative h-60 rounded-2xl overflow-hidden border shadow-inner">
                          <img src={transport.cover_image} alt="" className="h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                          <div className="absolute bottom-4 left-4 flex flex-wrap gap-1.5 z-10">
                            {transport.ac && <span className="text-[9px] uppercase tracking-wider font-bold bg-emerald-500 text-white px-2 py-0.5 rounded">AC</span>}
                            {transport.music && <span className="text-[9px] uppercase tracking-wider font-bold bg-indigo-500 text-white px-2 py-0.5 rounded">Music System</span>}
                            {transport.charging_ports && <span className="text-[9px] uppercase tracking-wider font-bold bg-amber-500 text-white px-2 py-0.5 rounded">USB Ports</span>}
                            {transport.trip_captain && <span className="text-[9px] uppercase tracking-wider font-bold bg-primary text-white px-2 py-0.5 rounded">Captain Included</span>}
                          </div>
                        </div>
                      )}

                      {/* Pickup & Drop times */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F8F7F3] p-4 rounded-2xl border">
                        <div className="space-y-1">
                          <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-accent" /> Pickup Points
                          </span>
                          <div className="flex flex-col gap-1 pl-4.5">
                            {(transport.pickup_points || []).map((pt: string, idx: number) => (
                              <span key={idx} className="text-xs font-semibold text-primary">• {pt}</span>
                            ))}
                            {(!transport.pickup_points || transport.pickup_points.length === 0) && (
                              <span className="text-xs text-muted-foreground">Delhi Kashmere Gate / reporting point</span>
                            )}
                          </div>
                          {transport.departure_time && (
                            <span className="text-[10px] text-muted-foreground block pl-4.5">Departure: {transport.departure_time}</span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-slate-500" /> Drop Points
                          </span>
                          <div className="flex flex-col gap-1 pl-4.5">
                            {(transport.drop_points || []).map((pt: string, idx: number) => (
                              <span key={idx} className="text-xs font-semibold text-primary">• {pt}</span>
                            ))}
                            {(!transport.drop_points || transport.drop_points.length === 0) && (
                              <span className="text-xs text-muted-foreground">Delhi Kashmere Gate / drop off point</span>
                            )}
                          </div>
                          {transport.arrival_time && (
                            <span className="text-[10px] text-muted-foreground block pl-4.5">Return: {transport.arrival_time}</span>
                          )}
                        </div>
                      </div>

                      {/* Features */}
                      {transport.features && transport.features.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Features & Amenities</span>
                          <div className="flex flex-wrap gap-1.5">
                            {transport.features.map((feat: string, idx: number) => (
                              <span key={idx} className="text-[11px] font-medium text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full flex items-center gap-1">
                                ✓ {feat}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Transport Gallery */}
                      {transport.gallery && transport.gallery.length > 0 && (
                        <div className="space-y-2.5">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Vehicle Interior & Views</span>
                          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                            {transport.gallery.map((url: string, idx: number) => (
                              <div key={idx} className="h-20 w-32 rounded-xl overflow-hidden border shrink-0 bg-muted">
                                <img src={url} alt="" className="h-full w-full object-cover hover:scale-105 transition-transform duration-300" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ==================== 🏨 ACCOMMODATION SECTION ==================== */}
                  {stay && stay.hotel_name && (
                    <div className="mt-8 bg-white border border-[#E4E2DA] rounded-3xl p-6 shadow-soft space-y-6 font-poppins text-left">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#E4E2DA]">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#C8A96A] bg-[#C8A96A]/10 px-2.5 py-1 rounded-full">
                            🏨 Premium Stay
                          </span>
                          <h3 className="font-display text-xl font-bold text-primary mt-1">{stay.hotel_name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{stay.location || 'Himachal Pradesh'}</span>
                            <span className="text-xs text-amber-500 font-semibold flex items-center gap-0.5">
                              ★ {stay.hotel_category || '3 Star Stay'}
                            </span>
                          </div>
                        </div>
                        {stay.google_maps && (
                          <a
                            href={stay.google_maps}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 flex items-center gap-1.5 text-xs text-accent font-bold bg-accent/10 border border-accent/20 px-4 py-2 rounded-2xl hover:bg-accent/20 transition-colors"
                          >
                            <Map className="h-3.5 w-3.5" /> View on Google Maps
                          </a>
                        )}
                      </div>

                      {/* Cover Banner */}
                      {stay.cover_image && (
                        <div className="relative h-60 rounded-2xl overflow-hidden border shadow-inner">
                          <img src={stay.cover_image} alt="" className="h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                          <div className="absolute bottom-4 left-4 flex flex-wrap gap-1.5 z-10">
                            <span className="text-[9px] uppercase tracking-wider font-bold bg-[#C8A96A] text-white px-2.5 py-0.5 rounded-full">
                              Verified Stay
                            </span>
                            {stay.check_in && <span className="text-[9px] uppercase tracking-wider font-bold bg-slate-900/60 text-white px-2 py-0.5 rounded">In: {stay.check_in}</span>}
                            {stay.check_out && <span className="text-[9px] uppercase tracking-wider font-bold bg-slate-900/60 text-white px-2 py-0.5 rounded">Out: {stay.check_out}</span>}
                          </div>
                        </div>
                      )}

                      {/* Room Occupancies & Sharing options */}
                      {stay.room_types && stay.room_types.length > 0 && (
                        <div className="space-y-2 bg-[#F8F7F3] p-4 rounded-2xl border">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Sharing Configurations</span>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {stay.room_types.map((room: string, idx: number) => (
                              <span key={idx} className="text-xs font-semibold text-primary bg-white border px-3.5 py-1.5 rounded-xl shadow-soft">
                                🛏️ {room}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Amenities */}
                      {stay.amenities && stay.amenities.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Amenities Included</span>
                          <div className="flex flex-wrap gap-1.5">
                            {stay.amenities.map((item: string, idx: number) => (
                              <span key={idx} className="text-[11px] font-medium text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                                ✓ {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Hotel Gallery */}
                      {stay.gallery && stay.gallery.length > 0 && (
                        <div className="space-y-2.5">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Room & Property Gallery</span>
                          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                            {stay.gallery.map((url: string, idx: number) => (
                              <div key={idx} className="h-20 w-32 rounded-xl overflow-hidden border shrink-0 bg-muted">
                                <img src={url} alt="" className="h-full w-full object-cover hover:scale-105 transition-transform duration-300" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Premium Itinerary PDF Card */}
                  {premiumDoc && (
                    <div className="mt-8 p-6 rounded-3xl bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-white border border-[#334155] shadow-elegant relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-[#F59E0B]/5 rounded-full blur-3xl pointer-events-none" />
                      
                      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-3">
                          <span className="text-[10px] uppercase font-poppins font-bold bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 px-3 py-1 rounded-full">
                            📄 Complete Travel Guide Available
                          </span>
                          <h4 className="font-display font-bold text-xl tracking-wide">{premiumDoc.title || 'Premium Document'}</h4>
                          <p className="text-xs text-white/70 max-w-lg leading-relaxed font-poppins">
                            Want to unlock the complete day-by-day roadmap, pickup coordinates, packing guidelines, and vetted hotel stays? Access our official trip guide.
                          </p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 text-[11px] text-white/90">
                            <span className="flex items-center gap-1.5 font-poppins font-semibold">✓ Complete Timeline</span>
                            <span className="flex items-center gap-1.5 font-poppins font-semibold">✓ Exact Pickup Locations</span>
                            <span className="flex items-center gap-1.5 font-poppins font-semibold">✓ Vetted Hotels Details</span>
                            <span className="flex items-center gap-1.5 font-poppins font-semibold">✓ Complete Gear Checklist</span>
                            <span className="flex items-center gap-1.5 font-poppins font-semibold">✓ Custom Navigation Maps</span>
                            <span className="flex items-center gap-1.5 font-poppins font-semibold">✓ Local Recommendations</span>
                          </div>
                        </div>

                        <Button 
                          onClick={handleViewPdf}
                          className="w-full md:w-auto h-12 px-8 bg-accent text-white font-poppins font-bold text-sm tracking-wider rounded-2xl shrink-0 flex items-center justify-center gap-2 hover:bg-[#D97706] shadow-lg shadow-accent/25 hover:shadow-xl transition-all"
                        >
                          View Full Itinerary PDF
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Unlock Modal Dialog */}
                  {journey && (
                    <ItineraryUnlockModal
                      open={unlockModalOpen}
                      onOpenChange={setUnlockModalOpen}
                      packageId={journey.id}
                      packageName={journey.name}
                      onSuccess={() => {
                        const targetUrl = `/account/itinerary/${slug}?type=ITINERARY`;
                        window.open(targetUrl, "_blank");
                      }}
                    />
                  )}
                </div>
              )}

              {activeTab === 'includes' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {inclusions.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-poppins font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                        <Check className="h-4 w-4" /> What's Included
                      </h3>
                      <ul className="space-y-2.5">
                        {inclusions.map((item, idx) => (
                          <li key={idx} className="flex gap-2.5 text-xs text-muted-foreground leading-relaxed font-poppins">
                            <span className="text-emerald-600 shrink-0 font-bold">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {exclusions.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-poppins font-bold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                        <X className="h-4 w-4" /> What's Excluded
                      </h3>
                      <ul className="space-y-2.5">
                        {exclusions.map((item, idx) => (
                          <li key={idx} className="flex gap-2.5 text-xs text-muted-foreground leading-relaxed font-poppins">
                            <span className="text-red-500 shrink-0 font-bold">✗</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'faqs' && (() => {
                const filtered = parsedFaqs.filter((f: any) =>
                  f.question.toLowerCase().includes(faqSearchQuery.toLowerCase()) ||
                  f.answer.toLowerCase().includes(faqSearchQuery.toLowerCase())
                )
                
                const showFeaturedGroup = !faqSearchQuery
                const featured = showFeaturedGroup ? filtered.filter((f: any) => f.featured) : []
                const regular = showFeaturedGroup ? filtered.filter((f: any) => !f.featured) : filtered

                const categoriesMap: Record<string, typeof regular> = {}
                regular.forEach((faq: any) => {
                  const cat = faq.category || 'General'
                  if (!categoriesMap[cat]) {
                    categoriesMap[cat] = []
                  }
                  categoriesMap[cat].push(faq)
                })

                const renderFaqItem = (faq: any, key: string) => {
                  const isOpen = activeFaqKey === key
                  const relatedQuestions = parsedFaqs
                    .filter((r: any) => r.category === faq.category && r.question !== faq.question)
                    .slice(0, 2)

                  return (
                    <div key={key} className="border border-[#E4E2DA] rounded-xl overflow-hidden bg-white shadow-soft transition-all duration-300">
                      <button
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-[#F8F7F3] transition-colors"
                        onClick={() => setActiveFaqKey(isOpen ? null : key)}
                      >
                        <span className="font-semibold text-xs text-primary font-poppins flex items-center gap-1.5">
                          <HelpCircle className="h-3.5 w-3.5 text-accent/80 shrink-0" />
                          {faq.question}
                        </span>
                        {isOpen ? <ChevronUp className="h-4 w-4 text-accent shrink-0" /> : <ChevronDown className="h-4 w-4 text-accent shrink-0" />}
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-[#F8F7F3]/40 border-t border-[#E4E2DA]"
                          >
                            <div className="p-4 space-y-3 font-poppins">
                              <p className="text-xs text-muted-foreground leading-relaxed">{faq.answer}</p>
                              
                              {relatedQuestions.length > 0 && (
                                <div className="pt-2.5 border-t border-[#E4E2DA]/60 mt-2">
                                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-1">Related Questions:</span>
                                  <div className="flex flex-col gap-1.5">
                                    {relatedQuestions.map((rel: any, idx: number) => (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => {
                                          const isRelFeatured = rel.featured && showFeaturedGroup
                                          const groupPrefix = isRelFeatured ? 'featured' : rel.category
                                          const itemsList = isRelFeatured ? featured : categoriesMap[rel.category]
                                          const itemIdx = itemsList?.findIndex((x: any) => x.question === rel.question)
                                          if (itemIdx !== undefined && itemIdx !== -1) {
                                            setActiveFaqKey(`${groupPrefix}-${itemIdx}`)
                                          }
                                        }}
                                        className="text-left text-[11px] text-accent hover:underline flex items-center gap-1"
                                      >
                                        • {rel.question}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                }

                return (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search FAQs (e.g. meals, safety, pickup)..."
                        value={faqSearchQuery}
                        onChange={(e) => setFaqSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-[#E4E2DA] rounded-xl bg-white focus:outline-none focus:border-accent font-poppins text-xs shadow-soft"
                      />
                    </div>

                    {filtered.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic font-poppins text-center py-6">No matching FAQs found.</p>
                    ) : (
                      <div className="space-y-6">
                        {featured.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-xs font-poppins font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                              <Star className="h-3.5 w-3.5 fill-accent/20" /> Frequently Asked
                            </h4>
                            <div className="space-y-2.5">
                              {featured.map((faq: any, i: number) => renderFaqItem(faq, `featured-${i}`))}
                            </div>
                          </div>
                        )}

                        {Object.entries(categoriesMap).map(([category, items]) => (
                          <div key={category} className="space-y-3">
                            <h4 className="text-xs font-poppins font-bold uppercase tracking-wider text-[#16212C] border-b border-[#E4E2DA]/60 pb-1">
                              {category}
                            </h4>
                            <div className="space-y-2.5">
                              {items.map((faq: any, i: number) => renderFaqItem(faq, `${category}-${i}`))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>

        {/* Right Column: Integrated Multi-Step Booking Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="sticky top-24 bg-white rounded-2xl border border-[#E4E2DA] overflow-hidden shadow-soft">
            
            {/* Dark Starting From block */}
            <div className="bg-[#16212C] text-white p-5 space-y-1">
              <span className="text-[10px] text-white/50 uppercase tracking-widest font-poppins font-bold block">
                Starting From
              </span>
              <p className="font-display text-3xl font-bold text-[#C8A96A]">
                ₹{finalPrice.toLocaleString('en-IN')}{' '}
                <span className="text-xs font-poppins text-white/60 font-normal">/person</span>
              </p>
            </div>

            {/* Sidebar Booking Selector body */}
            <div className="p-5 space-y-5">
              
              {/* Stepper Header indicator */}
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-poppins font-bold text-sm text-primary">Book Trip</h3>
                <span className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
                  Step {bookingStep} of 4
                </span>
              </div>

              {/* ================= STEP 1: Date Picker Calendar ================= */}
              {bookingStep === 1 && (
                <div className="space-y-4">
                  {/* Available Departures select dropdown */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-semibold text-gray-500 font-poppins shrink-0">Dates</span>
                      <div className="relative flex-1">
                        <button
                          type="button"
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          className="w-full flex items-center justify-between py-2.5 px-4 border border-[#E4E2DA] rounded-xl bg-white hover:border-accent/50 transition-all text-xs font-poppins text-foreground font-semibold shadow-sm focus:outline-none"
                        >
                          <span className="text-gray-700">
                            {selectedDeparture 
                              ? `${formatDepartureDateRange(selectedDeparture.departure_date, selectedDeparture.return_date)} · ${selectedDeparture.available_seats ?? 20} spots` 
                              : 'Select a Date'}
                          </span>
                          <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {isDropdownOpen && (
                          <div className="absolute z-[120] top-[calc(100%+6px)] left-0 w-full bg-white border border-[#E4E2DA] rounded-xl shadow-elegant overflow-hidden py-1 max-h-56 overflow-y-auto">
                            {departures.length === 0 ? (
                              <p className="text-xs text-muted-foreground italic p-3 text-center font-poppins">
                                No upcoming departures
                              </p>
                            ) : (
                              departures.map((dep) => {
                                const isSelected = selectedDepartureId === dep.id
                                return (
                                  <button
                                    key={dep.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedDepartureId(dep.id)
                                      setIsDropdownOpen(false)
                                      setShowValError(false)
                                    }}
                                    className={`w-full text-left py-3 px-4 text-xs font-poppins transition-colors flex items-center justify-between hover:bg-[#F8F7F3] ${
                                      isSelected ? 'bg-accent/10 text-primary font-bold' : 'text-gray-700 font-medium'
                                    }`}
                                  >
                                    <span>
                                      {formatDepartureDateRange(dep.departure_date, dep.return_date)} · {dep.available_seats ?? 20} spots
                                    </span>
                                    <span className="text-[10px] font-semibold text-accent/80">
                                      ₹{(dep.dynamic_price ?? dep.base_price).toLocaleString('en-IN')}
                                    </span>
                                  </button>
                                )
                              })
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedDeparture && (
                      <div className="pt-3 border-t border-[#E4E2DA] mt-3">
                        <p className="text-[#FF6A00] font-bold text-lg font-poppins animate-pulse">
                          {selectedDeparture.available_seats ?? 20} Spots Remain
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Calendar selector */}
                  <div className="space-y-1.5 pt-3 border-t border-[#E4E2DA]">
                    <label className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground block">
                      Or Select via Calendar
                    </label>
                    <div className="border border-[#E4E2DA] rounded-xl overflow-hidden p-2 flex justify-center bg-white">
                      <Calendar
                        mode="single"
                        selected={selectedDeparture ? new Date(selectedDeparture.departure_date) : undefined}
                        onSelect={handleCalendarSelect}
                        modifiers={{
                          hasDeparture: departureDates,
                        }}
                        modifiersClassNames={{
                          hasDeparture: 'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-[#E53E3E] after:rounded-full font-bold text-primary',
                        }}
                        className="p-1"
                      />
                    </div>
                  </div>

                  {/* Validation Error warning if no date is chosen */}
                  {showValError && !selectedDeparture && (
                    <div className="bg-[#E53E3E] text-white p-3 rounded-lg text-xs font-poppins font-medium flex items-center gap-2">
                      <X className="h-4 w-4 shrink-0" />
                      <span>Please select a departure date from the list or calendar.</span>
                    </div>
                  )}

                  <Button
                    onClick={handleStep1Continue}
                    disabled={departures.length === 0}
                    className="w-full h-11 text-xs font-poppins font-bold tracking-wider uppercase text-white bg-[#E53E3E] hover:bg-[#E53E3E]/90"
                  >
                    CONTINUE
                  </Button>
                </div>
              )}

              {/* ================= STEP 2: Traveller Details Form ================= */}
              {bookingStep === 2 && (
                <div className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-poppins font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter full name"
                      className={`w-full h-10 border rounded-lg px-3 text-xs font-poppins ${step2Errors.fullName ? 'border-[#E53E3E]' : 'border-[#E4E2DA]'}`}
                    />
                    {step2Errors.fullName && <p className="text-[10px] text-[#E53E3E] font-poppins">{step2Errors.fullName}</p>}
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-poppins font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email address"
                      className={`w-full h-10 border rounded-lg px-3 text-xs font-poppins ${step2Errors.email ? 'border-[#E53E3E]' : 'border-[#E4E2DA]'}`}
                    />
                    {step2Errors.email && <p className="text-[10px] text-[#E53E3E] font-poppins">{step2Errors.email}</p>}
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-poppins font-bold uppercase tracking-wider text-muted-foreground">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter contact number"
                      className={`w-full h-10 border rounded-lg px-3 text-xs font-poppins ${step2Errors.phone ? 'border-[#E53E3E]' : 'border-[#E4E2DA]'}`}
                    />
                    {step2Errors.phone && <p className="text-[10px] text-[#E53E3E] font-poppins">{step2Errors.phone}</p>}
                    <label className="flex items-center gap-2 pt-1 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isWhatsapp}
                        onChange={(e) => setIsWhatsapp(e.target.checked)}
                        className="rounded border-[#E4E2DA] text-[#E53E3E] focus:ring-[#E53E3E]"
                      />
                      <span className="text-[10px] font-poppins text-muted-foreground">Is this number on WhatsApp?</span>
                    </label>
                  </div>

                  {/* Address */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-poppins font-bold uppercase tracking-wider text-muted-foreground">Address</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter address"
                      className={`w-full h-10 border rounded-lg px-3 text-xs font-poppins ${step2Errors.address ? 'border-[#E53E3E]' : 'border-[#E4E2DA]'}`}
                    />
                    {step2Errors.address && <p className="text-[10px] text-[#E53E3E] font-poppins">{step2Errors.address}</p>}
                  </div>

                  {/* Age & Gender Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-poppins font-bold uppercase tracking-wider text-muted-foreground">Age</label>
                      <input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="Age"
                        className={`w-full h-10 border rounded-lg px-3 text-xs font-poppins ${step2Errors.age ? 'border-[#E53E3E]' : 'border-[#E4E2DA]'}`}
                      />
                      {step2Errors.age && <p className="text-[10px] text-[#E53E3E] font-poppins">{step2Errors.age}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-poppins font-bold uppercase tracking-wider text-muted-foreground">Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full h-10 border border-[#E4E2DA] rounded-lg px-3 text-xs font-poppins bg-white"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      {step2Errors.gender && <p className="text-[10px] text-[#E53E3E] font-poppins">{step2Errors.gender}</p>}
                    </div>
                  </div>

                  {/* Guardian's Number */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-poppins font-bold uppercase tracking-wider text-muted-foreground">Guardian's Number</label>
                    <input
                      type="text"
                      value={guardianNumber}
                      onChange={(e) => setGuardianNumber(e.target.value)}
                      placeholder="Emergency contact"
                      className="w-full h-10 border border-[#E4E2DA] rounded-lg px-3 text-xs font-poppins"
                    />
                  </div>

                  {/* File Pickers */}
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[9px] font-poppins font-bold uppercase tracking-wider text-muted-foreground block">
                        Aadhar Card Photo *
                      </label>
                      <div className={`flex items-center gap-2 border rounded-lg p-2 bg-[#F8F7F3]/30 ${step2Errors.aadhar ? 'border-[#E53E3E]' : 'border-[#E4E2DA]'}`}>
                        <label className="bg-white border border-[#E4E2DA] rounded px-3 py-1.5 text-[10px] font-semibold font-poppins cursor-pointer shrink-0 hover:bg-[#F8F7F3]">
                          Choose File
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                setAadharFile(file)
                                setAadharFileName(file.name)
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                        <span className="text-[10px] text-muted-foreground truncate">
                          {aadharFileName || 'No file chosen'}
                        </span>
                      </div>
                      {step2Errors.aadhar && <p className="text-[10px] text-[#E53E3E] font-poppins">{step2Errors.aadhar}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-poppins font-bold uppercase tracking-wider text-muted-foreground block">
                        Profile Photo *
                      </label>
                      <div className={`flex items-center gap-2 border rounded-lg p-2 bg-[#F8F7F3]/30 ${step2Errors.profile ? 'border-[#E53E3E]' : 'border-[#E4E2DA]'}`}>
                        <label className="bg-white border border-[#E4E2DA] rounded px-3 py-1.5 text-[10px] font-semibold font-poppins cursor-pointer shrink-0 hover:bg-[#F8F7F3]">
                          Choose File
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                setProfileFile(file)
                                setProfileFileName(file.name)
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                        <span className="text-[10px] text-muted-foreground truncate">
                          {profileFileName || 'No file chosen'}
                        </span>
                      </div>
                      {step2Errors.profile && <p className="text-[10px] text-[#E53E3E] font-poppins">{step2Errors.profile}</p>}
                      <p className="text-[8px] text-muted-foreground font-poppins leading-tight">A clear photo of the traveller (Max 2MB)</p>
                    </div>
                  </div>

                  {/* Booking Referred By */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-poppins font-bold uppercase tracking-wider text-muted-foreground block">
                      Booking Referred By (Team Member)
                    </label>
                    <select
                      value={referredBy}
                      onChange={(e) => setReferredBy(e.target.value)}
                      className="w-full h-10 border border-[#E4E2DA] rounded-lg px-3 text-xs font-poppins bg-white"
                    >
                      <option value="">Choose team member...</option>
                      <option value="Sales Team A">Sales Team A</option>
                      <option value="Sales Team B">Sales Team B</option>
                      <option value="Direct Online">Direct Online</option>
                    </select>
                    <span className="text-[8px] text-muted-foreground font-poppins leading-tight">Select the team member who assisted you (if any)</span>
                  </div>

                  {/* How Did You Hear About Us */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-poppins font-bold uppercase tracking-wider text-muted-foreground block">
                      How Did You Hear About Us?
                    </label>
                    <select
                      value={howHeard}
                      onChange={(e) => setHowHeard(e.target.value)}
                      className="w-full h-10 border border-[#E4E2DA] rounded-lg px-3 text-xs font-poppins bg-white"
                    >
                      <option value="">Select marketing channel</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Facebook">Facebook</option>
                      <option value="Google Ads">Google Ads</option>
                      <option value="Friends/Family">Friends / Recommendation</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Back & Continue Buttons */}
                  <div className="flex gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setBookingStep(1)}
                      className="flex-1 h-11 border border-[#E4E2DA] text-xs font-bold font-poppins uppercase tracking-wider rounded-lg text-primary hover:bg-[#F8F7F3]"
                    >
                      BACK
                    </button>
                    <Button
                      onClick={handleStep2Continue}
                      className="flex-1 h-11 text-xs font-poppins font-bold tracking-wider uppercase text-white bg-[#E53E3E] hover:bg-[#E53E3E]/90"
                    >
                      CONTINUE
                    </Button>
                  </div>
                </div>
              )}

              {/* ================= STEP 3: Transport & Seats Selection ================= */}
              {bookingStep === 3 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground block">
                      Choose Transport Class
                    </label>

                    {/* Standard AC Traveller */}
                    <label className={`block border p-4 rounded-xl cursor-pointer select-none transition-all ${
                      transportType === 'standard' ? 'border-[#C8A96A] bg-[#C8A96A]/5 shadow-sm' : 'border-[#E4E2DA] hover:border-[#C8A96A]/40'
                    }`}>
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="transport"
                          checked={transportType === 'standard'}
                          onChange={() => setTransportType('standard')}
                          className="mt-1 text-[#E53E3E] focus:ring-[#E53E3E]"
                        />
                        <div className="space-y-1">
                          <span className="block text-xs font-bold text-primary font-poppins">AC Tempo Traveller</span>
                          <span className="block text-[10px] text-muted-foreground font-poppins leading-tight">
                            Standard comfortable pushback seats. Good legroom, shared operations.
                          </span>
                          <span className="block text-[10px] text-emerald-600 font-bold font-poppins">Included in Base Price</span>
                        </div>
                      </div>
                    </label>

                    {/* Premium Sleeper Volvo Bus */}
                    <label className={`block border p-4 rounded-xl cursor-pointer select-none transition-all ${
                      transportType === 'sleeper' ? 'border-[#C8A96A] bg-[#C8A96A]/5 shadow-sm' : 'border-[#E4E2DA] hover:border-[#C8A96A]/40'
                    }`}>
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="transport"
                          checked={transportType === 'sleeper'}
                          onChange={() => setTransportType('sleeper')}
                          className="mt-1 text-[#E53E3E] focus:ring-[#E53E3E]"
                        />
                        <div className="space-y-1">
                          <span className="block text-xs font-bold text-primary font-poppins">Luxury Volvo Sleeper</span>
                          <span className="block text-[10px] text-muted-foreground font-poppins leading-tight">
                            Premium overnight sleeper berths. Perfect for full rest before the trek.
                          </span>
                          <span className="block text-[10px] text-[#C8A96A] font-bold font-poppins">+₹1,000 /person</span>
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Seat preference buttons */}
                  <div className="space-y-2 pt-2 border-t">
                    <label className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground block">
                      Seat Preference
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['window', 'aisle', 'none'] as const).map((pref) => {
                        const isSelected = seatPreference === pref
                        return (
                          <button
                            key={pref}
                            type="button"
                            onClick={() => setSeatPreference(pref)}
                            className={`py-2 text-[10px] font-poppins font-bold uppercase tracking-wider rounded-lg border transition-all ${
                              isSelected
                                ? 'border-[#E53E3E] bg-[#E53E3E]/5 text-[#E53E3E]'
                                : 'border-[#E4E2DA] bg-white hover:bg-[#F8F7F3] text-muted-foreground'
                            }`}
                          >
                            {pref === 'none' ? 'No Preference' : pref}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Back & Continue Buttons */}
                  <div className="flex gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setBookingStep(2)}
                      className="flex-1 h-11 border border-[#E4E2DA] text-xs font-bold font-poppins uppercase tracking-wider rounded-lg text-primary hover:bg-[#F8F7F3]"
                    >
                      BACK
                    </button>
                    <Button
                      onClick={() => setBookingStep(4)}
                      className="flex-1 h-11 text-xs font-poppins font-bold tracking-wider uppercase text-white bg-[#E53E3E] hover:bg-[#E53E3E]/90"
                    >
                      CONTINUE
                    </Button>
                  </div>
                </div>
              )}

              {/* ================= STEP 4: Package, Sharing, Coupons & Billing (Matches design screenshot) ================= */}
              {bookingStep === 4 && (
                <div className="space-y-5">
                  
                  {/* SELECT FINAL PACKAGE */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-poppins font-bold uppercase tracking-wider text-muted-foreground block">
                      Select Final Package
                    </label>
                    <div className="border border-[#E53E3E] rounded-xl p-4 bg-white flex items-center justify-between shadow-sm relative">
                      <div className="space-y-1">
                        <span className="block text-xs font-bold text-primary font-poppins">Standard Package</span>
                        <span className="block text-[10px] text-muted-foreground font-poppins">{journey.duration || '5 Days / 4 Nights'}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-base font-bold text-primary font-poppins">
                          ₹{sharingPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="block text-[8px] font-bold text-[#E53E3E] uppercase font-poppins">SELECTED</span>
                      </div>
                    </div>
                  </div>

                  {/* ROOM SHARING TYPE */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-poppins font-bold uppercase tracking-wider text-muted-foreground block">
                      Room Sharing Type
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { type: 'double', label: 'DOUBLE', price: basePrice + 800 },
                        { type: 'triple', label: 'TRIPLE', price: basePrice + 500 },
                        { type: 'quad', label: 'QUAD', price: basePrice },
                      ].map((item) => {
                        const isSelected = sharingType === item.type
                        return (
                          <button
                            key={item.type}
                            type="button"
                            onClick={() => setSharingType(item.type as any)}
                            className={`p-2 rounded-lg text-center font-poppins transition-all border ${
                              isSelected
                                ? 'bg-[#E53E3E] border-[#E53E3E] text-white font-bold'
                                : 'bg-white border-[#E4E2DA] text-slate-700 hover:border-[#E53E3E]/50'
                            }`}
                          >
                            <span className="block text-[10px] font-bold">{item.label}</span>
                            <span className={`block text-[9px] font-semibold ${isSelected ? 'text-white/90' : 'text-[#E53E3E]'}`}>
                              ₹{item.price.toLocaleString('en-IN')}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* DISCOUNT COUPON */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-poppins font-bold uppercase tracking-wider text-muted-foreground block">
                      Discount Coupon
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="ENTER CODE"
                        disabled={couponApplied}
                        className="flex-1 h-9 border border-[#E4E2DA] rounded-lg px-3 text-xs font-poppins placeholder-muted-foreground bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponApplied || !couponCode.trim()}
                        className="h-9 px-4 bg-black text-white text-[10px] font-poppins font-bold uppercase tracking-wider rounded-lg disabled:opacity-50"
                      >
                        APPLY
                      </button>
                    </div>
                    {couponApplied && <p className="text-[9px] text-emerald-600 font-bold font-poppins">NOMAD20 coupon active: -₹500 discount.</p>}
                    {couponError && <p className="text-[9px] text-[#E53E3E] font-poppins font-medium">{couponError}</p>}
                  </div>

                  {/* BILLING DISPLAY BOX */}
                  <div className="border border-[#E4E2DA] rounded-xl p-4 space-y-3 bg-white">
                    <div className="flex justify-between items-center text-xs font-poppins text-muted-foreground">
                      <span>Base Package ({sharingType.toUpperCase()} Sharing)</span>
                      <span className="font-medium text-slate-700">₹{sharingPrice.toLocaleString('en-IN')}</span>
                    </div>
                    {transportType === 'sleeper' && (
                      <div className="flex justify-between items-center text-xs font-poppins text-muted-foreground">
                        <span>Luxury Volvo Sleeper Add-on</span>
                        <span className="font-medium text-slate-700">+₹1,000</span>
                      </div>
                    )}
                    {couponApplied && (
                      <div className="flex justify-between items-center text-xs font-poppins text-emerald-600 font-medium">
                        <span>Coupon Discount</span>
                        <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="border-t border-[#E4E2DA] pt-2.5 flex justify-between items-center">
                      <span className="text-xs font-bold text-primary font-poppins">Total Payable</span>
                      <span className="text-lg font-bold text-[#E53E3E] font-poppins">
                        ₹{finalPrice.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* PAYMENT SCHEDULE */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-poppins font-bold uppercase tracking-wider text-muted-foreground block">
                      Payment Schedule
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: 'full', title: 'Full Payment', sub: `Pay ₹${finalPrice.toLocaleString('en-IN')} now` },
                        { key: 'slot', title: 'Book Slot', sub: 'Pay ₹2,000 now' },
                      ].map((sched) => {
                        const isSelected = paymentSchedule === sched.key
                        return (
                          <button
                            key={sched.key}
                            type="button"
                            onClick={() => setPaymentSchedule(sched.key as any)}
                            className={`p-3 rounded-lg text-left font-poppins border transition-all ${
                              isSelected
                                ? 'border-[#E53E3E] bg-[#E53E3E]/5 text-primary'
                                : 'border-[#E4E2DA] bg-white text-muted-foreground hover:bg-[#F8F7F3]'
                            }`}
                          >
                            <span className="block text-[10px] font-bold">{sched.title}</span>
                            <span className="block text-[8px] text-muted-foreground mt-0.5">{sched.sub}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* SPECIAL REQUESTS */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-poppins font-bold uppercase tracking-wider text-muted-foreground block">
                      Special Requests
                    </label>
                    <textarea
                      rows={2}
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="Any special requirements?"
                      className="w-full border border-[#E4E2DA] rounded-lg p-2.5 text-xs font-poppins placeholder-muted-foreground bg-white"
                    />
                  </div>

                  {/* Terms & Conditions Checkbox */}
                  <div className={`border rounded-lg p-3 ${termsError ? 'border-[#E53E3E] bg-[#E53E3E]/5' : 'border-[#E4E2DA]'}`}>
                    <label className="flex items-start gap-2.5 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => {
                          setAgreeTerms(e.target.checked)
                          if (e.target.checked) setTermsError(false)
                        }}
                        className="mt-0.5 rounded border-[#E4E2DA] text-[#E53E3E] focus:ring-[#E53E3E]"
                      />
                      <span className="text-[9px] font-poppins text-muted-foreground leading-tight">
                        I confirm that the details provided are correct, and I agree to the{' '}
                        <a href="/terms" target="_blank" className="underline text-[#E53E3E] font-semibold">Terms & Conditions</a> and the{' '}
                        <a href="/policies" target="_blank" className="underline text-[#E53E3E] font-semibold">Cancellation & Refund Policy</a>.
                      </span>
                    </label>
                  </div>

                  {/* Back & Complete Booking Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setBookingStep(3)}
                      className="flex-1 h-11 border border-[#E4E2DA] text-xs font-bold font-poppins uppercase tracking-wider rounded-lg text-slate-700 hover:bg-[#F8F7F3]"
                    >
                      BACK
                    </button>
                    <Button
                      onClick={handleFinalSubmit}
                      disabled={isSubmitting}
                      className="flex-1 h-11 text-xs font-poppins font-bold tracking-wider uppercase text-white bg-[#333333] hover:bg-[#222222]"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <Loader2 className="h-4 w-4 animate-spin text-white" />
                          <span>PROCESSING...</span>
                        </div>
                      ) : (
                        <span>COMPLETE BOOKING</span>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* ================= STEP 5: Success Confirmation ================= */}
              {bookingStep === 5 && bookingSuccess && (
                <div className="space-y-4 text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
                    <Check className="h-6 w-6 font-bold" />
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="font-display text-lg font-bold text-primary">Booking Successful!</h3>
                    <p className="text-xs text-muted-foreground font-poppins">
                      Your booking reference is <span className="font-bold text-primary">{successBookingId}</span>
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed font-poppins">
                    A confirmation email has been sent to <span className="font-semibold text-primary">{email}</span>. Our trip captain will coordinate with you via WhatsApp soon.
                  </p>

                  <div className="pt-2 border-t">
                    <Button
                      onClick={() => {
                        setBookingStep(1)
                        setFullName('')
                        setEmail('')
                        setPhone('')
                        setAadharFileName('')
                        setProfileFileName('')
                        setAgreeTerms(false)
                      }}
                      className="w-full h-10 text-xs font-poppins font-bold tracking-wider uppercase text-white bg-primary hover:bg-primary/95"
                    >
                      Book Another Seat
                    </Button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>

      {/* 📸 Trip Gallery (Real Photos) */}
      {(() => {
        const galleryList = (journey.gallery ?? []).map((item: any) => typeof item === 'string' ? { url: item, caption: '', day: null } : item);
        if (galleryList.length === 0) return null;
        
        const displayItems = galleryList.slice(0, 5);
        return (
          <section className="max-w-7xl mx-auto px-5 py-16 border-t border-[#E4E2DA]">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="text-xs font-poppins font-bold uppercase tracking-[0.2em] text-accent">Vibe Check</span>
                <h2 className="text-3xl font-display font-bold text-primary mt-1">📸 Real Traveler Gallery</h2>
              </div>
              <Button 
                variant="outline"
                onClick={() => {
                  setLightboxIndex(0);
                  setLightboxDayFilter(null);
                  setLightboxOpen(true);
                }}
                className="font-poppins font-semibold text-xs border-[#E4E2DA]"
              >
                View All {galleryList.length} Photos
              </Button>
            </div>

            {/* Airbnb-style Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 h-[450px] overflow-hidden rounded-2xl border border-[#E4E2DA] shadow-soft">
              {displayItems[0] && (
                <div 
                  className="md:col-span-2 relative h-full group overflow-hidden cursor-pointer bg-muted"
                  onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}
                >
                  <img src={displayItems[0].url} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-all" />
                  {displayItems[0].caption && (
                    <span className="absolute bottom-4 left-4 bg-black/60 text-white text-[10px] px-3 py-1 rounded-full backdrop-blur-sm font-poppins">
                      {displayItems[0].caption}
                    </span>
                  )}
                </div>
              )}

              <div className="md:col-span-2 grid grid-cols-2 gap-3 h-full">
                {displayItems.slice(1, 5).map((img: any, idx: number) => (
                  <div 
                    key={idx} 
                    className="relative h-full group overflow-hidden cursor-pointer bg-muted"
                    onClick={() => { setLightboxIndex(idx + 1); setLightboxOpen(true); }}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-all" />
                    {img.caption && (
                      <span className="absolute bottom-3 left-3 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded-full backdrop-blur-sm font-poppins truncate max-w-[85%]">
                        {img.caption}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && (() => {
          const galleryList = (journey.gallery ?? []).map((item: any) => typeof item === 'string' ? { url: item, caption: '', day: null } : item);
          const filteredList = lightboxDayFilter === null 
            ? galleryList 
            : galleryList.filter((item: any) => item.day === lightboxDayFilter);

          const currentItem = filteredList[lightboxIndex] || filteredList[0] || null;

          return (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] bg-black/95 flex flex-col justify-between p-4"
            >
              <div className="flex items-center justify-between text-white border-b border-white/10 pb-3">
                <div>
                  <h3 className="font-poppins font-bold text-sm tracking-wide">Community Hub Explorer</h3>
                  <p className="text-[10px] text-white/60 font-poppins">
                    {currentItem ? (currentItem.day ? `Day ${currentItem.day} Experience` : "General Memories") : ""}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <select 
                    value={lightboxDayFilter === null ? '' : String(lightboxDayFilter)}
                    onChange={(e) => {
                      const val = e.target.value === '' ? null : Number(e.target.value);
                      setLightboxDayFilter(val);
                      setLightboxIndex(0);
                    }}
                    className="bg-white/10 text-white border border-white/20 rounded-lg px-2.5 py-1 text-xs font-poppins focus:outline-none"
                  >
                    <option value="" className="text-slate-900">Show All Days</option>
                    {itineraryDays.map((d) => (
                      <option key={d.day_number} value={String(d.day_number)} className="text-slate-900">
                        Day {d.day_number}: {d.title}
                      </option>
                    ))}
                  </select>
                  <Button variant="ghost" size="icon" className="text-white/80 hover:text-white" onClick={() => setLightboxOpen(false)}>
                    <X className="h-6 w-6" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center relative my-4">
                {filteredList.length > 1 && (
                  <button 
                    onClick={() => setLightboxIndex(prev => prev === 0 ? filteredList.length - 1 : prev - 1)}
                    className="absolute left-4 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full z-10 transition-colors backdrop-blur-sm"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                )}

                {currentItem ? (
                  <div className="max-w-4xl max-h-[70vh] flex flex-col items-center">
                    <img src={currentItem.url} alt="" className="max-w-full max-h-[65vh] object-contain rounded-lg border border-white/10" />
                    {currentItem.caption && (
                      <p className="text-white/90 text-xs sm:text-sm text-center mt-4 bg-black/40 px-4 py-2 rounded-xl border border-white/10 font-poppins leading-relaxed max-w-lg">
                        {currentItem.caption}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-white/50 text-sm font-poppins">No memories found for this filter.</p>
                )}

                {filteredList.length > 1 && (
                  <button 
                    onClick={() => setLightboxIndex(prev => prev === filteredList.length - 1 ? 0 : prev + 1)}
                    className="absolute right-4 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full z-10 transition-colors backdrop-blur-sm"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                )}
              </div>

              <div className="border-t border-white/10 pt-3 flex items-center justify-between text-white/80 text-[10px] font-poppins">
                <span>
                  Photo {filteredList.length > 0 ? lightboxIndex + 1 : 0} of {filteredList.length}
                </span>
                <div className="flex gap-1.5 overflow-x-auto max-w-xl pb-1">
                  {filteredList.map((img: any, i: number) => (
                    <button 
                      key={i}
                      onClick={() => setLightboxIndex(i)}
                      className={`h-9 w-12 rounded overflow-hidden border-2 shrink-0 transition-all ${
                        lightboxIndex === i ? 'border-[#C8A96A] scale-95' : 'border-transparent opacity-50 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <span>
                  {lightboxDayFilter ? `Filtered: Day ${lightboxDayFilter}` : 'All Memories'}
                </span>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* 🎥 Trip Videos & Reels */}
      {(() => {
        const videosList = (journey.videos ?? []).map((item: any) => typeof item === 'string' ? { url: item, title: '', day: null, type: 'youtube' } : item);
        const reelsList = videosList.filter((v: any) => v.type === 'instagram');
        const regularVideos = videosList.filter((v: any) => v.type === 'youtube' || v.type === 'raw');
        
        if (videosList.length === 0) return null;
        
        return (
          <section className="max-w-7xl mx-auto px-5 py-16 border-t border-[#E4E2DA] space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-poppins font-bold uppercase tracking-[0.2em] text-accent">On The Road</span>
                <h2 className="text-3xl font-display font-bold text-primary mt-1">🎥 Videos & Trip Reels</h2>
              </div>
              <p className="text-sm text-muted-foreground font-poppins max-w-md">Watch real traveler captures, drone sweeps, and night stories shared directly by our convoy captains and explorers.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {regularVideos.length > 0 && (
                <div className="lg:col-span-8 space-y-6">
                  <h3 className="text-sm font-poppins font-bold uppercase tracking-wider text-primary border-l-4 border-accent pl-3">Trip Highlights & Stories</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {regularVideos.slice(0, 4).map((video: any, idx: number) => {
                      let embedUrl = video.url;
                      const ytMatch = video.url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i);
                      if (ytMatch && ytMatch[1]) {
                        embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
                      }
                      
                      return (
                        <div key={idx} className="border border-[#E4E2DA] bg-white rounded-2xl overflow-hidden shadow-soft flex flex-col h-full hover:shadow-elegant transition-shadow">
                          <div className="aspect-video bg-black relative">
                            {ytMatch && ytMatch[1] ? (
                              <iframe 
                                src={embedUrl}
                                title={video.title || "Trip Video"}
                                className="w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            ) : (
                              <video src={video.url} controls className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <h4 className="font-poppins font-bold text-sm text-primary line-clamp-1">{video.title || "Road Journey Highlight"}</h4>
                            {video.day && (
                              <span className="text-[9px] font-bold text-accent uppercase tracking-wider mt-1.5 block">
                                Linked to Day {video.day}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className={`${regularVideos.length > 0 ? 'lg:col-span-4' : 'lg:col-span-12'} space-y-6`}>
                <h3 className="text-sm font-poppins font-bold uppercase tracking-wider text-primary border-l-4 border-[#E53E3E] pl-3">Short Reels</h3>
                {reelsList.length === 0 ? (
                  <div className="h-[300px] border border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center text-muted-foreground bg-white">
                    <Video className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-xs font-poppins">Reels highlights coming soon</p>
                  </div>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin snap-x">
                    {reelsList.map((reel: any, idx: number) => (
                      <a 
                        key={idx}
                        href={reel.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-[180px] h-[340px] shrink-0 border border-[#E4E2DA] rounded-2xl bg-slate-900 relative overflow-hidden flex flex-col justify-end p-4 snap-start group shadow-soft hover:shadow-elegant transition-shadow"
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/45 transition-colors z-0">
                          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Video className="h-4 w-4 text-white fill-white" />
                          </div>
                        </div>
                        <div className="relative z-20 space-y-2 text-white text-left">
                          <span className="inline-block bg-[#E53E3E] text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Reel {idx + 1}
                          </span>
                          <p className="text-xs font-semibold font-poppins line-clamp-2 leading-snug">{reel.title || "Convoy diaries ⚡"}</p>
                          {reel.day && <p className="text-[8px] text-white/70 font-semibold font-poppins flex items-center gap-1">📍 Day {reel.day} highlights</p>}
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })()}

      {/* Traveler Moments Cards */}
      {(() => {
        const moments = (journey as any).trip_moments ?? [];
        if (moments.length === 0) return null;
        return (
          <section className="max-w-7xl mx-auto px-5 py-10 border-t border-[#E4E2DA]">
            <span className="block text-center text-xs font-poppins font-bold uppercase tracking-[0.2em] text-accent">Vibe Pills</span>
            <h3 className="text-center font-display text-2xl font-bold text-primary mt-1 mb-8">What this trip feels like</h3>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {moments.map((mom: any, idx: number) => (
                <div 
                  key={idx} 
                  className="bg-white px-4 py-2.5 rounded-full border border-[#E4E2DA] shadow-sm flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-soft transition-all"
                >
                  <span className="text-base">{mom.emoji || '✨'}</span>
                  <span className="text-xs font-poppins font-bold text-primary tracking-wide uppercase">{mom.title}</span>
                </div>
              ))}
            </div>
          </section>
        );
      })()}

      {/* 💬 Traveler Quick Memories */}
      {(() => {
        const memoriesList = (journey as any).memories ?? [];
        if (memoriesList.length === 0) return null;
        return (
          <section className="bg-primary text-white py-16 relative overflow-hidden">
            <div className="pointer-events-none absolute -left-40 -bottom-40 h-96 w-96 rounded-full bg-gold/5 blur-3xl" />
            <div className="max-w-7xl mx-auto px-5 text-center space-y-8 relative z-10">
              <span className="text-xs font-poppins font-bold uppercase tracking-[0.2em] text-gold">Explorer Vibe Circle</span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white max-w-xl mx-auto leading-tight">💬 Traveler Notes & Memories</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                {memoriesList.map((mem: any, idx: number) => (
                  <div key={idx} className="bg-white/5 border border-white/10 p-6 rounded-2xl text-left space-y-4 backdrop-blur-sm">
                    <div className="flex gap-0.5 text-gold">
                      {Array.from({ length: mem.rating || 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm font-poppins text-white/90 italic leading-relaxed">
                      "{mem.text}"
                    </p>
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-white/60 font-poppins">
                      <span className="font-bold text-white">{mem.author || "Explorer"}</span>
                      <span>Convoy Memory</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* Traveler Stories */}
      {packageStories.length > 0 && (
        <section className="max-w-7xl mx-auto px-5 py-16 border-t border-[#E4E2DA]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-poppins font-bold uppercase tracking-[0.2em] text-accent">Real Experiences</span>
              <h2 className="text-3xl font-display font-bold text-primary mt-1">Traveler Stories</h2>
            </div>
            <a href={`/stories`} className="text-sm font-poppins font-semibold text-accent flex items-center gap-1 hover:gap-2 transition-all">
              View All Stories →
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {packageStories.map((story) => (
              <a key={story.id} href={`/stories/${story.slug}`} className="group block">
                <motion.div
                  whileHover={{ y: -4 }}
                  className="border border-[#E4E2DA] rounded-2xl overflow-hidden bg-white hover:shadow-soft transition-all duration-300 h-full flex flex-col"
                >
                  <div className="h-44 overflow-hidden relative">
                    {story.cover_image ? (
                      <img src={story.cover_image} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary/30">📸</div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="bg-accent text-white text-[9px] font-poppins font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                        {story.category}
                      </span>
                    </div>
                    {story.rating && (
                      <div className="absolute top-3 right-3 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-0.5">
                        ★ {story.rating}
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col text-left">
                    <h3 className="font-display text-base font-bold text-primary group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                      {story.title}
                    </h3>
                    {story.excerpt && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2 font-poppins leading-relaxed">{story.excerpt}</p>
                    )}
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/30">
                      <div className="text-[10px] text-muted-foreground font-poppins">
                        <span className="font-semibold text-foreground">{story.author_name || 'Explorer'}</span>
                        {story.college_name && <span> · {story.college_name}</span>}
                      </div>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        {story.reading_time} min read
                      </span>
                    </div>
                  </div>
                </motion.div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ⭐ Reviews & Ratings */}
      {reviews.length > 0 && (
        <section className="max-w-7xl mx-auto px-5 py-16 border-t border-[#E4E2DA]">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-poppins font-bold uppercase tracking-[0.2em] text-accent">Social Proof</span>
              <h2 className="text-3xl font-display font-bold text-primary mt-1">⭐ Community Reviews</h2>
            </div>
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl">
              <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
              <span className="font-poppins font-bold text-sm text-amber-950">
                {((journey as any).experience_stats?.avg_rating || 4.9)} / 5 Rating ({(journey as any).experience_stats?.travelers || 420} verified reviews)
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((rev) => (
              <div key={rev.id} className="border border-[#E4E2DA] rounded-2xl bg-white p-6 space-y-4 hover:shadow-soft transition-all text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  {rev.is_verified && (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-poppins font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Verified
                    </span>
                  )}
                </div>
                {rev.title && <h4 className="font-poppins font-bold text-sm text-primary leading-snug">{rev.title}</h4>}
                <p className="text-xs text-muted-foreground font-poppins leading-relaxed line-clamp-4">"{rev.content}"</p>
                <div className="pt-3 border-t border-border/30 flex items-center justify-between text-[10px] text-muted-foreground font-poppins">
                  <div>
                    <span className="font-bold text-foreground block">{rev.author_name}</span>
                    {rev.trip_date && <span>Travelled {rev.trip_date}</span>}
                  </div>
                  <span className="bg-secondary/15 text-secondary border border-secondary/25 px-2 py-0.5 rounded uppercase font-bold text-[8px]">
                    {rev.author_email?.includes('dtu') ? 'DTU' : rev.author_email?.includes('nsut') ? 'NSUT' : 'BPIT'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related Packages */}
      {relatedPackages.length > 0 && (
        <section className="max-w-7xl mx-auto px-5 py-16 border-t border-[#E4E2DA]">
          <h2 className="text-3xl font-display font-bold text-primary mb-8 text-left">People Also Viewed</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {relatedPackages.map((pkg) => (
              <Link key={pkg.id} to={`/journeys/${pkg.slug}` as any}>
                <motion.div
                  whileHover={{ y: -6 }}
                  className="border border-[#E4E2DA] rounded-2xl overflow-hidden bg-white hover:shadow-soft transition-all duration-300 flex flex-col h-full"
                >
                  <div className="h-48 relative overflow-hidden bg-muted">
                    {pkg.hero_banner ? (
                      <img src={pkg.hero_banner} alt={pkg.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Mountain className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4 text-left">
                    <div className="space-y-1">
                      <p className="text-[10px] text-[#C8A96A] font-poppins font-bold uppercase tracking-wider">{pkg.duration}</p>
                      <h3 className="font-display text-xl font-bold text-primary">{pkg.name}</h3>
                    </div>
                    {pkg.starting_price && (
                      <div className="pt-3 border-t flex justify-between items-center">
                        <span className="text-[10px] uppercase text-muted-foreground font-poppins">Starting from</span>
                        <span className="text-primary font-bold text-lg">₹{pkg.starting_price.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Bottom CTA Banner */}
      <section className="bg-gradient-to-br from-[#16212C] to-[#0F1720] text-white py-16 text-center space-y-6 relative overflow-hidden border-t border-white/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-2xl mx-auto px-5 relative z-10 space-y-4">
          <h2 className="font-display text-3xl sm:text-4xl font-bold">Loved these Memories?</h2>
          <p className="text-white/70 text-xs sm:text-sm font-poppins leading-relaxed">
            Stop scrolling and start living it. Lock your seat on the next Nomadik convoy to {journey.name} today.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="text-center sm:text-left">
              <span className="text-[10px] text-white/50 uppercase font-poppins block font-bold tracking-wider">convoy starting at</span>
              <span className="text-2xl font-bold text-gold">₹{journey.starting_price?.toLocaleString('en-IN') || '6,499'}</span>
            </div>
            <Button 
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setBookingStep(1);
              }}
              className="w-full sm:w-auto h-12 px-8 bg-accent text-white font-poppins font-bold text-sm tracking-wider rounded-2xl hover:bg-[#D97706] transition-all shadow-lg hover:shadow-xl"
            >
              Book {journey.name.split(" ")[0]} Seat
            </Button>
          </div>
        </div>
      </section>

      {/* Sticky Bottom CTA for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-[#E4E2DA] p-4 z-50 flex items-center justify-between shadow-elegant">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase font-poppins">Starting from</p>
          <p className="text-lg font-bold text-primary font-poppins">₹{finalPrice.toLocaleString('en-IN')}</p>
        </div>
        <Button 
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setBookingStep(1);
          }} 
          disabled={!selectedDeparture} 
          size="sm" 
          className="font-poppins"
        >
          Book Now →
        </Button>
      </div>

    </div>
  )
}
