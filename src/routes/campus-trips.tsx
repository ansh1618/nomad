import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  GraduationCap,
  Bus,
  ShieldCheck,
  Flame,
  Users,
  Camera,
  Star,
  Clock,
  Calendar,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Building2,
  MapPin,
  Tag,
  Check
} from 'lucide-react'
import { Navbar } from '@/components/site/Navbar'
import { Footer } from '@/components/site/Footer'
import { FloatingUI } from '@/components/site/FloatingUI'
import { Reveal } from '@/components/site/Reveal'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/campus-trips')({
  head: () => ({
    meta: [
      { title: 'Nomadik × North Campus — Exclusive Student Road Trips' },
      {
        name: 'description',
        content:
          'Exclusive student road trips designed for DU North Campus students. Manali & Udaipur weekend escapes starting at ₹5,999 with verified stays, bonfire nights & certified captains.',
      },
    ],
  }),
  component: CampusTripsPage,
})

function CampusTripsPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  const packages = [
    {
      id: 'manali-weekend',
      name: 'Manali Weekend Escape',
      slug: 'manali-weekend',
      duration: '2N / 3D',
      price: '₹5,999',
      priceNumber: 5999,
      launchDate: '14 August',
      tagline: 'Solang Valley, Atal Tunnel, Old Manali Cafes & Riverside Camping',
      image: '/images/campus/manali.jpg',
      fallbackImg: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
      destination: 'Manali, Himachal Pradesh',
      badges: ['Student Exclusive', 'Verified Stay', 'Weekend Escape', 'Launching 14 Aug'],
      highlights: [
        'Overnight Volvo / AC Traveller Ride',
        '3-Star Hotel Stay with Mountain Views',
        'DJ Night & Bonfire with College Squad',
        'Solang Valley & Atal Tunnel Excursion',
        'Daily Breakfast & Dinner Included'
      ]
    },
    {
      id: 'udaipur-weekend',
      name: 'Udaipur Royal Escape',
      slug: 'udaipur-weekend',
      duration: '2N / 3D',
      price: '₹5,999',
      priceNumber: 5999,
      launchDate: '14 August',
      tagline: 'Lake Pichola Sunset Boat Ride, City Palace & Poolside Music Party',
      image: '/images/campus/udaipur.jpg',
      fallbackImg: 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=800&q=80',
      destination: 'Udaipur, Rajasthan',
      badges: ['Student Exclusive', 'Verified Stay', 'Weekend Escape', 'Launching 14 Aug'],
      highlights: [
        'AC Luxury Bus / Conveyance',
        'Heritage Hotel Stay with Poolside Lounge',
        'Lake Pichola Sunset & Ghat Exploration',
        'Bahubali Hills & Fateh Sagar Sunset',
        'Daily Breakfast & Dinner Included'
      ]
    }
  ]

  const benefits = [
    {
      icon: Tag,
      title: 'Student Special Pricing',
      desc: 'Guaranteed best student rates starting at ₹5,999 all-inclusive with zero hidden costs.'
    },
    {
      icon: Building2,
      title: 'Verified Hotels & Stays',
      desc: 'Handpicked 3-star & boutique properties checked for quality, safety and comfort.'
    },
    {
      icon: Users,
      title: 'Community Travel',
      desc: 'Connect & bond with fellow North Campus students across different DU colleges.'
    },
    {
      icon: Camera,
      title: 'Photography & Content',
      desc: 'Professional Trip Captain coverage & curated photo ops at iconic viewpoints.'
    },
    {
      icon: Flame,
      title: 'Bonfire & Music Nights',
      desc: 'Atmospheric campfire jam sessions, DJ nights & acoustic evening chillouts.'
    },
    {
      icon: ShieldCheck,
      title: 'Safe for Solo Travelers',
      desc: 'Certified Trip Captains, female-friendly stays & 24/7 on-ground assistance.'
    }
  ]

  const faqs = [
    {
      q: 'Who can join the Nomadik × North Campus trips?',
      a: 'All Delhi University (DU) North Campus students are eligible to join! Students from colleges like Hansraj, SRCC, Hindu, Miranda House, Kirori Mal, Ramjas, Khalsa, etc., can travel together. A valid College ID card is mandatory during boarding.'
    },
    {
      q: 'Is female safety ensured for solo travelers?',
      a: 'Yes, absolutely! Female and solo traveler safety is our highest priority. We provide verified luxury stays, 24/7 emergency support, experienced certified Trip Captains, and zero tolerance for misbehavior.'
    },
    {
      q: 'Where is the departure pickup point?',
      a: 'All convoys depart conveniently from North Campus pickup points (Vishwavidyalaya Metro Station / GTB Nagar / Iffco Chowk) for effortless boarding.'
    },
    {
      q: 'What is included in the ₹5,999 student price?',
      a: 'The price includes roundtrip AC transport from Delhi, 2 Nights stay in verified hotels/resorts, daily breakfast & dinner, bonfire music sessions, and end-to-end Trip Captain support.'
    },
    {
      q: 'Can students from other DU colleges or non-DU friends join?',
      a: 'Yes! While curated primarily for DU North Campus, college friends from other campuses or universities are welcome as long as they hold a valid college ID.'
    }
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between overflow-x-hidden">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0A1628] via-[#0D1D35] to-[#060E1A] pt-28 pb-20 text-white border-b border-amber-500/20">
          <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

          <div className="mx-auto max-w-7xl px-5 relative z-10">
            <Reveal className="mx-auto max-w-3xl text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-poppins font-semibold uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                University Collaboration Series
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white">
                Nomadik <span className="font-serif italic text-amber-400 font-normal">×</span> North Campus
              </h1>

              <p className="text-lg sm:text-xl text-slate-300 font-sans font-light leading-relaxed">
                Exclusive Student Road Trips • Curated for DU North Campus Explorers.
              </p>

              <div className="pt-4 flex flex-wrap items-center justify-center gap-3 text-xs font-poppins font-medium">
                <span className="bg-white/10 border border-white/15 px-3.5 py-1.5 rounded-full text-slate-200">
                  🎓 Student ID Mandatory
                </span>
                <span className="bg-amber-500/20 border border-amber-500/40 text-amber-300 px-3.5 py-1.5 rounded-full">
                  🚀 Launching 14 August
                </span>
                <span className="bg-white/10 border border-white/15 px-3.5 py-1.5 rounded-full text-slate-200">
                  💰 Flat ₹5,999 / Person
                </span>
              </div>
            </Reveal>
          </div>
        </section>

        {/* PACKAGE CARDS SECTION (ONLY TWO PACKAGES) */}
        <section className="mx-auto max-w-7xl px-5 py-16">
          <Reveal className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-poppins font-bold uppercase tracking-[0.25em] text-gold">EXCLUSIVE CAMPUS EDITIONS</span>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-primary">
              Handpicked Student Getaways
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Limited slots open for DU North Campus batch departure on <strong className="text-foreground">14 August</strong>.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {packages.map((pkg, idx) => (
              <Reveal key={pkg.id} delay={idx} className="h-full">
                <div className="group flex flex-col h-full overflow-hidden rounded-3xl bg-card border border-border shadow-soft hover:shadow-xl transition-all duration-300">
                  {/* Card Image */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
                    <img
                      src={pkg.image}
                      alt={pkg.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLElement).setAttribute('src', pkg.fallbackImg);
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                      <span className="bg-amber-500 text-slate-950 text-[10px] font-poppins font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow">
                        Student Exclusive
                      </span>
                      <span className="bg-white/95 backdrop-blur-md text-primary text-[10px] font-poppins font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
                        <Star className="h-3.5 w-3.5 fill-gold text-gold" /> 4.9 Rating
                      </span>
                    </div>

                    {/* Bottom Image Info */}
                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white text-xs font-poppins font-semibold">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-amber-400" /> {pkg.destination}
                      </span>
                      <span className="bg-black/40 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-amber-300">
                        {pkg.duration}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="flex-1 p-6 flex flex-col justify-between space-y-6">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h3 className="font-display text-2xl font-bold text-primary group-hover:text-accent transition-colors">
                          {pkg.name}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {pkg.tagline}
                      </p>

                      {/* Highlights */}
                      <ul className="mt-4 space-y-2 border-t border-b border-border py-4">
                        {pkg.highlights.map((h, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs font-poppins text-foreground">
                            <Check className="h-3.5 w-3.5 text-accent shrink-0" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Footer: Price & CTAs */}
                    <div className="pt-2 flex items-center justify-between gap-4">
                      <div>
                        <span className="block text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Special Student Price</span>
                        <span className="font-display text-2xl font-extrabold text-primary">
                          {pkg.price}
                          <span className="text-xs font-sans text-muted-foreground font-normal"> / person</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link to={`/journeys/${pkg.slug}`}>
                          <Button variant="outline" className="rounded-xl text-xs font-poppins font-bold px-4 py-2">
                            View Details
                          </Button>
                        </Link>
                        <Link to={`/journeys/${pkg.slug}`}>
                          <Button className="rounded-xl bg-gold-gradient text-gold-foreground font-poppins font-bold text-xs px-4 py-2 shadow-gold hover:scale-105 transition-transform">
                            Book Now
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* STUDENT BENEFITS SECTION */}
        <section className="bg-slate-900 text-white py-16">
          <div className="mx-auto max-w-7xl px-5">
            <Reveal className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-poppins font-bold uppercase tracking-[0.25em] text-amber-400">STUDENT BENEFITS</span>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-white">
                Why Travel With Nomadik?
              </h2>
              <div className="mt-3 inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1 rounded-full text-xs text-amber-300 font-poppins">
                <Users className="h-3.5 w-3.5" /> 50+ Students Already Interested & Registering!
              </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((b, i) => {
                const Icon = b.icon
                return (
                  <Reveal key={i} delay={i}>
                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-amber-500/30 hover:bg-white/10 transition-all duration-300">
                      <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-display text-lg font-bold text-white mb-2">{b.title}</h3>
                      <p className="text-xs text-slate-300 font-sans leading-relaxed">{b.desc}</p>
                    </div>
                  </Reveal>
                )
              })}
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="mx-auto max-w-4xl px-5 py-16">
          <Reveal className="text-center mb-12">
            <span className="text-xs font-poppins font-bold uppercase tracking-[0.25em] text-gold">CAMPUS FAQ</span>
            <h2 className="mt-2 font-display text-3xl font-bold text-primary">Frequently Asked Questions</h2>
            <p className="mt-2 text-xs text-muted-foreground">Everything you need to know about the North Campus trip edition.</p>
          </Reveal>

          <div className="space-y-4">
            {faqs.map((faq, i) => {
              const isOpen = openFaqIndex === i
              return (
                <Reveal key={i} delay={i}>
                  <div className="border border-border rounded-2xl bg-card overflow-hidden transition-all">
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                      className="w-full flex items-center justify-between p-5 text-left font-display font-bold text-primary hover:text-accent transition-colors"
                    >
                      <span className="text-base">{faq.q}</span>
                      <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180 text-accent' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-xs text-muted-foreground font-sans leading-relaxed border-t border-border/50 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                </Reveal>
              )
            })}
          </div>
        </section>
      </main>

      <Footer />
      <FloatingUI />
    </div>
  )
}
