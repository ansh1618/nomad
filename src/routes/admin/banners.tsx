import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ImageField } from '@/components/admin/MediaPicker'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Edit,
  Save,
  Loader2,
  Tv,
  Eye,
  Link as LinkIcon,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/admin/banners')({
  component: BannersPage,
})

const bannerSchema = z.object({
  placement: z.string(),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  subtitle: z.string().optional(),
  image_url: z.string().min(1, 'Image is required'),
  cta_text: z.string().optional(),
  cta_link: z.string().optional(),
  is_active: z.boolean().default(true),
  display_order: z.number().default(0),
})

type BannerValues = z.infer<typeof bannerSchema>

function BannersPage() {
  const qc = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState('')

  const { data: banners, isLoading } = useQuery({
    queryKey: ['homepage_banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('display_order', { ascending: true })
      if (error) throw error
      return data || []
    },
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<BannerValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      placement: 'HERO',
      is_active: true,
      display_order: 0,
    },
  })

  // Watch placement to customize form placeholders
  const placementVal = watch('placement')

  useEffect(() => {
    if (isOpen) {
      if (editingId) {
        const item = banners?.find((b) => b.id === editingId)
        if (item) {
          reset({
            placement: item.placement,
            title: item.title ?? '',
            subtitle: item.subtitle ?? '',
            image_url: item.image_url ?? '',
            cta_text: item.cta_text ?? '',
            cta_link: item.cta_link ?? '',
            is_active: item.is_active ?? true,
            display_order: item.display_order ?? 0,
          })
          setImageUrl(item.image_url ?? '')
        }
      } else {
        reset({
          placement: 'HERO',
          title: '',
          subtitle: '',
          image_url: '',
          cta_text: '',
          cta_link: '',
          is_active: true,
          display_order: 0,
        })
        setImageUrl('')
      }
    }
  }, [isOpen, editingId, banners, reset])

  const saveMutation = useMutation({
    mutationFn: async (values: BannerValues) => {
      const payload = {
        ...values,
        image_url: imageUrl,
      }
      if (editingId) {
        const { error } = await supabase
          .from('banners')
          .update(payload)
          .eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('banners')
          .insert([payload])
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['homepage_banners'] })
      toast.success(editingId ? 'Banner updated successfully' : 'Banner created successfully')
      setIsOpen(false)
      setEditingId(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('banners').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['homepage_banners'] })
      toast.success('Banner deleted')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold font-poppins text-foreground">Homepage CMS Blocks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure announcement banners, home page sliders, promotion cards, and active highlights.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null)
            setIsOpen(true)
          }}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" /> Add Block / Banner
        </Button>
      </motion.div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !banners || banners.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground bg-white border rounded-xl shadow-soft">
          No banners or homepage blocks configured yet. Configure one above.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((b) => (
            <Card key={b.id} className="overflow-hidden group hover:shadow-soft transition-all duration-300">
              <div className="h-44 relative bg-muted border-b overflow-hidden">
                {b.image_url ? (
                  <img src={b.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Tv className="h-8 w-8" />
                  </div>
                )}
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <Badge className="bg-primary text-primary-foreground font-poppins text-[10px] tracking-wider uppercase">
                    {b.placement}
                  </Badge>
                  {!b.is_active && (
                    <Badge variant="secondary" className="text-[10px]">
                      Draft
                    </Badge>
                  )}
                </div>
                <div className="absolute top-3 right-3 bg-black/60 text-white rounded-full px-2 py-0.5 text-[10px] font-mono">
                  Order: {b.display_order}
                </div>
              </div>
              <CardContent className="p-4 space-y-4">
                <div>
                  <h3 className="font-bold text-base text-primary line-clamp-1">{b.title}</h3>
                  {b.subtitle && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{b.subtitle}</p>}
                </div>

                <div className="flex items-center justify-between pt-3 border-t text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground font-mono truncate max-w-[200px]">
                    <LinkIcon className="h-3.5 w-3.5" />
                    <span>{b.cta_link || 'No CTA Link'}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingId(b.id)
                        setIsOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4 text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => {
                        if (confirm('Delete this banner configuration permanently?')) {
                          deleteMutation.mutate(b.id)
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto flex flex-col p-0">
          <DialogHeader className="p-6 bg-muted/30 border-b">
            <DialogTitle className="font-poppins">{editingId ? 'Edit Block / Banner' : 'Create Block / Banner'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="p-6 space-y-4 flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Placement Type</Label>
                <Select
                  value={watch('placement')}
                  onValueChange={(v) => setValue('placement', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HERO">Homepage Hero</SelectItem>
                    <SelectItem value="OFFER">Special Offer Section</SelectItem>
                    <SelectItem value="POPUP">Popup modal window</SelectItem>
                    <SelectItem value="ANNOUNCEMENT">Announcement Ticker</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Display Order</Label>
                <Input
                  type="number"
                  {...register('display_order', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Headline / Title *</Label>
              <Input
                {...register('title')}
                placeholder={placementVal === 'ANNOUNCEMENT' ? 'e.g. Save flat 10% on pre-bookings' : 'e.g. Early Bird Discounts'}
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Subtitle / Description</Label>
              <Input
                {...register('subtitle')}
                placeholder="Brief helper sub-copy or details..."
              />
            </div>

            <ImageField
              label="Banner / Graphic Image"
              value={imageUrl}
              onChange={setImageUrl}
              folder="/banners"
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>CTA Link</Label>
                <Input
                  {...register('cta_link')}
                  placeholder="/journeys/jibhi"
                />
              </div>
              <div className="space-y-1.5">
                <Label>CTA Button Text</Label>
                <Input
                  {...register('cta_text')}
                  placeholder="Explore Now"
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <Label>Active Status</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Render this banner block visible on public site</p>
              </div>
              <Switch
                checked={watch('is_active')}
                onCheckedChange={(v) => setValue('is_active', v)}
              />
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending} className="gap-1.5">
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Configurations
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
