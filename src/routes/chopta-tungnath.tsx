import { createFileRoute } from "@tanstack/react-router";
import { DestinationTemplate } from "@/components/site/DestinationTemplate";
import { getDestinationBySlug, getJourneys } from "@/lib/queries-client";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingUI } from "@/components/site/FloatingUI";

import { RouteLoadingState, RouteErrorState } from "@/components/site/RouteStates";

export const Route = createFileRoute("/chopta-tungnath")({
  loader: async () => {
    const dest = await getDestinationBySlug("chopta-tungnath");
    const journeys = await getJourneys();
    return { dest, journeys };
  },
  pendingComponent: RouteLoadingState,
  errorComponent: RouteErrorState,
  head: () => ({
    meta: [
      { title: "Chopta Tungnath Trek | Nomadik Journeys" },
      {
        name: "description",
        content: "Embark on the trek to the highest Shiva temple on Earth at Tungnath, Uttarakhand. Alpine camping, majestic snow peaks.",
      },
    ],
  }),
  component: ChoptaRoute,
});

function ChoptaRoute() {
  return (
    <div className="bg-background min-h-screen flex flex-col justify-between">
      <Navbar />
      <main>
        <DestinationTemplate slug="chopta-tungnath" />
      </main>
      <Footer />
      <FloatingUI />
    </div>
  );
}
