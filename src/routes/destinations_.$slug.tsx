import { createFileRoute } from "@tanstack/react-router";
import { DestinationTemplate } from "@/components/site/DestinationTemplate";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingUI } from "@/components/site/FloatingUI";
import { RouteLoadingState, RouteErrorState } from "@/components/site/RouteStates";
import { withTimeout } from "@/lib/promise-timeout";
import { getDestinationBySlug, getJourneys } from "@/lib/queries-client";

export const Route = createFileRoute("/destinations_/$slug")({
  loader: async ({ params }) => {
    console.log(`[Loader /destinations/$slug] Loading destination slug: ${params.slug}...`);
    try {
      const [dest, journeys] = await Promise.all([
        getDestinationBySlug(params.slug),
        getJourneys()
      ]);
      console.log(`[Loader /destinations/$slug] Resolved dest: ${dest?.name || 'Not Found'}, journeys count: ${journeys?.length || 0}`);
      return { dest, journeys: journeys || [] };
    } catch (err) {
      console.error(`[Loader /destinations/$slug] Exception loading ${params.slug}:`, err);
      return { dest: null, journeys: [] };
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
