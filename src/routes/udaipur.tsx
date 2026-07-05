import { createFileRoute } from "@tanstack/react-router";
import { DestinationTemplate } from "@/components/site/DestinationTemplate";
import { getDestinationBySlug, getJourneys } from "@/lib/queries-client";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingUI } from "@/components/site/FloatingUI";

import { RouteLoadingState, RouteErrorState } from "@/components/site/RouteStates";

export const Route = createFileRoute("/udaipur")({
  loader: async () => {
    const dest = await getDestinationBySlug("udaipur");
    const journeys = await getJourneys();
    return { dest, journeys };
  },
  pendingComponent: RouteLoadingState,
  errorComponent: RouteErrorState,
  head: () => ({
    meta: [
      { title: "Udaipur Oasis Weekend | Nomadik Journeys" },
      {
        name: "description",
        content: "Experience the royal Mewar heritage in Udaipur. Lake Pichola boat cruises and Aravali road trip caravans.",
      },
    ],
  }),
  component: UdaipurRoute,
});

function UdaipurRoute() {
  return (
    <div className="bg-background min-h-screen flex flex-col justify-between">
      <Navbar />
      <main>
        <DestinationTemplate slug="udaipur" />
      </main>
      <Footer />
      <FloatingUI />
    </div>
  );
}
