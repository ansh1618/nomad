import { useState, useEffect, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'motion/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { ImageField } from '@/components/admin/MediaPicker'
import { uploadMedia } from '@/lib/queries/admin'
import { useAdminAuth } from '@/hooks/use-admin-auth'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Save,
  Video,
  Play,
  Pause,
  Upload,
  Loader2,
  ExternalLink,
  Instagram,
  ArrowUp,
  ArrowDown,
  Eye,
  Settings,
  Sparkles,
  MapPin,
  Compass,
  CheckCircle,
  Copy,
  Layers,
  LayoutGrid,
  Smartphone,
  Monitor,
} from 'lucide-react'
import {
  getHeroVideoGallery,
  getHeroVideoSettings,
  upsertHeroVideoCard,
  deleteHeroVideoCard,
  reorderHeroVideoCards,
  updateHeroVideoSettings,
  HeroVideoCard,
  HeroVideoSettings,
  DEFAULT_HERO_SETTINGS,
} from '@/lib/queries/hero-videos'

export function HeroVideosEditor() {
  const qc = useQueryClient()
  const { admin } = useAdminAuth()

  // Queries
  const { data: cards = [], isLoading: isLoadingCards } = useQuery({
    queryKey: ['hero_video_gallery'],
    queryFn: getHeroVideoGallery,
  })

  const { data: settings = DEFAULT_HERO_SETTINGS, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['hero_video_settings'],
    queryFn: getHeroVideoSettings,
  })

  // Local state for global settings form
  const [formSettings, setFormSettings] = useState<HeroVideoSettings>(DEFAULT_HERO_SETTINGS)
  useEffect(() => {
    if (settings) {
      setFormSettings(settings)
    }
  }, [settings])

  // Card modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<Partial<HeroVideoCard> | null>(null)
  const [videoUploadLoading, setVideoUploadLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Video preview player modal
  const [previewCard, setPreviewCard] = useState<HeroVideoCard | null>(null)

  // ----------------------------------------------------
  // MUTATIONS
  // ----------------------------------------------------
  const saveCardMutation = useMutation({
    mutationFn: async (card: Partial<HeroVideoCard> & { title: string; video_url: string }) => {
      return upsertHeroVideoCard(card)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hero_video_gallery'] })
      qc.invalidateQueries({ queryKey: ['cms', 'hero'] })
      toast.success('Video card saved successfully')
      setIsModalOpen(false)
      setEditingCard(null)
    },
    onError: (err: any) => {
      toast.error(`Failed to save card: ${err.message}`)
    },
  })

  const deleteCardMutation = useMutation({
    mutationFn: async (id: string) => {
      return deleteHeroVideoCard(id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hero_video_gallery'] })
      qc.invalidateQueries({ queryKey: ['cms', 'hero'] })
      toast.success('Video card deleted')
    },
    onError: (err: any) => {
      toast.error(`Failed to delete card: ${err.message}`)
    },
  })

  const reorderMutation = useMutation({
    mutationFn: async (orderedList: HeroVideoCard[]) => {
      return reorderHeroVideoCards(orderedList)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hero_video_gallery'] })
      toast.success('Order updated')
    },
    onError: (err: any) => {
      toast.error(`Failed to update order: ${err.message}`)
    },
  })

  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: HeroVideoSettings) => {
      return updateHeroVideoSettings(newSettings)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hero_video_settings'] })
      qc.invalidateQueries({ queryKey: ['cms', 'hero'] })
      toast.success('Hero section settings saved')
    },
    onError: (err: any) => {
      toast.error(`Failed to save settings: ${err.message}`)
    },
  })

  // ----------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------
  const handleOpenAdd = () => {
    setEditingCard({
      id: crypto.randomUUID(),
      title: '',
      destination_name: '',
      instagram_url: '',
      video_url: '',
      thumbnail_url: '',
      caption: '',
      cta_url: '/destinations',
      card_size: 'medium',
      layout_position: 'center',
      display_order: cards.length,
      is_active: true,
      autoplay: true,
      loop: true,
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (card: HeroVideoCard) => {
    setEditingCard({ ...card })
    setIsModalOpen(true)
  }

  const handleToggleCardActive = (card: HeroVideoCard) => {
    saveCardMutation.mutate({
      ...card,
      is_active: !card.is_active,
    })
  }

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newCards = [...cards]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newCards.length) return

    const temp = newCards[index]
    newCards[index] = newCards[targetIndex]
    newCards[targetIndex] = temp

    reorderMutation.mutate(newCards)
  }

  const handleDirectVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const file = files[0]

    // Validate size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Video file size exceeds 50MB. Please use an optimized compressed MP4.')
      return
    }

    setVideoUploadLoading(true)
    try {
      const adminId = admin?.id || 'admin'
      const asset = await uploadMedia(file, '/hero-videos', adminId)
      if (asset && asset.url) {
        setEditingCard((prev) => (prev ? { ...prev, video_url: asset.url } : null))
        toast.success(`Video uploaded successfully (${file.name})`)
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload video')
    } finally {
      setVideoUploadLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCard?.title?.trim()) {
      toast.error('Please enter a card title')
      return
    }
    if (!editingCard?.video_url?.trim()) {
      toast.error('Please provide a direct video URL or upload an MP4')
      return
    }
    saveCardMutation.mutate(editingCard as any)
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2 text-muted-foreground">
                <Link to="/admin/website">
                  <ArrowLeft className="h-4 w-4" />
                  Website Builder
                </Link>
              </Button>
              <Badge variant="outline" className="border-amber-500/30 text-amber-600 bg-amber-50/50">
                Homepage Hero
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
              <Video className="h-8 w-8 text-amber-500" />
              Hero Video Gallery
            </h1>
            <p className="text-sm text-slate-500">
              Manage the dynamic floating video collage cards, autoplay behavior, destination tags, and global hero section layout.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-2"
            >
              <a href="/#home" target="_blank" rel="noopener noreferrer">
                <Eye className="h-4 w-4" />
                Live Preview
              </a>
            </Button>
            <Button
              onClick={handleOpenAdd}
              size="sm"
              className="gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add Video Card
            </Button>
          </div>
        </div>

        {/* Tabs: Video Cards vs Hero Section Settings */}
        <Tabs defaultValue="cards" className="space-y-6">
          <TabsList className="bg-white border p-1 rounded-xl shadow-xs">
            <TabsTrigger value="cards" className="gap-2 px-4 py-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-lg">
              <Layers className="h-4 w-4" />
              Video Cards ({cards.length})
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 px-4 py-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-lg">
              <Settings className="h-4 w-4" />
              Global Hero Settings
            </TabsTrigger>
          </TabsList>

          {/* ==================================================== */}
          {/* TAB 1: VIDEO CARDS CMS */}
          {/* ==================================================== */}
          <TabsContent value="cards" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cards.map((card, idx) => (
                <Card
                  key={card.id}
                  className={`overflow-hidden border transition-all duration-200 hover:shadow-md ${
                    !card.is_active ? 'opacity-60 bg-slate-50' : 'bg-white'
                  }`}
                >
                  {/* Video Thumbnail / Preview Header */}
                  <div className="relative aspect-video w-full bg-slate-900 overflow-hidden group">
                    {card.thumbnail_url ? (
                      <img
                        src={card.thumbnail_url}
                        alt={card.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-500">
                        <Video className="h-10 w-10 opacity-40" />
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Play preview button */}
                    <button
                      type="button"
                      onClick={() => setPreviewCard(card)}
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 text-white cursor-pointer"
                    >
                      <div className="h-12 w-12 rounded-full bg-amber-500/90 text-slate-950 flex items-center justify-center shadow-lg transition-transform transform hover:scale-110">
                        <Play className="h-6 w-6 fill-current ml-0.5" />
                      </div>
                    </button>

                    {/* Position & Size Badges */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <Badge className="bg-slate-900/80 text-white backdrop-blur-xs text-[10px] uppercase font-semibold">
                        #{idx + 1} • {card.card_size}
                      </Badge>
                      <Badge variant="outline" className="bg-black/50 text-white border-white/20 text-[10px] backdrop-blur-xs">
                        {card.layout_position}
                      </Badge>
                    </div>

                    {/* Active Status Badge */}
                    <div className="absolute top-2.5 right-2.5">
                      <Badge
                        className={`${
                          card.is_active
                            ? 'bg-emerald-500/90 text-white'
                            : 'bg-slate-600/90 text-slate-200'
                        } text-[10px] font-medium backdrop-blur-xs`}
                      >
                        {card.is_active ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>

                    {/* Destination Pill on Image */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs font-semibold text-amber-300 bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-xs">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate max-w-[160px]">{card.destination_name || 'Destination'}</span>
                      </div>
                      {card.instagram_url && (
                        <div className="text-white/80 hover:text-white p-1 rounded-full bg-black/50" title="Instagram Reel Linked">
                          <Instagram className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Content Details */}
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-slate-900 line-clamp-1 text-base">{card.title}</h3>
                      {card.caption && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {card.caption}
                        </p>
                      )}
                    </div>

                    {/* Media specs row */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-t pt-2.5">
                      <span className="flex items-center gap-1 font-mono truncate max-w-[180px]" title={card.video_url}>
                        <Video className="h-3 w-3 text-slate-400 shrink-0" />
                        {card.video_url.split('/').pop()}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {card.autoplay && <Badge variant="secondary" className="text-[9px] py-0 px-1">Autoplay</Badge>}
                        {card.loop && <Badge variant="secondary" className="text-[9px] py-0 px-1">Loop</Badge>}
                      </div>
                    </div>

                    {/* Actions & Reordering */}
                    <div className="flex items-center justify-between border-t pt-3">
                      {/* Move Up / Down */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-slate-900"
                          disabled={idx === 0 || reorderMutation.isPending}
                          onClick={() => handleMove(idx, 'up')}
                          title="Move card up"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-slate-900"
                          disabled={idx === cards.length - 1 || reorderMutation.isPending}
                          onClick={() => handleMove(idx, 'down')}
                          title="Move card down"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* Enable/Disable Toggle */}
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={card.is_active}
                          onCheckedChange={() => handleToggleCardActive(card)}
                          title="Toggle card visibility"
                        />

                        {/* Edit Button */}
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-slate-700 hover:bg-slate-100"
                          onClick={() => handleOpenEdit(card)}
                          title="Edit card"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>

                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => {
                            if (confirm(`Delete "${card.title}"?`)) {
                              deleteCardMutation.mutate(card.id)
                            }
                          }}
                          title="Delete card"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add New Card Slot */}
              <div
                onClick={handleOpenAdd}
                className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-amber-500 hover:bg-amber-50/20 transition-all min-h-[300px] text-center"
              >
                <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shadow-xs">
                  <Plus className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Add New Video Card</h4>
                  <p className="text-xs text-slate-500 max-w-[200px] mt-1">
                    Upload an MP4 or enter direct video URL to add a new card to the floating collage.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ==================================================== */}
          {/* TAB 2: GLOBAL HERO SECTION SETTINGS */}
          {/* ==================================================== */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="border bg-white shadow-xs">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-amber-500" />
                  Hero Section Global Controls
                </CardTitle>
                <CardDescription>
                  Configure global typography, CTAs, layout modes for desktop/mobile, and background video fallbacks.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 1. Visibility & Layout Mode */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-xl bg-slate-50 border">
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-900 flex items-center gap-2">
                      <Switch
                        checked={formSettings.is_enabled}
                        onCheckedChange={(checked) =>
                          setFormSettings((prev) => ({ ...prev, is_enabled: checked }))
                        }
                      />
                      Enable Video Gallery
                    </Label>
                    <p className="text-xs text-slate-500">
                      Toggle the interactive floating video collage on the homepage hero.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-900 flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-slate-600" />
                      Desktop Layout Mode
                    </Label>
                    <Select
                      value={formSettings.desktop_layout}
                      onValueChange={(val: any) =>
                        setFormSettings((prev) => ({ ...prev, desktop_layout: val }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="collage">Cinematic Floating Collage (Recommended)</SelectItem>
                        <SelectItem value="grid">Balanced Video Grid</SelectItem>
                        <SelectItem value="featured_focus">Featured Focus (Single Center + Mini Cards)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-900 flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-slate-600" />
                      Mobile Layout Mode
                    </Label>
                    <Select
                      value={formSettings.mobile_layout}
                      onValueChange={(val: any) =>
                        setFormSettings((prev) => ({ ...prev, mobile_layout: val }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="carousel">Swipeable Video Carousel (Recommended)</SelectItem>
                        <SelectItem value="compact_grid">Compact 2-Column Grid</SelectItem>
                        <SelectItem value="single_featured">Single Prominent Video</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 2. Hero Editorial Copy */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wider text-slate-500">
                    Hero Typography & Copy
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="badge_text">Tagline Badge Text</Label>
                      <Input
                        id="badge_text"
                        value={formSettings.badge_text}
                        onChange={(e) =>
                          setFormSettings((prev) => ({ ...prev, badge_text: e.target.value }))
                        }
                        placeholder="e.g. Curated Road Trips & Himalayan Treks"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hero_heading">Hero Main Heading</Label>
                      <Input
                        id="hero_heading"
                        value={formSettings.hero_heading}
                        onChange={(e) =>
                          setFormSettings((prev) => ({ ...prev, hero_heading: e.target.value }))
                        }
                        placeholder="e.g. Your Next Adventure Begins Here."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hero_subtitle">Hero Subtitle / Description</Label>
                    <Textarea
                      id="hero_subtitle"
                      rows={3}
                      value={formSettings.hero_subtitle}
                      onChange={(e) =>
                        setFormSettings((prev) => ({ ...prev, hero_subtitle: e.target.value }))
                      }
                      placeholder="Enter the editorial brand description..."
                    />
                  </div>
                </div>

                {/* 3. Call to Action Buttons */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wider text-slate-500">
                    CTA Action Buttons
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 border rounded-xl space-y-3 bg-slate-50/50">
                      <Label className="font-semibold text-xs text-amber-700">Primary CTA Button</Label>
                      <Input
                        value={formSettings.cta_primary_label}
                        onChange={(e) =>
                          setFormSettings((prev) => ({ ...prev, cta_primary_label: e.target.value }))
                        }
                        placeholder="Button Text (e.g. Explore Destinations)"
                      />
                      <Input
                        value={formSettings.cta_primary_href}
                        onChange={(e) =>
                          setFormSettings((prev) => ({ ...prev, cta_primary_href: e.target.value }))
                        }
                        placeholder="Destination Link (e.g. /destinations)"
                      />
                    </div>

                    <div className="p-3 border rounded-xl space-y-3 bg-slate-50/50">
                      <Label className="font-semibold text-xs text-slate-700">Secondary CTA Button</Label>
                      <Input
                        value={formSettings.cta_secondary_label}
                        onChange={(e) =>
                          setFormSettings((prev) => ({ ...prev, cta_secondary_label: e.target.value }))
                        }
                        placeholder="Button Text (e.g. Upcoming Trips)"
                      />
                      <Input
                        value={formSettings.cta_secondary_href}
                        onChange={(e) =>
                          setFormSettings((prev) => ({ ...prev, cta_secondary_href: e.target.value }))
                        }
                        placeholder="Destination Link (e.g. /destinations)"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Fallback Background Media */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wider text-slate-500">
                    Ambient Background & Fallbacks
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Background Fallback Image</Label>
                      <ImageField
                        value={formSettings.fallback_media_url}
                        onChange={(url) =>
                          setFormSettings((prev) => ({ ...prev, fallback_media_url: url }))
                        }
                        folder="/hero"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fallback_video">Background Fallback Video URL (MP4)</Label>
                      <Input
                        id="fallback_video"
                        value={formSettings.fallback_video_url}
                        onChange={(e) =>
                          setFormSettings((prev) => ({ ...prev, fallback_video_url: e.target.value }))
                        }
                        placeholder="https://.../video.mp4"
                      />
                      <p className="text-xs text-slate-400">
                        Plays as ambient background behind the floating cards on large monitors.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Save button */}
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    onClick={() => saveSettingsMutation.mutate(formSettings)}
                    disabled={saveSettingsMutation.isPending}
                    className="gap-2 bg-slate-900 text-white hover:bg-slate-800"
                  >
                    {saveSettingsMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Global Hero Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ==================================================== */}
      {/* CARD CREATE / EDIT DIALOG MODAL */}
      {/* ==================================================== */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <Video className="h-5 w-5 text-amber-500" />
              {editingCard?.id && cards.some((c) => c.id === editingCard.id)
                ? 'Edit Video Card'
                : 'Add New Video Card'}
            </DialogTitle>
            <DialogDescription>
              Provide direct MP4 URL or upload a video file for seamless muted autoplay in the homepage collage.
            </DialogDescription>
          </DialogHeader>

          {editingCard && (
            <form onSubmit={handleSaveCard} className="space-y-5 py-2">
              {/* Title & Destination Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="card_title" className="font-semibold">
                    Card Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="card_title"
                    required
                    value={editingCard.title || ''}
                    onChange={(e) =>
                      setEditingCard((prev) => (prev ? { ...prev, title: e.target.value } : null))
                    }
                    placeholder="e.g. Winter Snow Peaks & Glaciers"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dest_name" className="font-semibold">
                    Destination Name
                  </Label>
                  <Input
                    id="dest_name"
                    value={editingCard.destination_name || ''}
                    onChange={(e) =>
                      setEditingCard((prev) =>
                        prev ? { ...prev, destination_name: e.target.value } : null
                      )
                    }
                    placeholder="e.g. Kedarkantha & Manali"
                  />
                </div>
              </div>

              {/* Direct Video Source (Upload vs URL) */}
              <div className="space-y-2 p-4 rounded-xl bg-slate-50 border">
                <Label className="font-semibold text-slate-900 flex items-center justify-between">
                  <span>Direct Video URL (MP4 / WebM for Autoplay)</span>
                  <span className="text-xs text-amber-600 font-normal">Muted continuous loop</span>
                </Label>

                <div className="flex gap-2">
                  <Input
                    value={editingCard.video_url || ''}
                    onChange={(e) =>
                      setEditingCard((prev) =>
                        prev ? { ...prev, video_url: e.target.value } : null
                      )
                    }
                    placeholder="https://.../video.mp4"
                    className="font-mono text-xs"
                  />

                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="video/mp4,video/webm"
                    className="hidden"
                    onChange={handleDirectVideoUpload}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    disabled={videoUploadLoading}
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-1.5 shrink-0"
                  >
                    {videoUploadLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                    ) : (
                      <Upload className="h-4 w-4 text-slate-600" />
                    )}
                    Upload MP4
                  </Button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Tip: Direct MP4 URLs are required for cross-browser silent autoplay without third-party iframe cookie blocks.
                </p>
              </div>

              {/* Instagram URL Attribution */}
              <div className="space-y-1.5">
                <Label htmlFor="insta_url" className="font-semibold flex items-center gap-1.5">
                  <Instagram className="h-4 w-4 text-pink-600" />
                  Instagram Reel / Post URL (Optional Attribution)
                </Label>
                <Input
                  id="insta_url"
                  value={editingCard.instagram_url || ''}
                  onChange={(e) =>
                    setEditingCard((prev) =>
                      prev ? { ...prev, instagram_url: e.target.value } : null
                    )
                  }
                  placeholder="https://www.instagram.com/reel/..."
                />
                <p className="text-[11px] text-slate-400">
                  Displays an Instagram badge on the card and allows travelers to open the original reel on Instagram.
                </p>
              </div>

              {/* Poster / Thumbnail Image */}
              <div className="space-y-1.5">
                <Label className="font-semibold">Poster / Thumbnail Image</Label>
                <ImageField
                  value={editingCard.thumbnail_url || ''}
                  onChange={(url) =>
                    setEditingCard((prev) => (prev ? { ...prev, thumbnail_url: url } : null))
                  }
                  folder="/hero-posters"
                />
              </div>

              {/* Caption & CTA link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="caption" className="font-semibold">
                    Short Caption / Hook
                  </Label>
                  <Textarea
                    id="caption"
                    rows={2}
                    value={editingCard.caption || ''}
                    onChange={(e) =>
                      setEditingCard((prev) =>
                        prev ? { ...prev, caption: e.target.value } : null
                      )
                    }
                    placeholder="Crisp winter powder, snow treks to 12,500 ft..."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cta_url" className="font-semibold">
                    Target Destination / Package Link
                  </Label>
                  <Input
                    id="cta_url"
                    value={editingCard.cta_url || ''}
                    onChange={(e) =>
                      setEditingCard((prev) =>
                        prev ? { ...prev, cta_url: e.target.value } : null
                      )
                    }
                    placeholder="/destinations/kedarkantha"
                  />
                </div>
              </div>

              {/* Card Size & Layout Position */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border">
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs">Card Dimension in Collage</Label>
                  <Select
                    value={editingCard.card_size || 'medium'}
                    onValueChange={(val: any) =>
                      setEditingCard((prev) => (prev ? { ...prev, card_size: val } : null))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="large">Large (Main Centerpiece)</SelectItem>
                      <SelectItem value="portrait">Portrait (9:16 Reel Staggered)</SelectItem>
                      <SelectItem value="medium">Medium Landscape (4:3)</SelectItem>
                      <SelectItem value="small">Small Compact Card</SelectItem>
                      <SelectItem value="wide">Wide Banner Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs">Collage Stagger Position</Label>
                  <Select
                    value={editingCard.layout_position || 'center'}
                    onValueChange={(val: any) =>
                      setEditingCard((prev) => (prev ? { ...prev, layout_position: val } : null))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="center">Center / Prominent</SelectItem>
                      <SelectItem value="top_right">Top Right (Offset)</SelectItem>
                      <SelectItem value="bottom_right">Bottom Right (Floating)</SelectItem>
                      <SelectItem value="bottom_left">Bottom Left (Offset)</SelectItem>
                      <SelectItem value="top_left">Top Left (Background)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Toggles (Active, Autoplay, Loop) */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl border">
                <div className="flex items-center gap-2">
                  <Switch
                    id="card_active"
                    checked={editingCard.is_active ?? true}
                    onCheckedChange={(checked) =>
                      setEditingCard((prev) => (prev ? { ...prev, is_active: checked } : null))
                    }
                  />
                  <Label htmlFor="card_active" className="text-xs font-semibold cursor-pointer">
                    Card Enabled
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="card_autoplay"
                    checked={editingCard.autoplay ?? true}
                    onCheckedChange={(checked) =>
                      setEditingCard((prev) => (prev ? { ...prev, autoplay: checked } : null))
                    }
                  />
                  <Label htmlFor="card_autoplay" className="text-xs font-semibold cursor-pointer">
                    Autoplay (Muted)
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="card_loop"
                    checked={editingCard.loop ?? true}
                    onCheckedChange={(checked) =>
                      setEditingCard((prev) => (prev ? { ...prev, loop: checked } : null))
                    }
                  />
                  <Label htmlFor="card_loop" className="text-xs font-semibold cursor-pointer">
                    Loop Continuously
                  </Label>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saveCardMutation.isPending}
                  className="gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium"
                >
                  {saveCardMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Card
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ==================================================== */}
      {/* VIDEO PREVIEW PLAYER MODAL */}
      {/* ==================================================== */}
      <Dialog open={!!previewCard} onOpenChange={() => setPreviewCard(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-slate-950 border-slate-800 text-white">
          {previewCard && (
            <div>
              <div className="relative aspect-video w-full bg-black flex items-center justify-center">
                <video
                  src={previewCard.video_url}
                  autoPlay
                  controls
                  playsInline
                  loop
                  className="h-full w-full object-contain"
                  poster={previewCard.thumbnail_url}
                />
              </div>
              <div className="p-5 space-y-3 bg-slate-900">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full mb-1">
                      <MapPin className="h-3 w-3" />
                      {previewCard.destination_name}
                    </div>
                    <h3 className="text-lg font-bold text-white">{previewCard.title}</h3>
                    {previewCard.caption && (
                      <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                        {previewCard.caption}
                      </p>
                    )}
                  </div>

                  {previewCard.instagram_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="gap-1.5 border-pink-500/40 text-pink-400 hover:bg-pink-500/10 shrink-0"
                    >
                      <a href={previewCard.instagram_url} target="_blank" rel="noopener noreferrer">
                        <Instagram className="h-4 w-4" />
                        View on Instagram
                      </a>
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-400">
                  <span>Size: {previewCard.card_size} • Position: {previewCard.layout_position}</span>
                  {previewCard.cta_url && (
                    <span className="font-mono text-amber-400/90">{previewCard.cta_url}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

