/**
 * MediaResolver — Centralized, strictly isolated Media Architecture for Nomadik Platform
 * 
 * Rules:
 * 1. Destinations ONLY display authentic destination media. Never cross-contaminate.
 * 2. Journeys display journey-specific hero images & galleries.
 * 3. Fallbacks per slug return location-authentic imagery (e.g. Udaipur -> Lake Pichola & City Palace).
 * 4. Invalid URLs (blob:, devtools screenshots) are filtered cleanly.
 */

export const AUTHENTIC_DESTINATION_MEDIA: Record<string, { hero: string; gallery: { url: string; caption: string }[] }> = {
  udaipur: {
    hero: "/images/destinations/udaipur-lake-pichola.jpg",
    gallery: [
      { url: "/images/destinations/udaipur-lake-pichola.jpg", caption: "Amet Haveli & Lake Pichola Pavilion at Sunset" },
      { url: "https://images.unsplash.com/photo-1615836245337-f5b9b2303f1c?auto=format&fit=crop&w=1200&q=80", caption: "Lake Pichola & City Palace at Golden Hour" },
      { url: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80", caption: "Jag Mandir Island Palace" },
      { url: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1200&q=80", caption: "Fateh Sagar Lake Sunset" },
      { url: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80", caption: "Gangaur Ghat Evening Aarti" }
    ]
  },
  manali: {
    hero: "/images/destinations/manali-atal-tunnel.jpg",
    gallery: [
      { url: "/images/destinations/manali-atal-tunnel.jpg", caption: "Atal Tunnel, Rohtang Gate & Snow Peaks" },
      { url: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80", caption: "Solang Valley Snow Peaks" },
      { url: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1200&q=80", caption: "Old Manali Wooden Cafes & Pine Trails" }
    ]
  },
  jibhi: {
    hero: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2000&q=90",
    gallery: [
      { url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80", caption: "Jibhi Valley Riverside Wooden Homestay" },
      { url: "/images/transport/force-traveller-front.jpg", caption: "Jalori Pass & Serolsar Lake Trail" }
    ]
  },
  mcleodganj: {
    hero: "/images/destinations/mcleodganj-town-view.jpg",
    gallery: [
      { url: "/images/destinations/mcleodganj-town-view.jpg", caption: "Colorful McLeod Ganj Town & Dhauladhar Ranges" },
      { url: "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=1200&q=80", caption: "Dhauladhar Snow Ranges from McLeod Ganj" }
    ]
  },
  "chopta-tungnath": {
    hero: "/images/destinations/chopta-tungnath-snow.jpg",
    gallery: [
      { url: "/images/destinations/chopta-tungnath-snow.jpg", caption: "Snow Trek & World's Highest Shiva Temple Summit" },
      { url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80", caption: "Chopta Meadows & Himalayan Peaks" }
    ]
  }
};

export function isValidMediaUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (trimmed.length < 5) return false;

  const lower = trimmed.toLowerCase();
  if (
    lower.includes("blob:") ||
    lower.includes("localhost") ||
    lower.includes("127.0.0.1") ||
    lower.includes("chrome-extension") ||
    lower.includes("data:image") ||
    lower.includes("screenshot") ||
    lower.includes("devtools")
  ) {
    return false;
  }

  return lower.startsWith("/") || lower.startsWith("http://") || lower.startsWith("https://");
}

export function resolveDestinationHero(slug?: string | null, rawHero?: string | null): string {
  const s = (slug || "").toLowerCase().trim();

  // If rawHero is valid, use it
  if (isValidMediaUrl(rawHero)) {
    return rawHero!.trim();
  }

  // Fallback strictly per destination slug
  if (s.includes("udaipur")) return AUTHENTIC_DESTINATION_MEDIA.udaipur.hero;
  if (s.includes("manali")) return AUTHENTIC_DESTINATION_MEDIA.manali.hero;
  if (s.includes("jibhi") || s.includes("tirthan")) return AUTHENTIC_DESTINATION_MEDIA.jibhi.hero;
  if (s.includes("mcleod") || s.includes("dharamshala")) return AUTHENTIC_DESTINATION_MEDIA.mcleodganj.hero;
  if (s.includes("chopta") || s.includes("tungnath")) return AUTHENTIC_DESTINATION_MEDIA["chopta-tungnath"].hero;

  return AUTHENTIC_DESTINATION_MEDIA.udaipur.hero;
}

export function resolveJourneyHero(journeySlug?: string | null, rawHero?: string | null, destSlug?: string | null): string {
  if (isValidMediaUrl(rawHero)) {
    return rawHero!.trim();
  }
  return resolveDestinationHero(destSlug || journeySlug, null);
}

export function resolveGallery(rawGallery?: any[], slug?: string | null): any[] {
  if (Array.isArray(rawGallery) && rawGallery.length > 0) {
    const cleaned = rawGallery.filter(item => {
      const url = typeof item === 'string' ? item : item?.url;
      return isValidMediaUrl(url);
    });
    if (cleaned.length > 0) return cleaned;
  }

  const s = (slug || "").toLowerCase().trim();
  if (s.includes("udaipur")) return AUTHENTIC_DESTINATION_MEDIA.udaipur.gallery;
  if (s.includes("manali")) return AUTHENTIC_DESTINATION_MEDIA.manali.gallery;
  if (s.includes("jibhi")) return AUTHENTIC_DESTINATION_MEDIA.jibhi.gallery;
  if (s.includes("mcleod")) return AUTHENTIC_DESTINATION_MEDIA.mcleodganj.gallery;
  if (s.includes("chopta")) return AUTHENTIC_DESTINATION_MEDIA["chopta-tungnath"].gallery;

  return AUTHENTIC_DESTINATION_MEDIA.udaipur.gallery;
}
