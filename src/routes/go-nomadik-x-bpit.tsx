import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingUI } from "@/components/site/FloatingUI";
import { BPITHero } from "@/components/bpit/BPITHero";
import { BPITTripStats } from "@/components/bpit/BPITTripStats";
import { BPITHighlights } from "@/components/bpit/BPITHighlights";
import { BPITDestinations } from "@/components/bpit/BPITDestinations";
import { BPITItinerary } from "@/components/bpit/BPITItinerary";
import { BPITInclusions } from "@/components/bpit/BPITInclusions";
import { BPITGroupBooking } from "@/components/bpit/BPITGroupBooking";
import { BPITFAQ } from "@/components/bpit/BPITFAQ";
import { BPITFinalCTA } from "@/components/bpit/BPITFinalCTA";

export const Route = createFileRoute("/go-nomadik-x-bpit")({
  head: () => ({
    meta: [
      { title: "GoNomadik × BPIT — Udaipur 2026 College Getaway" },
      {
        name: "description",
        content:
          "Exclusive college getaway to Udaipur for BPIT students & friends. 2N/3D of palaces, lakes, boat rides & bonfire nights starting from ₹6,499.",
      },
      { property: "og:title", content: "GoNomadik × BPIT — Udaipur 2026 College Getaway" },
      {
        property: "og:description",
        content:
          "Palaces. Lakes. Sunsets. Your college gang. Join the exclusive BPIT Udaipur road trip with GoNomadik.",
      },
    ],
  }),
  component: GoNomadikXBPITPage,
});

function GoNomadikXBPITPage() {
  return (
    <div className="overflow-x-hidden bg-background font-poppins min-h-screen">
      <Navbar />
      <main>
        {/* 1. Hero Section */}
        <BPITHero />
        {/* 2. Trip Information Bar */}
        <BPITTripStats />
        {/* 3. Why BPIT Loves This Trip (Highlights) */}
        <BPITHighlights />
        {/* 4. Places You'll Explore */}
        <BPITDestinations />
        {/* 5. Detailed Itinerary */}
        <BPITItinerary />
        {/* 6. Inclusions & Exclusions */}
        <BPITInclusions />
        {/* 7. Group Booking Cards */}
        <BPITGroupBooking />
        {/* 8. FAQ Accordion */}
        <BPITFAQ />
        {/* 9. Final CTA */}
        <BPITFinalCTA />
      </main>
      <Footer />
      <FloatingUI />
    </div>
  );
}
