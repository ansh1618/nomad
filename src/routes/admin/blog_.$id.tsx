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
import { ImageField } from '@/components/admin/MediaPicker'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Save,
  Loader2,
  FileText,
  Eye,
} from 'lucide-react'
import { getBlogById, createBlog, updateBlog } from '@/lib/queries/admin'
import { useAdminAuth } from '@/hooks/use-admin-auth'

export const Route = createFileRoute('/admin/blog_/$id')({
  component: BlogFormPage,
})

const blogSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  slug: z.string().min(2, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes'),
  excerpt: z.string().optional(),
  content: z.string().min(10, 'Content is required'),
  featured_image: z.string().optional(),
  is_published: z.boolean().default(false),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
})

type BlogFormValues = z.infer<typeof blogSchema>

function BlogFormPage() {
  const { id } = Route.useParams()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { admin } = useAdminAuth()

  const { data: blog, isLoading: loadingData } = useQuery({
    queryKey: ['blog', id],
    queryFn: () => getBlogById(id),
    enabled: !isNew,
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      is_published: false,
    },
  })

  // Load existing data
  useEffect(() => {
    if (blog) {
      reset({
        title: blog.title,
        slug: blog.slug,
        excerpt: blog.excerpt ?? '',
        content: blog.content,
        featured_image: blog.featured_image ?? '',
        is_published: blog.is_published,
        seo_title: blog.seo?.title ?? '',
        seo_description: blog.seo?.description ?? '',
      })
    }
  }, [blog, reset])

  // Slug generator
  const titleValue = watch('title')
  useEffect(() => {
    if (isNew && titleValue) {
      setValue('slug', titleValue.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim())
    }
  }, [isNew, titleValue, setValue])

  const saveMutation = useMutation({
    mutationFn: async (values: BlogFormValues) => {
      const { seo_title, seo_description, ...rest } = values
      const payload = {
        ...rest,
        seo: seo_title || seo_description ? { title: seo_title, description: seo_description } : null,
        author_id: admin?.id ?? null,
      }

      if (isNew) {
        return createBlog(payload as Parameters<typeof createBlog>[0])
      }
      return updateBlog(id, payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blogs_list'] })
      qc.invalidateQueries({ queryKey: ['blog', id] })
      toast.success(isNew ? 'Blog post published!' : 'Blog post updated!')
      navigate({ to: '/admin/blog' })
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

  const slugValue = watch('slug')

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/admin/blog' })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold font-poppins">
            {isNew ? 'Write Blog Post' : `Edit: ${blog?.title ?? '...'}`}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <a href={`/blog/${slugValue}`} target="_blank" rel="noreferrer">
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
            Save Post
          </Button>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit((v) => saveMutation.mutate(v), onInvalid)} className="space-y-6">
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Article Details</TabsTrigger>
            <TabsTrigger value="content">Content Body</TabsTrigger>
            <TabsTrigger value="seo">SEO Metadata</TabsTrigger>
          </TabsList>

          {/* BASIC */}
          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Article Title *</Label>
                    <Input {...register('title')} placeholder="e.g. Best Travel Spots in Jibhi" />
                    {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Slug URL *</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">blog/</span>
                      <Input {...register('slug')} placeholder="travel-spots-jibhi" className="font-mono" />
                    </div>
                    {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Excerpt / Summary</Label>
                  <Textarea {...register('excerpt')} placeholder="A short 1-2 sentence description shown in blog grid cards..." rows={3} />
                </div>

                <ImageField
                  label="Featured Image"
                  value={watch('featured_image') ?? ''}
                  onChange={(url) => setValue('featured_image', url)}
                  folder="/blogs"
                />

                <div className="flex items-center justify-between border-t pt-4">
                  <div>
                    <Label>Publish Post</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Allow public visitors to view this article</p>
                  </div>
                  <Switch
                    checked={watch('is_published')}
                    onCheckedChange={(v) => setValue('is_published', v, { shouldDirty: true })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONTENT */}
          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label>Markdown Body *</Label>
                  <Textarea
                    {...register('content')}
                    placeholder="Write your article in Markdown syntax..."
                    rows={15}
                    className="font-mono text-sm leading-relaxed"
                  />
                  {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO */}
          <TabsContent value="seo" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label>SEO Title</Label>
                  <Input {...register('seo_title')} placeholder="Google search result title tag..." maxLength={70} />
                </div>
                <div className="space-y-1.5">
                  <Label>Meta Description</Label>
                  <Textarea {...register('seo_description')} placeholder="Compelling search results description..." rows={4} maxLength={160} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  )
}
