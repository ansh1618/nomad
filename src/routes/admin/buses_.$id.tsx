import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react'
import {
  getBusById,
  createBus,
  updateBus,
  upsertBusSeats,
} from '@/lib/queries/hotels-buses'
import { useAdminAuth } from '@/hooks/use-admin-auth'

export const Route = createFileRoute('/admin/buses_/$id')({
  component: BusFormPage,
})

const busSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  registration_number: z.string().min(4, 'Registration number is required'),
  bus_type: z.string().min(1, 'Layout type is required'),
  total_seats: z.number().int().min(1).default(20),
  driver_name: z.string().optional(),
  driver_phone: z.string().optional(),
  is_active: z.boolean().default(true),
  notes: z.string().optional(),
})

type BusFormValues = z.infer<typeof busSchema>

function BusFormPage() {
  const { id } = Route.useParams()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { admin } = useAdminAuth()

  const [amenities, setAmenities] = useState<string[]>([])
  const [newAmenity, setNewAmenity] = useState('')

  const { data: bus, isLoading: loadingData } = useQuery({
    queryKey: ['bus', id],
    queryFn: () => getBusById(id),
    enabled: !isNew,
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<BusFormValues>({
    resolver: zodResolver(busSchema),
    defaultValues: {
      bus_type: '2x2',
      total_seats: 20,
      is_active: true,
    },
  })

  // Load existing data
  useEffect(() => {
    if (bus) {
      reset({
        name: bus.name,
        registration_number: bus.registration_number,
        bus_type: bus.bus_type,
        total_seats: bus.total_seats,
        driver_name: bus.driver_name ?? '',
        driver_phone: bus.driver_phone ?? '',
        is_active: bus.is_active,
        notes: bus.notes ?? '',
      })
      setAmenities(bus.amenities ?? [])
    }
  }, [bus, reset])

  const saveMutation = useMutation({
    mutationFn: async (values: BusFormValues) => {
      const payload = {
        ...values,
        amenities,
        created_by: admin?.id ?? null,
      }

      let savedBus
      if (isNew) {
        savedBus = await createBus(payload)
      } else {
        savedBus = await updateBus(id, payload)
      }

      // Automatically generate/refresh seats registry map
      const seatsCount = values.total_seats
      const layout = values.bus_type

      const seatsToInsert = []
      const cols = layout === '1x2' ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D']
      const rowsCount = Math.ceil(seatsCount / cols.length)

      let seatIndex = 0
      for (let r = 1; r <= rowsCount; r++) {
        for (let c = 0; c < cols.length; c++) {
          if (seatIndex >= seatsCount) break
          seatsToInsert.push({
            bus_id: savedBus.id,
            seat_number: `${r}${cols[c]}`,
            seat_type: 'STANDARD',
            row_number: r,
            column_letter: cols[c],
            is_window: c === 0 || c === cols.length - 1,
            is_sleeper: layout === 'SLEEPER',
            price_modifier: 0,
          })
          seatIndex++
        }
      }

      await upsertBusSeats(savedBus.id, seatsToInsert)
      return savedBus
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['buses_list'] })
      qc.invalidateQueries({ queryKey: ['bus', id] })
      toast.success(isNew ? 'Vehicle registered!' : 'Vehicle updated!')
      navigate({ to: '/admin/buses' })
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

  const addAmenity = () => {
    const val = newAmenity.trim()
    if (!val) return
    if (amenities.includes(val)) {
      toast.error('Amenity already added')
      return
    }
    setAmenities([...amenities, val])
    setNewAmenity('')
  }

  const removeAmenity = (index: number) => {
    setAmenities(amenities.filter((_, i) => i !== index))
  }

  if (!isNew && loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/admin/buses' })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold font-poppins">
            {isNew ? 'New Vehicle Configuration' : `Edit Vehicle Layout`}
          </h1>
        </div>
        <Button
          onClick={handleSubmit((v) => saveMutation.mutate(v), onInvalid)}
          disabled={saveMutation.isPending}
          className="gap-1.5"
        >
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save layout
        </Button>
      </motion.div>

      <form onSubmit={handleSubmit((v) => saveMutation.mutate(v), onInvalid)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Vehicle Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Vehicle Label Name *</Label>
                <Input {...register('name')} placeholder="e.g. Luxury Volvo Coach" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Registration Number Plate *</Label>
                <Input {...register('registration_number')} placeholder="e.g. DL 1C A 1234" />
                {errors.registration_number && <p className="text-xs text-destructive">{errors.registration_number.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Layout Grid Format *</Label>
                <Select
                  value={watch('bus_type') ?? ''}
                  onValueChange={(v) => setValue('bus_type', v, { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2x2">2x2 Standard (Tempo / Bus)</SelectItem>
                    <SelectItem value="1x2">1x2 Business Executive</SelectItem>
                    <SelectItem value="SLEEPER">Sleeper Berth Grid</SelectItem>
                  </SelectContent>
                </Select>
                {errors.bus_type && <p className="text-xs text-destructive">{errors.bus_type.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Total Seats capacity *</Label>
                <Input type="number" {...register('total_seats', { valueAsNumber: true })} />
                {errors.total_seats && <p className="text-xs text-destructive">{errors.total_seats.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Driver Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Driver / Crew Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Driver Name</Label>
                <Input {...register('driver_name')} placeholder="e.g. Ramesh Kumar" />
              </div>
              <div className="space-y-1.5">
                <Label>Driver Phone Contact</Label>
                <Input {...register('driver_phone')} placeholder="e.g. +91 98765 43210" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Vehicle Notes</Label>
              <Input {...register('notes')} placeholder="Special maintenance info, route permits..." />
            </div>
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Amenities Available</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                placeholder="e.g. USB Chargers, AC, WiFi, Water Bottle"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAmenity() } }}
              />
              <Button type="button" onClick={addAmenity}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {amenities.map((item, i) => (
                <Badge key={i} variant="outline" className="flex items-center gap-1.5 py-1 px-2.5">
                  {item}
                  <button type="button" onClick={() => removeAmenity(i)} className="text-destructive font-bold text-xs">×</button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Vehicle active</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Toggle vehicle active status</p>
              </div>
              <Switch
                checked={watch('is_active')}
                onCheckedChange={(v) => setValue('is_active', v, { shouldDirty: true })}
              />
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
