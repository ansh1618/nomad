import { createFileRoute, redirect } from "@tanstack/react-router";
import { DestinationTemplate } from "@/components/site/DestinationTemplate";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingUI } from "@/components/site/FloatingUI";
import { RouteLoadingState, RouteErrorState } from "@/components/site/RouteStates";
import { getDestinationBySlug, getJourneys } from "@/lib/queries-client";
import {
  BASE_URL,
  getCanonicalUrl,
  generateTouristDestinationSchema,
  generateBreadcrumbSchema,
  generateFAQSchema
} from "@/lib/seo";

export const Route = createFileRoute("/destinations_/$slug")({
  loader: async ({ params }) => {
    const rawSlug = (params.slug || "").toLowerCase().trim();

    // Alias redirects to clean canonical slugs
    if (rawSlug === "chopta-tungnath") {
      throw redirect({ to: "/destinations/$slug", params: { slug: "chopta" }, statusCode: 301 });
    }
    if (rawSlug === "mcleod-ganj") {
      throw redirect({ to: "/destinations/$slug", params: { slug: "mcleodganj" }, statusCode: 301 });
    }

    try {
      const [dest, journeys] = await Promise.all([
        getDestinationBySlug(rawSlug),
        getJourneys()
      ]);
      return { dest, journeys: journeys || [] };
    } catch (err) {
      console.error(`[Loader /destinations/$slug] Exception loading ${rawSlug}:`, err);
      return { dest: null, journeys: [] };
    }
  },
  pendingComponent: RouteLoadingState,
  errorComponent: RouteErrorState,
  head: ({ loaderData, params }: any) => {
    const slug = (params?.slug || "").toLowerCase().trim();
    const dest = loaderData?.dest;

    const canonicalSlug = slug === "chopta-tungnath" ? "chopta" : slug === "mcleod-ganj" ? "mcleodganj" : slug;
    const canonicalUrl = getCanonicalUrl(`/destinations/${canonicalSlug}`);

    // Search intent specific title & description mapping
    let seoTitle = `${dest?.name || 'Destination'} Road Trip & Group Package from Delhi | GoNomadik`;
    let seoDesc = `Explore ${dest?.name || 'Destination'} with GoNomadik. Handpicked stays, road trip convoy from Delhi NCR, verified Trip Captains & transparent itineraries.`;

    if (canonicalSlug === "udaipur") {
      seoTitle = "Udaipur Trip Package from Delhi — Road Trips & Weekend Getaway | GoNomadik";
      seoDesc = "Plan your Udaipur road trip from Delhi with GoNomadik. City Palace, Lake Pichola, Monsoon Palace & luxury stays with zero hidden costs.";
    } else if (canonicalSlug === "manali") {
      seoTitle = "Manali Road Trip Package from Delhi — Old Manali & Solang Valley | GoNomadik";
      seoDesc = "Join GoNomadik's curated Manali group trip from Delhi. Solang Valley snow drive, Old Manali cafe walks, Sethan valley & bonfire nights.";
    } else if (canonicalSlug === "jibhi") {
      seoTitle = "Jibhi Trip Package from Delhi — Tirthan Valley & Jalori Pass | GoNomadik";
      seoDesc = "Discover Jibhi & Tirthan Valley on a curated road trip from Delhi. Waterfall hikes, Jalori Pass trek, cozy wooden homestays & Serolsar Lake.";
    } else if (canonicalSlug === "chopta") {
      seoTitle = "Chopta Tungnath Trek & Road Trip Package from Delhi | GoNomadik";
      seoDesc = "Embark on the Chopta & Tungnath snow trek from Delhi / Rishikesh. Experience the highest Shiva temple, Chandrashila summit & Deoria Tal lake.";
    } else if (canonicalSlug === "mcleodganj") {
      seoTitle = "McLeod Ganj & Triund Trip Package from Delhi — Dharamshala Road Trip | GoNomadik";
      seoDesc = "Explore McLeod Ganj, Dalai Lama Temple & Triund trek with GoNomadik. Premium road journeys from Delhi NCR with verified mountain stays.";
    }

    const breadcrumbs = [
      { name: "Home", url: "/" },
      { name: "Destinations", url: "/destinations" },
      { name: dest?.name || canonicalSlug, url: `/destinations/${canonicalSlug}` }
    ];

    const destSchema = generateTouristDestinationSchema({
      name: dest?.name || canonicalSlug,
      slug: canonicalSlug,
      overview: dest?.overview || dest?.description,
      image: dest?.image || dest?.hero_image,
      topPlaces: dest?.topPlaces || []
    });

    const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
    const faqSchema = dest?.faqs ? generateFAQSchema(dest.faqs) : null;

    const scriptsArr = [
      { type: "application/ld+json", children: JSON.stringify(destSchema) },
      { type: "application/ld+json", children: JSON.stringify(breadcrumbSchema) }
    ];
    if (faqSchema) {
      scriptsArr.push({ type: "application/ld+json", children: JSON.stringify(faqSchema) });
    }

    return {
      meta: [
        { title: seoTitle },
        { name: "description", content: seoDesc },
        { property: "og:title", content: seoTitle },
        { property: "og:description", content: seoDesc },
        { property: "og:url", content: canonicalUrl },
        { property: "og:type", content: "website" },
        { property: "og:image", content: dest?.image || `${BASE_URL}/nomadik-favicon.png` },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: seoTitle },
        { name: "twitter:description", content: seoDesc },
        { name: "twitter:image", content: dest?.image || `${BASE_URL}/nomadik-favicon.png` },
      ],
      links: [
        { rel: "canonical", href: canonicalUrl }
      ],
      scripts: scriptsArr
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
