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
import { toast } from 'sonner'
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Trash2,
  Calendar,
} from 'lucide-react'
import {
  getDepartureById,
  createDeparture,
  updateDeparture,
  generateSeatInventory,
} from '@/lib/queries/departures'
import { getAllBuses, getAllHotels } from '@/lib/queries/hotels-buses'
import { getAllTripCaptains } from '@/lib/queries/admin'
import { useAdminAuth } from '@/hooks/use-admin-auth'

export const Route = createFileRoute('/admin/departures_/$id')({
  component: DepartureFormPage,
})

const departureSchema = z.object({
  journey_id: z.string().min(1, 'Journey is required'),
  trip_captain_id: z.string().optional(),
  bus_id: z.string().optional(),
  hotel_id: z.string().optional(),
  departure_date: z.string().min(1, 'Departure date is required'),
  return_date: z.string().min(1, 'Return date is required'),
  total_seats: z.number().int().min(1).default(20),
  base_price: z.number().min(0, 'Base price is required'),
  dynamic_price: z.number().min(0).optional(),
  discount_amount: z.number().min(0).default(0),
  discount_type: z.enum(['PERCENTAGE', 'FLAT']).optional(),
  pickup_location: z.string().optional(),
  drop_location: z.string().optional(),
  notes: z.string().optional(),
  status: z.preprocess((val) => {
    if (typeof val === 'string') return val.toUpperCase().trim();
    return val;
  }, z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED', 'SOLD_OUT', 'CLOSED']).default('UPCOMING')),
  is_visible: z.boolean().default(true),
})

type DepartureFormValues = z.infer<typeof departureSchema>

function DepartureFormPage() {
  const { id } = Route.useParams()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { admin } = useAdminAuth()

  const [pricingTiers, setPricingTiers] = useState<{ tier_name: string; price: number; seats_limit?: number }[]>([])

  const { data: departure, isLoading: loadingData } = useQuery({
    queryKey: ['departure', id],
    queryFn: () => getDepartureById(id),
    enabled: !isNew,
  })

  const { data: journeys = [] } = useQuery({
    queryKey: ['journeys_dropdown'],
    queryFn: async () => {
      const { supabase } = await import('@/lib/supabase')
      const { data } = await supabase.from('journeys').select('id, name')
      return data ?? []
    },
  })

  const { data: buses = [] } = useQuery({
    queryKey: ['buses_dropdown'],
    queryFn: getAllBuses,
  })

  const { data: hotels = [] } = useQuery({
    queryKey: ['hotels_dropdown'],
    queryFn: getAllHotels,
  })

  const { data: captains = [] } = useQuery({
    queryKey: ['captains_dropdown'],
    queryFn: getAllTripCaptains,
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<DepartureFormValues>({
    resolver: zodResolver(departureSchema) as any,
    defaultValues: {
      status: 'UPCOMING',
      is_visible: true,
      total_seats: 20,
    },
  })

  // Load existing data
  useEffect(() => {
    if (departure) {
      reset({
        journey_id: departure.journey_id,
        trip_captain_id: departure.trip_captain_id ?? '',
        bus_id: departure.bus_id ?? '',
        hotel_id: departure.hotel_id ?? '',
        departure_date: departure.departure_date,
        return_date: departure.return_date,
        total_seats: departure.total_seats,
        base_price: departure.base_price,
        dynamic_price: departure.dynamic_price ?? undefined,
        discount_amount: departure.discount_amount ?? 0,
        discount_type: (departure.discount_type as 'PERCENTAGE' | 'FLAT') ?? undefined,
        pickup_location: departure.pickup_location ?? '',
        drop_location: departure.drop_location ?? '',
        notes: departure.notes ?? '',
        status: departure.status ? (departure.status.toUpperCase().trim() as any) : 'UPCOMING',
        is_visible: departure.is_visible,
      })
      setPricingTiers(((departure as any).pricing_tiers as any[])?.map(t => ({
        tier_name: t.tier_name,
        price: t.price,
        seats_limit: t.seats_limit ?? undefined
      })) ?? [])
    }
  }, [departure, reset])

  const saveMutation = useMutation({
    mutationFn: async (values: DepartureFormValues) => {
      const payload = {
        ...values,
        status: (values.status || 'UPCOMING').toUpperCase().trim(),
        trip_captain_id: values.trip_captain_id || null,
        bus_id: values.bus_id || null,
        hotel_id: values.hotel_id || null,
        discount_type: values.discount_type || null,
        created_by: admin?.id ?? null,
        updated_by: admin?.id ?? null,
        pickup_time: null,
        hotel_name: null,
        is_closed: false,
        is_cancelled: false,
      }

      let savedDep
      if (isNew) {
        savedDep = await createDeparture({
          ...payload,
          available_seats: values.total_seats,
          booked_seats: 0,
        } as any)
      } else {
        savedDep = await updateDeparture(id, payload as any)
      }

      // Sync dynamic pricing tiers
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('pricing_tiers').delete().eq('departure_id', savedDep.id)
      if (pricingTiers.length > 0) {
        const { error } = await supabase.from('pricing_tiers').insert(
          pricingTiers.map((t, index) => ({
            departure_id: savedDep.id,
            tier_name: t.tier_name,
            price: t.price,
            seats_limit: t.seats_limit ?? null,
            sort_order: index,
          }))
        )
        if (error) throw new Error(error.message)
      }

      // Initialize/regenerate seat inventory if bus is assigned/changed
      if (payload.bus_id && (isNew || departure?.bus_id !== payload.bus_id)) {
        await generateSeatInventory(savedDep.id, payload.bus_id)
      }

      return savedDep
    },
    onSuccess: (dep) => {
      qc.invalidateQueries({ queryKey: ['departures_list'] })
      qc.invalidateQueries({ queryKey: ['departure', id] })
      toast.success(isNew ? 'Departure date created!' : 'Departure configuration updated!')
      if (isNew) navigate({ to: '/admin/departures/$id', params: { id: dep.id } })
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

  if (!isNew && loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/admin/departures' })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold font-poppins">
            {isNew ? 'New Departure' : 'Edit Departure'}
          </h1>
        </div>
        <Button
          onClick={handleSubmit((v) => saveMutation.mutate(v as any), onInvalid)}
          disabled={saveMutation.isPending}
          className="gap-1.5"
        >
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isNew ? 'Create Departure' : 'Save Changes'}
        </Button>
      </motion.div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Date & Assignments</TabsTrigger>
          <TabsTrigger value="pricing">Dynamic Pricing</TabsTrigger>
          <TabsTrigger value="rules">Visits & Notes</TabsTrigger>
        </TabsList>

        {/* BASIC */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Journey Package *</Label>
                  <Select
                    value={watch('journey_id') ?? ''}
                    onValueChange={(v) => setValue('journey_id', v, { shouldDirty: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select package" />
                    </SelectTrigger>
                    <SelectContent>
                      {journeys.map((j) => (
                        <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.journey_id && <p className="text-xs text-destructive">{errors.journey_id.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Trip Captain</Label>
                  <Select
                    value={watch('trip_captain_id') ?? ''}
                    onValueChange={(v) => setValue('trip_captain_id', v, { shouldDirty: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select captain" />
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
                  <Label>Departure Date *</Label>
                  <Input type="date" {...register('departure_date')} />
                  {errors.departure_date && <p className="text-xs text-destructive">{errors.departure_date.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Return Date *</Label>
                  <Input type="date" {...register('return_date')} />
                  {errors.return_date && <p className="text-xs text-destructive">{errors.return_date.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Assign Vehicle (Seat Inventory)</Label>
                  <Select
                    value={watch('bus_id') ?? ''}
                    onValueChange={(v) => {
                      setValue('bus_id', v, { shouldDirty: true })
                      const total = buses.find((b) => b.id === v)?.total_seats ?? 20
                      setValue('total_seats', total, { shouldDirty: true })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select bus layout" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {buses.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name} ({b.total_seats} seats)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Assign Hotel</Label>
                  <Select
                    value={watch('hotel_id') ?? ''}
                    onValueChange={(v) => setValue('hotel_id', v, { shouldDirty: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select hotel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {hotels.map((h) => (
                        <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Base Price (₹) *</Label>
                  <Input type="number" {...register('base_price', { valueAsNumber: true })} />
                  {errors.base_price && <p className="text-xs text-destructive">{errors.base_price.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Capacity (Seats)</Label>
                  <Input type="number" {...register('total_seats', { valueAsNumber: true })} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRICING */}
        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                Dynamic Pricing Tiers
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setPricingTiers([...pricingTiers, { tier_name: '', price: 0 }])}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Tier
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pricingTiers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No dynamic pricing tiers set.</p>
              )}
              {pricingTiers.map((tier, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/20">
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <Input
                      value={tier.tier_name}
                      onChange={(e) => setPricingTiers(pricingTiers.map((t, j) => j === i ? { ...t, tier_name: e.target.value } : t))}
                      placeholder="e.g. Early Bird"
                    />
                    <Input
                      type="number"
                      value={tier.price || ''}
                      onChange={(e) => setPricingTiers(pricingTiers.map((t, j) => j === i ? { ...t, price: Number(e.target.value) } : t))}
                      placeholder="Price (₹)"
                    />
                    <Input
                      type="number"
                      value={tier.seats_limit || ''}
                      onChange={(e) => setPricingTiers(pricingTiers.map((t, j) => j === i ? { ...t, seats_limit: e.target.value ? Number(e.target.value) : undefined } : t))}
                      placeholder="Seats limit (optional)"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setPricingTiers(pricingTiers.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* RULES & NOTES */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Pickup Location Override</Label>
                  <Input {...register('pickup_location')} placeholder="e.g. Kashmere Gate, Metro Station Gate 1" />
                </div>
                <div className="space-y-1.5">
                  <Label>Drop Location Override</Label>
                  <Input {...register('drop_location')} placeholder="e.g. Kashmere Gate, Delhi" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Internal Notes</Label>
                <Textarea {...register('notes')} placeholder="Captain details, special notes for sales staff..." rows={4} />
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <Label>Publish Departure</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Allow public to book this date</p>
                </div>
                <Switch
                  checked={watch('is_visible')}
                  onCheckedChange={(v) => setValue('is_visible', v, { shouldDirty: true })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Trip Status</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Control execution stage of departure</p>
                </div>
                <Select
                  value={watch('status')}
                  onValueChange={(v) => setValue('status', v as DepartureFormValues['status'], { shouldDirty: true })}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPCOMING">Upcoming</SelectItem>
                    <SelectItem value="ONGOING">Ongoing</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="SOLD_OUT">Sold Out</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
