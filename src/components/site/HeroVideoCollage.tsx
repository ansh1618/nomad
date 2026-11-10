import { useState, useRef, useEffect } from 'react'
import { motion } from 'motion/react'
import {
  MapPin,
  Play,
  Maximize2,
  Instagram,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { HeroVideoCard, HeroVideoSettings } from '@/lib/queries/hero-videos'

interface HeroVideoCollageProps {
  cards: HeroVideoCard[]
  settings: HeroVideoSettings
  onOpenPreview: (card: HeroVideoCard) => void
}

/**
 * Extracts a clean, concise destination name (e.g. "Spiti Valley", "Kedarkantha", "Jibhi")
 */
function getShortDestination(card: HeroVideoCard): string {
  if (card.destination_name?.trim()) {
    const raw = card.destination_name.trim()
    // If long with '&' or 'Expedition', trim gracefully
    if (raw.length > 22 && raw.includes('&')) {
      return raw.split('&')[0].trim()
    }
    return raw
  }
  return card.title?.trim() || 'Himalayas'
}

/**
 * Single Cinematic Video Card
 * - Large rounded corners (20-26px)
 * - 95%+ purely visible travel video
 * - Only small destination pill at bottom-left
 * - Subtle dark gradient at bottom only
 * - Autoplay, muted, loop, playsInline with IntersectionObserver
 */
function CinematicMosaicCard({
  card,
  index,
  className = '',
  onOpenPreview,
}: {
  card: HeroVideoCard
  index: number
  className?: string
  onOpenPreview: (card: HeroVideoCard) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hasError, setHasError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Autoplay when visible in viewport, pause when scrolled away
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!videoRef.current || hasError) return
          if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
            if (card.autoplay !== false) {
              videoRef.current
                .play()
                .catch(() => {
                  // Autoplay blocked by browser policy
                })
            }
          } else {
            videoRef.current.pause()
          }
        })
      },
      { threshold: [0, 0.2, 0.5] }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasError, card.autoplay])

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.08 * index }}
      whileHover={{ scale: 1.018 }}
      className={`group relative overflow-hidden rounded-[22px] lg:rounded-[26px] bg-slate-900 border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.5)] cursor-pointer select-none transition-all duration-300 hover:border-amber-400/40 hover:shadow-[0_16px_48px_rgba(212,175,55,0.2)] ${className}`}
      onClick={() => onOpenPreview(card)}
    >
      {/* 1. Muted Autoplay Video */}
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
          className={`h-full w-full object-cover transition-opacity duration-500 ${
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

      {/* 3. Subtle bottom gradient only (leaves top 75% video totally clean) */}
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

      {/* 4. Top-Right Subtle Icons (Instagram or Expand on Hover) */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10 opacity-70 group-hover:opacity-100 transition-opacity">
        {card.instagram_url && (
          <div
            className="p-1.5 rounded-full bg-black/50 text-pink-300 hover:text-white backdrop-blur-md border border-white/10 transition-colors"
            title="Instagram Reel"
            onClick={(e) => {
              e.stopPropagation()
              window.open(card.instagram_url!, '_blank', 'noopener,noreferrer')
            }}
          >
            <Instagram className="h-3 w-3" />
          </div>
        )}
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white/90 backdrop-blur-md border border-white/10">
          <Maximize2 className="h-2.5 w-2.5 opacity-80 group-hover:opacity-100" />
        </div>
      </div>

      {/* 5. ONLY Destination Name at Bottom-Left */}
      <div className="absolute bottom-3.5 left-3.5 z-10 flex items-center gap-1.5 pointer-events-none">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white/95 backdrop-blur-md border border-white/15 shadow-sm">
          <MapPin className="h-3 w-3 text-[#F59E0B] shrink-0" />
          <span className="tracking-wide">{getShortDestination(card)}</span>
        </div>
      </div>

      {/* 6. Soft Play Overlay on Hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="h-11 w-11 rounded-full bg-black/60 text-white/95 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg transition-transform transform group-hover:scale-105">
          <Play className="h-5 w-5 fill-current ml-0.5 text-amber-400" />
        </div>
      </div>
    </motion.div>
  )
}

export function HeroVideoCollage({ cards, settings, onOpenPreview }: HeroVideoCollageProps) {
  const activeCards = cards.filter((c) => c.is_active)
  const displayCards = activeCards.slice(0, settings.max_visible_cards || 5)

  // Carousel ref for mobile
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
    scrollContainerRef.current.scrollBy({ left: -240, behavior: 'smooth' })
  }

  const scrollNext = () => {
    if (!scrollContainerRef.current) return
    scrollContainerRef.current.scrollBy({ left: 240, behavior: 'smooth' })
  }

  if (displayCards.length === 0) return null

  // Ensure 5 distinct cards (with fallbacks if fewer than 5)
  const card0 = displayCards[0]
  const card1 = displayCards[1] || displayCards[0]
  const card2 = displayCards[2] || displayCards[0]
  const card3 = displayCards[3] || displayCards[1] || displayCards[0]
  const card4 = displayCards[4] || displayCards[2] || displayCards[0]

  return (
    <div className="w-full">
      {/* ========================================================== */}
      {/* 1. DESKTOP CINEMATIC MOSAIC LAYOUT (lg & xl >= 1024px) */}
      {/* Utilizes 100% of the right 57% space with large, balanced mosaic */}
      {/* ========================================================== */}
      <div className="hidden lg:flex w-full h-[580px] xl:h-[620px] 2xl:h-[650px] gap-3.5 xl:gap-4 select-none">
        {/* Column A (~58% width): Large Featured Video on Top + 2 Landscape Videos on Bottom */}
        <div className="flex flex-col gap-3.5 xl:gap-4 w-[58%] h-full">
          {/* Top Featured Large Landscape Video (~58% height) */}
          <div className="h-[58%] w-full">
            <CinematicMosaicCard
              card={card0}
              index={0}
              className="h-full w-full"
              onOpenPreview={onOpenPreview}
            />
          </div>

          {/* Bottom Row (~42% height): 2 Side-by-side Landscape Cards */}
          <div className="h-[42%] w-full flex gap-3.5 xl:gap-4">
            <div className="w-1/2 h-full">
              <CinematicMosaicCard
                card={card2}
                index={2}
                className="h-full w-full"
                onOpenPreview={onOpenPreview}
              />
            </div>
            <div className="w-1/2 h-full">
              <CinematicMosaicCard
                card={card3}
                index={3}
                className="h-full w-full"
                onOpenPreview={onOpenPreview}
              />
            </div>
          </div>
        </div>

        {/* Column B (~42% width): Medium Portrait Video on Top + Community Video on Bottom */}
        <div className="flex flex-col gap-3.5 xl:gap-4 w-[42%] h-full">
          {/* Top Portrait Video (~54% height) */}
          <div className="h-[54%] w-full">
            <CinematicMosaicCard
              card={card1}
              index={1}
              className="h-full w-full"
              onOpenPreview={onOpenPreview}
            />
          </div>

          {/* Bottom Community Video (~46% height) */}
          <div className="h-[46%] w-full">
            <CinematicMosaicCard
              card={card4}
              index={4}
              className="h-full w-full"
              onOpenPreview={onOpenPreview}
            />
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 2. TABLET 2-COLUMN BALANCED GRID (md >= 768px and < 1024px) */}
      {/* ========================================================== */}
      <div className="hidden md:grid lg:hidden grid-cols-2 gap-4 w-full h-[480px]">
        {/* Left Column: Big Featured Video */}
        <div className="h-full w-full">
          <CinematicMosaicCard
            card={card0}
            index={0}
            className="h-full w-full"
            onOpenPreview={onOpenPreview}
          />
        </div>

        {/* Right Column: 2 Stacked Videos */}
        <div className="flex flex-col gap-4 h-full w-full">
          <div className="h-1/2 w-full">
            <CinematicMosaicCard
              card={card1}
              index={1}
              className="h-full w-full"
              onOpenPreview={onOpenPreview}
            />
          </div>
          <div className="h-1/2 w-full">
            <CinematicMosaicCard
              card={card2}
              index={2}
              className="h-full w-full"
              onOpenPreview={onOpenPreview}
            />
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 3. MOBILE ADAPTIVE VIEW (< 768px) */}
      {/* Large Primary Featured Video + Horizontal Swipeable Gallery Below */}
      {/* ========================================================== */}
      <div className="md:hidden flex flex-col gap-3.5 w-full pt-2">
        {/* Primary Large Featured Video Card */}
        <div className="w-full aspect-[16/10] sm:aspect-[16/9] min-h-[220px]">
          <CinematicMosaicCard
            card={card0}
            index={0}
            className="h-full w-full"
            onOpenPreview={onOpenPreview}
          />
        </div>

        {/* Secondary Swipeable Gallery */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
              More Expeditions
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={scrollPrev}
                aria-label="Previous"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={scrollNext}
                aria-label="Next"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none px-0.5"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {displayCards.slice(1).map((card, idx) => (
              <div
                key={card.id}
                className="w-[190px] sm:w-[210px] shrink-0 snap-start aspect-[3/4]"
              >
                <CinematicMosaicCard
                  card={card}
                  index={idx + 1}
                  className="h-full w-full"
                  onOpenPreview={onOpenPreview}
                />
              </div>
            ))}
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center items-center gap-1.5 pt-0.5">
            {displayCards.slice(1).map((_, i) => (
              <span
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  scrollIndex === i ? 'w-4 bg-amber-400' : 'w-1 bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
