import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingUI } from "@/components/site/FloatingUI";
import { Reveal } from "@/components/site/Reveal";
import { BRAND } from "@/config/brand";
import {
  Star,
  MessageCircle,
  ArrowRight,
  Compass,
  Clock,
  User,
  Eye,
  Search,
  BookOpen,
  Heart,
  Building2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPublishedStories } from "@/lib/queries/stories";
import type { Story } from "@/types/supabase";
import { motion, AnimatePresence } from "motion/react";

export const Route = createFileRoute("/stories")({
  head: () => ({
    meta: [
      { title: "Trip Experience Hub & Traveler Stories | Nomadik" },
      {
        name: "description",
        content:
          "Explore real-time traveler stories, photo galleries, trip reels, and reviews. Dive into our active student and college travel community.",
      },
      { property: "og:title", content: "Trip Experience Hub | Nomadik" },
      { property: "og:description", content: "Real Experiences. Real Memories. Real People." },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StoriesRoute,
});

const CATEGORIES = ["ALL", "Adventure", "Weekend", "Spiritual", "Budget", "College", "Solo", "Group", "Family"];

function StoryCard({ story, index }: { story: Story; index: number }) {
  return (
    <Reveal key={story.id} delay={index % 3} className="group h-full">
      <Link to="/stories/$slug" params={{ slug: story.slug }} className="block h-full">
        <article className="hover-lift flex h-full flex-col overflow-hidden rounded-2xl bg-card border border-border/60 shadow-soft hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
          {/* Cover */}
          <div className="relative h-52 overflow-hidden">
            {story.cover_image ? (
              <img
                src={story.cover_image}
                alt={story.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <BookOpen className="h-12 w-12 text-primary/40" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            {/* Category pill */}
            <span className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-primary text-[10px] font-poppins font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
              {story.category}
            </span>
            {/* Rating */}
            {story.rating && (
              <span className="absolute top-3 right-3 flex items-center gap-1 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow">
                <Star className="h-2.5 w-2.5 fill-white" /> {story.rating}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex flex-col flex-1 p-5 space-y-3">
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-poppins">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {story.reading_time} min read
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" /> {story.views.toLocaleString("en-IN")}
              </span>
              {story.likes_count > 0 && (
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3 fill-red-400 text-red-400" /> {story.likes_count}
                </span>
              )}
            </div>

            <h3 className="font-display text-lg font-bold text-primary group-hover:text-accent transition-colors leading-snug line-clamp-2">
              {story.title}
            </h3>

            {story.excerpt && (
              <p className="text-xs text-muted-foreground leading-relaxed font-poppins line-clamp-3">
                {story.excerpt}
              </p>
            )}

            <div className="flex-1" />

            {/* Author */}
            <div className="flex items-center justify-between border-t border-border/30 pt-3 mt-auto">
              <div className="flex items-center gap-2.5">
                {story.author_image ? (
                  <img src={story.author_image} alt={story.author_name || ""} className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
                    {story.author_name?.[0]?.toUpperCase() || "E"}
                  </div>
                )}
                <div>
                  <p className="text-[11px] font-semibold text-foreground leading-none">{story.author_name || "Explorer"}</p>
                  {story.college_name && (
                    <p className="text-[9px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                      <Building2 className="h-2.5 w-2.5" /> {story.college_name}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-poppins font-bold text-accent flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                Read <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </article>
      </Link>
    </Reveal>
  );
}

function StoriesRoute() {
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data: result, isLoading } = useQuery({
    queryKey: ["published_stories", activeCategory, debouncedSearch],
    queryFn: () =>
      getPublishedStories({
        pageSize: 50,
        category: activeCategory === "ALL" ? undefined : activeCategory,
        search: debouncedSearch || undefined,
        sortBy: "published_at",
        sortDir: "desc",
      }),
  });

  const stories = result?.data ?? [];

  const featuredStory = useMemo(() => {
    if (activeCategory === "ALL" && !debouncedSearch) {
      return stories.find((s) => s.is_featured) ?? stories[0];
    }
    return undefined;
  }, [stories, activeCategory, debouncedSearch]);

  const gridStories = useMemo(() => {
    if (featuredStory) return stories.filter((s) => s.id !== featuredStory.id);
    return stories;
  }, [stories, featuredStory]);

  return (
    <div className="bg-background min-h-screen flex flex-col justify-between">
      <Navbar />
      <main className="pt-16 pb-20 font-sans text-foreground">

        {/* ========== HERO ========== */}
        <section
          className="relative min-h-[55vh] flex items-center justify-center text-white py-24 px-5 text-center bg-cover bg-center overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.55), rgba(0,0,0,0.65)), url(${featuredStory?.cover_image || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80"})`,
          }}
        >
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle at 25% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 75% 50%, rgba(255,255,255,0.08) 0%, transparent 50%)"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto space-y-6">
            <Reveal>
              <span className="inline-flex items-center gap-2 text-xs font-poppins font-bold uppercase tracking-[0.25em] text-accent border border-accent/30 bg-accent/10 px-4 py-1.5 rounded-full backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                India's Best College Travel Platform
              </span>
              <h1 className="font-display text-5xl sm:text-7xl font-bold mt-5 leading-[1.05]">
                Trip Experience{" "}
                <span className="text-accent italic font-light">Hub</span>
              </h1>
              <p className="max-w-xl mx-auto text-sm sm:text-base text-white/75 font-poppins mt-4 leading-relaxed">
                Real Experiences. Real Memories. Real People.
                <br />
                Explore real trip logs, photos, and swipable Reels shared by the student community.
              </p>
            </Reveal>

            {/* Search */}
            <Reveal delay={1}>
              <div className="max-w-md mx-auto relative mt-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search stories, destinations, authors..."
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white placeholder:text-white/50 text-sm font-poppins focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ========== FEATURED STORY ========== */}
        <AnimatePresence mode="wait">
          {featuredStory && !debouncedSearch && (
            <motion.section
              key="featured"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto px-5 py-10 -mt-16 relative z-30"
            >
              <Link to="/stories/$slug" params={{ slug: featuredStory.slug }}>
                <div className="group bg-card border border-border/80 rounded-3xl overflow-hidden shadow-elegant transition-all duration-300 hover:-translate-y-1 hover:shadow-gold/10 grid grid-cols-1 lg:grid-cols-12 gap-0 cursor-pointer">
                  <div className="lg:col-span-7 h-64 lg:h-[26rem] relative overflow-hidden">
                    <img
                      src={featuredStory.cover_image || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"}
                      alt={featuredStory.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4 bg-accent text-white text-[10px] font-poppins font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md">
                      <Star className="h-3 w-3 fill-white" /> Featured Story
                    </div>
                    {featuredStory.rating && (
                      <div className="absolute top-4 right-4 bg-amber-500 text-white text-sm font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md">
                        <Star className="h-3.5 w-3.5 fill-white" /> {featuredStory.rating}
                      </div>
                    )}
                  </div>
                  <div className="lg:col-span-5 p-8 lg:p-12 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="bg-primary/8 text-primary px-3 py-1 rounded-full font-semibold uppercase tracking-wider text-[10px] font-poppins">
                          {featuredStory.category}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground font-poppins">
                          <Clock className="h-3.5 w-3.5" /> {featuredStory.reading_time} min read
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground font-poppins">
                          <Eye className="h-3.5 w-3.5" /> {featuredStory.views.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <h2 className="font-display text-2xl lg:text-3xl font-bold text-primary leading-tight group-hover:text-accent transition-colors">
                        {featuredStory.title}
                      </h2>
                      {featuredStory.excerpt && (
                        <p className="text-sm text-muted-foreground leading-relaxed font-poppins line-clamp-4">
                          {featuredStory.excerpt}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between border-t border-border/50 pt-6 mt-6 lg:mt-0">
                      <div className="flex items-center gap-3">
                        {featuredStory.author_image ? (
                          <img src={featuredStory.author_image} alt={featuredStory.author_name || ""} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {featuredStory.author_name?.[0]?.toUpperCase() || "E"}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-foreground">{featuredStory.author_name || "Anonymous Explorer"}</p>
                          {featuredStory.college_name && (
                            <p className="text-[10px] text-muted-foreground">{featuredStory.college_name}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-poppins font-bold text-accent flex items-center gap-1 group-hover:gap-2 transition-all">
                        Read Story <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ========== CATEGORY FILTERS ========== */}
        <section className="max-w-7xl mx-auto px-5 py-6">
          <Reveal>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-border/50">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-poppins font-semibold uppercase tracking-wider transition-all shrink-0 ${
                    activeCategory === cat
                      ? "bg-accent text-white shadow-soft"
                      : "bg-card hover:bg-muted text-muted-foreground border border-border hover:border-accent/30"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ========== STORIES GRID ========== */}
        <section className="max-w-7xl mx-auto px-5 py-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl bg-card border border-border overflow-hidden">
                  <div className="h-52 bg-muted" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-muted rounded w-1/3" />
                    <div className="h-5 bg-muted rounded" />
                    <div className="h-5 bg-muted rounded w-4/5" />
                    <div className="h-3 bg-muted rounded" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : gridStories.length === 0 ? (
            <div className="text-center py-24 bg-card border border-dashed rounded-3xl">
              <Compass className="h-12 w-12 text-muted-foreground mx-auto animate-pulse" />
              <p className="text-muted-foreground font-poppins text-base mt-4">No stories found.</p>
              <p className="text-muted-foreground/60 font-poppins text-sm mt-2">
                {debouncedSearch ? "Try different search terms" : "Check back soon for new traveler stories!"}
              </p>
            </div>
          ) : (
            <>
              {(debouncedSearch || activeCategory !== "ALL") && (
                <p className="text-sm text-muted-foreground font-poppins mb-6">
                  Showing {gridStories.length + (featuredStory ? 1 : 0)} stories
                  {activeCategory !== "ALL" && ` in ${activeCategory}`}
                  {debouncedSearch && ` for "${debouncedSearch}"`}
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {gridStories.map((story, i) => (
                  <StoryCard key={story.id} story={story} index={i} />
                ))}
              </div>
            </>
          )}
        </section>

        {/* ========== COMMUNITY CTA ========== */}
        <section className="max-w-4xl mx-auto px-5 py-12">
          <Reveal>
            <div className="bg-secondary text-white p-8 sm:p-12 rounded-3xl shadow-elegant text-center space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
              <BookOpen className="h-10 w-10 text-accent mx-auto" />
              <h2 className="font-display text-3xl font-bold text-white leading-tight">
                Share Your Nomadik Story
              </h2>
              <p className="text-sm text-white/80 max-w-xl mx-auto leading-relaxed font-poppins">
                Traveled with us? Write about your experience and inspire thousands of other explorers. Your story could be featured here.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" variant="hero" className="shadow-gold uppercase tracking-wider text-xs px-8" asChild>
                  <a href={BRAND.community} target="_blank" rel="noreferrer">
                    <MessageCircle className="h-4 w-4 mr-2" /> Join WhatsApp Community
                  </a>
                </Button>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
      <FloatingUI />
    </div>
  );
}
