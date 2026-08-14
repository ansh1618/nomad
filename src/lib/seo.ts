export const BASE_URL = "https://nomadik.co.in";

/**
 * Returns clean canonical URL without query parameters (e.g. ?book=true).
 */
export function getCanonicalUrl(path: string = ""): string {
  const cleanPath = path.split("?")[0].split("#")[0];
  const normalizedPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  if (normalizedPath === "/") return BASE_URL;
  return `${BASE_URL}${normalizedPath.replace(/\/+$/, "")}`;
}

/**
 * Organization Schema (JSON-LD)
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE_URL}/#organization`,
    name: "GoNomadik",
    alternateName: ["Nomadik", "GoNomadik Road Trips"],
    url: BASE_URL,
    logo: `${BASE_URL}/nomadik-favicon.png`,
    image: `${BASE_URL}/images/manali/manali-snow-valley.jpg`,
    description: "Nomadik crafts premium, curated road trips and group journeys across India. Join our community of explorers on unforgettable road travel experiences.",
    email: "support.nomadik@gmail.com",
    telephone: "+91-7982850767",
    sameAs: [
      "https://www.instagram.com/gonomadik",
      "https://chat.whatsapp.com/Gs3A2oHpp4r0iYCVqxvS57"
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: "New Delhi",
      addressRegion: "Delhi NCR",
      addressCountry: "IN"
    }
  };
}

/**
 * WebSite Schema (JSON-LD)
 */
export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    url: BASE_URL,
    name: "GoNomadik Road Trips",
    alternateName: "Nomadik Travel",
    publisher: {
      "@id": `${BASE_URL}/#organization`
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${BASE_URL}/explorer?search={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };
}

/**
 * BreadcrumbList Schema (JSON-LD)
 */
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : getCanonicalUrl(item.url)
    }))
  };
}

/**
 * TouristDestination Schema (JSON-LD)
 */
export function generateTouristDestinationSchema(dest: {
  name: string;
  slug: string;
  subtitle?: string;
  overview?: string;
  image?: string;
  topPlaces?: string[];
}) {
  const url = getCanonicalUrl(`/destinations/${dest.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    "@id": `${url}/#destination`,
    name: `${dest.name} Road Trip`,
    description: dest.overview || dest.subtitle || `Travel guide and road trip package for ${dest.name} from Delhi.`,
    url: url,
    image: dest.image?.startsWith("http") ? dest.image : `${BASE_URL}${dest.image || "/nomadik-favicon.png"}`,
    touristType: ["Road Trip", "Group Travel", "Weekend Trip", "Adventure Travel"],
    includesAttraction: (dest.topPlaces || []).map((place) => ({
      "@type": "TouristAttraction",
      name: place
    }))
  };
}

/**
 * Product / Trip Package Schema (JSON-LD)
 */
export function generateProductSchema(journey: {
  name: string;
  slug: string;
  overview?: string;
  price?: string | number;
  image?: string;
  duration?: string;
}) {
  const url = getCanonicalUrl(`/journeys/${journey.slug}`);
  
  // Extract numeric price accurately
  let numericPrice = 6499;
  if (typeof journey.price === "number" && !isNaN(journey.price) && journey.price > 0) {
    numericPrice = journey.price;
  } else if (typeof journey.price === "string") {
    const cleaned = journey.price.replace(/[^0-9]/g, "");
    if (cleaned) {
      const parsed = parseInt(cleaned, 10);
      if (!isNaN(parsed) && parsed > 0) numericPrice = parsed;
    }
  }

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}/#product`,
    name: journey.name,
    description: journey.overview || `${journey.name} road trip package from Delhi with verified stays and trip captains.`,
    image: journey.image?.startsWith("http") ? journey.image : `${BASE_URL}${journey.image || "/nomadik-favicon.png"}`,
    url: url,
    brand: {
      "@type": "Brand",
      name: "GoNomadik"
    },
    offers: {
      "@type": "Offer",
      url: url,
      priceCurrency: "INR",
      price: numericPrice,
      priceValidUntil: "2026-12-31",
      itemCondition: "https://schema.org/NewCondition",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "GoNomadik"
      }
    }
  };
}

/**
 * Article Schema (JSON-LD)
 */
export function generateArticleSchema(article: {
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  featured_image?: string;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
  author_name?: string;
}) {
  const url = getCanonicalUrl(`/stories/${article.slug}`);
  const pubDate = article.published_at || article.created_at || new Date().toISOString();
  const modDate = article.updated_at || pubDate;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}/#article`,
    headline: article.title,
    description: article.excerpt || `Travel guide and insights for ${article.title}`,
    url: url,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url
    },
    image: article.featured_image?.startsWith("http") ? article.featured_image : `${BASE_URL}${article.featured_image || "/nomadik-favicon.png"}`,
    datePublished: pubDate,
    dateModified: modDate,
    author: {
      "@type": "Person",
      name: article.author_name || "The Nomadik Traveller"
    },
    publisher: {
      "@type": "Organization",
      name: "GoNomadik",
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/nomadik-favicon.png`
      }
    }
  };
}

/**
 * FAQPage Schema (JSON-LD)
 */
export function generateFAQSchema(faqs: { q: string; a: string }[]) {
  if (!faqs || faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a
      }
    }))
  };
}
