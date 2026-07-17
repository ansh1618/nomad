import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingUI } from "@/components/site/FloatingUI";
import { Reveal } from "@/components/site/Reveal";
import { ShieldCheck, Calendar, ArrowLeft, Mail, MapPin, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Nomadik" },
      { name: "description", content: "Learn how Nomadik protects, processes, and respects your personal travel information." },
    ],
  }),
  component: PrivacyPolicyRoute,
});

function PrivacyPolicyRoute() {
  const sections = [
    { id: "info-collect", title: "1. Information We Collect" },
    { id: "info-use", title: "2. How We Use Your Information" },
    { id: "google-login", title: "3. Google Login" },
    { id: "premium-docs", title: "4. Premium Documents" },
    { id: "communication", title: "5. Communication" },
    { id: "cookies", title: "6. Cookies & Analytics" },
    { id: "sharing", title: "7. How We Share Information" },
    { id: "security", title: "8. Data Security" },
    { id: "retention", title: "9. Data Retention" },
    { id: "rights", title: "10. Your Rights" },
    { id: "third-party", title: "11. Third-Party Services" },
    { id: "children", title: "12. Children's Privacy" },
    { id: "changes", title: "13. Changes to Policy" },
    { id: "contact", title: "14. Contact Us" },
    { id: "grievance", title: "15. Grievance Officer" },
  ];

  return (
    <div className="bg-background min-h-screen flex flex-col justify-between">
      <Navbar />
      
      <main className="pt-24 pb-20 font-sans text-foreground">
        {/* Banner Section */}
        <section className="relative py-16 px-5 text-center bg-slate-950 border-b border-border/40 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/5 via-transparent to-transparent pointer-events-none" />
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/25 text-gold text-xs font-poppins font-bold uppercase tracking-wider">
              <ShieldCheck className="h-3.5 w-3.5" /> Trust & Privacy Center
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-primary tracking-tight">
              Privacy Policy
            </h1>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-poppins">
              <Calendar className="h-3.5 w-3.5 text-gold" />
              <span>Last Updated: July 2026</span>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="max-w-7xl mx-auto px-5 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            
            {/* Left Column: Navigation TOC */}
            <aside className="hidden lg:block lg:col-span-1 space-y-4">
              <div className="sticky top-28 p-6 bg-card border border-border rounded-3xl space-y-4 shadow-soft">
                <p className="text-[10px] text-muted-foreground font-poppins font-bold tracking-wider uppercase border-b border-border pb-3">
                  Document Sections
                </p>
                <nav className="space-y-1 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {sections.map((sec) => (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      className="block text-xs font-semibold text-muted-foreground hover:text-gold transition-colors py-1.5 leading-snug"
                    >
                      {sec.title}
                    </a>
                  ))}
                </nav>
                <div className="pt-4 border-t border-border mt-4">
                  <Link to="/">
                    <Button variant="ghost" size="sm" className="w-full justify-start text-xs font-poppins font-semibold gap-1.5">
                      <ArrowLeft className="h-3.5 w-3.5" /> Return Home
                    </Button>
                  </Link>
                </div>
              </div>
            </aside>

            {/* Right Column: Detailed Clauses */}
            <div className="col-span-1 lg:col-span-3 space-y-8 leading-relaxed text-sm text-foreground/80">
              <Reveal>
                <div className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <p>
                    At Nomadik (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;), we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, share, and protect your information when you visit our website, create an account, book a trip, or use any of our services.
                  </p>
                  <p className="font-semibold text-primary">
                    By accessing or using Nomadik, you agree to the practices described in this Privacy Policy.
                  </p>
                </div>
              </Reveal>

              {/* Clause 1 */}
              <Reveal>
                <div id="info-collect" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-5 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">1. Information We Collect</h2>
                  <p>To provide you with a seamless travel experience, we may collect the following information:</p>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-primary text-xs font-poppins uppercase tracking-wider text-gold">Personal Information</h4>
                      <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
                        <li>Full Name</li>
                        <li>Email Address</li>
                        <li>Mobile Number</li>
                        <li>Date of Birth (if provided) and Gender (optional)</li>
                        <li>Emergency Contact Details</li>
                        <li>City or State</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-primary text-xs font-poppins uppercase tracking-wider text-gold">Account Information</h4>
                      <p className="text-xs mt-1">If you create an account or sign in using Google:</p>
                      <ul className="list-disc pl-5 mt-1 space-y-1 text-xs">
                        <li>Google Account Name & Email Address</li>
                        <li>Profile Picture</li>
                        <li>Authentication Information</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-primary text-xs font-poppins uppercase tracking-wider text-gold">Booking Information</h4>
                      <p className="text-xs mt-1">When you book a trip, we may collect:</p>
                      <ul className="list-disc pl-5 mt-1 space-y-1 text-xs">
                        <li>Selected Package & Travel Date</li>
                        <li>Number of Travelers</li>
                        <li>Pickup Location & Room Preferences</li>
                        <li>Special Requests & Emergency Contacts</li>
                        <li>Government ID details (only if required for bookings)</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-primary text-xs font-poppins uppercase tracking-wider text-gold">Payment Information</h4>
                      <p className="text-xs mt-1">
                        Payments are processed through secure third-party payment gateways such as <strong>Cashfree Payments</strong>.
                      </p>
                      <p className="text-xs font-medium text-destructive mt-1">
                        Nomadik does not store your debit card, credit card, UPI PIN, CVV, or complete banking information.
                      </p>
                      <p className="text-xs mt-1">We may store:</p>
                      <ul className="list-disc pl-5 mt-1 space-y-1 text-xs">
                        <li>Payment Status & Transaction ID</li>
                        <li>Order ID & Payment Method</li>
                        <li>Amount Paid</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </Reveal>

              {/* Clause 2 */}
              <Reveal>
                <div id="info-use" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">2. How We Use Your Information</h2>
                  <p>We use your information to:</p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs">
                    <li>Process bookings and confirm reservations</li>
                    <li>Generate invoices, send itinerary PDFs, and share trip details</li>
                    <li>Provide customer support and send booking confirmations</li>
                    <li>Notify you about trip updates and improve our services</li>
                    <li>Prevent fraud and maintain travel records</li>
                    <li>Provide personalized travel recommendations</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    With your permission, we may also send upcoming trip announcements, exclusive offers, festival discounts, referral rewards, and new destination launches. You can opt out of promotional communication at any time.
                  </p>
                </div>
              </Reveal>

              {/* Clause 3 */}
              <Reveal>
                <div id="google-login" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">3. Google Login</h2>
                  <p>Nomadik allows users to securely sign in using Google. When you choose Google Sign-In, we may receive:</p>
                  <ul className="list-disc pl-5 space-y-1 text-xs">
                    <li>Google display name</li>
                    <li>Email Address</li>
                    <li>Profile Picture</li>
                  </ul>
                  <p className="text-xs font-semibold text-emerald-600">
                    We never receive or store your Google password. Authentication is securely handled through Supabase Authentication and Google OAuth.
                  </p>
                </div>
              </Reveal>

              {/* Clause 4 */}
              <Reveal>
                <div id="premium-docs" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">4. Premium Documents & Itineraries</h2>
                  <p>
                    Some travel documents such as complete itineraries, packing lists, travel guides, hotel vouchers, and trip documents may require you to sign in before accessing them.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    These documents are securely delivered using temporary signed URLs and remain protected from unauthorized public access.
                  </p>
                </div>
              </Reveal>

              {/* Clause 5 */}
              <Reveal>
                <div id="communication" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">5. Communication</h2>
                  <p>By registering, booking a trip, or submitting any inquiry, you consent to receive communications via:</p>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold font-poppins">
                    {["Email", "Phone Calls", "SMS", "WhatsApp", "Push Notifications"].map((channel) => (
                      <span key={channel} className="bg-slate-100 dark:bg-slate-900 border border-border px-3 py-1 rounded-lg">
                        {channel}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs mt-2">These communications may include booking confirmations, payment confirmations, travel reminders, important trip updates, emergency notifications, and promotional offers.</p>
                </div>
              </Reveal>

              {/* Clause 6 */}
              <Reveal>
                <div id="cookies" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">6. Cookies & Analytics</h2>
                  <p>We use cookies and similar technologies to remember your preferences, keep you signed in, improve website performance, understand user behavior, enhance security, and measure marketing performance.</p>
                  <p className="text-xs text-muted-foreground">You can manage cookie preferences through your browser settings.</p>
                </div>
              </Reveal>

              {/* Clause 7 */}
              <Reveal>
                <div id="sharing" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">7. How We Share Information</h2>
                  <p className="font-semibold text-primary">We never sell your personal information.</p>
                  <p>Your information may be shared only when necessary with trusted service providers including:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-poppins">
                    {["Hotels", "Transport Providers", "Trip Captains", "Local Travel Partners", "Payment Gateways", "Cloud Hosting"].map((provider) => (
                      <div key={provider} className="p-3 border border-border bg-slate-50 dark:bg-slate-950 rounded-xl text-center">
                        {provider}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Information is shared only to fulfill your booking or provide requested services.</p>
                </div>
              </Reveal>

              {/* Clause 8 */}
              <Reveal>
                <div id="security" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">8. Data Security</h2>
                  <p>We implement industry-standard security measures to protect your information, including encrypted HTTPS connections, secure authentication, protected databases, role-based access controls, and secure cloud infrastructure.</p>
                  <p className="text-xs text-muted-foreground italic">While we strive to protect your data, no online platform can guarantee absolute security.</p>
                </div>
              </Reveal>

              {/* Clause 9 */}
              <Reveal>
                <div id="retention" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">9. Data Retention</h2>
                  <p>We retain your information only for as long as necessary to complete your bookings, provide customer support, comply with legal obligations, resolve disputes, and maintain financial records.</p>
                </div>
              </Reveal>

              {/* Clause 10 */}
              <Reveal>
                <div id="rights" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">10. Your Rights</h2>
                  <p>Depending on applicable laws, you may request to access your personal information, correct inaccurate information, update your profile, delete your account, withdraw marketing consent, or request a copy of your stored data.</p>
                </div>
              </Reveal>

              {/* Clause 11 */}
              <Reveal>
                <div id="third-party" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">11. Third-Party Services</h2>
                  <p>Nomadik may integrate with trusted third-party services including Google Authentication, Cashfree Payments, Supabase, WhatsApp Business, Google Maps, and Analytics Platforms. These services have their own privacy policies.</p>
                </div>
              </Reveal>

              {/* Clause 12 */}
              <Reveal>
                <div id="children" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">12. Children's Privacy</h2>
                  <p>Our services are intended for individuals who are legally eligible to travel independently or with appropriate guardian consent. We do not knowingly collect personal information from children without permission.</p>
                </div>
              </Reveal>

              {/* Clause 13 */}
              <Reveal>
                <div id="changes" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">13. Changes to This Privacy Policy</h2>
                  <p>We may update this Privacy Policy periodically. Any updates will be posted on this page with the revised "Last Updated" date. Continued use of the platform after updates constitutes acceptance of the revised policy.</p>
                </div>
              </Reveal>

              {/* Clause 14 */}
              <Reveal>
                <div id="contact" className="bg-card border border-gold p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none translate-x-4 translate-y-4">
                    <ShieldCheck className="h-64 w-64 text-gold" />
                  </div>
                  <h2 className="font-display text-xl font-bold text-primary">14. Contact Us</h2>
                  <p>If you have any questions, concerns, or requests regarding this Privacy Policy or your personal information, please contact us:</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-poppins pt-2">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gold/10 flex items-center justify-center text-gold"><Mail className="h-4 w-4" /></div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Email</p>
                      <a href="mailto:support.nomadik@gmail.com" className="font-semibold text-primary hover:underline">support.nomadik@gmail.com</a>
                    </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gold/10 flex items-center justify-center text-gold"><MapPin className="h-4 w-4" /></div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Address</p>
                        <p className="font-semibold text-primary">Rohini Sector 11, New Delhi – 110085, India</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gold/10 flex items-center justify-center text-gold"><Instagram className="h-4 w-4" /></div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Instagram</p>
                        <a href="https://instagram.com/gonomadik" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">@gonomadik</a>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>

              {/* Clause 15 */}
              <Reveal>
                <div id="grievance" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">15. Grievance Officer</h2>
                  <p>In accordance with applicable Indian laws, users may contact our Grievance Officer regarding privacy or data-related concerns.</p>
                  <p className="text-xs">
                    <strong>Email:</strong> <a href="mailto:support.nomadik@gmail.com" className="text-gold font-semibold hover:underline">support.nomadik@gmail.com</a>
                    <br />
                    <strong>Address:</strong> Rohini Sector 11, New Delhi – 110085, India
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <FloatingUI />
    </div>
  );
}
