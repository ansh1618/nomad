import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingUI } from "@/components/site/FloatingUI";
import { MHHero } from "@/components/miranda-house/MHHero";
import { MHTripStats } from "@/components/miranda-house/MHTripStats";
import { MHHighlights } from "@/components/miranda-house/MHHighlights";
import { MHDestinations } from "@/components/miranda-house/MHDestinations";
import { MHItinerary } from "@/components/miranda-house/MHItinerary";
import { MHInclusions } from "@/components/miranda-house/MHInclusions";
import { MHCoupon } from "@/components/miranda-house/MHCoupon";
import { MHGroupBooking } from "@/components/miranda-house/MHGroupBooking";
import { MHFAQ } from "@/components/miranda-house/MHFAQ";
import { MHFinalCTA } from "@/components/miranda-house/MHFinalCTA";

export const Route = createFileRoute("/go-nomadik-x-mh")({
  head: () => ({
    meta: [
      { title: "GoNomadik × Miranda House — Udaipur 2026 All-Girls Trip" },
      {
        name: "description",
        content:
          "Exclusive all-girls college trip to Udaipur & Mount Abu for Miranda House students & friends. 2N/3D of palaces, lakes, boat rides, bonfire nights starting from ₹6,499. Use code STUTI500 for ₹500 OFF.",
      },
      { property: "og:title", content: "GoNomadik × Miranda House — Udaipur 2026 All-Girls Trip" },
      {
        property: "og:description",
        content:
          "Palaces. Lakes. Sunsets. Your girl gang. Join the exclusive Miranda House Udaipur road trip with GoNomadik.",
      },
    ],
  }),
  component: GoNomadikXMHPage,
});

function GoNomadikXMHPage() {
  return (
    <div className="overflow-x-hidden bg-background font-poppins min-h-screen">
      <Navbar />
      <main>
        {/* 1. Hero Section */}
        <MHHero />
        {/* 2. Trip Information Bar */}
        <MHTripStats />
        {/* 3. Why This Trip (6 Cards) */}
        <MHHighlights />
        {/* 4. Places You'll Explore */}
        <MHDestinations />
        {/* 5. Detailed Itinerary */}
        <MHItinerary />
        {/* 6. Inclusions & Exclusions */}
        <MHInclusions />
        {/* 7. Miranda House Special Discount STUTI500 */}
        <MHCoupon />
        {/* 8. Group Booking Cards */}
        <MHGroupBooking />
        {/* 9. FAQ Accordion */}
        <MHFAQ />
        {/* 10. Final CTA */}
        <MHFinalCTA />
      </main>
      <Footer />
      <FloatingUI />
    </div>
  );
}
