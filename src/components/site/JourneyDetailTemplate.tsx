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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { getPackageBySlug, getRelatedPackages } from '@/lib/queries/packages'
import { getUpcomingDepartures } from '@/lib/queries/departures'
import { getApprovedReviews } from '@/lib/queries/admin'
import type { Departure, ItineraryDay } from '@/types/supabase'
import { toast } from 'sonner'
import { validateCoupon } from '@/lib/booking-api'
import { createGuestBookingFn } from '@/lib/booking-fns'

interface JourneyDetailTemplateProps {
  slug: string
}

export function JourneyDetailTemplate({ slug }: JourneyDetailTemplateProps) {
  const navigate = useNavigate()
  const [activeDay, setActiveDay] = useState<number | null>(1)
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null)
  const [selectedDepartureId, setSelectedDepartureId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'itinerary' | 'includes' | 'faqs'>('itinerary')
  
  // Hero Gallery Image index
  const [heroImageIndex, setHeroImageIndex] = useState(0)

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
  const faqs = journey.faqs ?? []

  // Collect images for Hero slider
  const galleryImages = journey.gallery && journey.gallery.length > 0
    ? journey.gallery
    : [journey.hero_banner || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b']

  const currentHeroImage = galleryImages[heroImageIndex] || journey.hero_banner

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
                {journey.season || 'April – July'}
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

              {activeTab === 'faqs' && (
                <div className="space-y-4">
                  {faqs.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic font-poppins">No FAQs configured for this trip.</p>
                  ) : (
                    faqs.map((faq, i) => (
                      <div key={i} className="border border-[#E4E2DA] rounded-xl overflow-hidden">
                        <button
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-[#F8F7F3] transition-colors"
                          onClick={() => setActiveFaqIndex(activeFaqIndex === i ? null : i)}
                        >
                          <span className="font-semibold text-sm text-primary font-poppins">{faq.question}</span>
                          {activeFaqIndex === i ? <ChevronUp className="h-4 w-4 text-accent" /> : <ChevronDown className="h-4 w-4 text-accent" />}
                        </button>
                        <AnimatePresence>
                          {activeFaqIndex === i && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden bg-[#F8F7F3]/40 border-t border-[#E4E2DA]"
                            >
                              <p className="p-4 text-xs text-muted-foreground leading-relaxed font-poppins">{faq.answer}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))
                  )}
                </div>
              )}
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
                  <div className="space-y-2">
                    <label className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground">
                      Available Departures
                    </label>
                    {departures.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic p-3 border border-dashed rounded-lg text-center font-poppins bg-muted/20">
                        No upcoming departures
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {departures.map((dep) => {
                          const isSelected = selectedDepartureId === dep.id
                          return (
                            <button
                              key={dep.id}
                              type="button"
                              onClick={() => {
                                setSelectedDepartureId(dep.id)
                                setShowValError(false)
                              }}
                              className={`w-full text-left p-3 rounded-lg border text-xs font-poppins transition-all flex items-center justify-between ${
                                isSelected
                                  ? 'border-[#C8A96A] bg-[#C8A96A]/5 font-bold text-primary shadow-sm'
                                  : 'border-[#E4E2DA] bg-white hover:border-[#C8A96A]/50 text-muted-foreground'
                              }`}
                            >
                              <span>
                                {new Date(dep.departure_date).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </span>
                              <span className="font-semibold text-[10px]">
                                ₹{(dep.dynamic_price ?? dep.base_price).toLocaleString('en-IN')}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Calendar selector */}
                  <div className="space-y-1.5 pt-2 border-t">
                    <label className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground block">
                      Or Select a Custom Date
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

      {/* Related Packages */}
      {relatedPackages.length > 0 && (
        <section className="max-w-7xl mx-auto px-5 py-16 border-t border-[#E4E2DA]">
          <h2 className="text-3xl font-display font-bold text-primary mb-8">Related Packages</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {relatedPackages.map((pkg) => (
              <Link key={pkg.id} to={`/journeys/${pkg.slug}`}>
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
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
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

      {/* Sticky Bottom CTA for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-[#E4E2DA] p-4 z-50 flex items-center justify-between shadow-elegant">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase font-poppins">Starting from</p>
          <p className="text-lg font-bold text-primary font-poppins">₹{finalPrice.toLocaleString('en-IN')}</p>
        </div>
        <Button onClick={() => setBookingStep(bookingStep === 1 ? 2 : bookingStep)} disabled={!selectedDeparture} size="sm" className="font-poppins">
          Book Now →
        </Button>
      </div>

    </div>
  )
}
