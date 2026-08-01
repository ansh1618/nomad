import { createFileRoute } from "@tanstack/react-router";
import { DestinationTemplate } from "@/components/site/DestinationTemplate";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingUI } from "@/components/site/FloatingUI";
import { RouteLoadingState, RouteErrorState } from "@/components/site/RouteStates";
import { withTimeout } from "@/lib/promise-timeout";
import { getDestinationBySlug, getJourneys, STATIC_FALLBACK_JOURNEYS } from "@/lib/queries-client";

export const Route = createFileRoute("/destinations/$slug")({
  loader: async ({ params }) => {
    try {
      const [dest, journeys] = await Promise.all([
        withTimeout(getDestinationBySlug(params.slug), 6000, null),
        withTimeout(getJourneys(), 6000, STATIC_FALLBACK_JOURNEYS)
      ]);
      return { dest, journeys: journeys?.length > 0 ? journeys : STATIC_FALLBACK_JOURNEYS };
    } catch (err) {
      console.error("[Route Loader] Error in /destinations/$slug loader:", err);
      return { dest: null, journeys: STATIC_FALLBACK_JOURNEYS };
    }
  },
  pendingComponent: RouteLoadingState,
  errorComponent: RouteErrorState,
  head: ({ params }) => {
    const slug = params?.slug || "";
    const titleFriendly = slug ? slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "Destination";
    return {
      meta: [
        { title: `${titleFriendly} | Nomadik Destinations` },
        {
          name: "description",
          content: `Travel and explore ${titleFriendly} with Nomadik. Slow road travel, handpicked stays, and signature convoy vibes.`,
        },
      ],
    };
  },
  component: DynamicDestinationRoute,
});

function DynamicDestinationRoute() {
  const { slug } = Route.useParams();
  return (
    <div className="bg-background min-h-screen flex flex-col justify-between">
      <Navbar />
      <main>
        <DestinationTemplate slug={slug} />
      </main>
      <Footer />
      <FloatingUI />
    </div>
  );
}
