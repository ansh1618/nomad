import { createFileRoute } from "@tanstack/react-router";
import { DestinationTemplate } from "@/components/site/DestinationTemplate";
import { getDestinationBySlug, getJourneys } from "@/lib/queries-client";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingUI } from "@/components/site/FloatingUI";

import { RouteLoadingState, RouteErrorState } from "@/components/site/RouteStates";

export const Route = createFileRoute("/mcleodganj")({
  loader: async () => {
    const dest = await getDestinationBySlug("mcleodganj");
    const journeys = await getJourneys();
    return { dest, journeys };
  },
  pendingComponent: RouteLoadingState,
  errorComponent: RouteErrorState,
  head: () => ({
    meta: [
      { title: "McLeod Ganj & Triund Trek | Nomadik Journeys" },
      {
        name: "description",
        content: "Explore Tibetan monasteries and camp under the stars at Triund, McLeod Ganj. Premium group road journeys.",
      },
    ],
  }),
  component: McLeodGanjRoute,
});

function McLeodGanjRoute() {
  return (
    <div className="bg-background min-h-screen flex flex-col justify-between">
      <Navbar />
      <main>
        <DestinationTemplate slug="mcleodganj" />
      </main>
      <Footer />
      <FloatingUI />
    </div>
  );
}
