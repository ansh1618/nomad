import { createFileRoute } from "@tanstack/react-router";
import { JourneyDetailTemplate } from "@/components/site/JourneyDetailTemplate";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingUI } from "@/components/site/FloatingUI";

import { getJourneyBySlug } from "@/lib/queries-client";

import { RouteLoadingState, RouteErrorState } from "@/components/site/RouteStates";

export const Route = createFileRoute("/journeys/$journeyId")({
  loader: async ({ params }) => {
    const journey = await getJourneyBySlug(params.journeyId);
    return { journey };
  },
  pendingComponent: RouteLoadingState,
  errorComponent: RouteErrorState,
  head: ({ params }) => ({
    meta: [
      { title: `Nomadik Journey - ${params.journeyId.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}` },
      { name: "description", content: "Explore the day-wise itinerary, inclusions, stay, food, and transport specifics for this Nomadik road journey." }
    ]
  }),
  component: JourneyRoute,
});

function JourneyRoute() {
  const { journeyId } = Route.useParams();

  return (
    <div className="bg-background min-h-screen flex flex-col justify-between">
      <Navbar />
      <main>
        <JourneyDetailTemplate slug={journeyId} />
      </main>
      <Footer />
      <FloatingUI />
    </div>
  );
}
