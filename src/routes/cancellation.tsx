import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingUI } from "@/components/site/FloatingUI";
import { Reveal } from "@/components/site/Reveal";
import { FileText, Calendar, ArrowLeft, Mail, Phone, Info, BadgeAlert, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cancellation")({
  head: () => ({
    meta: [
      { title: "Booking, Cancellation & Refund Policy | Nomadik" },
      { name: "description", content: "Learn about Nomadik's transparent Booking, Cancellation, and Refund Policy." },
    ],
  }),
  component: CancellationRoute,
});

function CancellationRoute() {
  const sections = [
    { id: "booking-payment", title: "1. Booking & Payment Policy" },
    { id: "payment-failure", title: "2. Failure to Complete Payment" },
    { id: "cancel-before-full", title: "3. Cancellation (Booking Amount Only)" },
    { id: "cancel-after-full", title: "4. Cancellation (After Full Payment)" },
    { id: "cancel-by-nomadik", title: "5. Cancellation by Nomadik" },
    { id: "refund-processing", title: "6. Refund Processing" },
    { id: "non-refundable", title: "7. Non-Refundable Charges" },
    { id: "modifications", title: "8. Package Modifications" },
    { id: "no-show", title: "9. No Show Policy" },
    { id: "force-majeure", title: "10. Force Majeure" },
    { id: "eligibility", title: "11. Refund Eligibility" },
    { id: "travel-credits", title: "12. Travel Credits" },
    { id: "contact-us", title: "13. Contact Us" },
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
              <Coins className="h-3.5 w-3.5" /> Bookings & Refunds
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-primary tracking-tight">
              Booking, Cancellation & Refund Policy
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
                    At Nomadik, we strive to provide a transparent and hassle-free booking experience. Please read this Booking, Cancellation & Refund Policy carefully before making any reservation.
                  </p>
                  <p className="font-semibold text-primary">
                    By booking any trip with Nomadik, you acknowledge and agree to the terms outlined below.
                  </p>
                </div>
              </Reveal>

              {/* Clause 1 */}
              <Reveal>
                <div id="booking-payment" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">1. Booking & Payment Policy</h2>
                  <p>To reserve your seat on any Nomadik trip:</p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs">
                    <li>A minimum booking amount (generally <strong>₹2,000 per traveler</strong> or as mentioned on the package page) must be paid to confirm your booking.</li>
                    <li>The remaining balance must be paid at least <strong>3 days (72 hours)</strong> before the scheduled departure date unless otherwise specified.</li>
                    <li>Your booking will only be confirmed after successful payment and generation of a Booking ID.</li>
                    <li>Seats are allocated on a first-come, first-served basis and remain subject to availability.</li>
                  </ul>
                </div>
              </Reveal>

              {/* Clause 2 */}
              <Reveal>
                <div id="payment-failure" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">2. Failure to Complete Payment</h2>
                  <p>If the remaining balance is not paid before the payment deadline:</p>
                  <ul className="list-disc pl-5 space-y-1 text-xs">
                    <li>Your booking may be cancelled automatically.</li>
                    <li>Your reserved seat may be released to another traveler.</li>
                    <li>The booking amount may be forfeited depending on the package and departure.</li>
                  </ul>
                  <p className="text-xs text-destructive font-semibold">
                    Nomadik reserves the right to cancel unpaid reservations without prior notice.
                  </p>
                </div>
              </Reveal>

              {/* Clause 3 */}
              <Reveal>
                <div id="cancel-before-full" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">3. Cancellation Before Full Payment (Only Booking Token Paid)</h2>
                  <p>If you cancel your booking after paying only the booking token amount, the following refund calculations apply:</p>
                  
                  <div className="overflow-x-auto border border-border rounded-xl mt-3">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950 border-b border-border">
                          <th className="p-3 font-semibold">Cancellation Before Departure</th>
                          <th className="p-3 font-semibold">Refund Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border">
                          <td className="p-3">30 days or more</td>
                          <td className="p-3 text-emerald-600 font-semibold">100% Refund</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="p-3">15–29 days</td>
                          <td className="p-3 text-emerald-600 font-semibold">70% Refund</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="p-3">8–14 days</td>
                          <td className="p-3 text-amber-600 font-semibold">50% Refund</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="p-3">4–7 days</td>
                          <td className="p-3 text-amber-600 font-semibold">25% Refund</td>
                        </tr>
                        <tr>
                          <td className="p-3">0–3 days</td>
                          <td className="p-3 text-destructive font-semibold">No Refund</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Refunds will be processed to the original payment method where applicable.</p>
                </div>
              </Reveal>

              {/* Clause 4 */}
              <Reveal>
                <div id="cancel-after-full" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">4. Cancellation After Full Payment</h2>
                  <p>If the complete trip amount has already been paid, the following refund scale applies:</p>
                  
                  <div className="overflow-x-auto border border-border rounded-xl mt-3">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950 border-b border-border">
                          <th className="p-3 font-semibold">Cancellation Before Departure</th>
                          <th className="p-3 font-semibold">Refund Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border">
                          <td className="p-3">30 days or more</td>
                          <td className="p-3 text-emerald-600 font-semibold">100% Refund</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="p-3">15–29 days</td>
                          <td className="p-3 text-emerald-600 font-semibold">90% Refund</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="p-3">8–14 days</td>
                          <td className="p-3 text-amber-600 font-semibold">75% Refund</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="p-3">4–7 days</td>
                          <td className="p-3 text-amber-600 font-semibold">50% Refund</td>
                        </tr>
                        <tr>
                          <td className="p-3">Less than 4 days</td>
                          <td className="p-3 text-destructive font-semibold">No Refund</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </Reveal>

              {/* Clause 5 */}
              <Reveal>
                <div id="cancel-by-nomadik" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">5. Cancellation by Nomadik</h2>
                  <p>If Nomadik cancels a trip due to operational reasons such as low participation, safety concerns, government restrictions, natural disasters, or force majeure events, travelers may receive one of the following:</p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs font-semibold text-primary">
                    <li>Full refund processed back to original source</li>
                    <li>Rescheduling to another scheduled departure date</li>
                    <li>Future travel credits for any Nomadik booking</li>
                  </ul>
                  <p className="text-xs text-muted-foreground">Nomadik will communicate all available options directly to affected travelers.</p>
                </div>
              </Reveal>

              {/* Clause 6 */}
              <Reveal>
                <div id="refund-processing" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">6. Refund Processing</h2>
                  <p>Approved refunds will be processed:</p>
                  <ul className="list-disc pl-5 space-y-1 text-xs">
                    <li>Within <strong>7–10 business days</strong>.</li>
                    <li>To the original payment method wherever possible.</li>
                  </ul>
                  <p className="text-xs text-muted-foreground italic">Processing time may vary depending on your bank or payment provider.</p>
                </div>
              </Reveal>

              {/* Clause 7 */}
              <Reveal>
                <div id="non-refundable" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">7. Non-Refundable Charges</h2>
                  <p>The following are generally non-refundable:</p>
                  <ul className="list-disc pl-5 space-y-1 text-xs">
                    <li>Payment gateway transaction charges & platform convenience fees</li>
                    <li>Government taxes already paid & visa processing fees</li>
                    <li>Flight or train tickets booked separately</li>
                    <li>Travel insurance & third-party bookings marked as non-refundable</li>
                  </ul>
                </div>
              </Reveal>

              {/* Clause 8 */}
              <Reveal>
                <div id="modifications" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">8. Package Modifications</h2>
                  <p>Any request to change travel dates, transfer bookings, upgrade packages, or change traveler names is subject to availability, vendor approval, and additional charges. Nomadik cannot guarantee modification requests.</p>
                </div>
              </Reveal>

              {/* Clause 9 */}
              <Reveal>
                <div id="no-show" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">9. No Show Policy</h2>
                  <p>If a traveler does not report at the designated pickup point, misses the departure, leaves the trip midway, or fails to utilize booked services, no refund will be provided for unused services.</p>
                </div>
              </Reveal>

              {/* Clause 10 */}
              <Reveal>
                <div id="force-majeure" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">10. Force Majeure</h2>
                  <p>Nomadik shall not be held responsible for cancellations, delays, or interruptions caused by circumstances beyond our reasonable control, including heavy rainfall, landslides, floods, earthquakes, political unrest, pandemics, road closures, government orders, or transport strikes. Any additional expenses arising due to such situations shall be borne by the traveler.</p>
                </div>
              </Reveal>

              {/* Clause 11 */}
              <Reveal>
                <div id="eligibility" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">11. Refund Eligibility</h2>
                  <p>Refund eligibility is calculated from the official trip reporting time mentioned in your booking confirmation. The date of refund request submission will be considered the cancellation date.</p>
                </div>
              </Reveal>

              {/* Clause 12 */}
              <Reveal>
                <div id="travel-credits" className="bg-card border border-border p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft">
                  <h2 className="font-display text-xl font-bold text-primary">12. Travel Credits</h2>
                  <p>In certain promotional campaigns or special situations, Nomadik may issue Travel Credits instead of monetary refunds. Travel Credits can only be used on Nomadik, are non-transferable, cannot be exchanged for cash, and may have an expiry period.</p>
                </div>
              </Reveal>

              {/* Clause 13 */}
              <Reveal>
                <div id="contact-us" className="bg-card border border-gold p-6 sm:p-8 rounded-3xl space-y-4 shadow-soft relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none translate-x-4 translate-y-4">
                    <BadgeAlert className="h-64 w-64 text-gold" />
                  </div>
                  <h2 className="font-display text-xl font-bold text-primary">13. Contact Us</h2>
                  <p>For cancellation requests, refund status, or booking assistance, contact us:</p>
                  
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
                  </div>

                  <div className="mt-6 pt-6 border-t border-border space-y-2">
                    <div className="flex items-start gap-2 bg-gold/10 border border-gold/25 p-4 rounded-2xl">
                      <Info className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-xs font-poppins uppercase tracking-wider text-gold">Important Note</h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          Each package may have special cancellation terms depending on festivals, peak season, customized trips, international departures, or fixed departure events. If a package has special terms, those conditions will override the general policy and be displayed on the respective package page.
                        </p>
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
