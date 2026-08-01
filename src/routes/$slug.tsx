import { createFileRoute, notFound } from "@tanstack/react-router";
import { DestinationTemplate } from "@/components/site/DestinationTemplate";
import { getDestinationBySlug, getJourneys, STATIC_FALLBACK_JOURNEYS } from "@/lib/queries-client";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingUI } from "@/components/site/FloatingUI";
import { RouteLoadingState, RouteErrorState } from "@/components/site/RouteStates";
import { withTimeout } from "@/lib/promise-timeout";

export const Route = createFileRoute("/$slug")({
  loader: async ({ params }) => {
    const [dest, journeys] = await Promise.all([
      withTimeout(getDestinationBySlug(params.slug), 6000, null),
      withTimeout(getJourneys(), 6000, STATIC_FALLBACK_JOURNEYS)
    ]);
    return { dest, journeys: journeys?.length > 0 ? journeys : STATIC_FALLBACK_JOURNEYS };
  },
  pendingComponent: RouteLoadingState,
  errorComponent: RouteErrorState,
  head: ({ params }) => {
    const slug = params?.slug || "";
    const titleFriendly = slug ? slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "Explore";
    return {
      meta: [
        { title: `${titleFriendly} | Nomadik Journeys` },
        {
          name: "description",
          content: `Travel and explore ${titleFriendly} with Nomadik.`,
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
