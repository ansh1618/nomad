import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImageField } from '@/components/admin/MediaPicker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Globe,
  Settings,
  Sliders,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import {
  getSiteSettings,
  updateSiteSettings,
  getCmsSection,
  updateCmsSection,
  getHomepageLayout,
  updateHomepageLayoutItem,
  reorderHomepageLayout,
  getHeroSlides,
  upsertHeroSlide,
  deleteHeroSlide,
  reorderHeroSlides,
  getAllFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
  reorderFaqs,
  getAllNavItems,
  upsertNavItem,
  deleteNavItem,
  reorderNavItems,
  getAllFooterSections,
  updateFooterSection,
  getAllAnnouncementBars,
  upsertAnnouncementBar,
  deleteAnnouncementBar,
  getAllPageSeo,
  updatePageSeo,
  getThemeConfig,
  updateThemeConfigs
} from '@/lib/queries/cms'

export const Route = createFileRoute('/admin/website_/$section')({
  component: WebsiteSectionEditor,
})

function WebsiteSectionEditor() {
  const { section } = Route.useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  // ----------------------------------------------------
  // GENERAL MUTATIONS & SAVING LOADER
  // ----------------------------------------------------
  const [isSaving, setIsSaving] = useState(false)

  // ----------------------------------------------------
  // 1. HERO EDITOR
  // ----------------------------------------------------
  const { data: heroSection, refetch: refetchHero } = useQuery({
    queryKey: ['cms', 'hero'],
    queryFn: () => getCmsSection('hero'),
    enabled: section === 'hero',
  })

  const { data: slides = [], refetch: refetchSlides } = useQuery({
    queryKey: ['hero_slides_admin'],
    queryFn: getHeroSlides,
    enabled: section === 'hero',
  })

  const [bgType, setBgType] = useState('video')
  const [videoUrl, setVideoUrl] = useState('')
  const [heroTitle, setHeroTitle] = useState('')
  const [heroSubtitle, setHeroSubtitle] = useState('')
  const [badgeText, setBadgeText] = useState('')
  const [primaryCtaLabel, setPrimaryCtaLabel] = useState('')
  const [primaryCtaHref, setPrimaryCtaHref] = useState('')

  // New slide states
  const [newSlideTitle, setNewSlideTitle] = useState('')
  const [newSlideSubtitle, setNewSlideSubtitle] = useState('')
  const [newSlideMediaUrl, setNewSlideMediaUrl] = useState('')
  const [newSlideMediaType, setNewSlideMediaType] = useState<'image' | 'video'>('image')

  useEffect(() => {
    if (heroSection) {
      const content = heroSection.content as any
      setBgType(content.bg_type || 'video')
      setVideoUrl(content.video_url || '')
      setHeroTitle(heroSection.title || '')
      setHeroSubtitle(heroSection.subtitle || '')
      setBadgeText(content.badge_text || '')
      setPrimaryCtaLabel(content.cta_primary_label || '')
      setPrimaryCtaHref(content.cta_primary_href || '')
    }
  }, [heroSection])

  const saveHeroMutation = useMutation({
    mutationFn: async () => {
      const prevContent = heroSection?.content as any
      await updateCmsSection('hero', {
        title: heroTitle,
        subtitle: heroSubtitle,
        content: {
          ...prevContent,
          bg_type: bgType,
          video_url: videoUrl,
          badge_text: badgeText,
          cta_primary_label: primaryCtaLabel,
          cta_primary_href: primaryCtaHref,
        },
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms', 'hero'] })
      toast.success('Hero section settings saved successfully')
    },
    onError: (err: any) => toast.error(err.message),
  })

  const addSlideMutation = useMutation({
    mutationFn: async () => {
      if (!newSlideTitle || !newSlideMediaUrl) throw new Error('Title and Media URL are required')
      await upsertHeroSlide({
        title: newSlideTitle,
        subtitle: newSlideSubtitle,
        media_url: newSlideMediaUrl,
        media_type: newSlideMediaType,
        sort_order: slides.length + 1,
        is_active: true,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hero_slides_admin'] })
      setNewSlideTitle('')
      setNewSlideSubtitle('')
      setNewSlideMediaUrl('')
      toast.success('Slide added successfully')
    },
    onError: (err: any) => toast.error(err.message),
  })

  // ----------------------------------------------------
  // 2. STATS EDITOR
  // ----------------------------------------------------
  const { data: statsSection } = useQuery({
    queryKey: ['cms', 'stats'],
    queryFn: () => getCmsSection('stats'),
    enabled: section === 'stats',
  })

  const [stats, setStats] = useState<any[]>([])

  useEffect(() => {
    if (statsSection) {
      setStats((statsSection.content as any)?.stats || [])
    }
  }, [statsSection])

  const saveStatsMutation = useMutation({
    mutationFn: async () => {
      await updateCmsSection('stats', {
        content: { stats },
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms', 'stats'] })
      toast.success('Stats saved successfully')
    },
    onError: (err: any) => toast.error(err.message),
  })

  // ----------------------------------------------------
  // 3. ANNOUNCEMENT BAR EDITOR
  // ----------------------------------------------------
  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements_admin'],
    queryFn: getAllAnnouncementBars,
    enabled: section === 'announcement',
  })

  const [annMsg, setAnnMsg] = useState('')
  const [annLink, setAnnLink] = useState('')
  const [annLinkText, setAnnLinkText] = useState('')
  const [annBgColor, setAnnBgColor] = useState('#1e3a5f')
  const [annIsActive, setAnnIsActive] = useState(false)

  useEffect(() => {
    if (announcements.length > 0) {
      const active = announcements[0]
      setAnnMsg(active.message)
      setAnnLink(active.link || '')
      setAnnLinkText(active.link_text || '')
      setAnnBgColor(active.bg_color || '#1e3a5f')
      setAnnIsActive(active.is_active)
    }
  }, [announcements])

  const saveAnnouncementMutation = useMutation({
    mutationFn: async () => {
      const activeAnn = announcements[0]
      await upsertAnnouncementBar({
        id: activeAnn?.id,
        message: annMsg,
        link: annLink || null,
        link_text: annLinkText || null,
        bg_color: annBgColor,
        is_active: annIsActive,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements_admin'] })
      toast.success('Announcement settings saved')
    },
    onError: (err: any) => toast.error(err.message),
  })

  // ----------------------------------------------------
  // 4. NAVIGATION BAR BUILDER
  // ----------------------------------------------------
  const { data: navItems = [] } = useQuery({
    queryKey: ['nav_items_admin'],
    queryFn: getAllNavItems,
    enabled: section === 'navigation',
  })

  const [newLinkLabel, setNewLinkLabel] = useState('')
  const [newLinkHref, setNewLinkHref] = useState('')

  const addNavLinkMutation = useMutation({
    mutationFn: async () => {
      if (!newLinkLabel || !newLinkHref) throw new Error('Label and Link URL are required')
      await upsertNavItem({
        id: undefined as any,
        label: newLinkLabel,
        href: newLinkHref,
        sort_order: navItems.length + 1,
        is_active: true,
        is_external: false,
        parent_id: null,
        icon: null,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nav_items_admin'] })
      setNewLinkLabel('')
      setNewLinkHref('')
      toast.success('Link added to navbar')
    },
    onError: (err: any) => toast.error(err.message),
  })

  const deleteNavLinkMutation = useMutation({
    mutationFn: deleteNavItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nav_items_admin'] })
      toast.success('Navbar link deleted')
    },
  })

  // ----------------------------------------------------
  // 5. FOOTER EDITOR
  // ----------------------------------------------------
  const { data: footerSections = [] } = useQuery({
    queryKey: ['footer_sections_admin'],
    queryFn: getAllFooterSections,
    enabled: section === 'footer',
  })

  const [footerCopyright, setFooterCopyright] = useState('')
  const [footerQuote, setFooterQuote] = useState('')

  const { data: siteSettingsFooter } = useQuery({
    queryKey: ['site_settings_footer'],
    queryFn: getSiteSettings,
    enabled: section === 'footer',
  })

  useEffect(() => {
    if (siteSettingsFooter) {
      setFooterCopyright(siteSettingsFooter.footer_copyright || '')
      setFooterQuote(siteSettingsFooter.footer_quote || '')
    }
  }, [siteSettingsFooter])

  const saveFooterSettingsMutation = useMutation({
    mutationFn: async () => {
      await updateSiteSettings({
        footer_copyright: footerCopyright,
        footer_quote: footerQuote,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['site_settings_footer'] })
      toast.success('Footer settings saved')
    },
  })

  // ----------------------------------------------------
  // 6. CONTACT DETAILS
  // ----------------------------------------------------
  const { data: contactSettings } = useQuery({
    queryKey: ['contact_settings_admin'],
    queryFn: getSiteSettings,
    enabled: section === 'contact',
  })

  const [phone, setPhone] = useState('')
  const [phone2, setPhone2] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [address, setAddress] = useState('')
  const [insta, setInsta] = useState('')
  const [yt, setYt] = useState('')
  const [reddit, setReddit] = useState('')
  const [mapEmbed, setMapEmbed] = useState('')

  useEffect(() => {
    if (contactSettings) {
      setPhone(contactSettings.support_phone || '')
      setPhone2(contactSettings.support_phone_2 || '')
      setEmail(contactSettings.support_email || '')
      setWhatsapp(contactSettings.whatsapp_number || '')
      setAddress(contactSettings.address || '')
      setInsta(contactSettings.instagram_url || '')
      setYt(contactSettings.youtube_url || '')
      setReddit(contactSettings.reddit_url || '')
      setMapEmbed(contactSettings.google_map_embed || '')
    }
  }, [contactSettings])

  const saveContactMutation = useMutation({
    mutationFn: async () => {
      await updateSiteSettings({
        support_phone: phone,
        support_phone_2: phone2,
        support_email: email,
        whatsapp_number: whatsapp,
        address,
        instagram_url: insta,
        youtube_url: yt,
        reddit_url: reddit,
        google_map_embed: mapEmbed,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contact_settings_admin'] })
      toast.success('Contact details saved successfully')
    },
  })

  // ----------------------------------------------------
  // 7. FAQ BUILDER
  // ----------------------------------------------------
  const { data: faqs = [] } = useQuery({
    queryKey: ['faqs_admin'],
    queryFn: () => getAllFaqs(),
    enabled: section === 'faqs',
  })

  const [faqQuestion, setFaqQuestion] = useState('')
  const [faqAnswer, setFaqAnswer] = useState('')
  const [faqPage, setFaqPage] = useState('homepage')

  const addFaqMutation = useMutation({
    mutationFn: async () => {
      if (!faqQuestion || !faqAnswer) throw new Error('Question and Answer are required')
      await createFaq({
        question: faqQuestion,
        answer: faqAnswer,
        page: faqPage,
        sort_order: faqs.length + 1,
        is_active: true,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faqs_admin'] })
      setFaqQuestion('')
      setFaqAnswer('')
      toast.success('FAQ item added successfully')
    },
    onError: (err: any) => toast.error(err.message),
  })

  const deleteFaqMutation = useMutation({
    mutationFn: deleteFaq,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faqs_admin'] })
      toast.success('FAQ item deleted')
    },
  })

  // ----------------------------------------------------
  // 8. SEO MANAGER
  // ----------------------------------------------------
  const { data: seos = [] } = useQuery({
    queryKey: ['page_seos_admin'],
    queryFn: getAllPageSeo,
    enabled: section === 'seo',
  })

  const saveSeoMutation = useMutation({
    mutationFn: async ({ pageKey, title, description, ogImage }: { pageKey: string; title: string; description: string; ogImage: string }) => {
      await updatePageSeo(pageKey, {
        title,
        description,
        og_image: ogImage,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['page_seos_admin'] })
      toast.success('SEO updates saved')
    },
  })

  // ----------------------------------------------------
  // 9. HOMEPAGE SECTION VISIBILITY
  // ----------------------------------------------------
  const { data: homepageLayout = [] } = useQuery({
    queryKey: ['homepage_layout_admin'],
    queryFn: getHomepageLayout,
    enabled: section === 'homepage',
  })

  const toggleLayoutItemMutation = useMutation({
    mutationFn: async ({ key, visible }: { key: string; visible: boolean }) => {
      await updateHomepageLayoutItem(key, { is_visible: visible })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['homepage_layout_admin'] })
      toast.success('Section visibility toggled')
    },
  })

  // ----------------------------------------------------
  // RENDER DYNAMIC COMPONENT EDITORS
  // ----------------------------------------------------
  const renderEditor = () => {
    switch (section) {
      case 'hero':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-poppins">Hero Banner Options</CardTitle>
                <CardDescription>Select background asset style and core CTA actions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Background Type</Label>
                    <Select value={bgType} onValueChange={setBgType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">Cinematic Video Loop</SelectItem>
                        <SelectItem value="image">Static High-Res Image</SelectItem>
                        <SelectItem value="slider">Dynamic Slideshow Carousel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Upper Small Badge</Label>
                    <Input value={badgeText} onChange={(e) => setBadgeText(e.target.value)} />
                  </div>
                </div>

                {bgType === 'video' && (
                  <div className="space-y-1.5">
                    <Label>Background Video URL</Label>
                    <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Mixkit / AWS S3 video path" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Primary Hero Title</Label>
                    <Input value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Subtitle Description</Label>
                    <Textarea value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} rows={3} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>CTA Button Label</Label>
                    <Input value={primaryCtaLabel} onChange={(e) => setPrimaryCtaLabel(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CTA Link Path</Label>
                    <Input value={primaryCtaHref} onChange={(e) => setPrimaryCtaHref(e.target.value)} />
                  </div>
                </div>

                <div className="pt-2">
                  <Button onClick={() => saveHeroMutation.mutate()} disabled={saveHeroMutation.isPending}>
                    {saveHeroMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Save Hero Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {bgType === 'slider' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-poppins">Carousel Slides ({slides.length})</CardTitle>
                  <CardDescription>Setup multiple slides with individual images and headings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* List of existing slides */}
                  <div className="space-y-3">
                    {slides.map((slide) => (
                      <div key={slide.id} className="flex items-center justify-between p-3 border rounded-xl bg-muted/40">
                        <div className="flex items-center gap-3">
                          <img src={slide.media_url} className="w-10 h-10 object-cover rounded-lg" />
                          <div>
                            <p className="text-sm font-semibold">{slide.title}</p>
                            <p className="text-xs text-muted-foreground">{slide.subtitle || 'No subtitle'}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={async () => {
                            await deleteHeroSlide(slide.id)
                            refetchSlides()
                            toast.success('Slide removed')
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Add slide form */}
                  <div className="border-t pt-4 space-y-4">
                    <h4 className="text-sm font-semibold font-poppins">Add New Carousel Slide</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Slide Title</Label>
                        <Input value={newSlideTitle} onChange={(e) => setNewSlideTitle(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Slide Subtitle</Label>
                        <Input value={newSlideSubtitle} onChange={(e) => setNewSlideSubtitle(e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>MediaType</Label>
                        <Select value={newSlideMediaType} onValueChange={(val: any) => setNewSlideMediaType(val)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="image">Image</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Media Asset Picker</Label>
                        <ImageField value={newSlideMediaUrl} onChange={setNewSlideMediaUrl} folder="hero" />
                      </div>
                    </div>
                    <Button onClick={() => addSlideMutation.mutate()} disabled={addSlideMutation.isPending}>
                      Add Slide
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )

      case 'stats':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-poppins">Travel Statistics Counters</CardTitle>
              <CardDescription>Adjust numeric stats showing happy explorers, total trips, experience years.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                {stats.map((stat, idx) => (
                  <div key={idx} className="p-4 border rounded-2xl bg-muted/20 space-y-3">
                    <p className="text-xs uppercase font-bold text-muted-foreground">Stat Card {idx + 1}</p>
                    <div className="space-y-1.5">
                      <Label>Stat Title</Label>
                      <Input
                        value={stat.label}
                        onChange={(e) => {
                          const updated = [...stats]
                          updated[idx].label = e.target.value
                          setStats(updated)
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label>Value</Label>
                        <Input
                          type="number"
                          value={stat.value}
                          onChange={(e) => {
                            const updated = [...stats]
                            updated[idx].value = parseInt(e.target.value) || 0
                            setStats(updated)
                          }}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Suffix</Label>
                        <Input
                          value={stat.suffix}
                          onChange={(e) => {
                            const updated = [...stats]
                            updated[idx].suffix = e.target.value
                            setStats(updated)
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-2">
                <Button onClick={() => saveStatsMutation.mutate()} disabled={saveStatsMutation.isPending}>
                  Save All Stats Counters
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      case 'announcement':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-poppins">Announcement Strip Settings</CardTitle>
              <CardDescription>Publish sitewide alerts, discount codes, or booking delays at the top bar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/40">
                <div>
                  <p className="text-sm font-semibold">Enable Announcement Bar</p>
                  <p className="text-xs text-muted-foreground">When active, this strip shows above the main navbar.</p>
                </div>
                <Switch checked={annIsActive} onCheckedChange={setAnnIsActive} />
              </div>

              <div className="space-y-1.5">
                <Label>Alert Strip Message</Label>
                <Input value={annMsg} onChange={(e) => setAnnMsg(e.target.value)} placeholder="Use code TRIP500 to save ₹500 today!" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Redirect Link (Optional)</Label>
                  <Input value={annLink} onChange={(e) => setAnnLink(e.target.value)} placeholder="/destinations/jibhi" />
                </div>
                <div className="space-y-1.5">
                  <Label>Link Button Text</Label>
                  <Input value={annLinkText} onChange={(e) => setAnnLinkText(e.target.value)} placeholder="Book Jibhi" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Background Accent Color</Label>
                <div className="flex items-center gap-3">
                  <Input type="color" className="w-12 h-10 p-1" value={annBgColor} onChange={(e) => setAnnBgColor(e.target.value)} />
                  <Input value={annBgColor} onChange={(e) => setAnnBgColor(e.target.value)} className="w-32" />
                </div>
              </div>

              <div className="pt-2">
                <Button onClick={() => saveAnnouncementMutation.mutate()} disabled={saveAnnouncementMutation.isPending}>
                  Save Announcement Bar Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      case 'homepage':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-poppins">Homepage Sections Layout</CardTitle>
              <CardDescription>Drag, reorder, or toggle display visibility of landing sections.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {homepageLayout.map((item, idx) => (
                <div key={item.section_key} className="flex items-center justify-between p-4 border rounded-2xl bg-muted/30">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono font-bold text-muted-foreground">0{idx + 1}</span>
                    <p className="text-sm font-semibold">{item.label}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={item.is_visible}
                      onCheckedChange={(checked) => toggleLayoutItemMutation.mutate({ key: item.section_key, visible: checked })}
                    />
                    <div className="flex gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={idx === 0}
                        onClick={async () => {
                          const updated = [...homepageLayout]
                          const temp = updated[idx]
                          updated[idx] = updated[idx - 1]
                          updated[idx - 1] = temp
                          const rows = updated.map((v, i) => ({ section_key: v.section_key, sort_order: i + 1 }))
                          await reorderHomepageLayout(rows)
                          qc.invalidateQueries({ queryKey: ['homepage_layout_admin'] })
                        }}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={idx === homepageLayout.length - 1}
                        onClick={async () => {
                          const updated = [...homepageLayout]
                          const temp = updated[idx]
                          updated[idx] = updated[idx + 1]
                          updated[idx + 1] = temp
                          const rows = updated.map((v, i) => ({ section_key: v.section_key, sort_order: i + 1 }))
                          await reorderHomepageLayout(rows)
                          qc.invalidateQueries({ queryKey: ['homepage_layout_admin'] })
                        }}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )

      case 'navigation':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-poppins">Navbar Link items ({navItems.length})</CardTitle>
                <CardDescription>Add, delete or reorder header navigation shortcuts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {navItems.map((item, idx) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-xl bg-muted/40">
                      <div>
                        <p className="text-sm font-semibold">{item.label}</p>
                        <p className="text-xs text-muted-foreground font-mono">{item.href}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => deleteNavLinkMutation.mutate(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={idx === 0}
                            onClick={async () => {
                              const updated = [...navItems]
                              const temp = updated[idx]
                              updated[idx] = updated[idx - 1]
                              updated[idx - 1] = temp
                              await reorderNavItems(updated.map((v, i) => ({ id: v.id, sort_order: i + 1 })))
                              qc.invalidateQueries({ queryKey: ['nav_items_admin'] })
                            }}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={idx === navItems.length - 1}
                            onClick={async () => {
                              const updated = [...navItems]
                              const temp = updated[idx]
                              updated[idx] = updated[idx + 1]
                              updated[idx + 1] = temp
                              await reorderNavItems(updated.map((v, i) => ({ id: v.id, sort_order: i + 1 })))
                              qc.invalidateQueries({ queryKey: ['nav_items_admin'] })
                            }}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add form */}
                <div className="border-t pt-4 space-y-3">
                  <h4 className="text-sm font-semibold font-poppins">Create New Nav Link</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Display Label</Label>
                      <Input value={newLinkLabel} onChange={(e) => setNewLinkLabel(e.target.value)} placeholder="e.g. Goa Trips" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Link Path / Anchors</Label>
                      <Input value={newLinkHref} onChange={(e) => setNewLinkHref(e.target.value)} placeholder="e.g. /destinations/goa or #destinations" />
                    </div>
                  </div>
                  <Button onClick={() => addNavLinkMutation.mutate()} disabled={addNavLinkMutation.isPending}>
                    Add Navbar Item
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'footer':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-poppins">Footer Legal Copy & Quote</CardTitle>
                <CardDescription>Configure bottom credits & quotes visible on all pages.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Copyright Copyright Strip</Label>
                  <Input value={footerCopyright} onChange={(e) => setFooterCopyright(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Footer Inspirational Quote</Label>
                  <Input value={footerQuote} onChange={(e) => setFooterQuote(e.target.value)} />
                </div>
                <Button onClick={() => saveFooterSettingsMutation.mutate()}>
                  Save Copyright Details
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-poppins">Footer Column Menus</CardTitle>
                <CardDescription>Setup link lists inside columns for destinations, company, etc.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {footerSections.map((sec) => (
                  <div key={sec.id} className="p-4 border rounded-2xl bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold font-poppins text-primary">{sec.title} Column</h4>
                      <Switch
                        checked={sec.is_active}
                        onCheckedChange={async (val) => {
                          await updateFooterSection(sec.section_key, { is_active: val })
                          qc.invalidateQueries({ queryKey: ['footer_sections_admin'] })
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      {sec.links?.map((link, lIdx) => (
                        <div key={lIdx} className="grid grid-cols-2 gap-2">
                          <Input value={link.label} readOnly disabled className="bg-muted text-xs" />
                          <Input value={link.href} readOnly disabled className="bg-muted text-xs" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )

      case 'contact':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-poppins">Contact Info & Embed Google Maps</CardTitle>
              <CardDescription>Setup company contact details, addresses, and maps integrations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Primary Phone Support</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Secondary Phone Support</Label>
                  <Input value={phone2} onChange={(e) => setPhone2(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Official Business Email</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>WhatsApp Broadcast / Chat Number</Label>
                  <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="e.g. 919999988888" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Business Office Address</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Instagram URL</Label>
                  <Input value={insta} onChange={(e) => setInsta(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>YouTube URL</Label>
                  <Input value={yt} onChange={(e) => setYt(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Reddit Profile URL</Label>
                  <Input value={reddit} onChange={(e) => setReddit(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Google Maps Embed Src URL (iframe src)</Label>
                <Textarea value={mapEmbed} onChange={(e) => setMapEmbed(e.target.value)} placeholder="https://google.com/maps/embed/v1/place?..." rows={3} />
              </div>

              <div className="pt-2">
                <Button onClick={() => saveContactMutation.mutate()} disabled={saveContactMutation.isPending}>
                  {saveContactMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Save Contact Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      case 'faqs':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-poppins">Frequently Asked Questions Builder</CardTitle>
                <CardDescription>Setup questions list across homepage, destination detail layouts, about pages.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                  {faqs.map((faq, idx) => (
                    <div key={faq.id} className="p-3 border rounded-xl bg-muted/40 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold text-primary uppercase font-mono tracking-wider">{faq.page}</p>
                        <p className="text-sm font-semibold mt-1">{faq.question}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{faq.answer}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => deleteFaqMutation.mutate(faq.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="flex gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={idx === 0}
                            onClick={async () => {
                              const updated = [...faqs]
                              const temp = updated[idx]
                              updated[idx] = updated[idx - 1]
                              updated[idx - 1] = temp
                              await reorderFaqs(updated.map((v, i) => ({ id: v.id, sort_order: i + 1 })))
                              qc.invalidateQueries({ queryKey: ['faqs_admin'] })
                            }}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={idx === faqs.length - 1}
                            onClick={async () => {
                              const updated = [...faqs]
                              const temp = updated[idx]
                              updated[idx] = updated[idx + 1]
                              updated[idx + 1] = temp
                              await reorderFaqs(updated.map((v, i) => ({ id: v.id, sort_order: i + 1 })))
                              qc.invalidateQueries({ queryKey: ['faqs_admin'] })
                            }}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Form */}
                <div className="border-t pt-4 space-y-3">
                  <h4 className="text-sm font-semibold font-poppins">Create New FAQ Question</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Question Label</Label>
                      <Input value={faqQuestion} onChange={(e) => setFaqQuestion(e.target.value)} placeholder="What is the pickup timing?" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Target Display Page</Label>
                      <Select value={faqPage} onValueChange={setFaqPage}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="homepage">Homepage Accordion</SelectItem>
                          <SelectItem value="destination">Destination Detail Layout</SelectItem>
                          <SelectItem value="about">About Page Details</SelectItem>
                          <SelectItem value="booking">Checkout / Payment wizard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Detailed FAQ Answer</Label>
                    <Textarea value={faqAnswer} onChange={(e) => setFaqAnswer(e.target.value)} placeholder="Answer description details..." rows={3} />
                  </div>
                  <Button onClick={() => addFaqMutation.mutate()} disabled={addFaqMutation.isPending}>
                    Save FAQ Item
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'seo':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-poppins">Per-Page SEO Metadata Manager</CardTitle>
              <CardDescription>Setup customized search engine listing descriptions, title tags, & OG assets.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-6">
                {seos.map((seo) => (
                  <div key={seo.page_key} className="p-4 border rounded-2xl bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                      <p className="text-xs uppercase font-bold text-primary font-mono">{seo.page_label} ({seo.page_key})</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const val = (document.getElementById(`seo-title-${seo.page_key}`) as HTMLInputElement)?.value
                          const desc = (document.getElementById(`seo-desc-${seo.page_key}`) as HTMLTextAreaElement)?.value
                          const img = (document.getElementById(`seo-img-${seo.page_key}`) as HTMLInputElement)?.value
                          saveSeoMutation.mutate({ pageKey: seo.page_key, title: val, description: desc, ogImage: img })
                        }}
                      >
                        Update Page SEO
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Browser Title Tag</Label>
                        <Input id={`seo-title-${seo.page_key}`} defaultValue={seo.title || ''} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>OpenGraph Thumbnail Asset Url</Label>
                        <Input id={`seo-img-${seo.page_key}`} defaultValue={seo.og_image || ''} placeholder="HTTPS path to social card thumbnail" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Search Description Meta Content</Label>
                      <Textarea id={`seo-desc-${seo.page_key}`} defaultValue={seo.description || ''} rows={2} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )

      case 'theme':
        return <ThemeEditor />

      case 'pages':
        return <PagesEditor />

      case 'special_offers':
        return <CmsSectionJsonEditor
          sectionKey="special_offers"
          title="Special Offers Section"
          description="Edit the section title, badge text, and the list of offer cards shown on the homepage."
          schema={[
            { field: 'title', label: 'Section Title', type: 'text', placeholder: 'Special Offers Ending Soon' },
            { field: 'subtitle', label: 'Badge Text', type: 'text', placeholder: 'Limited-time offers' },
          ]}
          jsonFields={[
            {
              field: 'offers',
              label: 'Offer Cards (JSON Array)',
              placeholder: JSON.stringify([
                { icon: 'Heart', title: 'Luxury Honeymoon', desc: 'Romantic overwater villas...', off: 'Up to 30% OFF' },
                { icon: 'Users', title: 'Family Packages', desc: 'Kid-friendly stays...', off: 'Kids Go Free' },
              ], null, 2)
            }
          ]}
        />

      case 'experience_steps':
        return <CmsSectionJsonEditor
          sectionKey="experience_steps"
          title="The Nomadik Experience Section"
          description="Edit the title, subtitle, description and the list of journey steps shown in the experience timeline."
          schema={[
            { field: 'title', label: 'Section Title', type: 'text', placeholder: 'The Nomadik Experience' },
            { field: 'subtitle', label: 'Badge Text', type: 'text', placeholder: 'THE NOMADIK VIBE' },
          ]}
          jsonFields={[
            {
              field: 'steps',
              label: 'Experience Steps (JSON Array)',
              placeholder: JSON.stringify([
                { icon: 'Compass', title: 'Discover', desc: 'Browse handpicked mountain roads...' },
                { icon: 'BookOpen', title: 'Book', desc: 'Secure your explorer seat...' },
              ], null, 2)
            },
            {
              field: 'description',
              label: 'Section Description',
              placeholder: 'A horizontal trail map of how we build connections...'
            }
          ]}
        />

      case 'our_promise':
        return <CmsSectionJsonEditor
          sectionKey="our_promise"
          title="Our Promise Section"
          description="Edit the title, subtitle, description and the 4-step promise shown on homepage."
          schema={[
            { field: 'title', label: 'Section Title', type: 'text', placeholder: 'Our Promise' },
            { field: 'subtitle', label: 'Badge Text', type: 'text', placeholder: 'ON-ROAD JOURNEY' },
          ]}
          jsonFields={[
            {
              field: 'steps',
              label: 'Promise Steps (JSON Array)',
              placeholder: JSON.stringify([
                { icon: 'CheckCircle2', title: 'Book', desc: 'Select your desired path...' },
                { icon: 'Settings', title: 'Plan', desc: 'We finalize vetted cottage stays...' },
              ], null, 2)
            },
            {
              field: 'description',
              label: 'Section Description',
              placeholder: 'Every step of your adventure is crafted...'
            }
          ]}
        />

      case 'popular_destinations':
        return <CmsSectionJsonEditor
          sectionKey="popular_destinations"
          title="Popular Destinations Section Headings"
          description="Edit the badge label, title and subtitle shown above the destinations grid on homepage."
          schema={[
            { field: 'title', label: 'Section Title', type: 'text', placeholder: 'Popular Destinations' },
            { field: 'subtitle', label: 'Section Description', type: 'text', placeholder: 'Explore India\'s most breathtaking roads...' },
          ]}
          jsonFields={[
            {
              field: 'badge',
              label: 'Badge Label',
              placeholder: 'ACTIVE CONVOYS'
            }
          ]}
        />

      case 'featured_packages':
        return <CmsSectionJsonEditor
          sectionKey="featured_packages"
          title="Featured Packages Section Headings"
          description="Edit the badge label, title and subtitle shown above the featured journeys grid on homepage."
          schema={[
            { field: 'title', label: 'Section Title', type: 'text', placeholder: 'Signature Experiences' },
            { field: 'subtitle', label: 'Section Description', type: 'text', placeholder: 'Handpicked adventures loved by thousands...' },
          ]}
          jsonFields={[
            {
              field: 'badge',
              label: 'Badge Label',
              placeholder: 'NOMADIK SIGNATURE'
            }
          ]}
        />

      case 'manifesto':
        return <CmsSectionJsonEditor
          sectionKey="manifesto"
          title="Manifesto Section (Why We Don't Sell Trips)"
          description="Edit the badge, headline title, inspirational quote, and CTA button label."
          schema={[
            { field: 'title', label: 'Main Headline', type: 'text', placeholder: "We Don't Believe in Selling Trips." },
            { field: 'subtitle', label: 'Inspirational Quote', type: 'text', placeholder: '"We create memories..."' },
          ]}
          jsonFields={[
            {
              field: 'badge',
              label: 'Badge Label',
              placeholder: 'OUR MANIFESTO'
            },
            {
              field: 'cta_label',
              label: 'CTA Button Text',
              placeholder: 'Become A Nomadik Explorer'
            }
          ]}
        />

      default:
        return (
          <div className="flex items-center gap-2 p-4 border rounded-xl text-amber-700 bg-amber-50">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm">Page builder section '{section}' is not implemented yet.</p>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <Link to="/admin/website">
            <Button variant="outline" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold font-poppins capitalize">{section} Editor</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Customize global site parameters.</p>
          </div>
        </div>
      </motion.div>

      {/* Editor Component */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        {renderEditor()}
      </motion.div>
    </div>
  )
}

// ----------------------------------------------------
// CMS SECTION JSON EDITOR - REUSABLE COMPONENT
// ----------------------------------------------------
interface CmsSectionJsonEditorProps {
  sectionKey: string
  title: string
  description: string
  schema: Array<{ field: 'title' | 'subtitle'; label: string; type: 'text'; placeholder: string }>
  jsonFields: Array<{ field: string; label: string; placeholder: string }>
}

function CmsSectionJsonEditor({ sectionKey, title, description, schema, jsonFields }: CmsSectionJsonEditorProps) {
  const qc = useQueryClient()
  const { data: section } = useQuery({
    queryKey: ['cms', sectionKey],
    queryFn: () => getCmsSection(sectionKey),
  })

  const [textValues, setTextValues] = useState<Record<string, string>>({})
  const [jsonValues, setJsonValues] = useState<Record<string, string>>({})
  const [jsonErrors, setJsonErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (section) {
      const texts: Record<string, string> = {}
      schema.forEach(({ field }) => {
        texts[field] = (section as any)[field] || ''
      })
      setTextValues(texts)

      const jsons: Record<string, string> = {}
      jsonFields.forEach(({ field }) => {
        const val = (section.content as any)?.[field]
        jsons[field] = val ? JSON.stringify(val, null, 2) : ''
      })
      setJsonValues(jsons)
    }
  }, [section])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const parsedContent: Record<string, any> = {}
      for (const { field } of jsonFields) {
        const raw = jsonValues[field]
        if (raw && raw.trim()) {
          try {
            parsedContent[field] = JSON.parse(raw)
          } catch (e) {
            throw new Error(`Invalid JSON in "${field}": ${(e as Error).message}`)
          }
        }
      }
      await updateCmsSection(sectionKey, {
        title: textValues['title'],
        subtitle: textValues['subtitle'],
        content: { ...(section?.content as any), ...parsedContent },
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms', sectionKey] })
      toast.success(`${title} saved successfully`)
    },
    onError: (err: any) => toast.error(err.message),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-poppins">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {schema.map(({ field, label, placeholder }) => (
          <div key={field} className="space-y-1.5">
            <Label>{label}</Label>
            <Input
              value={textValues[field] || ''}
              onChange={(e) => setTextValues(prev => ({ ...prev, [field]: e.target.value }))}
              placeholder={placeholder}
            />
          </div>
        ))}
        {jsonFields.map(({ field, label, placeholder }) => (
          <div key={field} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>{label}</Label>
              {jsonErrors[field] && (
                <span className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {jsonErrors[field]}
                </span>
              )}
            </div>
            <Textarea
              value={jsonValues[field] || ''}
              onChange={(e) => {
                setJsonValues(prev => ({ ...prev, [field]: e.target.value }))
                try { JSON.parse(e.target.value); setJsonErrors(prev => ({ ...prev, [field]: '' })) }
                catch { setJsonErrors(prev => ({ ...prev, [field]: 'Invalid JSON' })) }
              }}
              placeholder={placeholder}
              rows={8}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">Valid JSON required. Use icon names like: Compass, Heart, Star, Shield, Users, Award, Backpack, MapPin</p>
          </div>
        ))}
        <div className="pt-2">
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save {title}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ----------------------------------------------------
// THEME EDITOR SUBCOMPONENT
// ----------------------------------------------------
function ThemeEditor() {
  const qc = useQueryClient()
  const { data: themeConfigs = {} } = useQuery({
    queryKey: ['theme_config_admin'],
    queryFn: getThemeConfig,
  })

  const [primary, setPrimary] = useState('#1e3a5f')
  const [accent, setAccent] = useState('#c9a84c')
  const [headingFont, setHeadingFont] = useState('Poppins')
  const [bodyFont, setBodyFont] = useState('Inter')
  const [borderRadius, setBorderRadius] = useState('rounded')

  useEffect(() => {
    if (Object.keys(themeConfigs).length > 0) {
      setPrimary(themeConfigs.primary_color || '#1e3a5f')
      setAccent(themeConfigs.accent_color || '#c9a84c')
      setHeadingFont(themeConfigs.font_heading || 'Poppins')
      setBodyFont(themeConfigs.font_body || 'Inter')
      setBorderRadius(themeConfigs.border_radius || 'rounded')
    }
  }, [themeConfigs])

  const saveThemeMutation = useMutation({
    mutationFn: async () => {
      await updateThemeConfigs({
        primary_color: primary,
        accent_color: accent,
        font_heading: headingFont,
        font_body: bodyFont,
        border_radius: borderRadius,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['theme_config_admin'] })
      toast.success('Theme colors and border shapes updated')
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-poppins">Theme Style & Accent Colors Editor</CardTitle>
        <CardDescription>Control primary background, buttons color values, border shape and global fonts.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Primary Background Brand Color</Label>
            <div className="flex items-center gap-3">
              <Input type="color" className="w-12 h-10 p-1" value={primary} onChange={(e) => setPrimary(e.target.value)} />
              <Input value={primary} onChange={(e) => setPrimary(e.target.value)} className="w-32" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Accent / Gold Highlight Color</Label>
            <div className="flex items-center gap-3">
              <Input type="color" className="w-12 h-10 p-1" value={accent} onChange={(e) => setAccent(e.target.value)} />
              <Input value={accent} onChange={(e) => setAccent(e.target.value)} className="w-32" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Heading Font Selection</Label>
            <Select value={headingFont} onValueChange={setHeadingFont}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Poppins">Poppins (Modern Clean)</SelectItem>
                <SelectItem value="Outfit">Outfit (Round Stylish)</SelectItem>
                <SelectItem value="Playfair Display">Playfair Display (Serif Classic)</SelectItem>
                <SelectItem value="Inter">Inter (Strict Geometric)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Body Paragraph Font</Label>
            <Select value={bodyFont} onValueChange={setBodyFont}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Inter">Inter (Readable)</SelectItem>
                <SelectItem value="Poppins">Poppins</SelectItem>
                <SelectItem value="Roboto">Roboto</SelectItem>
                <SelectItem value="Manrope">Manrope</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Border Radius Shape Preset</Label>
          <Select value={borderRadius} onValueChange={setBorderRadius}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sharp">Sharp (0px radius)</SelectItem>
              <SelectItem value="rounded">Rounded Rounded (8px radius)</SelectItem>
              <SelectItem value="pill">Pill Shape Rounded (24px radius)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="pt-2">
          <Button onClick={() => saveThemeMutation.mutate()}>
            Save Theme Customizations
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ----------------------------------------------------
// COMPANY PAGES EDITOR SUBCOMPONENT
// ----------------------------------------------------
function PagesEditor() {
  const qc = useQueryClient()
  const { data: aboutSec } = useQuery({ queryKey: ['cms', 'about'], queryFn: () => getCmsSection('about') })
  const { data: privacySec } = useQuery({ queryKey: ['cms', 'privacy'], queryFn: () => getCmsSection('privacy') })
  const { data: termsSec } = useQuery({ queryKey: ['cms', 'terms'], queryFn: () => getCmsSection('terms') })
  const { data: cancelSec } = useQuery({ queryKey: ['cms', 'cancellation'], queryFn: () => getCmsSection('cancellation') })

  const [aboutText, setAboutText] = useState('')
  const [privacyText, setPrivacyText] = useState('')
  const [termsText, setTermsText] = useState('')
  const [cancelText, setCancelText] = useState('')

  useEffect(() => {
    if (aboutSec) setAboutText((aboutSec.content as any)?.markdown || '')
    if (privacySec) setPrivacyText((privacySec.content as any)?.markdown || '')
    if (termsSec) setTermsText((termsSec.content as any)?.markdown || '')
    if (cancelSec) setCancelText((cancelSec.content as any)?.markdown || '')
  }, [aboutSec, privacySec, termsSec, cancelSec])

  const savePageMutation = useMutation({
    mutationFn: async ({ key, markdown }: { key: string; markdown: string }) => {
      await updateCmsSection(key, { content: { markdown } })
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['cms', variables.key] })
      toast.success('Page details saved successfully')
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-poppins">Standard Document Policies Builder</CardTitle>
        <CardDescription>Setup full policies content copy in Markdown syntax below.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="about" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="about">About Us</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="terms">Terms</TabsTrigger>
            <TabsTrigger value="cancellation">Cancellation</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-3">
            <Textarea value={aboutText} onChange={(e) => setAboutText(e.target.value)} rows={12} className="font-mono text-xs" />
            <Button onClick={() => savePageMutation.mutate({ key: 'about', markdown: aboutText })}>
              Save About Page Info
            </Button>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-3">
            <Textarea value={privacyText} onChange={(e) => setPrivacyText(e.target.value)} rows={12} className="font-mono text-xs" />
            <Button onClick={() => savePageMutation.mutate({ key: 'privacy', markdown: privacyText })}>
              Save Privacy Policy
            </Button>
          </TabsContent>

          <TabsContent value="terms" className="space-y-3">
            <Textarea value={termsText} onChange={(e) => setTermsText(e.target.value)} rows={12} className="font-mono text-xs" />
            <Button onClick={() => savePageMutation.mutate({ key: 'terms', markdown: termsText })}>
              Save Terms
            </Button>
          </TabsContent>

          <TabsContent value="cancellation" className="space-y-3">
            <Textarea value={cancelText} onChange={(e) => setCancelText(e.target.value)} rows={12} className="font-mono text-xs" />
            <Button onClick={() => savePageMutation.mutate({ key: 'cancellation', markdown: cancelText })}>
              Save Cancellation Policy
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
