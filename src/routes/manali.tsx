import { createFileRoute } from "@tanstack/react-router";
import { DestinationTemplate } from "@/components/site/DestinationTemplate";
import { getDestinationBySlug, getJourneys } from "@/lib/queries-client";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingUI } from "@/components/site/FloatingUI";

import { RouteLoadingState, RouteErrorState } from "@/components/site/RouteStates";

export const Route = createFileRoute("/manali")({
  loader: async () => {
    const dest = await getDestinationBySlug("manali");
    const journeys = await getJourneys();
    return { dest, journeys };
  },
  pendingComponent: RouteLoadingState,
  errorComponent: RouteErrorState,
  head: () => ({
    meta: [
      { title: "Manali Road Trip | Nomadik Journeys" },
      {
        name: "description",
        content: "Explore our curated road trips to Manali. Cozy cabin stays, Old Manali cafe walks, and mountain hikes designed for explorers.",
      },
    ],
  }),
  component: ManaliRoute,
});

function ManaliRoute() {
  return (
    <div className="bg-background min-h-screen flex flex-col justify-between">
      <Navbar />
      <main>
        <DestinationTemplate slug="manali" />
      </main>
      <Footer />
      <FloatingUI />
    </div>
  );
}
