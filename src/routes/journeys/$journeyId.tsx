import { createFileRoute } from "@tanstack/react-router";
import { JourneyDetailTemplate } from "@/components/site/JourneyDetailTemplate";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingUI } from "@/components/site/FloatingUI";
import { getJourneyBySlug } from "@/lib/queries-client";
import { getUpcomingDepartures } from "@/lib/queries/departures";
import { RouteLoadingState, RouteErrorState } from "@/components/site/RouteStates";
import { withTimeout } from "@/lib/promise-timeout";

import {
  BASE_URL,
  getCanonicalUrl,
  generateProductSchema,
  generateBreadcrumbSchema,
  generateFAQSchema
} from "@/lib/seo";

export const Route = createFileRoute("/journeys/$journeyId")({
  loader: async ({ params }) => {
    console.log(`[Loader /journeys/$journeyId] Step 1: Loading journey slug: ${params.journeyId}...`);
    try {
      const journey = await getJourneyBySlug(params.journeyId);
      console.log(`[Loader /journeys/$journeyId] Step 2: Journey loaded -> ${journey?.name || 'Not Found'} (ID: ${journey?.id || 'none'})`);
      const departures = journey?.id ? await withTimeout(getUpcomingDepartures(journey.id), 4000, []) : [];
      console.log(`[Loader /journeys/$journeyId] Step 3: Departures loaded -> count: ${departures.length}`);
      return { journey, departures };
    } catch (err) {
      console.error(`[Loader /journeys/$journeyId] Exception loading ${params.journeyId}:`, err);
      return { journey: null, departures: [] };
    }
  },
  pendingComponent: RouteLoadingState,
  errorComponent: RouteErrorState,
  head: ({ loaderData, params }: any) => {
    const journeyId = (params?.journeyId || "").toLowerCase().trim();
    const journey = loaderData?.journey;

    const canonicalUrl = getCanonicalUrl(`/journeys/${journeyId}`);

    let seoTitle = `${journey?.name || 'Road Trip Package'} — Delhi Departure | GoNomadik`;
    let seoDesc = journey?.overview || `Join GoNomadik for ${journey?.name || 'this road trip'}. Detailed day-wise itinerary, verified hotel stays, transport from Delhi & 24x7 trip captain support.`;

    if (journeyId.includes("udaipur")) {
      seoTitle = "Udaipur Weekend Road Trip Package from Delhi | GoNomadik";
      seoDesc = "Book 4D/3N Udaipur road trip from Delhi. City Palace, Lake Pichola boat ride, Monsoon Palace & heritage stay with transparent pricing.";
    } else if (journeyId.includes("manali")) {
      seoTitle = "Manali 4D/3N Group Road Trip Package from Delhi | GoNomadik";
      seoDesc = "Book curated Manali group road trip from Delhi. Solang Valley snow drive, Old Manali cafe walks, Sethan & bonfire sessions.";
    } else if (journeyId.includes("jibhi")) {
      seoTitle = "Jibhi & Tirthan Valley 4D/3N Road Trip Package from Delhi | GoNomadik";
      seoDesc = "Experience Jibhi & Tirthan Valley on a 4-day road trip from Delhi. Waterfall hikes, Jalori Pass trek, Serolsar Lake & cozy treehouse stays.";
    } else if (journeyId.includes("chopta")) {
      seoTitle = "Chopta Tungnath & Chandrashila Snow Trek Package | GoNomadik";
      seoDesc = "Join the Chopta & Tungnath Temple snow trek from Delhi/Rikesh. Highest Shiva temple trek, Chandrashila summit view & pahadi camp stays.";
    } else if (journeyId.includes("mcleod")) {
      seoTitle = "McLeod Ganj & Triund Trek Road Trip Package from Delhi | GoNomadik";
      seoDesc = "Explore McLeod Ganj, Dalai Lama Temple & Triund trek with GoNomadik. Premium road trip from Delhi NCR with verified stays & trip captain.";
    }

    const breadcrumbs = [
      { name: "Home", url: "/" },
      { name: "Journeys", url: "/journeys" },
      { name: journey?.name || journeyId, url: `/journeys/${journeyId}` }
    ];

    const productSchema = generateProductSchema({
      name: journey?.name || journeyId,
      slug: journeyId,
      overview: journey?.overview,
      price: journey?.price,
      image: journey?.image
    });

    const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);

    const scriptsArr = [
      { type: "application/ld+json", children: JSON.stringify(productSchema) },
      { type: "application/ld+json", children: JSON.stringify(breadcrumbSchema) }
    ];

    return {
      meta: [
        { title: seoTitle },
        { name: "description", content: seoDesc },
        { property: "og:title", content: seoTitle },
        { property: "og:description", content: seoDesc },
        { property: "og:url", content: canonicalUrl },
        { property: "og:type", content: "website" },
        { property: "og:image", content: journey?.image || `${BASE_URL}/nomadik-favicon.png` },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: seoTitle },
        { name: "twitter:description", content: seoDesc },
        { name: "twitter:image", content: journey?.image || `${BASE_URL}/nomadik-favicon.png` },
      ],
      links: [
        { rel: "canonical", href: canonicalUrl }
      ],
      scripts: scriptsArr
    };
  },
  component: JourneyRoute,
});

function JourneyRoute() {
  const { journeyId } = Route.useParams();

  return (
    <div className="bg-background min-h-screen flex flex-col justify-between">
      <Navbar />
      <main className="flex-1">
        <JourneyDetailTemplate slug={journeyId} />
      </main>
      <Footer />
      <FloatingUI />
    </div>
  );
}
