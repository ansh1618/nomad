import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { PopularDestinations } from "@/components/site/PopularDestinations";
import { TravelStats } from "@/components/site/TravelStats";
import { MirandaHouseBanner } from "@/components/site/MirandaHouseBanner";
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
import { BASE_URL, getCanonicalUrl } from "@/lib/seo";

export const Route = createFileRoute("/")({
  loader: async () => {
    try {
      const [destinations, journeys] = await Promise.all([
        getDestinations(),
        getJourneys(),
      ]);
      return {
        destinations: destinations || [],
        journeys: journeys || []
      };
    } catch (err) {
      console.error("[Nomadik Loader] Failed to load data:", err);
      return { destinations: [], journeys: [] };
    }
  },
  pendingComponent: RouteLoadingState,
  errorComponent: RouteErrorState,
  head: () => {
    const canonicalUrl = getCanonicalUrl("/");
    const title = "GoNomadik — Premium Curated Road Trips & Weekend Trips from Delhi";
    const description = "Book curated road trips & weekend getaways from Delhi to Udaipur, Manali, Jibhi, Chopta & McLeod Ganj. Verified stays, expert Trip Captains & group travel.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:site_name", content: "GoNomadik" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: canonicalUrl },
        { property: "og:type", content: "website" },
        { property: "og:image", content: `${BASE_URL}/images/gonomadik-full-logo.png` },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description }
      ],
      links: [
        { rel: "canonical", href: canonicalUrl }
      ]
    };
  },
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
        {/* GoNomadik x Miranda House Special College Campaign */}
        <MirandaHouseBanner />
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
