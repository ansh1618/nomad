import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Reveal } from './Reveal'
import { Star, Quote, MapPin, Loader2 } from 'lucide-react'
import { getApprovedReviews } from '@/lib/queries/cms'
import type { ApprovedReview } from '@/lib/queries/cms'

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? 'fill-gold text-gold' : 'text-border'}`}
        />
      ))}
    </div>
  )
}

function ReviewSkeleton() {
  return (
    <div className="h-full rounded-3xl bg-white border border-border p-7 animate-pulse">
      <div className="h-6 w-6 bg-muted rounded mb-3" />
      <div className="space-y-2 flex-1">
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-5/6" />
        <div className="h-3 bg-muted rounded w-4/6" />
      </div>
      <div className="mt-4 mb-4">
        <div className="h-6 bg-muted rounded-full w-32" />
      </div>
      <div className="flex items-center gap-3 border-t border-border pt-4">
        <div className="h-10 w-10 rounded-full bg-muted" />
        <div className="space-y-1.5">
          <div className="h-3 bg-muted rounded w-24" />
          <div className="h-2.5 bg-muted rounded w-32" />
        </div>
      </div>
    </div>
  )
}

// Fallback avatar — initials based
function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const colors = [
    'bg-blue-500', 'bg-purple-500', 'bg-emerald-500',
    'bg-amber-500', 'bg-rose-500', 'bg-indigo-500',
  ]
  const color = colors[name.charCodeAt(0) % colors.length]

  return (
    <div className={`h-10 w-10 rounded-full ${color} flex items-center justify-center border-2 border-gold/20 flex-shrink-0`}>
      <span className="text-white text-xs font-bold">{initials}</span>
    </div>
  )
}

export function Testimonials() {
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews', 'approved'],
    queryFn: () => getApprovedReviews(6),
    staleTime: 1000,
  })

  return (
    <section id="testimonials" className="py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center pb-14">
          <span className="text-xs font-poppins font-bold uppercase tracking-[0.25em] text-gold">
            VERIFIED REVIEWS
          </span>
          <h2 className="mt-3 font-display text-4xl font-bold text-primary sm:text-5xl">
            Explorer Stories
          </h2>
          <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
            Real reviews from real travelers. No paid promotions, no influencer deals — just honest road trip feedback.
          </p>
          {/* Google Reviews badge */}
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white border border-border px-4 py-2 shadow-soft">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="text-xs font-poppins font-bold text-primary">4.9</span>
            <StarRating rating={5} />
            <span className="text-[10px] text-muted-foreground">on Google</span>
          </div>
        </Reveal>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <ReviewSkeleton key={i} />)}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Star className="h-8 w-8 mx-auto mb-3 text-border" />
            <p className="text-sm">Reviews will appear here once approved by admin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r, i) => (
              <Reveal key={r.id} delay={i}>
                <article className="group h-full rounded-3xl bg-white border border-border p-7 shadow-soft hover:border-gold/30 hover:shadow-gold/10 transition-all duration-300 flex flex-col">
                  {/* Quote icon */}
                  <Quote className="h-6 w-6 text-gold/30 mb-3 shrink-0" />

                  {/* Review text */}
                  <p className="text-sm text-foreground/80 leading-relaxed font-sans flex-1">
                    "{r.content}"
                  </p>

                  {/* Trip tag */}
                  {r.journeys?.name && (
                    <div className="mt-4 mb-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-[10px] font-poppins font-semibold text-accent">
                        <MapPin className="h-3 w-3" />
                        {r.journeys.name}
                      </span>
                    </div>
                  )}

                  {/* Reviewer info */}
                  <div className="flex items-center gap-3 border-t border-border pt-4 mt-auto">
                    <Avatar name={r.author_name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-primary truncate flex items-center gap-1.5">
                        {r.author_name}
                        {r.is_verified && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-700 rounded-full px-1.5 py-0.5 font-semibold">
                            Verified
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {r.trip_date && `${r.trip_date} · `}
                        <StarRating rating={r.rating} />
                      </p>
                    </div>
                    <StarRating rating={r.rating} />
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
