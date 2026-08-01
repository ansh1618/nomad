import { createFileRoute } from "@tanstack/react-router";
import { JourneyDetailTemplate } from "@/components/site/JourneyDetailTemplate";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingUI } from "@/components/site/FloatingUI";
import { getJourneyBySlug } from "@/lib/queries-client";
import { getUpcomingDepartures } from "@/lib/queries/departures";
import { RouteLoadingState, RouteErrorState } from "@/components/site/RouteStates";
import { withTimeout } from "@/lib/promise-timeout";

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
  head: ({ params }) => {
    const id = params?.journeyId || "";
    const titleFriendly = id ? id.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "Trip Package";
    return {
      meta: [
        { title: `Nomadik Journey - ${titleFriendly}` },
        { name: "description", content: "Explore the day-wise itinerary, inclusions, stay, food, and transport specifics for this Nomadik road journey." }
      ]
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
