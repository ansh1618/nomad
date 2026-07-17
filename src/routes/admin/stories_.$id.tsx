import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState, useRef } from 'react'
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
  Eye,
  BookOpen,
  Star,
  Plus,
  Trash2,
  GripVertical,
  Globe,
  EyeOff,
  Calendar,
  User,
  Building2,
  Image as ImageIcon,
} from 'lucide-react'
import {
  getStoryById,
  createStory,
  updateStory,
  publishStory,
  unpublishStory,
} from '@/lib/queries/stories'
import { getPublishedDestinations } from '@/lib/queries/destinations'
import { getPackages } from '@/lib/queries/packages'
import { useAdminAuth } from '@/hooks/use-admin-auth'
import { Badge } from '@/components/ui/badge'
import { ImageField, MediaPicker } from '@/components/admin/MediaPicker'
import type { MediaAsset } from '@/types/supabase'

export const Route = createFileRoute('/admin/stories_/$id')({
  component: StoryFormPage,
})

const STORY_CATEGORIES = [
  'Adventure', 'Weekend', 'Spiritual', 'Budget', 'College',
  'Solo', 'Group', 'Family', 'International',
]

const storySchema = z.object({
  title: z.string().min(2, 'Title is required'),
  slug: z.string().min(2, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with dashes only'),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  cover_image: z.string().optional(),
  author_name: z.string().optional(),
  author_image: z.string().optional(),
  author_designation: z.string().optional(),
  college_name: z.string().optional(),
  package_id: z.string().optional(),
  destination_id: z.string().optional(),
  category: z.string().default('Adventure'),
  rating: z.preprocess((v) => {
    if (v === '' || v === null || v === undefined) return null
    const n = Number(v)
    return isNaN(n) ? null : n
  }, z.number().min(1).max(5).nullable().optional()),
  trip_date: z.string().optional(),
  reading_time: z.preprocess((v) => {
    if (v === '' || v === null || v === undefined) return 5
    const n = Number(v)
    return isNaN(n) ? 5 : n
  }, z.number().int().min(1).default(5)),
  is_published: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
})

type StoryFormValues = z.infer<typeof storySchema>

function StoryFormPage() {
  const { id } = Route.useParams()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { admin } = useAdminAuth()
  const contentRef = useRef<HTMLTextAreaElement>(null)

  const [gallery, setGallery] = useState<string[]>([])
  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false)

  const { data: story, isLoading: loadingData } = useQuery({
    queryKey: ['story', id],
    queryFn: () => getStoryById(id),
    enabled: !isNew,
  })

  const { data: destinations = [] } = useQuery({
    queryKey: ['destinations_dropdown'],
    queryFn: getPublishedDestinations,
  })

  const { data: packagesResult } = useQuery({
    queryKey: ['packages_dropdown'],
    queryFn: () => getPackages({ pageSize: 200, status: 'PUBLISHED' }),
  })
  const packages = packagesResult?.data ?? []

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<StoryFormValues>({
    resolver: zodResolver(storySchema) as any,
    defaultValues: {
      is_published: false,
      is_featured: false,
      category: 'Adventure',
      reading_time: 5,
    },
  })

  // Load data on edit
  useEffect(() => {
    if (story) {
      reset({
        title: story.title,
        slug: story.slug,
        excerpt: story.excerpt ?? '',
        content: story.content ?? '',
        cover_image: story.cover_image ?? '',
        author_name: story.author_name ?? '',
        author_image: story.author_image ?? '',
        author_designation: story.author_designation ?? '',
        college_name: story.college_name ?? '',
        package_id: story.package_id ?? '',
        destination_id: story.destination_id ?? '',
        category: story.category || 'Adventure',
        rating: story.rating ?? undefined,
        trip_date: story.trip_date ?? '',
        reading_time: story.reading_time || 5,
        is_published: story.is_published,
        is_featured: story.is_featured,
        seo_title: story.seo_title ?? '',
        seo_description: story.seo_description ?? '',
      })
      setGallery(story.gallery || [])
    }
  }, [story, reset])

  // Auto slug from title
  const titleValue = watch('title')
  useEffect(() => {
    if (isNew && titleValue) {
      setValue('slug', titleValue.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim())
    }
  }, [isNew, titleValue, setValue])

  // Auto reading time from content
  const contentValue = watch('content')
  useEffect(() => {
    if (contentValue) {
      const words = contentValue.trim().split(/\s+/).length
      const time = Math.max(1, Math.ceil(words / 200))
      setValue('reading_time', time)
    }
  }, [contentValue, setValue])

  const saveMutation = useMutation({
    mutationFn: async (values: StoryFormValues) => {
      const { seo_title, seo_description, package_id, destination_id, ...rest } = values
      const payload = {
        ...rest,
        gallery,
        package_id: package_id && package_id !== 'none' ? package_id : null,
        destination_id: destination_id && destination_id !== 'none' ? destination_id : null,
        seo_title: seo_title || null,
        seo_description: seo_description || null,
        created_by: admin?.id ?? null,
        updated_by: admin?.id ?? null,
        published_at: values.is_published ? (story?.published_at ?? new Date().toISOString()) : null,
        rating: values.rating ?? null,
      }

      if (isNew) return createStory(payload as any)
      return updateStory(id, payload as any)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stories_list'] })
      qc.invalidateQueries({ queryKey: ['story', id] })
      qc.invalidateQueries({ queryKey: ['story_stats'] })
      toast.success(isNew ? 'Story created successfully!' : 'Story updated successfully!')
      if (isNew) navigate({ to: '/admin/stories' })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const publishMutation = useMutation({
    mutationFn: () => publishStory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['story', id] })
      qc.invalidateQueries({ queryKey: ['stories_list'] })
      toast.success('Story published!')
      setValue('is_published', true)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const unpublishMutation = useMutation({
    mutationFn: () => unpublishStory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['story', id] })
      qc.invalidateQueries({ queryKey: ['stories_list'] })
      toast.success('Story unpublished')
      setValue('is_published', false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const onInvalid = (errs: any) => {
    const first = Object.entries(errs)[0]
    if (first) {
      const [field, err] = first
      toast.error(`${field}: ${(err as any)?.message}`)
    } else {
      toast.error('Please fix form errors.')
    }
  }

  const insertMarkdown = (wrap: string) => {
    const el = contentRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = el.value.substring(start, end)
    const before = el.value.substring(0, start)
    const after = el.value.substring(end)
    const newVal = `${before}${wrap}${selected || 'text'}${wrap}${after}`
    setValue('content', newVal)
    setTimeout(() => { el.focus(); el.setSelectionRange(start + wrap.length, start + wrap.length + (selected || 'text').length) }, 0)
  }

  const insertBlock = (prefix: string) => {
    const el = contentRef.current
    if (!el) return
    const pos = el.selectionStart
    const before = el.value.substring(0, pos)
    const after = el.value.substring(pos)
    const newVal = `${before}\n\n${prefix} `
    setValue('content', newVal)
    setTimeout(() => { el.focus(); el.setSelectionRange(newVal.length, newVal.length) }, 0)
  }

  if (!isNew && loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  const slugValue = watch('slug')
  const isPublished = watch('is_published')
  const isFeatured = watch('is_featured')

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/admin/stories' })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold font-poppins flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {isNew ? 'Create Traveler Story' : `Edit: ${story?.title ?? '...'}`}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={isPublished ? 'default' : 'secondary'}>
              {isPublished ? 'Published' : 'Draft'}
            </Badge>
            {isFeatured && (
              <Badge className="bg-amber-500/15 text-amber-700 border-amber-200 text-[10px]">
                <Star className="h-2.5 w-2.5 mr-1" />Featured
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && story?.is_published && (
            <a href={`/stories/${slugValue}`} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Eye className="h-4 w-4" /> Preview
              </Button>
            </a>
          )}
          {!isNew && (
            story?.is_published ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => unpublishMutation.mutate()}
                disabled={unpublishMutation.isPending}
              >
                {unpublishMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <EyeOff className="h-4 w-4" />}
                Unpublish
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-emerald-600 border-emerald-300"
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending}
              >
                {publishMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                Publish
              </Button>
            )
          )}
          <Button
            onClick={handleSubmit((v) => saveMutation.mutate(v as any), onInvalid)}
            disabled={saveMutation.isPending}
            className="gap-1.5"
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isNew ? 'Save Story' : 'Update Story'}
          </Button>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* ========== BASIC INFO ========== */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Story Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Story Title *</Label>
                <Input {...register('title')} placeholder="e.g., My Solo Trip to Varanasi Changed Everything" className="text-base" />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>URL Slug *</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">stories/</span>
                    <Input {...register('slug')} placeholder="my-varanasi-story" className="font-mono" />
                  </div>
                  {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select
                    value={watch('category') ?? 'Adventure'}
                    onValueChange={(v) => setValue('category', v, { shouldDirty: true })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STORY_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Short Excerpt</Label>
                <Textarea
                  {...register('excerpt')}
                  placeholder="A short compelling summary shown on story cards (2-3 sentences max)..."
                  rows={3}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Cover Image</Label>
                <ImageField
                  value={watch('cover_image') ?? ''}
                  onChange={(url) => setValue('cover_image', url, { shouldDirty: true })}
                  label="Cover Image"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" />Author Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Author Name</Label>
                  <Input {...register('author_name')} placeholder="Priya Sharma" />
                </div>
                <div className="space-y-1.5">
                  <Label>Author Designation</Label>
                  <Input {...register('author_designation')} placeholder="Solo Traveler, Travel Blogger" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />College / Company</Label>
                  <Input {...register('college_name')} placeholder="Delhi University" />
                </div>
                <div className="space-y-1.5">
                  <Label>Author Photo URL</Label>
                  <ImageField
                    value={watch('author_image') ?? ''}
                    onChange={(url) => setValue('author_image', url, { shouldDirty: true })}
                    label="Author Photo"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4" />Trip Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Trip Date</Label>
                  <Input type="date" {...register('trip_date')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Rating (1–5)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.5"
                      min={1}
                      max={5}
                      {...register('rating')}
                      placeholder="4.5"
                    />
                    <Star className="h-4 w-4 text-amber-400 shrink-0" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Reading Time (min)</Label>
                  <Input type="number" {...register('reading_time')} min={1} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Package & Destination</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground font-poppins">
                Link this story to a package so it automatically appears on that package's "Traveler Stories" section.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Linked Package</Label>
                  <Select
                    value={watch('package_id') ?? ''}
                    onValueChange={(v) => setValue('package_id', v, { shouldDirty: true })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select a package (optional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {packages.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Linked Destination</Label>
                  <Select
                    value={watch('destination_id') ?? ''}
                    onValueChange={(v) => setValue('destination_id', v, { shouldDirty: true })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select a destination (optional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {destinations.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== CONTENT ========== */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Story Content</CardTitle>
              <p className="text-xs text-muted-foreground">Write the full story using Markdown. Use the toolbar shortcuts to insert formatting.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-1 p-2 bg-muted/40 rounded-lg border border-border">
                <Button type="button" size="sm" variant="ghost" className="h-7 text-xs px-2 font-bold" onClick={() => insertBlock('#')}>H1</Button>
                <Button type="button" size="sm" variant="ghost" className="h-7 text-xs px-2 font-bold" onClick={() => insertBlock('##')}>H2</Button>
                <Button type="button" size="sm" variant="ghost" className="h-7 text-xs px-2 font-bold" onClick={() => insertBlock('###')}>H3</Button>
                <div className="w-px h-5 bg-border mx-1" />
                <Button type="button" size="sm" variant="ghost" className="h-7 text-xs px-2 font-bold" onClick={() => insertMarkdown('**')}>B</Button>
                <Button type="button" size="sm" variant="ghost" className="h-7 text-xs px-2 italic" onClick={() => insertMarkdown('_')}>I</Button>
                <Button type="button" size="sm" variant="ghost" className="h-7 text-xs px-2 line-through" onClick={() => insertMarkdown('~~')}>S</Button>
                <div className="w-px h-5 bg-border mx-1" />
                <Button type="button" size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => insertBlock('-')}>• List</Button>
                <Button type="button" size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => insertBlock('1.')}>1. List</Button>
                <Button type="button" size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => insertBlock('>')}>Quote</Button>
                <Button type="button" size="sm" variant="ghost" className="h-7 text-xs px-2 font-mono" onClick={() => insertMarkdown('`')}>Code</Button>
                <Button type="button" size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => { const el = contentRef.current; if (!el) return; const pos = el.selectionStart; const before = el.value.substring(0, pos); setValue('content', `${before}\n\n---\n\n`); }}>—</Button>
              </div>

              <Textarea
                {...register('content')}
                ref={(el) => {
                  (register('content') as any).ref(el)
                  ;(contentRef as any).current = el
                }}
                placeholder="Write the full story here using Markdown...

# My Journey to Varanasi

It was 4 AM when our Nomadik convoy rolled into the ancient city...

## Day 1: Arrival at the Ghats

The first sight of the Ganges in the early morning light was..."
                rows={30}
                className="font-mono text-sm leading-relaxed resize-none"
              />

              <div className="flex items-center justify-between text-xs text-muted-foreground font-poppins px-1">
                <span>{(watch('content') || '').split(/\s+/).filter(Boolean).length} words</span>
                <span>~{watch('reading_time')} min read (auto-calculated)</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== GALLERY ========== */}
        <TabsContent value="gallery" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" /> Story Gallery
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Add photos from the trip. These appear in a sliding gallery on the story page.</p>
                </div>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setGalleryPickerOpen(true)}>
                  <Plus className="h-4 w-4" /> Add Images
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {gallery.length === 0 ? (
                <div
                  className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setGalleryPickerOpen(true)}
                >
                  <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-poppins">Click to add gallery images</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">These will appear in a beautiful slider on the story page</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {gallery.map((url, i) => (
                    <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border border-border">
                      <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <GripVertical className="h-4 w-4 text-white" />
                        <button
                          type="button"
                          onClick={() => setGallery(gallery.filter((_, idx) => idx !== i))}
                          className="p-1.5 bg-destructive rounded-full text-white hover:bg-destructive/80 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setGalleryPickerOpen(true)}
                    className="aspect-square rounded-xl border-2 border-dashed border-border flex items-center justify-center hover:bg-muted/30 transition-colors"
                  >
                    <Plus className="h-6 w-6 text-muted-foreground" />
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== SEO ========== */}
        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">SEO Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>SEO Title</Label>
                <Input {...register('seo_title')} placeholder="My Amazing Trip Story | Nomadik" />
                <p className="text-xs text-muted-foreground">{(watch('seo_title') || '').length}/60 chars recommended</p>
              </div>
              <div className="space-y-1.5">
                <Label>SEO Description</Label>
                <Textarea {...register('seo_description')} rows={3} placeholder="A compelling 155-char description for search engines..." />
                <p className="text-xs text-muted-foreground">{(watch('seo_description') || '').length}/155 chars recommended</p>
              </div>
              {/* Preview */}
              <div className="bg-muted/30 rounded-xl p-4 space-y-1 border border-border/50">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold font-poppins">SERP Preview</p>
                <p className="text-blue-600 text-sm font-medium truncate">
                  {watch('seo_title') || watch('title') || 'Story Title'}
                </p>
                <p className="text-[11px] text-emerald-700">nomadik.in › stories › {watch('slug') || 'story-slug'}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {watch('seo_description') || watch('excerpt') || 'Story description will appear here...'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== SETTINGS ========== */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Publishing Settings</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold">Publish Story</Label>
                  <p className="text-xs text-muted-foreground">Make this story visible on the public website</p>
                </div>
                <Switch
                  checked={watch('is_published')}
                  onCheckedChange={(v) => setValue('is_published', v, { shouldDirty: true })}
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50/50 border border-amber-100">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-amber-500" /> Feature This Story
                  </Label>
                  <p className="text-xs text-muted-foreground">Show as the hero featured story on the Stories landing page</p>
                </div>
                <Switch
                  checked={watch('is_featured')}
                  onCheckedChange={(v) => setValue('is_featured', v, { shouldDirty: true })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Gallery MediaPicker */}
      <MediaPicker
        open={galleryPickerOpen}
        onClose={() => setGalleryPickerOpen(false)}
        onSelect={(asset: MediaAsset) => {
          if (asset.url && !gallery.includes(asset.url)) {
            setGallery((prev) => [...prev, asset.url])
          }
          setGalleryPickerOpen(false)
        }}
        accept="image"
      />
    </div>
  )
}
