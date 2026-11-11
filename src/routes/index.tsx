import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { TravelStats } from "@/components/site/TravelStats";
import { TravelMediaSlideshow } from "@/components/site/TravelMediaSlideshow";
import { FeaturedPackages } from "@/components/site/FeaturedPackages";
import { SeasonalCampaignBanner } from "@/components/site/SeasonalCampaignBanner";
import { TravelCategories } from "@/components/site/TravelCategories";
import { PopularDestinations } from "@/components/site/PopularDestinations";
import { WhyChooseUs } from "@/components/site/WhyChooseUs";
import { CollegeSpecialsSection } from "@/components/site/CollegeSpecialsSection";
import { FeaturedSpiritualJourneys } from "@/components/site/FeaturedSpiritualJourneys";
import { NomadikExperience } from "@/components/site/NomadikExperience";
import { HomepageReviewsSection } from "@/components/site/HomepageReviewsSection";
import { InstagramReels } from "@/components/site/InstagramReels";
import { NomadikCommunity } from "@/components/site/NomadikCommunity";
import { FAQ } from "@/components/site/FAQ";
import { Footer } from "@/components/site/Footer";
import { FloatingUI } from "@/components/site/FloatingUI";
import { LoadingScreen } from "@/components/site/LoadingScreen";

import { getDestinations, getJourneys } from "@/lib/queries-client";
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
        journeys: journeys || [],
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
    const title = "GoNomadik — Premium Curated Road Trips & Himalayan Treks from Delhi NCR";
    const description =
      "Book curated Himalayan road trips & weekend getaways from Delhi to Munsiyari, Kedarkantha, Kedarnath, Jibhi, Chopta & Manali. Verified stays, expert Trip Captains & group travel.";
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
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
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
        {/* 1. Cinematic Hero with Full-Width Background Travel Video & Ambient Toggle */}
        <Hero />

        {/* 2. Social Proof / Trust Badges & Verified Travel Statistics */}
        <TravelStats />

        {/* 3. Automatic Travel Media Slideshow (Destination Spotlight with Autoplay) */}
        <TravelMediaSlideshow />

        {/* 4. Upcoming Trips & Curated Road Trips */}
        <FeaturedPackages />

        {/* 5. Dynamic Seasonal Promotional Campaign Banner (Winter Escapes / Festive Discounts) */}
        <SeasonalCampaignBanner />

        {/* 6. Explore by Travel Category */}
        <TravelCategories />

        {/* 7. Featured Destinations Grid (All 8 newly added destinations) */}
        <PopularDestinations />

        {/* 8. Why Travel With GoNomadik — Brand Trust Pillars */}
        <WhyChooseUs />

        {/* 9. GoNomadik x College Special Campaigns */}
        <CollegeSpecialsSection />

        {/* 10. Sacred Spiritual Journeys Block */}
        <FeaturedSpiritualJourneys />

        {/* 11. Real Travel Experiences Timeline */}
        <NomadikExperience />

        {/* 12. Verified Traveler Reviews & Ratings */}
        <HomepageReviewsSection />

        {/* 13. Auto-scrolling Real Travel Footage & Reels */}
        <InstagramReels />

        {/* 14. WhatsApp VIP Travel Community */}
        <NomadikCommunity />

        {/* 15. FAQ Accordion */}
        <FAQ />
      </main>
      <Footer />
      <FloatingUI />
    </div>
  );
}
