import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { PopularDestinations } from "@/components/site/PopularDestinations";
import { TravelStats } from "@/components/site/TravelStats";
import { NorthCampusSection } from "@/components/site/NorthCampusSection";
import { WhyChooseUs } from "@/components/site/WhyChooseUs";
import { MapSection } from "@/components/site/MapSection";
import { WhyWeDontSellTrips } from "@/components/site/WhyWeDontSellTrips";
import { OurPromise } from "@/components/site/OurPromise";
import { FeaturedPackages } from "@/components/site/FeaturedPackages";
import { FeaturedSpiritualJourneys } from "@/components/site/FeaturedSpiritualJourneys";
import { NomadikExperience } from "@/components/site/NomadikExperience";
import { HomepageReviewsSection } from "@/components/site/HomepageReviewsSection";
import { FloatingReviewWidget } from "@/components/site/FloatingReviewWidget";
import { InstagramReels } from "@/components/site/InstagramReels";
import { NomadikCommunity } from "@/components/site/NomadikCommunity";
import { FAQ } from "@/components/site/FAQ";
import { Footer } from "@/components/site/Footer";
import { FloatingUI } from "@/components/site/FloatingUI";
import { LoadingScreen } from "@/components/site/LoadingScreen";

import { getDestinations, getJourneys, STATIC_FALLBACK_DESTINATIONS, STATIC_FALLBACK_JOURNEYS } from "@/lib/queries-client";
import { withTimeout } from "@/lib/promise-timeout";
import { RouteLoadingState, RouteErrorState } from "@/components/site/RouteStates";

export const Route = createFileRoute("/")({
  loader: async () => {
    try {
      const [destinations, journeys] = await Promise.all([
        withTimeout(getDestinations(), 6000, STATIC_FALLBACK_DESTINATIONS),
        withTimeout(getJourneys(), 6000, STATIC_FALLBACK_JOURNEYS),
      ]);
      return {
        destinations: destinations?.length > 0 ? destinations : STATIC_FALLBACK_DESTINATIONS,
        journeys: journeys?.length > 0 ? journeys : STATIC_FALLBACK_JOURNEYS
      };
    } catch (err) {
      console.error("[Nomadik Loader] Failed to load data, using fallback:", err);
      return { destinations: STATIC_FALLBACK_DESTINATIONS, journeys: STATIC_FALLBACK_JOURNEYS };
    }
  },
  pendingComponent: RouteLoadingState,
  errorComponent: RouteErrorState,
  head: () => ({
    meta: [
      { title: "Nomadik — Premium Curated Road Trips Across India" },
      {
        name: "description",
        content:
          "Discover handpicked road trip experiences to Manali, Jibhi, Chopta, McLeod Ganj & Udaipur. Curated journeys with experienced Trip Captains, verified stays & 24×7 support.",
      },
      { property: "og:title", content: "Nomadik — Premium Curated Road Trips Across India" },
      {
        property: "og:description",
        content:
          "Some roads change you forever. Join 15,000+ explorers on curated road trip adventures across India.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="overflow-x-hidden bg-background">
      <LoadingScreen />
      <Navbar />
      <main>
        {/* 1. Hero with video loop + trusted partners */}
        <Hero />
        {/* 2. Phase 1 destination cards */}
        <PopularDestinations />
        {/* 4. Animated stats counter */}
        <TravelStats />
        {/* Nomadik x North Campus Collaboration */}
        <NorthCampusSection />
        {/* 5. Why Nomadik — 6 brand pillars */}
        <WhyChooseUs />
        {/* 6. Interactive India road map */}
        <MapSection />
        {/* 7. Emotional manifesto block */}
        <WhyWeDontSellTrips />
        {/* 8. Book → Plan → Travel → Memories */}
        <OurPromise />
        {/* 9. Signature journey cards */}
        <FeaturedPackages />
        {/* Featured Spiritual Journeys category block */}
        <FeaturedSpiritualJourneys />
        {/* 10. Horizontal experience timeline */}
        <NomadikExperience />
        {/* 11. Flagship Verified Traveler Reviews & Ratings */}
        <HomepageReviewsSection />
        {/* 12. Auto-scrolling Instagram reels */}
        <InstagramReels />
        {/* 13. WhatsApp community CTA */}
        <NomadikCommunity />
        {/* 14. FAQ accordion */}
        <FAQ />
      </main>
      <Footer />
      <FloatingUI />
      <FloatingReviewWidget />
    </div>
  );
}
