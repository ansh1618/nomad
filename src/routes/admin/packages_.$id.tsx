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
import { ImageField } from '@/components/admin/MediaPicker'
import { ItineraryEditor } from '@/components/admin/ItineraryEditor'
import type { ItineraryDayForm } from '@/components/admin/ItineraryEditor'
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
} from 'lucide-react'
import {
  getPackageById,
  createPackage,
  updatePackage,
  replaceItineraryDays,
  savePackageRevision,
} from '@/lib/queries/packages'
import { getPublishedDestinations } from '@/lib/queries/destinations'
import { getAllTripCaptains } from '@/lib/queries/admin'
import { useAdminAuth } from '@/hooks/use-admin-auth'
import type { FaqItem, PolicyItem } from '@/types/supabase'

export const Route = createFileRoute('/admin/packages_/$id')({
  component: PackageFormPage,
})

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
})

type PackageFormValues = z.infer<typeof packageSchema>

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
  const [policies, setPolicies] = useState<PolicyItem[]>([])
  const [faqs, setFaqs] = useState<FaqItem[]>([])
  const [newItem, setNewItem] = useState<Record<string, string>>({})

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

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      difficulty: 'EASY',
      group_size_min: 1,
      group_size_max: 25,
      status: 'DRAFT',
      is_featured: false,
      priority: 0,
    },
  })

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
        inclusions,
        exclusions,
        packing_list: packingList,
        policies,
        faqs,
        seo: seo_title || seo_description ? { title: seo_title, description: seo_description } : null,
        created_by: admin?.id ?? null,
        updated_by: admin?.id ?? null,
      }

      let savedPkg
      if (isNew) {
        savedPkg = await createPackage(payload as Parameters<typeof createPackage>[0])
      } else {
        // Save revision before updating
        if (pkg) await savePackageRevision(id, pkg, admin?.id)
        savedPkg = await updatePackage(id, payload)
      }

      // Save itinerary and capture the verified rows
      const savedDays = await replaceItineraryDays(savedPkg.id, itinerary)

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

  const addListItem = (list: string[], setList: (v: string[]) => void, key: string) => {
    const val = newItem[key]?.trim()
    if (!val) return
    setList([...list, val])
    setNewItem((prev) => ({ ...prev, [key]: '' }))
  }

  const removeListItem = (list: string[], setList: (v: string[]) => void, index: number) => {
    setList(list.filter((_, i) => i !== index))
  }

  if (!isNew && loadingPkg) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  const slugValue = watch('slug')

  function StringListEditor({
    label,
    list,
    setList,
    itemKey,
    placeholder,
  }: {
    label: string
    list: string[]
    setList: (v: string[]) => void
    itemKey: string
    placeholder?: string
  }) {
    return (
      <div className="space-y-3">
        <Label>{label}</Label>
        <div className="space-y-2">
          {list.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex-1 text-sm p-2 bg-muted/30 rounded-md border">{item}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => removeListItem(list, setList, i)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={newItem[itemKey] ?? ''}
            onChange={(e) => setNewItem((prev) => ({ ...prev, [itemKey]: e.target.value }))}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addListItem(list, setList, itemKey) } }}
            placeholder={placeholder ?? `Add ${label.toLowerCase()}...`}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addListItem(list, setList, itemKey)}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/admin/packages' })}>
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
              <Button variant="outline" size="sm" className="gap-1.5">
                <Eye className="h-4 w-4" /> Preview
              </Button>
            </a>
          )}
          <Button
            onClick={handleSubmit((v) => saveMutation.mutate(v), onInvalid)}
            disabled={saveMutation.isPending}
            className="gap-1.5"
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isNew ? 'Create Package' : 'Save Changes'}
          </Button>
        </div>
      </motion.div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
          <TabsTrigger value="inclusions">Inclusions</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* ==================== BASIC ==================== */}
        <TabsContent value="basic" className="space-y-4">
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

              <div className="space-y-1.5">
                <Label>Tagline</Label>
                <Input {...register('tagline')} placeholder="e.g., Where the mountains whisper your name" />
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
                itemKey="highlights"
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
          <Card>
            <CardContent className="pt-6 space-y-6">
              <StringListEditor label="Inclusions" list={inclusions} setList={setInclusions} itemKey="inclusions" placeholder="e.g., Accommodation on twin-sharing basis" />
              <StringListEditor label="Exclusions" list={exclusions} setList={setExclusions} itemKey="exclusions" placeholder="e.g., Airfare to/from destination" />
              <StringListEditor label="Packing List" list={packingList} setList={setPackingList} itemKey="packing" placeholder="e.g., Warm jacket, sunscreen" />
            </CardContent>
          </Card>

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

          {/* FAQs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                FAQs
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setFaqs([...faqs, { question: '', answer: '' }])}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add FAQ
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="p-3 border rounded-lg space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={faq.question}
                      onChange={(e) => setFaqs(faqs.map((f, j) => j === i ? { ...f, question: e.target.value } : f))}
                      placeholder="Question"
                      className="flex-1"
                    />
                    <Button type="button" variant="ghost" size="icon" className="text-destructive h-9 w-9"
                      onClick={() => setFaqs(faqs.filter((_, j) => j !== i))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Textarea
                    value={faq.answer}
                    onChange={(e) => setFaqs(faqs.map((f, j) => j === i ? { ...f, answer: e.target.value } : f))}
                    placeholder="Answer"
                    rows={2}
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
      </Tabs>
    </div>
  )
}
