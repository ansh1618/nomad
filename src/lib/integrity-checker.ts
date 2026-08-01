import { supabaseAdmin } from "./supabase-admin";

export interface SystemIntegrityReport {
  timestamp: string;
  destinationsChecked: number;
  journeysChecked: number;
  repairedLinks: number;
  createdDestinations: string[];
  status: "HEALTHY" | "REPAIRED" | "ERROR";
}

const REQUIRED_DESTINATIONS = [
  {
    slug: "manali",
    name: "Manali",
    subtitle: "Valley of Gods & High Mountain Passes",
    hero_image: "/images/destinations/manali-atal-tunnel.jpg",
    country: "India",
    state: "Himachal Pradesh",
    description: "Experience serene snow valleys, Solang adventures, and vibrant Old Manali cafes."
  },
  {
    slug: "jibhi",
    name: "Jibhi",
    subtitle: "Hidden Himalayan Hamlet in Tirthan Valley",
    hero_image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80",
    country: "India",
    state: "Himachal Pradesh",
    description: "Pristine pine forests, wooden chalets, waterfall treks, and tranquil river trails."
  },
  {
    slug: "chopta",
    name: "Chopta",
    subtitle: "Mini Switzerland of Uttarakhand & Tungnath Trek",
    hero_image: "/images/destinations/chopta-tungnath-snow.jpg",
    country: "India",
    state: "Uttarakhand",
    description: "Trek to the highest Shiva temple in the world at Tungnath & summit Chandrashila Peak."
  },
  {
    slug: "udaipur",
    name: "Udaipur",
    subtitle: "City of Lakes & Royal Rajputana Heritage",
    hero_image: "/images/destinations/udaipur-lake-pichola.jpg",
    country: "India",
    state: "Rajasthan",
    description: "Golden sunsets over Lake Pichola, royal palaces, heritage cafes, and fort trails."
  },
  {
    slug: "mcleodganj",
    name: "McLeod Ganj",
    subtitle: "Little Lhasa & Dhauladhar Mountain Trails",
    hero_image: "/images/destinations/mcleodganj-town-view.jpg",
    country: "India",
    state: "Himachal Pradesh",
    description: "Tibetan monasteries, Triund trek, cafes in Dharamkot, and majestic Dhauladhar views."
  },
  {
    slug: "kasol",
    name: "Kasol",
    subtitle: "Mini Israel of India & Parvati Valley Trails",
    hero_image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    country: "India",
    state: "Himachal Pradesh",
    description: "Parvati river banks, Manikaran Sahib, Tosh treks, and bohemian mountain cafes."
  }
];

let integrityRun = false;

export async function runStartupIntegrityCheck(): Promise<SystemIntegrityReport> {
  if (integrityRun && typeof window !== "undefined") {
    return {
      timestamp: new Date().toISOString(),
      destinationsChecked: REQUIRED_DESTINATIONS.length,
      journeysChecked: 0,
      repairedLinks: 0,
      createdDestinations: [],
      status: "HEALTHY"
    };
  }

  integrityRun = true;
  const createdDestinations: string[] = [];
  let repairedLinks = 0;

  try {
    // 1. Audit & Repair Destinations
    const { data: existingDests = [] } = await supabaseAdmin
      .from("destinations")
      .select("id, slug, name");

    const existingSlugMap = new Map((existingDests || []).map(d => [d.slug.toLowerCase(), d]));

    for (const req of REQUIRED_DESTINATIONS) {
      if (!existingSlugMap.has(req.slug)) {
        console.log(`[Integrity Checker] Missing destination '${req.slug}', creating record...`);
        const { data: newDest, error: createErr } = await supabaseAdmin
          .from("destinations")
          .insert({
            slug: req.slug,
            name: req.name,
            subtitle: req.subtitle,
            hero_image: req.hero_image,
            country: req.country,
            state: req.state,
            description: req.description,
            is_published: true
          })
          .select("id, slug, name")
          .single();

        if (!createErr && newDest) {
          createdDestinations.push(newDest.name);
          existingSlugMap.set(req.slug, newDest);
        } else {
          console.warn(`[Integrity Checker] Error creating destination ${req.slug}:`, createErr);
        }
      }
    }

    // 2. Audit & Repair Journey Relationships (Foreign Keys)
    const { data: journeys = [] } = await supabaseAdmin
      .from("journeys")
      .select("id, slug, name, destination_id");

    const validDestIds = new Set((Array.from(existingSlugMap.values())).map(d => d.id));

    for (const j of (journeys || [])) {
      if (!j.destination_id || !validDestIds.has(j.destination_id)) {
        // Try to deduce destination from slug / name
        let matchedDestId: string | null = null;
        const jSlug = j.slug.toLowerCase();
        const jName = j.name.toLowerCase();

        for (const [dSlug, destObj] of existingSlugMap.entries()) {
          if (jSlug.includes(dSlug) || jName.includes(dSlug) || jName.includes(destObj.name.toLowerCase())) {
            matchedDestId = destObj.id;
            break;
          }
        }

        if (matchedDestId) {
          console.log(`[Integrity Checker] Repairing journey '${j.slug}' -> foreign key destination_id: ${matchedDestId}`);
          await supabaseAdmin
            .from("journeys")
            .update({ destination_id: matchedDestId, is_published: true, status: "PUBLISHED" })
            .eq("id", j.id);
          repairedLinks++;
        }
      }
    }

    console.log(`[Integrity Checker] Complete. Created ${createdDestinations.length} destinations, repaired ${repairedLinks} journey relationships.`);

    return {
      timestamp: new Date().toISOString(),
      destinationsChecked: REQUIRED_DESTINATIONS.length,
      journeysChecked: journeys?.length || 0,
      repairedLinks,
      createdDestinations,
      status: "REPAIRED"
    };
  } catch (err: any) {
    console.error("[Integrity Checker] Exception during integrity check:", err?.message || err);
    return {
      timestamp: new Date().toISOString(),
      destinationsChecked: 0,
      journeysChecked: 0,
      repairedLinks: 0,
      createdDestinations: [],
      status: "ERROR"
    };
  }
}
