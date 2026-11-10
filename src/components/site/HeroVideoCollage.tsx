import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  MapPin,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Instagram,
  ArrowRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'
import { HeroVideoCard, HeroVideoSettings } from '@/lib/queries/hero-videos'

interface HeroVideoCollageProps {
  cards: HeroVideoCard[]
  settings: HeroVideoSettings
  onOpenPreview: (card: HeroVideoCard) => void
}

/**
 * Individual Single Video Card with IntersectionObserver autoplay/pause,
 * poster fallback, and glassmorphism destination pill.
 */
function CollageCardItem({
  card,
  index,
  isFeatured = false,
  desktopPositionClass = '',
  onOpenPreview,
}: {
  card: HeroVideoCard
  index: number
  isFeatured?: boolean
  desktopPositionClass?: string
  onOpenPreview: (card: HeroVideoCard) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Pause when scrolled out of viewport, play when visible
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!videoRef.current || hasError) return
          if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
            if (card.autoplay !== false) {
              videoRef.current
                .play()
                .then(() => setIsPlaying(true))
                .catch(() => {
                  // Browser blocked autoplay
                  setIsPlaying(false)
                })
            }
          } else {
            videoRef.current.pause()
            setIsPlaying(false)
          }
        })
      },
      { threshold: [0, 0.25, 0.5] }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasError, card.autoplay])

  // Floating animation offset per index
  const floatDuration = 4.5 + (index % 3) * 0.8
  const floatDelay = (index % 4) * 0.4

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{
        opacity: 1,
        y: [0, -8, 0],
        scale: 1,
      }}
      transition={{
        opacity: { duration: 0.7, delay: index * 0.12 },
        y: {
          duration: floatDuration,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: floatDelay,
        },
      }}
      whileHover={{
        scale: 1.04,
        zIndex: 50,
        transition: { duration: 0.25 },
      }}
      className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/15 bg-slate-900/90 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-md cursor-pointer select-none transition-shadow duration-300 hover:shadow-[0_25px_60px_rgba(212,175,55,0.25)] hover:border-amber-400/40 ${desktopPositionClass}`}
      onClick={() => onOpenPreview(card)}
    >
      {/* 1. Video Element */}
      {!hasError && card.video_url ? (
        <video
          ref={videoRef}
          src={card.video_url}
          autoPlay={card.autoplay ?? true}
          loop={card.loop ?? true}
          muted
          playsInline
          preload="metadata"
          poster={card.thumbnail_url}
          onLoadedData={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`h-full w-full object-cover transition-opacity duration-700 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ) : null}

      {/* 2. Fallback Poster Image */}
      {(!isLoaded || hasError) && card.thumbnail_url && (
        <img
          src={card.thumbnail_url}
          alt={card.title}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
      )}

      {/* 3. Multi-layer Dark Gradient Overlays for crystal clear text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-80" />
      <div className="absolute inset-0 bg-black/20" />

      {/* 4. Top Badges: Destination Pill & Live Indicator */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-950/80 px-2.5 py-1 text-[11px] font-semibold text-amber-300 backdrop-blur-md border border-white/10 shadow-xs">
          <MapPin className="h-3 w-3 text-amber-400 shrink-0" />
          <span className="truncate max-w-[130px] tracking-wide">
            {card.destination_name || 'Himalayas'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {card.instagram_url && (
            <div
              className="p-1 rounded-full bg-black/60 text-pink-400 hover:text-white backdrop-blur-md border border-white/10 transition-colors"
              title="Instagram Reel"
              onClick={(e) => {
                e.stopPropagation()
                window.open(card.instagram_url!, '_blank', 'noopener,noreferrer')
              }}
            >
              <Instagram className="h-3 w-3" />
            </div>
          )}
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white/90 backdrop-blur-md border border-white/10">
            <Maximize2 className="h-2.5 w-2.5 opacity-80 group-hover:opacity-100" />
          </div>
        </div>
      </div>

      {/* 5. Bottom Metadata: Title, Hook Caption & Tap to Watch */}
      <div className="absolute bottom-0 inset-x-0 p-3.5 sm:p-4 z-10 flex flex-col justify-end">
        <h4 className="font-display text-xs sm:text-sm font-bold text-white tracking-wide leading-snug drop-shadow-sm group-hover:text-amber-300 transition-colors line-clamp-1">
          {card.title}
        </h4>

        {card.caption && isFeatured && (
          <p className="mt-1 text-[11px] text-white/80 line-clamp-2 leading-relaxed drop-shadow-xs hidden sm:block">
            {card.caption}
          </p>
        )}

        <div className="mt-2 flex items-center justify-between text-[10px] text-amber-400/90 font-medium">
          <span className="inline-flex items-center gap-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
            </span>
            Watch Story
          </span>
          <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </div>
    </motion.div>
  )
}

export function HeroVideoCollage({ cards, settings, onOpenPreview }: HeroVideoCollageProps) {
  const activeCards = cards.filter((c) => c.is_active)
  const displayCards = activeCards.slice(0, settings.max_visible_cards || 5)

  // Carousel scroll ref for mobile
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [scrollIndex, setScrollIndex] = useState(0)

  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    const { scrollLeft, clientWidth } = scrollContainerRef.current
    const newIdx = Math.round(scrollLeft / clientWidth)
    setScrollIndex(newIdx)
  }

  const scrollPrev = () => {
    if (!scrollContainerRef.current) return
    scrollContainerRef.current.scrollBy({ left: -280, behavior: 'smooth' })
  }

  const scrollNext = () => {
    if (!scrollContainerRef.current) return
    scrollContainerRef.current.scrollBy({ left: 280, behavior: 'smooth' })
  }

  if (displayCards.length === 0) return null

  // Helper for desktop positioning styles in 5-card floating collage
  const getDesktopClasses = (card: HeroVideoCard, index: number) => {
    // We map by index or layout_position
    switch (index) {
      case 0:
        // Center featured large card
        return 'w-[320px] lg:w-[380px] xl:w-[410px] aspect-[16/10] z-20 mx-auto'
      case 1:
        // Top right portrait card (snow peaks)
        return 'w-[170px] lg:w-[200px] xl:w-[220px] aspect-[9/16] absolute -top-8 -right-2 lg:-right-6 z-15'
      case 2:
        // Bottom right compact card (bonfire)
        return 'w-[190px] lg:w-[225px] xl:w-[245px] aspect-[4/3] absolute -bottom-8 -right-2 lg:right-0 z-30'
      case 3:
        // Bottom left winding road card
        return 'w-[200px] lg:w-[240px] xl:w-[260px] aspect-[16/10] absolute -bottom-10 -left-4 lg:-left-10 z-25'
      case 4:
        // Top left portrait card (community)
        return 'w-[165px] lg:w-[190px] xl:w-[205px] aspect-[9/16] absolute -top-10 -left-4 lg:-left-8 z-10'
      default:
        return 'w-[220px] aspect-video'
    }
  }

  return (
    <div className="w-full">
      {/* ========================================================== */}
      {/* 1. DESKTOP / TABLET COLLAGE LAYOUT (md and up) */}
      {/* ========================================================== */}
      <div className="hidden md:flex relative min-h-[520px] lg:min-h-[580px] xl:min-h-[620px] w-full items-center justify-center py-6">
        {/* Subtle ambient glow behind collage */}
        <div className="pointer-events-none absolute h-[360px] w-[360px] lg:h-[460px] lg:w-[460px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.12)_0%,rgba(15,41,66,0)_70%)] blur-2xl" />

        {displayCards.map((card, idx) => (
          <CollageCardItem
            key={card.id}
            card={card}
            index={idx}
            isFeatured={idx === 0}
            desktopPositionClass={getDesktopClasses(card, idx)}
            onOpenPreview={onOpenPreview}
          />
        ))}
      </div>

      {/* ========================================================== */}
      {/* 2. MOBILE TOUCH-SWIPEABLE HORIZONTAL CAROUSEL (< md) */}
      {/* ========================================================== */}
      <div className="md:hidden relative w-full pt-4 pb-2">
        {/* Carousel controls header */}
        <div className="flex items-center justify-between px-1 mb-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Featured Road Stories</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={scrollPrev}
              aria-label="Previous video"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={scrollNext}
              aria-label="Next video"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Track */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-3.5 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-none px-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayCards.map((card, idx) => (
            <div
              key={card.id}
              className="w-[260px] shrink-0 snap-start aspect-[4/5]"
            >
              <CollageCardItem
                card={card}
                index={idx}
                isFeatured={true}
                desktopPositionClass="h-full w-full"
                onOpenPreview={onOpenPreview}
              />
            </div>
          ))}
        </div>

        {/* Carousel Pagination Dots */}
        <div className="flex justify-center items-center gap-1.5 pt-1">
          {displayCards.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                scrollIndex === i ? 'w-5 bg-amber-400' : 'w-1.5 bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

