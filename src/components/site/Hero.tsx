import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'motion/react'
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Star,
  Users,
  MapPin,
  Play,
  Pause,
  Compass,
  Volume2,
  VolumeX,
  Instagram,
  X,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  getHeroVideoGallery,
  getHeroVideoSettings,
  HeroVideoCard,
  HeroVideoSettings,
  DEFAULT_HERO_SETTINGS,
} from '@/lib/queries/hero-videos'
import { HeroVideoCollage } from '@/components/site/HeroVideoCollage'
import heroFallbackImg from '@/assets/hero.jpg'

export function Hero() {
  const [previewCard, setPreviewCard] = useState<HeroVideoCard | null>(null)
  const [modalAudioMuted, setModalAudioMuted] = useState(false)
  const modalVideoRef = useRef<HTMLVideoElement>(null)

  // Background ambient video state
  const bgVideoRef = useRef<HTMLVideoElement>(null)
  const [bgVideoPlaying, setBgVideoPlaying] = useState(true)
  const [bgVideoLoaded, setBgVideoLoaded] = useState(false)
  const [bgVideoError, setBgVideoError] = useState(false)

  // Fetch Hero Video Gallery cards & global settings
  const { data: cards = [] } = useQuery({
    queryKey: ['hero_video_gallery'],
    queryFn: getHeroVideoGallery,
    staleTime: 1000 * 60 * 5,
  })

  const { data: settings = DEFAULT_HERO_SETTINGS } = useQuery({
    queryKey: ['hero_video_settings'],
    queryFn: getHeroVideoSettings,
    staleTime: 1000 * 60 * 5,
  })

  // Editorial Copy & CTAs from settings
  const headline = settings.hero_heading || 'Your Next Adventure Begins Here.'
  const subtitle =
    settings.hero_subtitle ||
    "Discover breathtaking destinations, unforgettable journeys and experiences worth remembering with India's most trusted travel collective."
  const badgeText = settings.badge_text || 'Curated Road Trips & Himalayan Treks'
  const ctaPrimaryLabel = settings.cta_primary_label || 'Explore Destinations'
  const ctaPrimaryHref = settings.cta_primary_href || '/destinations'
  const ctaSecondaryLabel = settings.cta_secondary_label || 'Upcoming Trips'
  const ctaSecondaryHref = settings.cta_secondary_href || '/destinations'

  const posterUrl = settings.fallback_media_url || heroFallbackImg
  const bgVideoUrl = settings.fallback_video_url

  const trustBadges = [
    { icon: Star, label: '4.9/5 Rating', sub: '1,200+ Google Reviews', color: 'text-amber-400' },
    { icon: Users, label: '15,000+ Explorers', sub: 'Solo & Group Travelers', color: 'text-emerald-400' },
    { icon: ShieldCheck, label: '100% Guaranteed', sub: 'Fixed Batch Departures', color: 'text-blue-400' },
    { icon: MapPin, label: 'Verified Stays', sub: 'Handpicked Boutique Camps', color: 'text-gold' },
  ]

  const toggleBgVideo = () => {
    if (!bgVideoRef.current) return
    if (bgVideoPlaying) {
      bgVideoRef.current.pause()
      setBgVideoPlaying(false)
    } else {
      bgVideoRef.current.play().then(() => setBgVideoPlaying(true)).catch(() => {})
    }
  }

  return (
    <section
      id="home"
      className="relative flex min-h-[92vh] lg:min-h-screen items-center justify-center overflow-hidden bg-[#0A1622]"
    >
      {/* 1. Ambient Background Media (Optional background video with dark overlays) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {!bgVideoError && bgVideoUrl ? (
          <video
            ref={bgVideoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            poster={posterUrl}
            onLoadedData={() => setBgVideoLoaded(true)}
            onError={() => setBgVideoError(true)}
            className={`h-full w-full object-cover object-center transition-opacity duration-1000 ${
              bgVideoLoaded ? 'opacity-35 scale-100' : 'opacity-0 scale-105'
            }`}
          >
            <source src={bgVideoUrl} type="video/mp4" />
          </video>
        ) : null}

        {/* Fallback Ambient Image */}
        <img
          src={posterUrl}
          alt="Cinematic Himalayan Mountain Road Trip"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
            bgVideoLoaded && !bgVideoError ? 'opacity-0' : 'opacity-25'
          }`}
        />

        {/* Cinematic Multi-layer Gradient Overlays for contrast and brand tone */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A1622] via-[#0F2942]/80 to-[#0A1622]/95" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(10,22,34,0.7)_100%)]" />
      </div>

      {/* 2. Main Hero Container: 2-Column Responsive Layout */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 sm:px-8 pt-28 pb-16 sm:pt-36 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* ======================================================= */}
          {/* LEFT COLUMN: Editorial Typography & Brand Badges (Cols 1-6/7) */}
          {/* ======================================================= */}
          <div className="lg:col-span-6 xl:col-span-6 space-y-6 sm:space-y-7 text-left">
            {/* Tagline Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-md shadow-lg"
            >
              <Sparkles className="h-4 w-4 text-gold animate-pulse" />
              <span className="font-poppins text-xs font-semibold uppercase tracking-[0.18em] text-white/95">
                {badgeText}
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl"
            >
              {headline.includes('Begins Here') ? (
                <>
                  Your Next Adventure <br />
                  <span className="bg-gradient-to-r from-[#FDE047] via-[#D4AF37] to-[#F59E0B] bg-clip-text text-transparent">
                    Begins Here.
                  </span>
                </>
              ) : (
                headline
              )}
            </motion.h1>

            {/* Subheading Description */}
            <motion.p
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="max-w-xl font-poppins text-sm leading-relaxed text-white/80 sm:text-base sm:leading-relaxed"
            >
              {subtitle}
            </motion.p>

            {/* Primary & Secondary Action CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1"
            >
              <Button
                size="xl"
                className="group relative h-12 sm:h-13 px-8 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#F59E0B] to-[#D4AF37] bg-[length:200%_auto] text-[#0F2942] font-poppins font-bold text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:shadow-[0_0_35px_rgba(212,175,55,0.6)] hover:bg-right transition-all duration-500 cursor-pointer"
                asChild
              >
                <Link to={ctaPrimaryHref as any} className="flex items-center justify-center gap-2">
                  <span>{ctaPrimaryLabel}</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>

              <Button
                size="xl"
                variant="outline"
                className="h-12 sm:h-13 px-7 rounded-full border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white/50 backdrop-blur-md font-poppins font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 cursor-pointer"
                asChild
              >
                <Link to={ctaSecondaryHref as any} className="flex items-center justify-center gap-2">
                  <Compass className="h-4 w-4 text-gold" />
                  <span>{ctaSecondaryLabel}</span>
                </Link>
              </Button>
            </motion.div>

            {/* Trust Badges Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="pt-5 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
            >
              {trustBadges.map((badge, idx) => {
                const Icon = badge.icon
                return (
                  <div key={idx} className="flex items-center gap-2.5">
                    <div className="grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-lg bg-white/10 border border-white/15 backdrop-blur-sm">
                      <Icon className={`h-4 w-4 ${badge.color}`} />
                    </div>
                    <div>
                      <div className="text-xs font-poppins font-bold text-white tracking-wide">
                        {badge.label}
                      </div>
                      <div className="text-[10px] text-white/60 font-poppins truncate max-w-[100px]">
                        {badge.sub}
                      </div>
                    </div>
                  </div>
                )
              })}
            </motion.div>
          </div>

          {/* ======================================================= */}
          {/* RIGHT COLUMN: Floating Video Collage (Cols 7-12) */}
          {/* ======================================================= */}
          <div className="lg:col-span-6 xl:col-span-6 flex items-center justify-center">
            {settings.is_enabled !== false ? (
              <HeroVideoCollage
                cards={cards}
                settings={settings}
                onOpenPreview={(card) => {
                  setPreviewCard(card)
                  setModalAudioMuted(false)
                }}
              />
            ) : null}
          </div>
        </div>
      </div>

      {/* Video Lightbox Modal with Audio & Direct Booking CTA */}
      <Dialog open={!!previewCard} onOpenChange={() => setPreviewCard(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-slate-950 border-white/15 text-white shadow-2xl">
          {previewCard && (
            <div>
              {/* Video Player Box */}
              <div className="relative aspect-video w-full bg-black flex items-center justify-center">
                <video
                  ref={modalVideoRef}
                  src={previewCard.video_url}
                  autoPlay
                  controls
                  playsInline
                  loop
                  muted={modalAudioMuted}
                  poster={previewCard.thumbnail_url}
                  className="h-full w-full object-contain"
                />

                {/* Sound toggle button */}
                <button
                  type="button"
                  onClick={() => {
                    if (modalVideoRef.current) {
                      modalVideoRef.current.muted = !modalVideoRef.current.muted
                      setModalAudioMuted(modalVideoRef.current.muted)
                    }
                  }}
                  className="absolute bottom-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-md border border-white/20 hover:bg-black transition-colors"
                  aria-label={modalAudioMuted ? 'Unmute video' : 'Mute video'}
                >
                  {modalAudioMuted ? (
                    <VolumeX className="h-4 w-4 text-red-400" />
                  ) : (
                    <Volume2 className="h-4 w-4 text-amber-400" />
                  )}
                </button>
              </div>

              {/* Video Details & CTAs */}
              <div className="p-5 sm:p-6 space-y-4 bg-gradient-to-b from-slate-900 to-slate-950">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                      <MapPin className="h-3.5 w-3.5" />
                      {previewCard.destination_name}
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-wide">{previewCard.title}</h3>
                    {previewCard.caption && (
                      <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                        {previewCard.caption}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 pt-1">
                    {previewCard.instagram_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="gap-1.5 border-pink-500/40 text-pink-300 hover:bg-pink-500/10"
                      >
                        <a
                          href={previewCard.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Instagram className="h-4 w-4" />
                          <span>Instagram</span>
                        </a>
                      </Button>
                    )}

                    <Button
                      size="sm"
                      asChild
                      className="gap-2 bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-slate-950 font-bold hover:brightness-110 shadow-md"
                    >
                      <Link
                        to={(previewCard.cta_url || '/destinations') as any}
                        onClick={() => setPreviewCard(null)}
                      >
                        <span>Explore Trip</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
