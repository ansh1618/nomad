import { createFileRoute } from "@tanstack/react-router";
import { DestinationTemplate } from "@/components/site/DestinationTemplate";
import { getDestinationBySlug, getJourneys } from "@/lib/queries-client";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingUI } from "@/components/site/FloatingUI";

import { RouteLoadingState, RouteErrorState } from "@/components/site/RouteStates";

export const Route = createFileRoute("/jibhi")({
  loader: async () => {
    const dest = await getDestinationBySlug("jibhi");
    const journeys = await getJourneys();
    return { dest, journeys };
  },
  pendingComponent: RouteLoadingState,
  errorComponent: RouteErrorState,
  head: () => ({
    meta: [
      { title: "Jibhi & Tirthan Valley Road Trip | Nomadik Journeys" },
      {
        name: "description",
        content: "Travel to the fairytale wooden cottages of Jibhi. Guided hikes to Jalori Pass, Serolsar Lake, and Chehni Kothi.",
      },
    ],
  }),
  component: JibhiRoute,
});

function JibhiRoute() {
  return (
    <div className="bg-background min-h-screen flex flex-col justify-between">
      <Navbar />
      <main>
        <DestinationTemplate slug="jibhi" />
      </main>
      <Footer />
      <FloatingUI />
    </div>
  );
}
