import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Calendar as CalendarIcon,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Zap,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import {
  dryRunRecurringDepartures,
  executeRecurringDeparturesBatch,
  type RecurringConfig,
  type DryRunResult,
} from '@/lib/queries/departures'
import { supabase } from '@/lib/supabase'

interface RecurringDepartureModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function RecurringDepartureModal({ isOpen, onClose, onSuccess }: RecurringDepartureModalProps) {
  const [step, setStep] = useState<'FORM' | 'PREVIEW'>('FORM')

  // Form State
  const [journeyId, setJourneyId] = useState('')
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 3)
    return d.toISOString().split('T')[0]
  })
  const [repeatPattern, setRepeatPattern] = useState<RecurringConfig['repeatPattern']>('THURSDAY_FRIDAY')
  const [customDays, setCustomDays] = useState<number[]>([4, 5])
  const [price, setPrice] = useState('6499')
  const [totalSeats, setTotalSeats] = useState('25')
  const [tripCaptainId, setTripCaptainId] = useState('')
  const [busId, setBusId] = useState('')
  const [hotelId, setHotelId] = useState('')
  const [status, setStatus] = useState('UPCOMING')
  const [isVisible, setIsVisible] = useState(true)
  const [bookingOpensDays, setBookingOpensDays] = useState('0')
  const [bookingClosesHours, setBookingClosesHours] = useState('24')

  const [dryRunData, setDryRunData] = useState<DryRunResult | null>(null)

  // Fetch dropdown data
  const { data: journeys = [], isLoading: isLoadingJourneys } = useQuery({
    queryKey: ['journeys_dropdown_modal'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('journeys')
          .select('id, name, slug, starting_price, price, duration, duration_days, destination_id')
          .order('name')

        if (error) {
          console.error('[RecurringDepartureModal] Error fetching journeys from Supabase:', error.message)
          const { data: fallbackData } = await supabase
            .from('journeys')
            .select('id, name, slug, price, duration, destination_id')
            .order('name')
          return fallbackData ?? []
        }
        return data ?? []
      } catch (err) {
        console.error('[RecurringDepartureModal] Exception fetching journeys:', err)
        return []
      }
    },
    enabled: isOpen,
  })

  const { data: captains = [] } = useQuery({
    queryKey: ['captains_dropdown_modal'],
    queryFn: async () => {
      const { data } = await supabase.from('trip_captains').select('id, full_name').order('full_name')
      return data ?? []
    },
    enabled: isOpen,
  })

  const { data: buses = [] } = useQuery({
    queryKey: ['buses_dropdown_modal'],
    queryFn: async () => {
      const { data } = await supabase.from('buses').select('id, name, total_seats').order('name')
      return data ?? []
    },
    enabled: isOpen,
  })

  const { data: hotels = [] } = useQuery({
    queryKey: ['hotels_dropdown_modal'],
    queryFn: async () => {
      const { data } = await supabase.from('hotels').select('id, name, city').order('name')
      return data ?? []
    },
    enabled: isOpen,
  })

  // Auto-fill price when journey changes
  const handleJourneyChange = (val: string) => {
    setJourneyId(val)
    const selected = journeys.find((j: any) => j.id === val)
    const selectedPrice = selected?.starting_price ?? selected?.price
    if (selectedPrice) {
      setPrice(String(selectedPrice))
    }
  }

  // Dry Run Mutation
  const dryRunMutation = useMutation({
    mutationFn: async () => {
      if (!journeyId) throw new Error('Please select a Package / Journey')
      if (!startDate || !endDate) throw new Error('Please select valid Start & End Dates')

      const config: RecurringConfig = {
        journeyId,
        startDate,
        endDate,
        repeatPattern,
        customDays,
        price: Number(price) || 6499,
        totalSeats: Number(totalSeats) || 25,
        tripCaptainId: tripCaptainId || null,
        busId: busId || null,
        hotelId: hotelId || null,
        status,
        isVisible,
        bookingOpensDays: Number(bookingOpensDays) || 0,
        bookingClosesHours: Number(bookingClosesHours) || 24,
      }
      return dryRunRecurringDepartures(config)
    },
    onSuccess: (res) => {
      setDryRunData(res)
      setStep('PREVIEW')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // Execute Batch Mutation
  const executeMutation = useMutation({
    mutationFn: async () => {
      if (!dryRunData) throw new Error('No preview data available')
      const config: RecurringConfig = {
        journeyId,
        startDate,
        endDate,
        repeatPattern,
        customDays,
        price: Number(price) || 6499,
        totalSeats: Number(totalSeats) || 25,
        tripCaptainId: tripCaptainId || null,
        busId: busId || null,
        hotelId: hotelId || null,
        status,
        isVisible,
        bookingOpensDays: Number(bookingOpensDays) || 0,
        bookingClosesHours: Number(bookingClosesHours) || 24,
      }
      return executeRecurringDeparturesBatch(config, dryRunData.items)
    },
    onSuccess: (res) => {
      toast.success(
        `Generated ${res.createdCount} departures successfully! (${res.skippedCount} existing dates skipped)`,
        { duration: 5000 }
      )
      onSuccess()
      onClose()
      setStep('FORM')
      setDryRunData(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const toggleCustomDay = (dayNum: number) => {
    setCustomDays((prev) => (prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum]))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-6 shadow-2xl">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-display font-bold text-foreground">
                Recurring Departure Generator
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Automate departures creation for any date range with smart duplicate detection & 100% data safety.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {step === 'FORM' && (
          <div className="space-y-6 pt-4">
            {/* Package Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Package / Journey *
              </Label>
              <Select value={journeyId} onValueChange={handleJourneyChange}>
                <SelectTrigger className="rounded-xl h-11 border-border">
                  <SelectValue placeholder={isLoadingJourneys ? "Loading packages..." : "Select target package..."} />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-[300px]">
                  {isLoadingJourneys ? (
                    <div className="p-3 text-xs text-muted-foreground flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading journeys...
                    </div>
                  ) : journeys.length === 0 ? (
                    <div className="p-3 text-xs text-muted-foreground text-center">No journeys found in database</div>
                  ) : (
                    journeys.map((j: any) => {
                      const displayPrice = j.starting_price ?? j.price
                      const priceText = displayPrice ? `₹${Number(displayPrice).toLocaleString('en-IN')}` : ''
                      const durationText = j.duration || (j.duration_days ? `${j.duration_days} Days` : '')

                      return (
                        <SelectItem key={j.id} value={j.id}>
                          <div className="flex flex-col text-left py-1">
                            <span className="font-bold text-sm text-foreground">{j.name}</span>
                            {(durationText || priceText) && (
                              <span className="text-[11px] font-medium text-muted-foreground mt-0.5">
                                {durationText}{durationText && priceText ? ' • ' : ''}{priceText}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      )
                    })
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Start Date *
                </Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  End Date *
                </Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>
            </div>

            {/* Repeat Pattern */}
            <div className="space-y-3 bg-muted/30 p-4 rounded-2xl border border-border">
              <Label className="text-xs font-semibold uppercase tracking-wider text-foreground block">
                Repeat Pattern *
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { id: 'THURSDAY_FRIDAY', label: 'Thu & Fri' },
                  { id: 'FRIDAY', label: 'Every Friday' },
                  { id: 'THURSDAY', label: 'Every Thursday' },
                  { id: 'SATURDAY_SUNDAY', label: 'Sat & Sun' },
                  { id: 'EVERY_DAY', label: 'Every Day' },
                  { id: 'EVERY_WEEK', label: 'Weekly' },
                  { id: 'CUSTOM', label: 'Custom Days' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setRepeatPattern(p.id as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition border ${
                      repeatPattern === p.id
                        ? 'bg-secondary text-white border-secondary shadow-sm'
                        : 'bg-white text-muted-foreground border-border hover:bg-muted/50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {repeatPattern === 'CUSTOM' && (
                <div className="pt-2 border-t mt-3">
                  <span className="text-xs font-medium text-muted-foreground block mb-2">Select Custom Days:</span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { num: 1, name: 'Mon' },
                      { num: 2, name: 'Tue' },
                      { num: 3, name: 'Wed' },
                      { num: 4, name: 'Thu' },
                      { num: 5, name: 'Fri' },
                      { num: 6, name: 'Sat' },
                      { num: 0, name: 'Sun' },
                    ].map((d) => (
                      <button
                        key={d.num}
                        type="button"
                        onClick={() => toggleCustomDay(d.num)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                          customDays.includes(d.num)
                            ? 'bg-amber-500 text-white border-amber-600'
                            : 'bg-white text-muted-foreground border-border'
                        }`}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Price & Capacity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Default Base Price (₹) *
                </Label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="6499"
                  className="rounded-xl h-11 font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Seat Capacity *
                </Label>
                <Input
                  type="number"
                  value={totalSeats}
                  onChange={(e) => setTotalSeats(e.target.value)}
                  placeholder="25"
                  className="rounded-xl h-11 font-mono"
                />
              </div>
            </div>

            {/* Optional Resource Assignments */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Trip Captain (Optional)
                </Label>
                <Select value={tripCaptainId} onValueChange={setTripCaptainId}>
                  <SelectTrigger className="rounded-xl h-10 border-border text-xs">
                    <SelectValue placeholder="Assign captain..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none">None (Assign Later)</SelectItem>
                    {captains.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Vehicle / Bus (Optional)
                </Label>
                <Select value={busId} onValueChange={setBusId}>
                  <SelectTrigger className="rounded-xl h-10 border-border text-xs">
                    <SelectValue placeholder="Assign bus..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none">None (Assign Later)</SelectItem>
                    {buses.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name} ({b.total_seats} seats)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Hotel / Stay (Optional)
                </Label>
                <Select value={hotelId} onValueChange={setHotelId}>
                  <SelectTrigger className="rounded-xl h-10 border-border text-xs">
                    <SelectValue placeholder="Assign hotel..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none">None (Assign Later)</SelectItem>
                    {hotels.map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.name} {h.city ? `(${h.city})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Visibility & Booking Window Controls */}
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border">
              <div className="flex items-center gap-3">
                <Switch checked={isVisible} onCheckedChange={setIsVisible} id="visible-switch" />
                <Label htmlFor="visible-switch" className="text-xs font-semibold text-foreground cursor-pointer">
                  Make Departures Visible Immediately
                </Label>
              </div>
              <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                {isVisible ? 'Public & Bookable' : 'Admin Hidden'}
              </Badge>
            </div>
          </div>
        )}

        {/* STEP 2: DRY RUN PREVIEW */}
        {step === 'PREVIEW' && dryRunData && (
          <div className="space-y-6 pt-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block">
                  Dry Run Calculation Complete
                </span>
                <span className="text-sm font-semibold text-blue-700">
                  Target Package: {dryRunData.journeyName}
                </span>
              </div>
              <Badge className="bg-blue-600 text-white px-3 py-1 font-mono font-bold">
                {dryRunData.items.length} Total Dates Found
              </Badge>
            </div>

            {/* Summary KPI Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                <span className="block text-2xl font-black text-emerald-700 font-mono">
                  {dryRunData.willCreateCount}
                </span>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Will Create</span>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center">
                <span className="block text-2xl font-black text-amber-700 font-mono">
                  {dryRunData.willSkipCount}
                </span>
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Will Skip (Exists)</span>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl text-center">
                <span className="block text-2xl font-black text-gray-700 font-mono">0</span>
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Conflicts</span>
              </div>
            </div>

            {/* Preview Date List */}
            <div className="border border-border rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted text-muted-foreground font-semibold uppercase tracking-wider sticky top-0 border-b">
                  <tr>
                    <th className="p-3">Departure Date</th>
                    <th className="p-3">Day</th>
                    <th className="p-3">Return Date</th>
                    <th className="p-3 text-right">Action Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {dryRunData.items.map((item, idx) => (
                    <tr key={idx} className={item.status === 'SKIPPED_EXISTING' ? 'bg-amber-50/40' : 'hover:bg-muted/20'}>
                      <td className="p-3 font-mono font-bold">{item.date}</td>
                      <td className="p-3 font-medium text-foreground">{item.dayName}</td>
                      <td className="p-3 font-mono text-muted-foreground">{item.returnDate}</td>
                      <td className="p-3 text-right">
                        {item.status === 'TO_CREATE' ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Sparkles className="h-3 w-3 mr-1" /> Will Insert
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 border border-amber-300">
                            <AlertTriangle className="h-3 w-3 mr-1" /> Skip (DB Exists)
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Data Protection Guarantee: Existing database departures will remain untouched.</span>
            </div>
          </div>
        )}

        <DialogFooter className="pt-4 border-t flex items-center justify-between">
          {step === 'FORM' ? (
            <>
              <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl">
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => dryRunMutation.mutate()}
                disabled={dryRunMutation.isPending || !journeyId}
                className="bg-secondary hover:bg-primary text-white font-bold rounded-xl px-6"
              >
                {dryRunMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Calculating...
                  </>
                ) : (
                  <>
                    Preview Generation <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => setStep('FORM')} className="rounded-xl">
                Back to Edit Rules
              </Button>
              <Button
                type="button"
                onClick={() => executeMutation.mutate()}
                disabled={executeMutation.isPending || (dryRunData?.willCreateCount ?? 0) === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-6 shadow-md"
              >
                {executeMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Inserting Batch...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" /> Generate {dryRunData?.willCreateCount} Departures
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
