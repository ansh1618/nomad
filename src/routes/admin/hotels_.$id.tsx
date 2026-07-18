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
import { ImageField, MediaPicker } from '@/components/admin/MediaPicker'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Trash2,
  Hotel,
} from 'lucide-react'
import {
  getHotelById,
  createHotel,
  updateHotel,
  getRoomsByHotel,
  createHotelRoom,
  deleteHotelRoom,
} from '@/lib/queries/hotels-buses'
import { getPublishedDestinations } from '@/lib/queries/destinations'
import { useAdminAuth } from '@/hooks/use-admin-auth'

export const Route = createFileRoute('/admin/hotels_/$id')({
  component: HotelFormPage,
})

const hotelSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  destination_id: z.string().min(1, 'Destination is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional().default('India'),
  star_rating: z.number().int().min(1).max(5).default(3),
  description: z.string().optional(),
  check_in_time: z.string().default('14:00'),
  check_out_time: z.string().default('11:00'),
  contact_name: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().optional(),
  website: z.string().optional(),
  is_active: z.boolean().default(true),
  is_verified: z.boolean().default(false),
  available_rooms: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return 0;
    const num = Number(val);
    return isNaN(num) ? 0 : Math.round(num);
  }, z.number().int().min(0).default(0)),
  notes: z.string().optional(),
})

type HotelFormValues = z.infer<typeof hotelSchema>

function HotelFormPage() {
  const { id } = Route.useParams()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { admin } = useAdminAuth()

  const [gallery, setGallery] = useState<string[]>([])
  const [amenities, setAmenities] = useState<string[]>([])
  const [newAmenity, setNewAmenity] = useState('')
  const [showMediaPicker, setShowMediaPicker] = useState(false)

  // Rooms local state for editing
  const [rooms, setRooms] = useState<{ id?: string; room_type: string; sharing_type: string; capacity: number; price_modifier: number }[]>([])

  const { data: hotel, isLoading: loadingData } = useQuery({
    queryKey: ['hotel', id],
    queryFn: () => getHotelById(id),
    enabled: !isNew,
  })

  const { data: destinations = [] } = useQuery({
    queryKey: ['destinations_dropdown'],
    queryFn: getPublishedDestinations,
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<HotelFormValues>({
    resolver: zodResolver(hotelSchema) as any,
    defaultValues: {
      star_rating: 3,
      check_in_time: '14:00',
      check_out_time: '11:00',
      is_active: true,
      country: 'India',
      is_verified: false,
      available_rooms: 0,
    },
  })

  // Load existing stay details
  useEffect(() => {
    if (hotel) {
      reset({
        name: hotel.name,
        destination_id: hotel.destination_id ?? '',
        address: hotel.address ?? '',
        city: hotel.city ?? '',
        state: hotel.state ?? '',
        star_rating: hotel.star_rating ?? 3,
        description: hotel.description ?? '',
        check_in_time: hotel.check_in_time ?? '14:00',
        check_out_time: hotel.check_out_time ?? '11:00',
        contact_name: hotel.contact_name ?? '',
        contact_phone: hotel.contact_phone ?? '',
        contact_email: hotel.contact_email ?? '',
        website: hotel.website ?? '',
        is_active: hotel.is_active,
        notes: hotel.notes ?? '',
        country: hotel.country ?? 'India',
        is_verified: hotel.is_verified ?? false,
        available_rooms: hotel.available_rooms ?? 0,
      })
      setGallery((hotel.gallery as any[])?.map((item) => typeof item === 'string' ? item : item.url || '') ?? [])
      setAmenities(hotel.amenities ?? [])
      setRooms((hotel.hotel_rooms as any[])?.map(r => ({
        id: r.id,
        room_type: r.room_type,
        sharing_type: r.sharing_type ?? 'DOUBLE',
        capacity: r.capacity,
        price_modifier: r.price_modifier ?? 0,
      })) ?? [])
    }
  }, [hotel, reset])

  const saveMutation = useMutation({
    mutationFn: async (values: HotelFormValues) => {
      const payload = {
        ...values,
        destination_id: values.destination_id || null,
        gallery: gallery.map((url) => ({ url })),
        amenities,
        created_by: admin?.id ?? null,
        location: null,
        slug: values.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim(),
        latitude: null,
        longitude: null,
        meal_plans: [],
      }

      let savedHotel
      if (isNew) {
        savedHotel = await createHotel(payload as any)
      } else {
        savedHotel = await updateHotel(id, payload as any)
      }

      // Sync Rooms
      const { supabase } = await import('@/lib/supabase')
      // Delete old rooms
      await supabase.from('hotel_rooms').delete().eq('hotel_id', savedHotel.id)
      if (rooms.length > 0) {
        const { error } = await supabase.from('hotel_rooms').insert(
          rooms.map(r => ({
            hotel_id: savedHotel.id,
            room_type: r.room_type,
            sharing_type: r.sharing_type,
            capacity: r.capacity,
            price_modifier: r.price_modifier,
            is_active: true,
          }))
        )
        if (error) throw new Error(error.message)
      }

      return savedHotel
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hotels_list'] })
      qc.invalidateQueries({ queryKey: ['hotel', id] })
      toast.success(isNew ? 'Hotel vendor added!' : 'Hotel details updated!')
      navigate({ to: '/admin/hotels' })
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
    if (amenities.includes(val)) return
    setAmenities([...amenities, val])
    setNewAmenity('')
  }

  const removeAmenity = (index: number) => {
    setAmenities(amenities.filter((_, i) => i !== index))
  }

  const addRoom = () => {
    setRooms([...rooms, { room_type: '', sharing_type: 'DOUBLE', capacity: 2, price_modifier: 0 }])
  }

  const removeRoom = (index: number) => {
    setRooms(rooms.filter((_, i) => i !== index))
  }

  const updateRoom = (index: number, field: string, val: any) => {
    setRooms(rooms.map((r, i) => i === index ? { ...r, [field]: val } : r))
  }

  if (!isNew && loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/admin/hotels' })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold font-poppins">
            {isNew ? 'New Stay Vendor' : `Edit: ${hotel?.name ?? '...'}`}
          </h1>
        </div>
        <Button
          onClick={handleSubmit((v) => saveMutation.mutate(v as any), onInvalid)}
          disabled={saveMutation.isPending}
          className="gap-1.5"
        >
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Vendor
        </Button>
      </motion.div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Vendor Info</TabsTrigger>
          <TabsTrigger value="rooms">Room Categories</TabsTrigger>
          <TabsTrigger value="amenities">Amenities & Photos</TabsTrigger>
          <TabsTrigger value="notes">Operations Note</TabsTrigger>
        </TabsList>

        {/* BASIC */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Hotel Stay Name *</Label>
                  <Input {...register('name')} placeholder="e.g. Pine River Retreat" />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Destination Area *</Label>
                  <Select
                    value={watch('destination_id') ?? ''}
                    onValueChange={(v) => setValue('destination_id', v, { shouldDirty: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {destinations.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.destination_id && <p className="text-xs text-destructive">{errors.destination_id.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <Label>Address / Landmark</Label>
                  <Input {...register('address')} placeholder="e.g. Riverbank, Jibhi Valley" />
                </div>
                <div className="space-y-1.5">
                  <Label>Star Category Rating</Label>
                  <Input type="number" {...register('star_rating', { valueAsNumber: true })} min={1} max={5} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>City</Label>
                  <Input {...register('city')} placeholder="e.g. Jibhi" />
                </div>
                <div className="space-y-1.5">
                  <Label>State</Label>
                  <Input {...register('state')} placeholder="e.g. Himachal Pradesh" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Vendor Contact Person</Label>
                  <Input {...register('contact_name')} placeholder="e.g. Amit Sharma" />
                </div>
                <div className="space-y-1.5">
                  <Label>Contact Phone</Label>
                  <Input {...register('contact_phone')} placeholder="e.g. +91 99999 88888" />
                </div>
                <div className="space-y-1.5">
                  <Label>Contact Email</Label>
                  <Input {...register('contact_email')} placeholder="e.g. billing@pineriver.com" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ROOMS */}
        <TabsContent value="rooms" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Stays & Room Types</CardTitle>
              <Button type="button" size="sm" variant="outline" onClick={addRoom}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Room Category
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {rooms.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No rooms added. Stay won't be pickable in Bookings.</p>
              )}
              {rooms.map((room, i) => (
                <div key={i} className="p-4 border rounded-xl bg-muted/20 space-y-3 relative">
                  <button
                    type="button"
                    onClick={() => removeRoom(i)}
                    className="absolute top-2 right-2 text-destructive hover:bg-destructive/10 p-1.5 rounded-md"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Room Type Label</Label>
                      <Input
                        value={room.room_type}
                        onChange={(e) => updateRoom(i, 'room_type', e.target.value)}
                        placeholder="Deluxe Room"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Sharing Category</Label>
                      <Select value={room.sharing_type} onValueChange={(v) => updateRoom(i, 'sharing_type', v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SINGLE">Single Sharing</SelectItem>
                          <SelectItem value="DOUBLE">Double Sharing</SelectItem>
                          <SelectItem value="TRIPLE">Triple Sharing</SelectItem>
                          <SelectItem value="QUAD">Quad Sharing</SelectItem>
                          <SelectItem value="DORM">Dormitory</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Bed Capacity</Label>
                      <Input
                        type="number"
                        value={room.capacity}
                        onChange={(e) => updateRoom(i, 'capacity', Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Dynamic Modifier (₹)</Label>
                      <Input
                        type="number"
                        value={room.price_modifier}
                        onChange={(e) => updateRoom(i, 'price_modifier', Number(e.target.value))}
                        placeholder="+/- amount"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AMENITIES */}
        <TabsContent value="amenities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Amenities List</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  placeholder="e.g. Swimming Pool, Free Wi-Fi, River facing balconies"
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

          {/* Gallery */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Hotel Photos Gallery</CardTitle>
              <Button type="button" size="sm" variant="outline" onClick={() => setShowMediaPicker(true)}>
                Select Photos
              </Button>
            </CardHeader>
            <CardContent>
              {gallery.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No gallery photos.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {gallery.map((url, index) => (
                    <div key={index} className="relative group rounded-lg overflow-hidden border h-24">
                      <img src={url} className="w-full h-full object-cover" alt="" />
                      <button
                        type="button"
                        onClick={() => setGallery(gallery.filter((_, i) => i !== index))}
                        className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTES & RULES */}
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Check-In Time</Label>
                  <Input {...register('check_in_time')} placeholder="e.g. 14:00" />
                </div>
                <div className="space-y-1.5">
                  <Label>Check-Out Time</Label>
                  <Input {...register('check_out_time')} placeholder="e.g. 11:00" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Country</Label>
                  <Input {...register('country')} placeholder="e.g. India" />
                </div>
                <div className="space-y-1.5">
                  <Label>Available Rooms Capacity</Label>
                  <Input {...register('available_rooms', { valueAsNumber: true })} type="number" placeholder="e.g. 10" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Operations Notes / Custom Rules</Label>
                <Textarea {...register('notes')} placeholder="Add billing cycles, special checkin protocols, etc..." rows={5} />
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <Label>Verified Stay</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Control if stay displays verified badge on public templates</p>
                </div>
                <Switch
                  checked={watch('is_verified')}
                  onCheckedChange={(v) => setValue('is_verified', v, { shouldDirty: true })}
                />
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <Label>Stay Vendor Active</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Control if stay can be selected on departures</p>
                </div>
                <Switch
                  checked={watch('is_active')}
                  onCheckedChange={(v) => setValue('is_active', v, { shouldDirty: true })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <MediaPicker
        open={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(asset) => {
          if (!gallery.includes(asset.url)) {
            setGallery([...gallery, asset.url])
          }
        }}
        multiple
      />
    </div>
  )
}
