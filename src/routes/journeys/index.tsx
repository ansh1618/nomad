import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Navbar } from '@/components/site/Navbar'
import { Footer } from '@/components/site/Footer'
import { FloatingUI } from '@/components/site/FloatingUI'
import { getJourneys, getRealDestinationImage, formatPriceDisplay, STATIC_FALLBACK_JOURNEYS } from '@/lib/queries-client'
import { Search, Compass, MapPin, Clock, Bus, Users, Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { RouteLoadingState, RouteErrorState } from '@/components/site/RouteStates'
import { withTimeout } from '@/lib/promise-timeout'
import { motion } from 'framer-motion'

export const Route = createFileRoute('/journeys/')({
  loader: async () => {
    try {
      const journeys = await withTimeout(getJourneys(), 6000, STATIC_FALLBACK_JOURNEYS)
      return { journeys: journeys?.length > 0 ? journeys : STATIC_FALLBACK_JOURNEYS }
    } catch (err) {
      console.error('[Nomadik Journeys Loader] Failed to load journeys:', err)
      return { journeys: STATIC_FALLBACK_JOURNEYS }
    }
  },
  pendingComponent: RouteLoadingState,
  errorComponent: RouteErrorState,
  head: () => ({
    meta: [
      { title: "Curated Road Journeys & Packages | Nomadik Expeditions" },
      { name: "description", content: "Explore all hand-crafted road travel packages across India. Manali, Jibhi, Udaipur, McLeod Ganj & Chopta." },
    ],
  }),
  component: JourneysCatalogPage,
})

function JourneysCatalogPage() {
  const loaderData = (Route.useLoaderData() || {}) as any;
  const journeys = loaderData?.journeys || [];
  const [activeCategory, setActiveCategory] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredJourneys = (journeys || []).filter((j: any) => {
    const category = (j.category || 'WEEKEND').toUpperCase()
    const matchesCategory =
      activeCategory === 'ALL' || category.includes(activeCategory.toUpperCase())

    const query = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !query ||
      j.name.toLowerCase().includes(query) ||
      (j.overview && j.overview.toLowerCase().includes(query)) ||
      (j.highlights && j.highlights.some((h: string) => h.toLowerCase().includes(query))) ||
      (j.slug && j.slug.toLowerCase().includes(query))

    return matchesCategory && matchesSearch
  })

  return (
    <div className="bg-background min-h-screen flex flex-col justify-between">
      <Navbar />

      <main className="flex-1">
        {/* Hero Banner Section */}
        <section className="relative h-[45vh] min-h-[350px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80"
              alt="Curated Road Journeys"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/60 to-background" />
          </div>

          <div className="relative z-10 text-center px-5 max-w-4xl space-y-3 pt-12">
            <span className="text-xs font-poppins font-bold uppercase tracking-[0.25em] text-gold">
              PACKAGES & EXPEDITIONS
            </span>
            <h1 className="font-display text-4xl sm:text-6xl font-bold text-white tracking-tight">
              Curated Road Journeys
            </h1>
            <p className="max-w-xl mx-auto text-sm sm:text-base text-white/80 leading-relaxed font-poppins">
              Every trip is slow-crafted around road travel, boutique stays, expert captains, and iconic group vibes.
            </p>
          </div>
        </section>

        {/* Catalog Grid Section */}
        <section className="max-w-7xl mx-auto px-5 py-12 space-y-10">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'ALL', label: 'All Packages' },
                { id: 'WEEKEND', label: 'Weekend Escapes' },
                { id: 'BACKPACKING', label: 'Backpacking' },
                { id: 'LUXURY', label: 'Luxury Escapades' },
                { id: 'SPIRITUAL', label: 'Spiritual Trips' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-5 py-2.5 rounded-full text-xs font-poppins font-bold tracking-wider transition-all border ${
                    activeCategory === tab.id
                      ? 'bg-secondary text-white border-secondary shadow-soft'
                      : 'bg-white hover:bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search packages (e.g. Manali, Jibhi)..."
                className="pl-9 h-11 bg-white font-poppins text-xs"
              />
            </div>
          </div>

          {/* Journeys Grid */}
          {filteredJourneys.length === 0 ? (
            <div className="py-24 text-center text-muted-foreground bg-white border rounded-3xl p-12 max-w-xl mx-auto shadow-soft space-y-4">
              <Compass className="h-12 w-12 text-muted-foreground/50 mx-auto animate-pulse" />
              <h3 className="font-display text-2xl font-bold text-primary">No Packages Found</h3>
              <p className="text-sm">We couldn't find any journey package matching your search criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
              {filteredJourneys.map((j: any, i: number) => {
                const s = (j.slug || '').toLowerCase()
                const cardImg =
                  j.hero_banner ||
                  j.cover_image ||
                  getRealDestinationImage(j.slug, j.hero_banner)

                return (
                  <motion.article
                    key={j.id || j.slug}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="group flex flex-col h-full rounded-3xl overflow-hidden border border-border bg-white shadow-soft hover:shadow-elegant transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Hero Image */}
                    <div className="relative h-60 w-full overflow-hidden bg-muted">
                      <img
                        src={cardImg}
                        alt={j.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget
                          target.onerror = null
                          if (s.includes('manali')) target.src = '/images/manali/manali-snow-valley.jpg'
                          else if (s.includes('jibhi')) target.src = '/images/jibhi/jibhi-raghupur-fort-temple.jpg'
                          else if (s.includes('udaipur')) target.src = '/images/udaipur-palace.png'
                          else if (s.includes('mcleod')) target.src = '/images/mcleodganj/mcleodganj-town-view.jpg'
                          else target.src = 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80'
                        }}
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                        <span className="bg-[#0F2942]/90 backdrop-blur-md text-white font-poppins font-bold text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-full shadow">
                          {j.duration || '3N / 4D'}
                        </span>
                        <span className="bg-gold/90 text-primary font-poppins font-bold text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-full shadow">
                          {j.difficulty || 'EASY'}
                        </span>
                      </div>

                      {/* Title on Image */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <h2 className="font-display text-2xl font-bold text-white leading-tight drop-shadow">
                          {j.name}
                        </h2>
                      </div>
                    </div>

                    {/* Card Content Body */}
                    <div className="p-6 flex flex-col justify-between flex-1 bg-white space-y-5">
                      {/* Key Quick Metrics */}
                      <div className="grid grid-cols-2 gap-3 text-xs font-poppins text-muted-foreground border-b border-border pb-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gold shrink-0" />
                          <span>{j.duration || '3N / 4D'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Bus className="h-4 w-4 text-gold shrink-0" />
                          <span className="truncate">{j.transport?.vehicle_name || j.transport || 'AC Tempo Traveller'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gold shrink-0" />
                          <span>{j.groupSize || (j.group_size_max ? `Max ${j.group_size_max}` : '12-18 Explorers')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-gold shrink-0" />
                          <span>{j.stayInfo || j.hotel?.name || 'Verified Stays'}</span>
                        </div>
                      </div>

                      {/* Highlights */}
                      {j.highlights && j.highlights.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground">
                            Highlights:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {j.highlights.slice(0, 4).map((h: string, idx: number) => (
                              <span
                                key={idx}
                                className="bg-muted text-primary text-[10px] font-poppins font-medium px-2.5 py-1 rounded-md"
                              >
                                ✦ {h}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Card Footer Price & Book CTA */}
                      <div className="pt-4 border-t border-border flex items-center justify-between mt-auto">
                        <div>
                          <span className="text-[9px] text-muted-foreground uppercase font-poppins font-bold block tracking-wider">
                            Starting from
                          </span>
                          <p className="font-display text-xl font-bold text-primary">
                            {formatPriceDisplay(j.starting_price || j.price)}
                            <span className="text-xs font-normal text-muted-foreground"> /person</span>
                          </p>
                        </div>

                        <Link
                          to={`/journeys/${j.slug}` as any}
                          className="bg-secondary text-white font-poppins font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-[#D97706] transition-all shadow-soft flex items-center gap-1"
                        >
                          View Package →
                        </Link>
                      </div>
                    </div>
                  </motion.article>
                )
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
      <FloatingUI />
    </div>
  )
}
