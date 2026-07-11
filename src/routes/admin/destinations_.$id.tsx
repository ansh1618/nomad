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
import { Badge } from '@/components/ui/badge'
import { ImageField } from '@/components/admin/MediaPicker'
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
} from 'lucide-react'
import {
  getDestinationById,
  createDestination,
  updateDestination,
  checkDestinationSlug,
} from '@/lib/queries/destinations'
import { useAdminAuth } from '@/hooks/use-admin-auth'
import type { FaqItem, ThingToDo } from '@/types/supabase'

// ==========================================
// ROUTE — handles both /admin/destinations/new and /admin/destinations/:id
// ==========================================
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
  hero_image: z.string().optional(),
  hero_video: z.string().optional(),
  short_description: z.string().optional(),
  description: z.string().optional(),
  altitude: z.string().optional(),
  best_time: z.string().optional(),
  google_map_url: z.string().optional(),
  status: z.preprocess((val) => {
    if (typeof val === 'string') return val.toUpperCase().trim();
    return val;
  }, z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT')),
  is_featured: z.boolean().default(false),
  priority: z.number().int().min(0).default(0),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
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

  const [things, setThings] = useState<ThingToDo[]>([])
  const [faqs, setFaqs] = useState<FaqItem[]>([])

  const { data: destination, isLoading: loadingData } = useQuery({
    queryKey: ['destination', id],
    queryFn: () => getDestinationById(id),
    enabled: !isNew,
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
    reset,
  } = useForm<DestinationFormValues>({
    resolver: zodResolver(destinationSchema),
    defaultValues: {
      country: 'India',
      status: 'DRAFT',
      is_featured: false,
      priority: 0,
    },
  })

  // Populate form when editing
  useEffect(() => {
    if (destination) {
      reset({
        name: destination.name,
        slug: destination.slug,
        subtitle: destination.subtitle ?? '',
        country: destination.country,
        state: destination.state ?? '',
        region: destination.region ?? '',
        hero_image: destination.hero_image ?? '',
        hero_video: destination.hero_video ?? '',
        short_description: destination.short_description ?? '',
        description: destination.description ?? '',
        altitude: destination.altitude ?? '',
        best_time: destination.best_time ?? '',
        google_map_url: destination.google_map_url ?? '',
        status: destination.status ? (destination.status.toUpperCase().trim() as any) : 'DRAFT',
        is_featured: destination.is_featured,
        priority: destination.priority,
        seo_title: destination.seo?.title ?? '',
        seo_description: destination.seo?.description ?? '',
      })
      setThings(destination.things_to_do ?? [])
      setFaqs(destination.faqs ?? [])
    }
  }, [destination, reset])

  // Auto-generate slug from name
  const nameValue = watch('name')
  const slugValue = watch('slug')

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()

  useEffect(() => {
    if (isNew && nameValue) {
      setValue('slug', generateSlug(nameValue), { shouldDirty: false })
    }
  }, [isNew, nameValue, setValue])

  const saveMutation = useMutation({
    mutationFn: async (values: DestinationFormValues) => {
      const { seo_title, seo_description, ...rest } = values

      const statusUpper = (values.status || 'DRAFT').toUpperCase().trim()

      const payload = {
        ...rest,
        status: statusUpper,
        things_to_do: things,
        faqs,
        seo: seo_title || seo_description ? { title: seo_title, description: seo_description } : null,
        created_by: admin?.id ?? null,
        updated_by: admin?.id ?? null,
      }

      if (isNew) {
        return createDestination(payload as Parameters<typeof createDestination>[0])
      }
      return updateDestination(id, payload)
    },
    onSuccess: (dest) => {
      qc.invalidateQueries({ queryKey: ['destinations'] })
      qc.invalidateQueries({ queryKey: ['destination', id] })
      toast.success(isNew ? 'Destination created successfully!' : 'Destination updated!')
      if (isNew) navigate({ to: '/admin/destinations/$id', params: { id: dest.id } })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const onSubmit = (values: DestinationFormValues) => saveMutation.mutate(values)

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
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/admin/destinations' })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold font-poppins">
            {isNew ? 'New Destination' : `Edit: ${destination?.name ?? '...'}`}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isNew ? 'Fill in the details to create a new destination' : 'Update destination information'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <a href={`/destinations/${slugValue}`} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Eye className="h-4 w-4" /> Preview
              </Button>
            </a>
          )}
          <Button
            onClick={handleSubmit(onSubmit, onInvalid)}
            disabled={saveMutation.isPending}
            className="gap-1.5"
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

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="seo">SEO & Settings</TabsTrigger>
          </TabsList>

          {/* ==================== BASIC ==================== */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Globe className="h-4 w-4" /> Destination Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Name *</Label>
                    <Input {...register('name')} placeholder="e.g., Manali" />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>URL Slug *</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">destinations/</span>
                      <Input {...register('slug')} placeholder="manali" className="font-mono" />
                    </div>
                    {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Subtitle</Label>
                  <Input {...register('subtitle')} placeholder="e.g., The Valley of the Gods" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>State / Province</Label>
                    <Input {...register('state')} placeholder="e.g., Himachal Pradesh" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Region</Label>
                    <Input {...register('region')} placeholder="e.g., Himalayas" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Country</Label>
                    <Input {...register('country')} placeholder="India" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5">
                      <Mountain className="h-3.5 w-3.5" /> Altitude
                    </Label>
                    <Input {...register('altitude')} placeholder="e.g., 2,050m above sea level" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> Best Time to Visit
                    </Label>
                    <Input {...register('best_time')} placeholder="e.g., March to June" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> Google Maps URL
                  </Label>
                  <Input {...register('google_map_url')} placeholder="https://maps.google.com/..." />
                </div>
              </CardContent>
            </Card>

            {/* Things To Do */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  Things To Do
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setThings([...things, { title: '', description: '', icon: '' }])}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Activity
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {things.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No activities added yet.</p>
                )}
                {things.map((thing, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 border rounded-lg bg-muted/20">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <Input
                        value={thing.title}
                        onChange={(e) => setThings(things.map((t, j) => j === i ? { ...t, title: e.target.value } : t))}
                        placeholder="Activity name"
                      />
                      <Input
                        value={thing.description ?? ''}
                        onChange={(e) => setThings(things.map((t, j) => j === i ? { ...t, description: e.target.value } : t))}
                        placeholder="Short description"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setThings(things.filter((_, j) => j !== i))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* FAQs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
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
                {faqs.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No FAQs added yet.</p>
                )}
                {faqs.map((faq, i) => (
                  <div key={i} className="p-3 border rounded-lg bg-muted/20 space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-2">
                        <Input
                          value={faq.question}
                          onChange={(e) => setFaqs(faqs.map((f, j) => j === i ? { ...f, question: e.target.value } : f))}
                          placeholder="Question"
                        />
                        <Textarea
                          value={faq.answer}
                          onChange={(e) => setFaqs(faqs.map((f, j) => j === i ? { ...f, answer: e.target.value } : f))}
                          placeholder="Answer"
                          rows={2}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive mt-1"
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

          {/* ==================== CONTENT ==================== */}
          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Descriptions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Short Description (shown on cards)</Label>
                  <Textarea
                    {...register('short_description')}
                    placeholder="2-3 sentence teaser shown on destination cards..."
                    rows={3}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Full Description (destination page)</Label>
                  <Textarea
                    {...register('description')}
                    placeholder="Comprehensive description of the destination..."
                    rows={8}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== MEDIA ==================== */}
          <TabsContent value="media" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-6">
                <ImageField
                  label="Hero Image"
                  value={watch('hero_image') ?? ''}
                  onChange={(url) => setValue('hero_image', url, { shouldDirty: true })}
                  folder="/destinations"
                />
                <div className="space-y-1.5">
                  <Label>Hero Video URL (optional)</Label>
                  <Input
                    {...register('hero_video')}
                    placeholder="https://youtube.com/... or direct MP4 URL"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== SEO & SETTINGS ==================== */}
          <TabsContent value="seo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">SEO Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>SEO Title</Label>
                  <Input
                    {...register('seo_title')}
                    placeholder="Manali Travel Guide — Best Time, Things To Do & How To Reach"
                    maxLength={70}
                  />
                  <p className="text-xs text-muted-foreground">Recommended: 50–70 characters</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Meta Description</Label>
                  <Textarea
                    {...register('seo_description')}
                    placeholder="Discover Manali, the Valley of Gods. Best time to visit, places to explore, hotels & complete travel guide..."
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground">Recommended: 120–160 characters</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Publishing Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Status</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Control visibility on the website</p>
                  </div>
                  <Select
                    value={watch('status')}
                    onValueChange={(v) => setValue('status', v as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED', { shouldDirty: true })}
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
                  <div>
                    <Label>Featured Destination</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Show in homepage featured section</p>
                  </div>
                  <Switch
                    checked={watch('is_featured')}
                    onCheckedChange={(v) => setValue('is_featured', v, { shouldDirty: true })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Display Priority</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Higher = shown first</p>
                  </div>
                  <Input
                    type="number"
                    className="w-24 text-center"
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
