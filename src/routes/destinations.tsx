import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Navbar } from '@/components/site/Navbar'
import { Footer } from '@/components/site/Footer'
import { FloatingUI } from '@/components/site/FloatingUI'
import { getDestinations, getJourneys } from '@/lib/queries-client'
import { Search, Compass, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RouteLoadingState, RouteErrorState } from '@/components/site/RouteStates'
import { motion } from 'motion/react'

export const Route = createFileRoute('/destinations')({
  loader: async () => {
    try {
      const [destinations, journeys] = await Promise.all([
        getDestinations(),
        getJourneys(),
      ])
      return { destinations, journeys }
    } catch (err) {
      console.error('[Nomadik Destinations Loader] Failed to load data:', err)
      return { destinations: [], journeys: [] }
    }
  },
  pendingComponent: RouteLoadingState,
  errorComponent: RouteErrorState,
  component: DestinationsCatalogPage,
})

function DestinationsCatalogPage() {
  const { destinations, journeys } = Route.useLoaderData()
  const [activeDifficulty, setActiveDifficulty] = useState<'ALL' | 'EASY' | 'MODERATE' | 'HARD'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Map difficulty level properly
  const getDifficultyCategory = (diff: string): 'EASY' | 'MODERATE' | 'HARD' => {
    const d = (diff || '').toUpperCase()
    if (d.includes('EASY')) return 'EASY'
    if (d.includes('HARD') || d.includes('DIFFICULT') || d.includes('CHALLENGING')) return 'HARD'
    return 'MODERATE'
  }

  const filteredJourneys = journeys.filter((j) => {
    const matchesDifficulty =
      activeDifficulty === 'ALL' || getDifficultyCategory(j.difficulty) === activeDifficulty

    const query = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !query ||
      j.name.toLowerCase().includes(query) ||
      (j.overview && j.overview.toLowerCase().includes(query)) ||
      j.difficulty.toLowerCase().includes(query)

    return matchesDifficulty && matchesSearch
  })

  return (
    <div className="bg-background min-h-screen flex flex-col justify-between">
      <Navbar />

      <main className="flex-1">
        {/* Banner Section */}
        <section className="relative h-[45vh] min-h-[350px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80"
              alt="Himalayan mountain ranges"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-primary/75 via-primary/50 to-background" />
          </div>

          <div className="relative z-10 text-center px-5 max-w-4xl space-y-3 pt-12">
            <span className="text-xs font-poppins font-bold uppercase tracking-[0.25em] text-gold">EXPLORE</span>
            <h1 className="font-display text-4xl sm:text-6xl font-bold text-white tracking-tight">
              All Destinations
            </h1>
            <p className="max-w-xl mx-auto text-sm sm:text-base text-white/80 leading-relaxed font-poppins">
              Choose your escape from our premium, slow-crafted road convoy experiences.
            </p>
          </div>
        </section>

        {/* Catalog Section */}
        <section className="max-w-7xl mx-auto px-5 py-12 space-y-10">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {(['ALL', 'EASY', 'MODERATE', 'HARD'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setActiveDifficulty(diff)}
                  className={`px-5 py-2.5 rounded-full text-xs font-poppins font-bold tracking-wider transition-all border ${
                    activeDifficulty === diff
                      ? 'bg-secondary text-white border-secondary shadow-soft'
                      : 'bg-white hover:bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search destinations..."
                className="pl-9 h-11 bg-white"
              />
            </div>
          </div>

          {/* Grid Layout */}
          {filteredJourneys.length === 0 ? (
            <div className="py-24 text-center text-muted-foreground bg-white border rounded-3xl p-12 max-w-xl mx-auto shadow-soft space-y-4">
              <Compass className="h-12 w-12 text-muted-foreground/50 mx-auto animate-pulse" />
              <h3 className="font-display text-2xl font-bold text-primary">No Destinations Found</h3>
              <p className="text-sm">We couldn't find any trips matching your filters. Try adjusting your search query or difficulty setting.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredJourneys.map((j, i) => {
                const dest = destinations.find((d) => d.slug === j.destinationSlug)
                const regionName = dest?.name || 'India'

                return (
                  <motion.article
                    key={j.slug}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-border bg-card shadow-soft hover:shadow-elegant transition-all duration-500"
                  >
                    {/* Journey Image */}
                    <img
                      src={j.image || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b'}
                      alt={j.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent transition-opacity duration-500" />

                    {/* Tags */}
                    <span className="absolute left-4 top-4 bg-secondary text-white font-poppins font-bold text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-full shadow">
                      {j.difficulty} Trip
                    </span>

                    {/* Footer Content */}
                    <div className="absolute inset-x-0 bottom-0 p-5 space-y-4 text-white flex flex-col justify-end">
                      <div className="space-y-1">
                        <p className="text-[10px] text-accent uppercase font-poppins font-bold tracking-wider flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {regionName}
                        </p>
                        <h3 className="font-display text-xl font-bold leading-tight group-hover:text-accent transition-colors">
                          {j.name}
                        </h3>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                        <div>
                          <span className="text-[9px] text-white/50 block font-poppins uppercase">Starts at</span>
                          <span className="font-display text-base font-bold text-white">{j.price}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="hero"
                          className="h-8 text-[11px] px-3 font-poppins"
                          asChild
                        >
                          <Link to="/journeys/$journeyId" params={{ journeyId: j.slug }}>
                            Book Now
                          </Link>
                        </Button>
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
