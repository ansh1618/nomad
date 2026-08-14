import { createFileRoute, redirect } from "@tanstack/react-router";
import { DestinationTemplate } from "@/components/site/DestinationTemplate";
import { getDestinationBySlug, getJourneys } from "@/lib/queries-client";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingUI } from "@/components/site/FloatingUI";
import { RouteLoadingState, RouteErrorState } from "@/components/site/RouteStates";

export const Route = createFileRoute("/$slug")({
  loader: async ({ params }) => {
    const rawSlug = (params.slug || "").toLowerCase().trim();

    // 1. Redirect /blog to /stories
    if (rawSlug === "blog" || rawSlug === "blogs") {
      throw redirect({ to: "/stories", statusCode: 301 });
    }

    // 2. Redirect destination slugs to /destinations/$slug
    const knownDestinations: Record<string, string> = {
      udaipur: "udaipur",
      manali: "manali",
      jibhi: "jibhi",
      chopta: "chopta",
      "chopta-tungnath": "chopta",
      mcleodganj: "mcleodganj",
      "mcleod-ganj": "mcleodganj"
    };

    if (knownDestinations[rawSlug]) {
      throw redirect({
        to: "/destinations/$slug",
        params: { slug: knownDestinations[rawSlug] },
        statusCode: 301
      });
    }

    try {
      const [dest, journeys] = await Promise.all([
        getDestinationBySlug(rawSlug),
        getJourneys()
      ]);
      return { dest, journeys: journeys || [] };
    } catch (err) {
      console.error(`[Loader /$slug] Exception loading ${rawSlug}:`, err);
      return { dest: null, journeys: [] };
    }
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
