import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  Loader2,
  Calendar,
  MapPin,
  User,
  CreditCard,
  ArrowRight,
  Home,
  Phone,
  Mail,
  Clock,
  Download,
} from 'lucide-react'
import type { Booking } from '@/types/supabase'
import { toast } from 'sonner'

export const Route = createFileRoute('/booking/success')({
  validateSearch: (search: Record<string, unknown>) => ({
    booking_id: (search.booking_id as string) ?? '',
  }),
  component: BookingSuccessPage,
})

type FullBookingData = Booking & {
  customers?: {
    name: string
    email: string | null
    phone: string
  }
  departures?: {
    departure_date: string
    return_date?: string
    journeys?: {
      name: string
      destination_id?: string
    }
  }
  booking_travellers?: Array<{
    full_name: string
    phone: string | null
    gender: string | null
    age: number | null
    room_sharing: string | null
  }>
}

function BookingSuccessPage() {
  const { booking_id } = Route.useSearch()
  const navigate = useNavigate()
  const [pollCount, setPollCount] = useState(0)

  // Poll booking status until CONFIRMED (max 30 seconds)
  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking_success', booking_id, pollCount],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          customers (name, email, phone),
          departures (
            departure_date,
            return_date,
            journeys (name)
          ),
          booking_travellers (full_name, phone, gender, age, room_sharing)
        `)
        .eq('id', booking_id)
        .single()

      if (error) throw error
      return data as FullBookingData
    },
    enabled: !!booking_id,
    refetchInterval: (query) => {
      // Stop polling once confirmed or after 10 attempts
      const data = query?.state?.data as FullBookingData | undefined
      if (data?.booking_status === 'CONFIRMED' || pollCount >= 10) return false
      return 3000
    },
  })

  // Auto-increment poll count for refetch
  useEffect(() => {
    if (!booking_id) return
    if (booking?.booking_status === 'CONFIRMED') return
    if (pollCount >= 10) return

    const timer = setTimeout(() => setPollCount((c) => c + 1), 3000)
    return () => clearTimeout(timer)
  }, [booking_id, booking?.booking_status, pollCount])

  // Redirect to home if no booking_id
  useEffect(() => {
    if (!booking_id) navigate({ to: '/' })
  }, [booking_id, navigate])

  const isConfirmed = booking?.booking_status === 'CONFIRMED'
  const isPending = booking?.booking_status === 'PENDING' || !isConfirmed
  const isFailed = booking?.payment_status === 'FAILED'

  const customer = booking?.customers
  const departure = booking?.departures
  const tripName = departure?.journeys?.name ?? 'Your Trip'
  const primaryTraveller = booking?.booking_travellers?.[0]

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'TBD'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-[#F8F7F3] flex flex-col items-center justify-start py-16 px-4">
      <div className="w-full max-w-2xl space-y-6">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/">
            <span className="font-display text-2xl font-black tracking-tight text-primary">NOMADIK</span>
          </Link>
        </div>

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl border border-[#E4E2DA] shadow-soft overflow-hidden"
        >
          {/* Header */}
          <div
            className={`px-8 py-10 text-center ${
              isConfirmed
                ? 'bg-gradient-to-br from-[#163A5F] via-[#1a4a2e] to-[#244B3D]'
                : isFailed
                ? 'bg-gradient-to-br from-red-700 to-red-900'
                : 'bg-gradient-to-br from-[#163A5F] to-[#244B3D]'
            }`}
          >
            {isLoading || (isPending && !isFailed) ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-[#C8A96A]/30 flex items-center justify-center">
                    <Loader2 className="h-10 w-10 text-[#C8A96A] animate-spin" />
                  </div>
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-white">Verifying Payment</h1>
                  <p className="text-white/70 text-sm mt-1 font-poppins">
                    Please don't close this window…
                  </p>
                </div>
              </div>
            ) : isConfirmed ? (
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-20 h-20 rounded-full bg-emerald-400/20 border-4 border-emerald-400 flex items-center justify-center"
                >
                  <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                </motion.div>
                <div>
                  <h1 className="font-display text-3xl font-bold text-white">Booking Confirmed!</h1>
                  <p className="text-white/70 text-sm mt-1 font-poppins">
                    You're going on an adventure 🎉
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-red-400/20 border-4 border-red-400 flex items-center justify-center">
                  <span className="text-4xl">✗</span>
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-white">Payment Failed</h1>
                  <p className="text-white/70 text-sm mt-1 font-poppins">
                    Please try booking again
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Booking ID Badge */}
          {booking?.booking_id && (
            <div className="px-8 py-4 border-b border-[#E4E2DA] flex items-center justify-between bg-[#FAFAF8]">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-poppins font-bold">
                  Booking Reference
                </p>
                <p className="font-mono text-xl font-black text-primary tracking-wider">
                  {booking.booking_id}
                </p>
              </div>
              <Badge
                className={`font-poppins font-bold text-[11px] px-3 py-1 ${
                  isConfirmed
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    : isFailed
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {isConfirmed ? 'CONFIRMED' : isFailed ? 'FAILED' : 'PENDING'}
              </Badge>
            </div>
          )}

          {/* Trip Details */}
          {booking && (
            <div className="px-8 py-6 space-y-4">

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-poppins font-semibold">Trip</p>
                    <p className="text-sm font-semibold text-foreground font-poppins">{tripName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-poppins font-semibold">Departure</p>
                    <p className="text-sm font-semibold text-foreground font-poppins">
                      {formatDate(departure?.departure_date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-poppins font-semibold">Traveller</p>
                    <p className="text-sm font-semibold text-foreground font-poppins">
                      {customer?.name ?? primaryTraveller?.full_name ?? '—'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <CreditCard className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-poppins font-semibold">Amount Paid</p>
                    <p className="text-sm font-semibold text-foreground font-poppins">
                      ₹{(booking.amount_paid ?? booking.total_amount ?? 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              {customer && (
                <div className="pt-4 border-t border-[#E4E2DA] grid grid-cols-2 gap-3">
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-poppins">
                      <Phone className="h-3.5 w-3.5" />
                      {customer.phone}
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-poppins">
                      <Mail className="h-3.5 w-3.5" />
                      {customer.email}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* What's Next (confirmed only) */}
          {isConfirmed && (
            <div className="px-8 pb-6">
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-bold text-blue-800 font-poppins">What happens next?</p>
                </div>
                <ul className="space-y-2 text-sm text-blue-700 font-poppins">
                  <li className="flex gap-2">
                    <span className="text-blue-500 font-bold shrink-0">→</span>
                    Confirmation email sent to {customer?.email ?? 'your email'}
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-500 font-bold shrink-0">→</span>
                    Trip captain will WhatsApp you 7 days before departure
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-500 font-bold shrink-0">→</span>
                    Pickup point details shared 3 days prior
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="px-8 pb-8 flex flex-col sm:flex-row gap-3">
            {isFailed ? (
              <Button
                className="flex-1 bg-primary text-white"
                onClick={() => navigate({ to: '/destinations' })}
              >
                Try Again <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="flex-1 border-[#E4E2DA] font-poppins"
                  disabled={!isConfirmed}
                  onClick={() => {
                    // TODO: Generate PDF invoice
                    toast.info('Invoice download coming soon!')
                  }}
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  Download Invoice
                </Button>
                <Link to="/" className="flex-1">
                  <Button className="w-full bg-primary text-white font-poppins">
                    <Home className="h-4 w-4 mr-1.5" />
                    Back to Home
                  </Button>
                </Link>
              </>
            )}
          </div>
        </motion.div>

        {/* Support */}
        <p className="text-center text-sm text-muted-foreground font-poppins">
          Need help? Contact us at{' '}
          <a href="mailto:hello@nomadiktravels.com" className="text-primary font-semibold">
            hello@nomadiktravels.com
          </a>
        </p>
      </div>
    </div>
  )
}
