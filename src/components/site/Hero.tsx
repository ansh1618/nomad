import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'motion/react'
import {
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
      className="relative flex min-h-[92vh] lg:min-h-screen items-center justify-center overflow-hidden bg-[#060B12]"
    >
      {/* ========================================================= */}
      {/* 1. SOPHISTICATED MODERN BACKGROUND & AMBIENT DEPTH */}
      {/* ========================================================= */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        {/* Base Midnight Background Canvas */}
        <div className="absolute inset-0 bg-[#060B12]" />

        {/* Ambient Orb 1: Midnight Sapphire Depth (Top Left) */}
        <div className="absolute -top-32 -left-32 w-[680px] h-[680px] rounded-full bg-[radial-gradient(circle,rgba(20,52,86,0.45)_0%,rgba(10,25,45,0.18)_50%,transparent_75%)] blur-3xl hero-ambient-orb-1" />

        {/* Ambient Orb 2: Warm Golden Amber Glow (Center Right behind videos) */}
        <div className="absolute top-1/4 -right-24 w-[760px] h-[760px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.11)_0%,rgba(180,130,40,0.035)_45%,transparent_70%)] blur-3xl hero-ambient-orb-2" />

        {/* Ambient Orb 3: Subtle Oceanic Teal/Indigo Core (Bottom Center) */}
        <div className="absolute -bottom-24 left-1/3 w-[820px] h-[520px] rounded-full bg-[radial-gradient(circle,rgba(16,42,68,0.4)_0%,transparent_65%)] blur-3xl hero-ambient-pulse" />

        {/* Floating Mountain Stardust Embers (Lightweight, pure CSS, no canvas) */}
        <div className="absolute inset-0 overflow-hidden">
          {[
            { left: '12%', delay: '0s', dur: '18s', dx: '25px' },
            { left: '28%', delay: '4s', dur: '22s', dx: '-30px' },
            { left: '46%', delay: '9s', dur: '20s', dx: '18px' },
            { left: '64%', delay: '2s', dur: '25s', dx: '-24px' },
            { left: '82%', delay: '7s', dur: '19s', dx: '30px' },
            { left: '94%', delay: '12s', dur: '21s', dx: '-15px' },
          ].map((ember, i) => (
            <span
              key={i}
              className="absolute bottom-8 h-1 w-1 rounded-full bg-amber-300/40 blur-[0.5px]"
              style={{
                left: ember.left,
                animation: `ember-rise ${ember.dur} ease-in-out infinite`,
                animationDelay: ember.delay,
                ['--drift-x' as any]: ember.dx,
              }}
            />
          ))}
        </div>

        {/* Optional Ambient Background Video (Subtle atmospheric presence at opacity-20) */}
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
              bgVideoLoaded ? 'opacity-20 scale-100' : 'opacity-0 scale-105'
            }`}
          >
            <source src={bgVideoUrl} type="video/mp4" />
          </video>
        ) : null}

        {/* Subtle Vignette Gradient Masks top & bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060B12]/80 via-transparent to-[#060B12]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(6,11,18,0.65)_100%)]" />
      </div>

      {/* ========================================================= */}
      {/* 2. MAIN HERO CONTAINER: LEFT 43% / RIGHT 57% */}
      {/* ========================================================= */}
      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-5 sm:px-8 xl:px-12 pt-28 pb-20 sm:pt-32 sm:pb-24 lg:pt-36 lg:pb-24">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-10 xl:gap-14 w-full">
          {/* ======================================================= */}
          {/* LEFT COLUMN: 43% - Typography, Editorial CTAs & Rating */}
          {/* ======================================================= */}
          <div className="w-full lg:w-[43%] xl:w-[42%] space-y-6 sm:space-y-7 text-left shrink-0 z-10">
            {/* Main Headline: Primary Visual Focus */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-4xl sm:text-5xl lg:text-[3.25rem] xl:text-[4rem] 2xl:text-[4.4rem] font-extrabold leading-[1.08] tracking-[-0.015em] text-white drop-shadow-sm"
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
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-xl font-poppins text-base sm:text-lg leading-relaxed text-slate-300/90 font-normal"
            >
              Discover breathtaking destinations, unforgettable journeys and experiences worth remembering with India&apos;s most trusted travel collective.
            </motion.p>

            {/* Primary & Secondary Action CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-1"
            >
              <Button
                size="xl"
                className="group relative h-13 sm:h-14 px-8 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#F59E0B] to-[#D4AF37] bg-[length:200%_auto] text-[#0A1622] font-poppins font-bold text-sm uppercase tracking-wider shadow-[0_4px_24px_rgba(212,175,55,0.35)] hover:shadow-[0_6px_32px_rgba(212,175,55,0.55)] hover:bg-right transition-all duration-500 cursor-pointer"
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
                className="h-13 sm:h-14 px-7 rounded-full border-white/20 bg-white/5 text-white hover:bg-white/12 hover:border-white/40 backdrop-blur-md font-poppins font-semibold text-sm uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-sm"
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
              transition={{ duration: 0.7, delay: 0.3 }}
              className="pt-7 sm:pt-8 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
            >
              {trustBadges.map((badge, idx) => {
                const Icon = badge.icon
                return (
                  <div key={idx} className="flex items-center gap-2.5">
                    <div className="grid h-9 w-9 sm:h-10 sm:w-10 shrink-0 place-items-center rounded-xl bg-white/[0.07] border border-white/10 backdrop-blur-md">
                      <Icon className={`h-4.5 w-4.5 ${badge.color}`} />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-poppins font-bold text-white tracking-wide">
                        {badge.label}
                      </div>
                      <div className="text-[10px] sm:text-xs text-slate-400 font-poppins truncate max-w-[110px]">
                        {badge.sub}
                      </div>
                    </div>
                  </div>
                )
              })}
            </motion.div>
          </div>

          {/* ======================================================= */}
          {/* RIGHT COLUMN: 57% - Cinematic Video Mosaic */}
          {/* ======================================================= */}
          <div className="w-full lg:w-[57%] xl:w-[58%] grow flex items-center justify-center z-10">
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
