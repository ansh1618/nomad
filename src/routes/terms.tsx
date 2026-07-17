import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingUI } from "@/components/site/FloatingUI";
import { Reveal } from "@/components/site/Reveal";
import { FileText, Calendar, ArrowLeft, Mail, MapPin, Instagram, Phone, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions | Nomadik" },
      { name: "description", content: "Read our comprehensive Booking and Travel Terms & Conditions." },
    ],
  }),
  component: TermsRoute,
});

function TermsRoute() {
  const sections = [
    { id: "booking-payment", title: "1. Booking & Payment" },
    { id: "booking-confirmation", title: "2. Booking Confirmation" },
    { id: "pricing", title: "3. Pricing" },
    { id: "whats-included", title: "4. What's Included" },
    { id: "whats-not-included", title: "5. What's Not Included" },
    { id: "travel-documents", title: "6. Travel Documents" },
    { id: "hotel-transport", title: "7. Hotel & Transport" },
    { id: "changes-amendments", title: "8. Changes & Amendments" },
    { id: "cancellation-policy", title: "9. Cancellation Policy" },
    { id: "non-refundable", title: "10. Non-Refundable" },
    { id: "refund-policy", title: "11. Refund Policy" },
    { id: "force-majeure", title: "12. Force Majeure" },
    { id: "responsibilities", title: "13. Responsibilities" },
    { id: "liability", title: "14. Liability" },
    { id: "user-accounts", title: "15. User Accounts" },
    { id: "payments", title: "16. Payments" },
    { id: "premium-docs", title: "17. Premium Documents" },
    { id: "intellectual-property", title: "18. Intellectual Property" },
    { id: "changes-terms", title: "19. Changes to Terms" },
    { id: "contact-us", title: "20. Contact Us" },
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
              <FileText className="h-3.5 w-3.5" /> Legal & Terms
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-primary tracking-tight">
              Terms & Conditions
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
                    Welcome to Nomadik. These Terms & Conditions govern your use of our website, services, and travel bookings. By accessing our platform or booking a trip with Nomadik, you agree to comply with these Terms & Conditions.
                  </p>
                </div>
              </Reveal>

              {/* Clause 1 */}
              <Reveal>
                <div id="booking-payment" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">1. Booking & Payment</h2>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs">
                    <li>A booking is confirmed only after the required advance payment is successfully received.</li>
                    <li>The remaining balance must be paid before the trip departure date as communicated by Nomadik.</li>
                    <li>Bookings are subject to availability of seats, accommodations, transport, and operational feasibility.</li>
                    <li>Nomadik reserves the right to reject or cancel any booking before confirmation if availability changes.</li>
                  </ul>
                  
                  <div className="mt-4 pt-4 border-t border-border space-y-2">
                    <h4 className="font-semibold text-primary text-xs font-poppins uppercase tracking-wider text-gold">Advance Payment</h4>
                    <p className="text-xs">Unless otherwise specified:</p>
                    <ul className="list-disc pl-5 space-y-1 text-xs">
                      <li><strong>₹2,000 per traveler</strong> is required to reserve a seat (or the amount mentioned on the package page).</li>
                      <li>The remaining amount must be paid before departure.</li>
                      <li>Some special departures or customized trips may require a higher advance payment.</li>
                    </ul>
                  </div>
                </div>
              </Reveal>

              {/* Clause 2 */}
              <Reveal>
                <div id="booking-confirmation" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">2. Booking Confirmation</h2>
                  <p>Your booking will be considered confirmed only after:</p>
                  <ul className="list-disc pl-5 space-y-1 text-xs">
                    <li>Payment is successfully processed.</li>
                    <li>Booking confirmation email or WhatsApp message is sent.</li>
                    <li>A Booking ID is generated.</li>
                  </ul>
                  <p className="text-xs text-destructive font-semibold">
                    If payment fails or remains pending, your booking will not be confirmed.
                  </p>
                </div>
              </Reveal>

              {/* Clause 3 */}
              <Reveal>
                <div id="pricing" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">3. Pricing</h2>
                  <p>All package prices displayed on Nomadik are subject to change until the booking is confirmed. Prices may vary due to:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {["Seasonal demand", "Hotel availability", "Transportation costs", "Government taxes", "Fuel surcharges", "Vendor pricing"].map((p) => (
                      <div key={p} className="p-2.5 border border-border bg-slate-50 dark:bg-slate-950 rounded-lg">
                        • {p}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Once your booking is confirmed, the confirmed package price will remain fixed unless additional services are requested by you.
                  </p>
                </div>
              </Reveal>

              {/* Clause 4 */}
              <Reveal>
                <div id="whats-included" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">4. What's Included</h2>
                  <p>Only the services specifically mentioned in the package itinerary are included. Typical inclusions include:</p>
                  <ul className="list-disc pl-5 space-y-1 text-xs">
                    <li>Accommodation & Transportation</li>
                    <li>Meals (if specified in the itinerary)</li>
                    <li>Experienced Trip Captain</li>
                    <li>Sightseeing & Entry tickets (only if mentioned)</li>
                  </ul>
                </div>
              </Reveal>

              {/* Clause 5 */}
              <Reveal>
                <div id="whats-not-included" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">5. What's Not Included</h2>
                  <p>Unless specifically mentioned, the following are excluded:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {["Personal expenses", "Snacks & Drinks", "Shopping", "Laundry", "Travel Insurance", "Entry fees not listed", "Adventure activities", "Camera fees", "Medical expenses"].map((e) => (
                      <div key={e} className="p-2 border border-border bg-slate-50 dark:bg-slate-950 rounded-lg text-center">
                        {e}
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>

              {/* Clause 6 */}
              <Reveal>
                <div id="travel-documents" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">6. Travel Documents</h2>
                  <p>Travelers are responsible for carrying valid identification documents. Depending on the destination, you may be required to provide:</p>
                  <ul className="list-disc pl-5 space-y-1 text-xs">
                    <li>Aadhaar Card, PAN Card, or Passport</li>
                    <li>Driving License or Student ID</li>
                    <li>Any other government-issued identity proof</li>
                  </ul>
                  <p className="text-xs text-muted-foreground italic">
                    International travelers are solely responsible for passport validity, visas, permits, and immigration requirements.
                  </p>
                </div>
              </Reveal>

              {/* Clause 7 */}
              <Reveal>
                <div id="hotel-transport" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">7. Hotel & Transport</h2>
                  <p>Hotel check-in and check-out timings are governed by hotel policies. Typical timings:</p>
                  <ul className="list-disc pl-5 space-y-1 text-xs">
                    <li>Check-in: 12:00 PM – 2:00 PM</li>
                    <li>Check-out: 10:00 AM – 11:00 AM</li>
                  </ul>
                  <p className="text-xs mt-2 text-muted-foreground">
                    Transportation will operate according to the published itinerary. Air conditioning in vehicles may not function while parked or in certain hilly regions due to operational guidelines.
                  </p>
                </div>
              </Reveal>

              {/* Clause 8 */}
              <Reveal>
                <div id="changes-amendments" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">8. Changes & Amendments</h2>
                  <p>Any request to modify a booking is subject to availability, vendor approval, and additional charges. Significant changes may require cancellation of the existing booking and creation of a new booking.</p>
                </div>
              </Reveal>

              {/* Clause 9 */}
              <Reveal>
                <div id="cancellation-policy" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-5 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">9. Cancellation Policy</h2>
                  
                  {/* Domestic Table */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-primary text-xs font-poppins uppercase tracking-wider text-gold">Domestic Trips</h4>
                    <div className="overflow-x-auto border border-border rounded-xl">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-950 border-b border-border">
                            <th className="p-3 font-semibold">Cancellation Before Departure</th>
                            <th className="p-3 font-semibold">Cancellation Charges</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-border">
                            <td className="p-3">30 days or more</td>
                            <td className="p-3">10%</td>
                          </tr>
                          <tr className="border-b border-border">
                            <td className="p-3">15–29 days</td>
                            <td className="p-3">25%</td>
                          </tr>
                          <tr className="border-b border-border">
                            <td className="p-3">7–14 days</td>
                            <td className="p-3">50%</td>
                          </tr>
                          <tr>
                            <td className="p-3">Less than 7 days</td>
                            <td className="p-3">100%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* International Table */}
                  <div className="space-y-2 pt-2">
                    <h4 className="font-semibold text-primary text-xs font-poppins uppercase tracking-wider text-gold">International Trips</h4>
                    <div className="overflow-x-auto border border-border rounded-xl">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-950 border-b border-border">
                            <th className="p-3 font-semibold">Cancellation Before Departure</th>
                            <th className="p-3 font-semibold">Cancellation Charges</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-border">
                            <td className="p-3">45 days or more</td>
                            <td className="p-3">20%</td>
                          </tr>
                          <tr className="border-b border-border">
                            <td className="p-3">30–44 days</td>
                            <td className="p-3">40%</td>
                          </tr>
                          <tr className="border-b border-border">
                            <td className="p-3">15–29 days</td>
                            <td className="p-3">60%</td>
                          </tr>
                          <tr>
                            <td className="p-3">Less than 15 days</td>
                            <td className="p-3">100%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground italic mt-2">
                    Some promotional departures or special events may have separate cancellation policies, which will be communicated before booking.
                  </p>
                </div>
              </Reveal>

              {/* Clause 10 */}
              <Reveal>
                <div id="non-refundable" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">10. Non-Refundable Charges</h2>
                  <p>The following may be non-refundable:</p>
                  <ul className="list-disc pl-5 space-y-1 text-xs">
                    <li>Booking token / advance amount (where applicable)</li>
                    <li>Visa fees, Flight tickets, Train tickets</li>
                    <li>Government permits & processing charges</li>
                    <li>Payment gateway charges & Peak season bookings</li>
                    <li>Special event departures</li>
                  </ul>
                </div>
              </Reveal>

              {/* Clause 11 */}
              <Reveal>
                <div id="refund-policy" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">11. Refund Policy</h2>
                  <p>Approved refunds will generally be processed within 7–14 business days. Refund timelines depend on banks, the payment gateway, and the original payment method. Payment gateway or banking charges may be deducted where applicable.</p>
                </div>
              </Reveal>

              {/* Clause 12 */}
              <Reveal>
                <div id="force-majeure" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">12. Force Majeure</h2>
                  <p>
                    Nomadik shall not be responsible for delays, cancellations, or disruptions caused by events beyond our reasonable control, including natural disasters, landslides, heavy rainfall, political unrest, road closures, strikes, pandemics, or weather conditions.
                  </p>
                  <p className="text-xs font-semibold text-primary">
                    Any additional expenses arising from such situations shall be borne by the traveler.
                  </p>
                </div>
              </Reveal>

              {/* Clause 13 */}
              <Reveal>
                <div id="responsibilities" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">13. Traveler Responsibilities</h2>
                  <p>Travelers are expected to respect fellow travelers, follow instructions of the Trip Captain, maintain discipline throughout the trip, avoid illegal substances or prohibited activities, and respect local culture and environmental guidelines.</p>
                  <p className="text-xs text-destructive font-semibold">
                    Nomadik reserves the right to remove any traveler whose behavior affects the safety or experience of others. No refund will be issued in such cases.
                  </p>
                </div>
              </Reveal>

              {/* Clause 14 */}
              <Reveal>
                <div id="liability" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">14. Liability</h2>
                  <p>Nomadik acts as a travel organizer and facilitator between travelers and third-party service providers. We shall not be liable for delays, missed connections, injury, theft, loss of baggage, damage to personal belongings, or hotel/transport vendor defaults.</p>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Our maximum liability shall not exceed the total amount paid for the respective booking.
                  </p>
                </div>
              </Reveal>

              {/* Clause 15 */}
              <Reveal>
                <div id="user-accounts" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">15. User Accounts</h2>
                  <p>Users are responsible for maintaining the confidentiality of their account credentials (Google login or Email & Password). Any activity performed through your account will be considered authorized unless reported otherwise.</p>
                </div>
              </Reveal>

              {/* Clause 16 */}
              <Reveal>
                <div id="payments" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">16. Payments</h2>
                  <p>Payments are processed securely through trusted third-party payment providers such as Cashfree Payments. Nomadik does not store your complete debit card, credit card, UPI PIN, CVV, or banking credentials.</p>
                </div>
              </Reveal>

              {/* Clause 17 */}
              <Reveal>
                <div id="premium-docs" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">17. Premium Documents</h2>
                  <p>Certain travel documents including complete itineraries, travel guides, packing checklists, hotel vouchers, trip vouchers, and invoices may only be accessible to logged-in users or confirmed travelers.</p>
                  <p className="text-xs text-muted-foreground">
                    These documents remain the intellectual property of Nomadik and may not be copied, redistributed, or commercially reused without prior written permission.
                  </p>
                </div>
              </Reveal>

              {/* Clause 18 */}
              <Reveal>
                <div id="intellectual-property" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">18. Intellectual Property</h2>
                  <p>All content available on Nomadik, including website design, logos, images, videos, trip itineraries, PDFs, blogs, graphics, and branding, is owned by Nomadik or licensed to Nomadik and is protected under applicable intellectual property laws.</p>
                </div>
              </Reveal>

              {/* Clause 19 */}
              <Reveal>
                <div id="changes-terms" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">19. Changes to These Terms</h2>
                  <p>Nomadik reserves the right to modify these Terms & Conditions at any time. Updated versions will be published on this page with the revised "Last Updated" date. Continued use of the platform constitutes acceptance of the revised Terms.</p>
                </div>
              </Reveal>

              {/* Clause 20 */}
              <Reveal>
                <div id="contact-us" className="bg-card border border-gold p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none translate-x-4 translate-y-4">
                    <Info className="h-64 w-64 text-gold" />
                  </div>
                  <h2 className="font-display text-xl font-bold text-primary">20. Contact Us</h2>
                  <p>For any booking, legal, or policy-related queries, please contact:</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-poppins pt-2">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gold/10 flex items-center justify-center text-gold"><Mail className="h-4 w-4" /></div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Email</p>
                        <a href="mailto:support.nomadik@gmail.com" className="font-semibold text-primary hover:underline">support.nomadik@gmail.com</a>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gold/10 flex items-center justify-center text-gold"><Phone className="h-4 w-4" /></div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Phone</p>
                        <a href="tel:+917857037041" className="font-semibold text-primary hover:underline">+91 78570 37041</a>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 col-span-1 sm:col-span-2">
                      <div className="h-8 w-8 rounded-lg bg-gold/10 flex items-center justify-center text-gold"><MapPin className="h-4 w-4" /></div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Address</p>
                        <p className="font-semibold text-primary">Rohini Sector 11, New Delhi – 110085, India</p>
                      </div>
                    </div>
                  </div>
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
