import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Navbar } from '@/components/site/Navbar'
import { Footer } from '@/components/site/Footer'
import { Reveal } from '@/components/site/Reveal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  Compass,
  Users,
  Camera,
  GraduationCap,
  Sparkles,
  Award,
  DollarSign,
  Gift,
  Handshake,
  Heart,
  ChevronDown,
  ArrowRight,
  Send,
  X,
  FileCheck,
  Check,
  Loader2,
} from 'lucide-react'

export const Route = createFileRoute('/explorer')({
  head: () => ({
    meta: [
      { title: "Become a Nomadik Explorer | Travel Tribe India" },
      { name: "description", content: "Join India's fastest growing travel community. Lead treks, build campus tribes, create content, and earn free trips." },
    ],
  }),
  component: ExplorerLandingPage,
})

const ROLES = [
  {
    id: 'Explorer',
    title: '🎒 Explorer',
    desc: 'Loves travelling, wants discounted trips, and joins our offline tribe meetups.',
    perks: ['Exclusive trip discounts', 'Tribe meetups entry', 'Earn travel coins'],
  },
  {
    id: 'Creator',
    title: '📸 Creator',
    desc: 'UGC creators, vloggers, and photographers who capture our journeys.',
    perks: ['Free sponsored trips', 'Professional gear access', 'Brand feature spotlight'],
  },
  {
    id: 'Ambassador',
    title: '🎤 Campus Ambassador',
    desc: 'College representative building local communities and earning referral cashback.',
    perks: ['Referral commission', 'Leadership certificates', 'Sponsored campus events'],
  },
  {
    id: 'Trip Captain',
    title: '🚍 Trip Captain',
    desc: 'Group leaders handling on-trip operations, safety, and experiences.',
    perks: ['Paid opportunities', 'Travel for free', 'Convoy leadership badge'],
  },
  {
    id: 'Remote Team',
    title: '💻 Remote Team',
    desc: 'Technical geeks, graphic designers, and operation interns helping Nomadik scale.',
    perks: ['Pre-placement offers (PPO)', 'Remote stipend work', 'Experience certificate'],
  },
]

const BENEFITS = [
  { icon: Compass, title: 'Free Trips', desc: 'Sponsorships on selected high-altitude Spiti convoys and beaches.' },
  { icon: DollarSign, title: 'Earn Money', desc: 'Direct referral commissions and cashback rewards into your wallet.' },
  { icon: Gift, title: 'Nomadik Merch', desc: 'Premium t-shirts, custom explorer caps, bags, and stickers.' },
  { icon: Award, title: 'Certificates', desc: 'Official leadership credentials signed by co-founders for ambassadors.' },
  { icon: Handshake, title: 'Networking', desc: 'Co-work and network with storytellers, remote nomads, and developers.' },
  { icon: Camera, title: 'Photoshoots', desc: 'Professional photos and drone cinematic clips shot during expeditions.' },
]

const LEVEL_PROGRESSION = [
  { name: 'Explorer', desc: 'Unlocks base discounts & community entry.' },
  { name: 'Creator', desc: 'Access to creator meetups and media tasks.' },
  { name: 'Ambassador', desc: 'Eligible for cashbacks and college rep perks.' },
  { name: 'Trip Captain', desc: 'Leads treks and groups with paid fees.' },
  { name: 'Core Team', desc: 'Manages marketing, development, and logistics.' },
  { name: 'Nomadik Legend', desc: 'Nomadik shareholder status & lifetime free travel.' },
]

const FAQ_ITEMS = [
  {
    q: 'Who can apply to the Explorer Program?',
    a: 'Students, remote builders, photographers, storytellers, and travel enthusiasts above 18 years of age are eligible to apply.',
  },
  {
    q: 'Is there any registration fee to join?',
    a: 'Absolutely not! Joining the explorer program is 100% free. We value energy, skills, and dedication.',
  },
  {
    q: 'How does the referral commission reward system work?',
    a: 'Once approved as an Ambassador or Explorer, you get a unique referral code. Every friend booking through your code gets an instant discount, and you earn credit/cashback instantly.',
  },
  {
    q: 'How are Trip Captains selected?',
    a: 'Captains are selected based on travel history, wilderness leadership traits, group management capacity, and first-aid response skills.',
  },
]

function ExplorerLandingPage() {
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [step, setStep] = useState(1)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  // Multi-step Application Form State
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    college: '',
    city: '',
    instagram: '',
    linkedin: '',
    portfolio: '',
    youtube: '',
    why_join: '',
    experience: '',
    skills: '',
  })
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const handleRoleToggle = (roleId: string) => {
    if (selectedRoles.includes(roleId)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== roleId))
    } else {
      setSelectedRoles([...selectedRoles, roleId])
    }
  }

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedRoles.length === 0) {
      toast.error('Please select at least one role')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.from('explorer_applications').insert({
        name: form.name,
        email: form.email,
        phone: form.phone,
        college: form.college || null,
        city: form.city,
        roles: selectedRoles,
        instagram: form.instagram || null,
        linkedin: form.linkedin || null,
        portfolio: form.portfolio || null,
        youtube: form.youtube || null,
        why_join: form.why_join,
        experience: form.experience || null,
        skills: form.skills || null,
        status: 'PENDING',
      })

      if (error) throw error

      setStep(5) // Show success
      toast.success('Application submitted successfully!')
    } catch (err: any) {
      toast.error('Failed to submit application: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setForm({
      name: '',
      email: '',
      phone: '',
      college: '',
      city: '',
      instagram: '',
      linkedin: '',
      portfolio: '',
      youtube: '',
      why_join: '',
      experience: '',
      skills: '',
    })
    setSelectedRoles([])
    setStep(1)
    setShowApplyModal(false)
  }

  return (
    <div className="bg-background min-h-screen flex flex-col justify-between overflow-x-hidden font-sans">
      <Navbar />

      <main className="pt-20 pb-20">
        {/* HERO SECTION */}
        <section className="relative h-[85vh] flex items-center justify-center bg-black overflow-hidden">
          {/* Simulated aesthetic background video overlay (drone visual representation) */}
          <div className="absolute inset-0 opacity-40 bg-gradient-to-t from-black via-black/25 to-black/80 z-10" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=1600')] bg-cover bg-center animate-[pulse_8s_infinite] scale-105" />

          <div className="relative z-20 max-w-4xl px-5 text-center space-y-6">
            <Reveal>
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-gold bg-gold/10 px-3 py-1.5 rounded-full">
                JOIN THE TRIBE
              </span>
              <h1 className="font-display text-4xl sm:text-7xl font-bold text-white mt-4 tracking-tight leading-[1.1]">
                Become a <span className="text-gradient-gold">Nomadik Explorer</span>
              </h1>
              <p className="max-w-2xl mx-auto text-sm sm:text-base text-gray-300 mt-4 leading-relaxed font-poppins">
                Don't just travel. Build stories, lead communities, create unforgettable experiences, and become a part of India's fastest growing travel tribe.
              </p>
              <div className="pt-8">
                <Button size="lg" onClick={() => setShowApplyModal(true)} className="rounded-xl px-8 h-12 text-sm font-semibold bg-gold text-gold-foreground hover:bg-gold/90 shadow-gold">
                  Apply Now <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </Reveal>
          </div>
        </section>

        {/* WHAT IS SECTION */}
        <section className="max-w-4xl mx-auto px-5 py-24 text-center space-y-6">
          <Reveal>
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-gold">Manifesto</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary mt-2">What is a Nomadik Explorer?</h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mt-4 max-w-2xl mx-auto font-poppins">
              Nomadik Explorers are students, creators, travelers, photographers, storytellers, trip leaders, and community builders who help us create unforgettable journeys while earning rewards, networking opportunities, and exclusive travel benefits.
            </p>
          </Reveal>
        </section>

        {/* CHOOSE YOUR JOURNEY CARDS */}
        <section className="bg-muted/30 py-24">
          <div className="max-w-6xl mx-auto px-5">
            <Reveal className="text-center pb-12">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-gold">ROLES</span>
              <h2 className="font-display text-3xl font-bold text-primary mt-2">Choose Your Community Path</h2>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {ROLES.map((role, i) => (
                <Reveal key={role.id} delay={i * 0.1}>
                  <div className="bg-white border p-6 rounded-2xl h-full flex flex-col justify-between shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 transition-all">
                    <div className="space-y-4">
                      <h3 className="font-display font-bold text-base text-primary leading-snug">{role.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{role.desc}</p>
                      <ul className="space-y-1.5 pt-2">
                        {role.perks.map((p, pIdx) => (
                          <li key={pIdx} className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <span className="w-1 h-1 bg-gold rounded-full shrink-0" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSelectedRoles([role.id])
                        setStep(1)
                        setShowApplyModal(true)
                      }}
                      className="mt-6 w-full text-xs font-semibold text-primary hover:bg-primary/5 rounded-xl border h-9"
                    >
                      Join Path
                    </Button>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* LEVEL PROGRESSION */}
        <section className="max-w-4xl mx-auto px-5 py-24">
          <Reveal className="text-center pb-12">
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-gold">LEVELS</span>
            <h2 className="font-display text-3xl font-bold text-primary mt-2">Explorer Rank System</h2>
          </Reveal>

          <div className="relative border-l-2 border-dashed border-border pl-6 ml-4 space-y-8">
            {LEVEL_PROGRESSION.map((lvl, i) => (
              <Reveal key={lvl.name} delay={i * 0.1} className="relative">
                {/* Dot */}
                <span className="absolute -left-[32px] top-1.5 w-4 h-4 bg-white border-2 border-gold rounded-full flex items-center justify-center font-bold text-[8px] text-gold shadow">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-display font-semibold text-sm text-primary">{lvl.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{lvl.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* BENEFITS */}
        <section className="bg-primary/5 py-24 border-t border-b">
          <div className="max-w-5xl mx-auto px-5">
            <Reveal className="text-center pb-12">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-gold">BENEFITS</span>
              <h2 className="font-display text-3xl font-bold text-primary mt-2">Perks of Nomadik Tribe</h2>
            </Reveal>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {BENEFITS.map((b, i) => (
                <Reveal key={b.title} delay={i * 0.05}>
                  <div className="flex gap-4 items-start p-2">
                    <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                      <b.icon className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-xs uppercase tracking-wide text-primary">{b.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1">{b.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* EARNING MODEL */}
        <section className="max-w-4xl mx-auto px-5 py-24 text-center">
          <Reveal className="pb-12">
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-gold">CASHBACKS</span>
            <h2 className="font-display text-3xl font-bold text-primary mt-2">Earn Travels With Friends</h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { title: 'Invite Friends', desc: 'Share your Ambassador discount code with friends.' },
              { title: 'Trip Booked', desc: 'They get a code discount on booking files.' },
              { title: 'Earn Cashback', desc: 'You get commission points credited into your wallet.' },
              { title: 'Redeem Free Trips', desc: 'Use wallet points to book any high-altitude Spiti caravan.' },
            ].map((card, i) => (
              <Reveal key={card.title} delay={i * 0.1}>
                <div className="bg-white border rounded-2xl p-6 text-left relative h-full flex flex-col justify-between shadow-soft">
                  <div>
                    <span className="text-2xl font-bold text-gold font-poppins">0{i + 1}</span>
                    <h4 className="font-display font-bold text-sm text-primary mt-3">{card.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">{card.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* GALLERY */}
        <section className="bg-muted/30 py-24 border-t">
          <div className="max-w-5xl mx-auto px-5">
            <Reveal className="text-center pb-12">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-gold">GALLERY</span>
              <h2 className="font-display text-3xl font-bold text-primary mt-2">Captured by the Tribe</h2>
            </Reveal>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&q=80&w=400',
                'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&q=80&w=400',
                'https://images.unsplash.com/photo-1533873984035-25970ab07461?auto=format&fit=crop&q=80&w=400',
                'https://images.unsplash.com/photo-1520201163981-8cc95007dd2a?auto=format&fit=crop&q=80&w=400',
              ].map((img, i) => (
                <div key={i} className="group relative rounded-2xl overflow-hidden aspect-square border">
                  <img src={img} alt="Tribe photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold uppercase tracking-wider">
                    UGC Tribe photo
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="max-w-3xl mx-auto px-5 py-24 text-center">
          <Reveal>
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-gold">TESTIMONIAL</span>
            <div className="bg-white border rounded-3xl p-8 shadow-soft-lg mt-4 max-w-2xl mx-auto">
              <div className="flex justify-center gap-1 text-gold mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Sparkles key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="font-display text-lg text-primary italic leading-relaxed">
                "I started as a college Explorer during my second year just looking for discounted weekend runs. In 6 months, I was trained in wilderness convoy management and now lead groups as a certified Nomadik Trip Captain!"
              </p>
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-primary mt-6">Rohan Mehra</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">Campus Captain, Delhi University</p>
            </div>
          </Reveal>
        </section>

        {/* FAQS SECTION */}
        <section className="bg-muted/30 py-24 border-t border-b">
          <div className="max-w-3xl mx-auto px-5">
            <Reveal className="text-center pb-12">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-gold">FAQ</span>
              <h2 className="font-display text-3xl font-bold text-primary mt-2">Explorer FAQs</h2>
            </Reveal>

            <div className="space-y-3">
              {FAQ_ITEMS.map((faq, idx) => (
                <div key={idx} className="bg-white border rounded-xl overflow-hidden transition-all duration-300">
                  <button
                    type="button"
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full p-4 text-left font-display font-semibold text-sm flex items-center justify-between text-primary hover:bg-muted/5"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`} />
                  </button>
                  {activeFaq === idx && (
                    <div className="p-4 border-t text-xs text-muted-foreground leading-relaxed bg-muted/5 font-poppins">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-28 text-center max-w-4xl mx-auto px-5">
          <Reveal className="space-y-6">
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-primary leading-tight">
              Ready to travel differently?
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Join college ambassadors, photographers, and developers mapping India's next travel tribe.
            </p>
            <div className="pt-4">
              <Button size="lg" onClick={() => setShowApplyModal(true)} className="rounded-xl px-10 h-12 text-sm font-semibold bg-gold text-gold-foreground hover:bg-gold/90 shadow-gold">
                Apply Now
              </Button>
            </div>
          </Reveal>
        </section>
      </main>

      <Footer />

      {/* MULTI-STEP WIZARD APPLICATION MODAL */}
      <AnimatePresence>
        {showApplyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            {/* Click backdrop to close */}
            <div className="absolute inset-0" onClick={resetForm} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border flex flex-col max-h-[90vh] z-10"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={resetForm}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground z-20"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Progress Indicator */}
              <div className="w-full bg-muted/40 h-1.5 flex">
                {Array.from({ length: 4 }).map((_, stepIdx) => (
                  <div
                    key={stepIdx}
                    className={`flex-1 h-full transition-colors ${
                      step > stepIdx + 1
                        ? 'bg-emerald-500'
                        : step === stepIdx + 1
                        ? 'bg-gold'
                        : 'bg-transparent'
                    }`}
                  />
                ))}
              </div>

              <div className="p-6 overflow-y-auto flex-1 text-left">
                {step === 1 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-display text-lg font-bold text-primary">Basic details</h3>
                      <p className="text-xs text-muted-foreground">Tell us a bit about yourself.</p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="space-y-1">
                        <Label htmlFor="app_name">Full Name</Label>
                        <Input
                          id="app_name"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="e.g. Ansh Tanwar"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label htmlFor="app_email">Email</Label>
                          <Input
                            id="app_email"
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="e.g. ansh@gmail.com"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="app_phone">Phone</Label>
                          <Input
                            id="app_phone"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            placeholder="e.g. +91 9999999999"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="app_college">College / University (Leave blank if not student)</Label>
                        <Input
                          id="app_college"
                          value={form.college}
                          onChange={(e) => setForm({ ...form, college: e.target.value })}
                          placeholder="e.g. Delhi University, IIT Delhi"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="app_city">Current City</Label>
                        <Input
                          id="app_city"
                          value={form.city}
                          onChange={(e) => setForm({ ...form, city: e.target.value })}
                          placeholder="e.g. Delhi, Gurugram"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                      <Button
                        onClick={() => {
                          if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.city.trim()) {
                            toast.error('Please fill in all required fields')
                            return
                          }
                          setStep(2)
                        }}
                        className="rounded-xl font-semibold h-10 px-5 text-xs gap-1.5"
                      >
                        Next Step <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-display text-lg font-bold text-primary">Select Community Roles</h3>
                      <p className="text-xs text-muted-foreground">Select the paths you're interested in joining (Select multiple if applicable).</p>
                    </div>

                    <div className="space-y-2 pt-2">
                      {['Explorer', 'Creator', 'Ambassador', 'Trip Captain', 'Remote Team'].map((roleId) => {
                        const isChecked = selectedRoles.includes(roleId);
                        return (
                          <button
                            key={roleId}
                            type="button"
                            onClick={() => handleRoleToggle(roleId)}
                            className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-colors ${
                              isChecked
                                ? 'bg-primary/5 border-primary text-primary'
                                : 'bg-white hover:bg-muted/10 border-border text-foreground'
                            }`}
                          >
                            <div>
                              <p className="text-xs font-bold font-poppins">{roleId}</p>
                              <p className="text-[10px] text-muted-foreground leading-normal mt-0.5">
                                {roleId === 'Explorer' && 'Explorer discount perks and tribal offline meetups.'}
                                {roleId === 'Creator' && 'Reels, YouTube photography sponsored runs.'}
                                {roleId === 'Ambassador' && 'Campus representative organizer earnings.'}
                                {roleId === 'Trip Captain' && ' Wilderness group captain lead opportunities.'}
                                {roleId === 'Remote Team' && 'Web, marketing operations stipend credits.'}
                              </p>
                            </div>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              isChecked ? 'bg-primary border-primary text-white' : 'border-muted-foreground/30'
                            }`}>
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex justify-between pt-4 border-t">
                      <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl h-10 px-5 text-xs border bg-white">
                        Back
                      </Button>
                      <Button
                        onClick={() => {
                          if (selectedRoles.length === 0) {
                            toast.error('Select at least one role')
                            return
                          }
                          setStep(3)
                        }}
                        className="rounded-xl font-semibold h-10 px-5 text-xs gap-1.5"
                      >
                        Next Step <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-display text-lg font-bold text-primary">Social Handles & Links</h3>
                      <p className="text-xs text-muted-foreground">Share your social credentials or portfolio link.</p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="space-y-1">
                        <Label htmlFor="app_insta">Instagram Profile URL / Handle</Label>
                        <Input
                          id="app_insta"
                          value={form.instagram}
                          onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                          placeholder="e.g. @ansh_nomadik or instagram.com/ansh_nomadik"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="app_linkedin">LinkedIn Profile URL</Label>
                        <Input
                          id="app_linkedin"
                          value={form.linkedin}
                          onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                          placeholder="e.g. linkedin.com/in/ansh-tanwar"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="app_portfolio">Portfolio / Website Link</Label>
                        <Input
                          id="app_portfolio"
                          value={form.portfolio}
                          onChange={(e) => setForm({ ...form, portfolio: e.target.value })}
                          placeholder="e.g. behance.net/ansh or github.com/ansh"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="app_youtube">YouTube Channel Link (If any)</Label>
                        <Input
                          id="app_youtube"
                          value={form.youtube}
                          onChange={(e) => setForm({ ...form, youtube: e.target.value })}
                          placeholder="e.g. youtube.com/@ansh_travels"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between pt-4 border-t">
                      <Button variant="outline" onClick={() => setStep(2)} className="rounded-xl h-10 px-5 text-xs border bg-white">
                        Back
                      </Button>
                      <Button
                        onClick={() => setStep(4)}
                        className="rounded-xl font-semibold h-10 px-5 text-xs gap-1.5"
                      >
                        Next Step <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <form onSubmit={handleApplySubmit} className="space-y-4">
                    <div>
                      <h3 className="font-display text-lg font-bold text-primary">Questionnaire</h3>
                      <p className="text-xs text-muted-foreground">Tell us why you would be a great fit.</p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="space-y-1">
                        <Label htmlFor="app_why">Why do you want to join Nomadik Explorer Program? *</Label>
                        <Textarea
                          id="app_why"
                          value={form.why_join}
                          onChange={(e) => setForm({ ...form, why_join: e.target.value })}
                          placeholder="What inspires you about slow road travels and communities?"
                          rows={3}
                          className="text-xs rounded-xl"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="app_exp">Any previous community or leadership experience?</Label>
                        <Textarea
                          id="app_exp"
                          value={form.experience}
                          onChange={(e) => setForm({ ...form, experience: e.target.value })}
                          placeholder="Managed college fests? Led high altitude treks before? Coordinated online groups?"
                          rows={2}
                          className="text-xs rounded-xl"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="app_skills">List your core skills (Photography, Writing, UI Dev, etc.)</Label>
                        <Input
                          id="app_skills"
                          value={form.skills}
                          onChange={(e) => setForm({ ...form, skills: e.target.value })}
                          placeholder="e.g. Photography, Video editing, public speaking"
                          className="rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between pt-4 border-t">
                      <Button type="button" variant="outline" onClick={() => setStep(3)} className="rounded-xl h-10 px-5 text-xs border bg-white">
                        Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="rounded-xl font-semibold h-10 px-6 text-xs gap-1.5 bg-gold text-gold-foreground hover:bg-gold/90"
                      >
                        {submitting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                        ) : (
                          <Send className="w-3.5 h-3.5 mr-1" />
                        )}
                        Submit Application
                      </Button>
                    </div>
                  </form>
                )}

                {step === 5 && (
                  <div className="text-center py-10 space-y-6">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/20">
                      <FileCheck className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-display text-xl font-bold text-primary">🎉 Welcome to Nomadik!</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto font-medium">
                        Your application has been received successfully. Our crew team will review your profile and contact you within 48 hours.
                      </p>
                    </div>
                    <div className="pt-4">
                      <Button onClick={resetForm} className="rounded-xl h-10 text-xs px-6 font-semibold border">
                        Done
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
