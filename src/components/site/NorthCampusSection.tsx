import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  GraduationCap,
  Bus,
  ShieldCheck,
  Flame,
  Users,
  Camera,
  Compass,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Calendar,
  Tag
} from 'lucide-react'
import { Reveal } from './Reveal'

export function NorthCampusSection() {
  const features = [
    { icon: GraduationCap, label: 'Student Special Pricing' },
    { icon: Bus, label: 'Weekend Getaways' },
    { icon: ShieldCheck, label: 'Safe & Verified Stays' },
    { icon: Flame, label: 'Fun, Music & Bonfire Nights' },
    { icon: Users, label: 'Curated for DU Students' },
    { icon: Camera, label: 'Photography & Memories' },
    { icon: Sparkles, label: 'Safe for Solo Travellers' },
  ]

  const highlights = [
    'Travel with college friends',
    'Weekend escapes',
    'Affordable premium road trips',
    'Verified stays',
    'Community vibes',
    'Bonfires & Music',
    'Photography',
    'Adventure trails'
  ]

  return (
    <section className="relative my-12 mx-auto max-w-7xl px-4 sm:px-6">
      {/* Container with Luxury Dark Navy & Gold Aesthetic */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A1628] via-[#0D1D35] to-[#060E1A] p-6 sm:p-10 lg:p-12 text-white shadow-2xl border border-amber-500/20">
        {/* Subtle Decorative Background Glows */}
        <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 h-full w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />

        {/* Top Header Banner */}
        <Reveal>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-8 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-poppins font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                Exclusive Collaboration
              </div>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
                Nomadik <span className="font-serif italic text-amber-400 font-normal">×</span> North Campus
              </h2>
              <p className="text-sm sm:text-base text-slate-300 font-sans mt-1">
                Exclusive Student Road Trips • Designed for DU North Campus Students.
              </p>
            </div>

            {/* Launch Badge */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/40 px-4 py-2 rounded-2xl">
              <Calendar className="h-4 w-4 text-amber-400" />
              <div className="text-left">
                <p className="text-[10px] text-amber-300 uppercase tracking-widest font-semibold">Special Edition</p>
                <p className="text-xs font-bold text-white font-poppins">Launching 14 August</p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Main Grid: Left Details & Right Polaroid Photo Stack */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-8">
          {/* Left Column: Brand Story & Highlights */}
          <div className="lg:col-span-7 space-y-6">
            <Reveal>
              <div className="inline-block bg-white/5 border border-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-poppins text-slate-200">
                ⭐ <span className="text-amber-400 font-semibold">THE ULTIMATE TRAVEL COLLABORATION FOR DU STUDENTS!</span>
              </div>
            </Reveal>

            <Reveal>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-sans">
                Experience curated road trips with certified Trip Captains, boutique stays, and unforgettable college group memories. Pack your bags for the ultimate weekend getaway with your campus squad!
              </p>
            </Reveal>

            {/* Highlights Grid */}
            <Reveal>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                {highlights.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-amber-500/30 p-2.5 rounded-xl transition-all duration-300"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span className="text-xs text-slate-200 font-medium truncate">{item}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Right Column: Polaroid Photo Stack / Collage Layout */}
          <div className="lg:col-span-5 relative flex justify-center py-4">
            <div className="relative w-full max-w-sm sm:max-w-md h-72 sm:h-80 flex items-center justify-center">
              {/* Photo 1: Manali (Left Tilted Polaroid Card) */}
              <motion.div
                whileHover={{ scale: 1.05, rotate: -3, zIndex: 30 }}
                className="absolute -left-2 top-4 w-44 sm:w-52 bg-white p-2.5 rounded-2xl shadow-2xl transform -rotate-6 border border-slate-200/40 cursor-pointer transition-all"
              >
                <div className="relative h-44 sm:h-52 overflow-hidden rounded-xl bg-slate-900">
                  <img
                    src="/images/campus/manali.jpg"
                    alt="Manali Weekend Escape"
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLElement).setAttribute('src', 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80');
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-white">
                    <span className="font-display font-bold text-sm">Manali</span>
                    <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded-full">2N/3D</span>
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <p className="text-[11px] font-bold text-slate-800 font-poppins">Manali Weekend Escape</p>
                  <p className="text-[10px] text-slate-500">Student Special • ₹5,999</p>
                </div>
              </motion.div>

              {/* Photo 2: Udaipur (Right Tilted Polaroid Card) */}
              <motion.div
                whileHover={{ scale: 1.05, rotate: 3, zIndex: 30 }}
                className="absolute right-0 bottom-2 w-44 sm:w-52 bg-white p-2.5 rounded-2xl shadow-2xl transform rotate-6 border border-slate-200/40 cursor-pointer transition-all z-10"
              >
                <div className="relative h-44 sm:h-52 overflow-hidden rounded-xl bg-slate-900">
                  <img
                    src="/images/campus/udaipur.jpg"
                    alt="Udaipur Royal Escape"
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLElement).setAttribute('src', 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=800&q=80');
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-white">
                    <span className="font-display font-bold text-sm">Udaipur</span>
                    <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded-full">2N/3D</span>
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <p className="text-[11px] font-bold text-slate-800 font-poppins">Udaipur Royal Escape</p>
                  <p className="text-[10px] text-slate-500">Student Special • ₹5,999</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Features Row */}
        <Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 py-6 border-t border-white/10">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <div
                  key={i}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-amber-500/30 hover:bg-white/10 text-center transition-all duration-300"
                >
                  <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-2">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-poppins font-medium text-slate-200 leading-tight">
                    {f.label}
                  </span>
                </div>
              )
            })}
          </div>
        </Reveal>

        {/* Bottom Banner Row: Floating Price Card & CTA Button */}
        <Reveal>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-white/10">
            {/* Price Badge */}
            <div className="flex items-center gap-4 bg-white/10 border border-white/15 backdrop-blur-md px-5 py-3 rounded-2xl">
              <div className="text-left">
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest block">Starting From</span>
                <span className="font-display text-2xl sm:text-3xl font-extrabold text-white">₹5,999<span className="text-xs text-slate-300 font-sans font-normal"> / person</span></span>
              </div>
              <div className="h-8 w-px bg-white/20 hidden sm:block" />
              <div className="text-left hidden sm:block">
                <span className="text-xs font-semibold text-slate-200 block">2 Nights • 3 Days</span>
                <span className="text-[10px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full inline-block mt-0.5">Launch Offer</span>
              </div>
            </div>

            {/* Gold CTA Button */}
            <Link
              to="/campus-trips"
              className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-poppins font-bold text-sm tracking-wide shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:shadow-[0_0_35px_rgba(212,175,55,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
              <span>Explore Campus Trips</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
