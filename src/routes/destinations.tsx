import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Navbar } from '@/components/site/Navbar'
import { Footer } from '@/components/site/Footer'
import { FloatingUI } from '@/components/site/FloatingUI'
import { getDestinations, getJourneys, getRealDestinationImage, STATIC_FALLBACK_DESTINATIONS, STATIC_FALLBACK_JOURNEYS } from '@/lib/queries-client'
import { Search, Compass, MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { RouteLoadingState, RouteErrorState } from '@/components/site/RouteStates'
import { withTimeout } from '@/lib/promise-timeout'
import { motion } from 'framer-motion'

export const Route = createFileRoute('/destinations')({
  loader: async () => {
    try {
      const [destinations, journeys] = await Promise.all([
        getDestinations(),
        getJourneys(),
      ])
      return { destinations: destinations || [], journeys: journeys || [] }
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
  const loaderData = (Route.useLoaderData() || {}) as any;
  const destinations = loaderData?.destinations || [];
  const journeys = loaderData?.journeys || [];
  const [searchQuery, setSearchQuery] = useState('')

  const filteredDestinations = (destinations || []).filter((d: any) => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return true
    return (
      d.name.toLowerCase().includes(query) ||
      (d.state && d.state.toLowerCase().includes(query)) ||
      (d.description && d.description.toLowerCase().includes(query)) ||
      (d.slug && d.slug.toLowerCase().includes(query))
    )
  })

  return (
    <div className="bg-background min-h-screen flex flex-col justify-between">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[45vh] min-h-[350px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80"
              alt="Himalayan destinations"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/50 to-background" />
          </div>

          <div className="relative z-10 text-center px-5 max-w-4xl space-y-3 pt-12">
            <span className="text-xs font-poppins font-bold uppercase tracking-[0.25em] text-gold">EXPLORE PLACES</span>
            <h1 className="font-display text-4xl sm:text-6xl font-bold text-white tracking-tight">
              All Destinations
            </h1>
            <p className="max-w-xl mx-auto text-sm sm:text-base text-white/80 leading-relaxed font-poppins">
              Discover iconic Himalayan valleys, historic desert forts, and sacred river ghats crafted for slow road travel.
            </p>
          </div>
        </section>

        {/* Places Grid Section */}
        <section className="max-w-7xl mx-auto px-5 py-12 space-y-10">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
            <h2 className="font-display text-2xl font-bold text-primary">
              Featured Destinations ({filteredDestinations.length})
            </h2>

            {/* Search Input */}
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search places (e.g. Manali, Jibhi, Udaipur)..."
                className="pl-9 h-11 bg-white font-poppins text-xs"
              />
            </div>
          </div>

          {/* Grid Layout of Destination Places */}
          {filteredDestinations.length === 0 ? (
            <div className="py-24 text-center text-muted-foreground bg-white border rounded-3xl p-12 max-w-xl mx-auto shadow-soft space-y-4">
              <Compass className="h-12 w-12 text-muted-foreground/50 mx-auto animate-pulse" />
              <h3 className="font-display text-2xl font-bold text-primary">No Destinations Found</h3>
              <p className="text-sm">We couldn't find any place matching your search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
              {filteredDestinations.map((d: any, i: number) => {
                const availablePackagesCount = (journeys || []).filter(
                  (j: any) =>
                    j.destination_id === d.id ||
                    j.destinationSlug === d.slug ||
                    (j.slug && j.slug.includes(d.slug))
                ).length;

                const getSafeDestImg = () => {
                  const raw = d.hero_image || d.thumbnail || d.cover_image;
                  const resolved = getRealDestinationImage(d.slug, raw);
                  if (!resolved || resolved.includes('media') || resolved.includes('178') || resolved.includes('schema')) {
                    if (d.slug.includes('manali')) return '/images/manali/manali-snow-valley.jpg';
                    if (d.slug.includes('jibhi')) return '/images/jibhi/jibhi-raghupur-fort-temple.jpg';
                    if (d.slug.includes('udaipur')) return '/images/udaipur-palace.png';
                    if (d.slug.includes('mcleod')) return '/images/mcleodganj/mcleodganj-town-view.jpg';
                    return 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80';
                  }
                  return resolved;
                };

                const destImg = getSafeDestImg();

                return (
                  <motion.article
                    key={d.id || d.slug}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="group flex flex-col h-full rounded-3xl overflow-hidden border border-border bg-white shadow-soft hover:shadow-elegant transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Top Image */}
                    <div className="relative h-64 w-full overflow-hidden bg-muted">
                      <img
                        src={destImg}
                        alt={d.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.onerror = null;
                          if (d.slug.includes('manali')) target.src = '/images/manali/manali-snow-valley.jpg';
                          else if (d.slug.includes('jibhi')) target.src = '/images/jibhi/jibhi-raghupur-fort-temple.jpg';
                          else if (d.slug.includes('udaipur')) target.src = '/images/udaipur-palace.png';
                          else if (d.slug.includes('mcleod')) target.src = '/images/mcleodganj/mcleodganj-town-view.jpg';
                          else target.src = 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80';
                        }}
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                      {/* Packages Badge Top-Right */}
                      <span className="absolute right-4 top-4 bg-[#0F2942]/90 backdrop-blur-md text-gold font-poppins font-bold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow">
                        {availablePackagesCount} {availablePackagesCount === 1 ? 'Package' : 'Packages'} Available
                      </span>

                      {/* Name & Region on Hero Overlay */}
                      <div className="absolute bottom-4 left-5 right-5">
                        <p className="text-[11px] text-gold font-poppins font-bold uppercase tracking-widest flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-gold shrink-0" />
                          {d.subtitle || `${d.state || 'Himalayas'}, ${d.country || 'India'}`}
                        </p>
                        <h3 className="font-display text-3xl font-bold text-white tracking-wide mt-0.5">
                          {d.name}
                        </h3>
                      </div>
                    </div>

                    {/* Bottom White Section */}
                    <div className="p-6 flex flex-col justify-between flex-1 bg-white space-y-4">
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed font-poppins">
                        {d.description || `Explore ${d.name} with Nomadik's curated road trip itineraries, handpicked boutique stays, and local coordinators.`}
                      </p>

                      {/* Footer CTA Button */}
                      <div className="pt-4 border-t border-border mt-auto flex justify-end">
                        <Link
                          to={`/destinations/${d.slug}` as any}
                          className="bg-primary text-white font-poppins font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-secondary transition-all shadow-soft flex items-center gap-1"
                        >
                          Explore {d.name} →
                        </Link>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
      <FloatingUI />
    </div>
  );
}
