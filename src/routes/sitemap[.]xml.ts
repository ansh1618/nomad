import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { BASE_URL } from "@/lib/seo";
import { destinations as staticDestinations } from "@/data/destinations";
import { journeys as staticJourneys } from "@/data/journeys";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entriesMap = new Map<string, SitemapEntry>();

        const addEntry = (entry: SitemapEntry) => {
          let cleanPath = entry.path.split("?")[0].split("#")[0];
          if (!cleanPath.startsWith("/")) cleanPath = `/${cleanPath}`;

          // Filter out duplicate aliases
          if (cleanPath === "/destinations/chopta-tungnath") cleanPath = "/destinations/chopta";
          if (cleanPath === "/destinations/mcleod-ganj") cleanPath = "/destinations/mcleodganj";

          // Exclude internal / non-public paths
          if (
            cleanPath.startsWith("/admin") ||
            cleanPath.startsWith("/api") ||
            cleanPath.startsWith("/account") ||
            cleanPath.includes("booking.success") ||
            cleanPath.includes("payment-demo") ||
            cleanPath.includes("reset-password") ||
            cleanPath.includes("forgot-password") ||
            cleanPath.includes("login") ||
            cleanPath.includes("signup")
          ) {
            return;
          }

          entriesMap.set(cleanPath, {
            ...entry,
            path: cleanPath,
          });
        };

        const todayIso = new Date().toISOString().split("T")[0];

        // 1. Static Core Public Pages
        addEntry({ path: "/", changefreq: "daily", priority: "1.0", lastmod: todayIso });
        addEntry({ path: "/destinations", changefreq: "weekly", priority: "0.9", lastmod: todayIso });
        addEntry({ path: "/journeys", changefreq: "weekly", priority: "0.9", lastmod: todayIso });
        addEntry({ path: "/stories", changefreq: "daily", priority: "0.9", lastmod: todayIso });
        addEntry({ path: "/about", changefreq: "monthly", priority: "0.7", lastmod: todayIso });
        addEntry({ path: "/contact", changefreq: "monthly", priority: "0.7", lastmod: todayIso });
        addEntry({ path: "/campus-trips", changefreq: "monthly", priority: "0.6", lastmod: todayIso });
        addEntry({ path: "/privacy", changefreq: "yearly", priority: "0.3", lastmod: todayIso });
        addEntry({ path: "/terms", changefreq: "yearly", priority: "0.3", lastmod: todayIso });
        addEntry({ path: "/cancellation", changefreq: "yearly", priority: "0.3", lastmod: todayIso });

        // 2. Fetch Destinations from DB + Static Fallbacks
        try {
          const { data: dbDests } = await supabase
            .from("destinations")
            .select("slug, updated_at")
            .eq("is_published", true)
            .eq("is_deleted", false);

          const destSlugs = new Set<string>();
          if (dbDests && dbDests.length > 0) {
            for (const d of dbDests) {
              if (d.slug) {
                destSlugs.add(d.slug.toLowerCase());
                const mod = d.updated_at ? new Date(d.updated_at).toISOString().split("T")[0] : todayIso;
                addEntry({ path: `/destinations/${d.slug.toLowerCase()}`, changefreq: "weekly", priority: "0.8", lastmod: mod });
              }
            }
          }

          // Fallback static destinations
          for (const sd of staticDestinations) {
            const canonicalSlug = sd.slug === "chopta-tungnath" ? "chopta" : sd.slug === "mcleod-ganj" ? "mcleodganj" : sd.slug;
            if (!destSlugs.has(canonicalSlug)) {
              addEntry({ path: `/destinations/${canonicalSlug}`, changefreq: "weekly", priority: "0.8", lastmod: todayIso });
            }
          }
        } catch (err) {
          console.warn("[Sitemap] Destinations fetch warning:", err);
        }

        // 3. Fetch Journeys from DB + Static Fallbacks
        try {
          const { data: dbJourneys } = await supabase
            .from("packages")
            .select("slug, updated_at")
            .eq("is_published", true)
            .eq("is_deleted", false);

          const journeySlugs = new Set<string>();
          if (dbJourneys && dbJourneys.length > 0) {
            for (const j of dbJourneys) {
              if (j.slug) {
                journeySlugs.add(j.slug.toLowerCase());
                const mod = j.updated_at ? new Date(j.updated_at).toISOString().split("T")[0] : todayIso;
                addEntry({ path: `/journeys/${j.slug.toLowerCase()}`, changefreq: "weekly", priority: "0.8", lastmod: mod });
              }
            }
          }

          // Fallback static journeys
          for (const sj of staticJourneys) {
            if (!journeySlugs.has(sj.slug.toLowerCase())) {
              addEntry({ path: `/journeys/${sj.slug.toLowerCase()}`, changefreq: "weekly", priority: "0.8", lastmod: todayIso });
            }
          }
        } catch (err) {
          console.warn("[Sitemap] Journeys fetch warning:", err);
        }

        // 4. Fetch Published Blogs / Stories from DB
        try {
          const { data: dbBlogs } = await supabase
            .from("blogs")
            .select("slug, updated_at, published_at")
            .eq("is_published", true);

          if (dbBlogs && dbBlogs.length > 0) {
            for (const b of dbBlogs) {
              if (b.slug) {
                const modDate = b.updated_at || b.published_at;
                const mod = modDate ? new Date(modDate).toISOString().split("T")[0] : todayIso;
                addEntry({ path: `/stories/${b.slug.toLowerCase()}`, changefreq: "weekly", priority: "0.8", lastmod: mod });
              }
            }
          }
        } catch (err) {
          console.warn("[Sitemap] Blogs fetch warning:", err);
        }

        // Build XML output
        const urls = Array.from(entriesMap.values()).map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n")
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
