import { createFileRoute } from "@tanstack/react-router";
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
  Calendar,
  BookOpen,
  X,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getBlogs } from "@/lib/queries/admin";
import type { Blog } from "@/types/supabase";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/stories")({
  head: () => ({
    meta: [
      { title: "Explorer Stories & Journals | Nomadik" },
      { name: "description", content: "Read our community's travel logs, checklists, reviews, and explore the Nomadik community forum." },
    ],
  }),
  component: StoriesRoute,
});

const CATEGORIES = ["ALL", "SOLO TRAVEL", "ADVENTURE", "HIGH ALTITUDE", "NATURE", "COMMUNITY", "TIPS & GUIDES"];

function StoriesRoute() {
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [selectedStory, setSelectedStory] = useState<Blog | null>(null);

  const { data: result, isLoading } = useQuery({
    queryKey: ["published_blogs"],
    queryFn: async () => {
      try {
        return await getBlogs({ published: true, pageSize: 50 });
      } catch (err) {
        console.error("Failed to fetch stories from Supabase (this usually happens if blogs table has not been upgraded with ERP columns yet):", err);
        return { data: [], total: 0, page: 1, pageSize: 50, totalPages: 1 };
      }
    },
  });

  const blogsList = useMemo(() => {
    return (result?.data ?? []) as Blog[];
  }, [result]);

  // Find the featured story (is_featured = true, or first story)
  const featuredStory = useMemo(() => {
    return blogsList.find((b) => b.is_featured) ?? blogsList[0];
  }, [blogsList]);

  // Filter grid stories by category (excluding the featured one to prevent duplication)
  const filteredStories = useMemo(() => {
    let list = blogsList.filter((b) => b.id !== featuredStory?.id);
    if (activeCategory !== "ALL") {
      list = list.filter(
        (b) => b.category?.toLowerCase() === activeCategory.toLowerCase()
      );
    }
    return list;
  }, [blogsList, activeCategory, featuredStory]);

  const handleShare = (story: Blog) => {
    if (navigator.share) {
      navigator.share({
        title: story.title,
        text: story.excerpt || "",
        url: window.location.href,
      }).catch(() => null);
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/stories?story=${story.slug || story.id}`);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <div className="bg-background min-h-screen flex flex-col justify-between">
      <Navbar />
      <main className="pt-16 pb-20 font-sans text-foreground">
        
        {/* Banner Section */}
        <section 
          className="relative min-h-[45vh] flex items-center justify-center text-white py-20 px-5 text-center bg-cover bg-center overflow-hidden"
          style={{ 
            backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.7)), url(${featuredStory?.featured_image || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80'})` 
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 max-w-4xl mx-auto space-y-4">
            <Reveal>
              <span className="text-xs font-poppins font-bold uppercase tracking-[0.2em] text-accent border border-accent/30 bg-accent/10 px-3 py-1 rounded-full">
                Real Stories
              </span>
              <h1 className="font-display text-4xl sm:text-7xl font-bold mt-4 leading-tight">
                Travel <span className="text-accent italic font-light">Stories</span>
              </h1>
              <p className="max-w-xl mx-auto text-sm sm:text-base text-white/80 font-poppins mt-3 leading-relaxed">
                Told by the travelers who lived them. Honest, unfiltered, and occasionally embarrassing.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Featured Story Showcase */}
        {featuredStory && (
          <section className="max-w-7xl mx-auto px-5 py-12 -mt-16 relative z-30">
            <Reveal>
              <div 
                onClick={() => setSelectedStory(featuredStory)}
                className="bg-card hover:bg-card/90 cursor-pointer border border-border/80 rounded-3xl overflow-hidden shadow-elegant transition-all duration-300 hover:-translate-y-1 hover:shadow-gold/10 grid grid-cols-1 lg:grid-cols-12 gap-0"
              >
                <div className="lg:col-span-7 h-64 lg:h-96 relative">
                  <img
                    src={featuredStory.featured_image || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"}
                    alt={featuredStory.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-accent text-white text-[10px] font-poppins font-bold uppercase tracking-wider px-3 py-1 rounded-md">
                    Featured Story
                  </div>
                </div>
                <div className="lg:col-span-5 p-8 lg:p-12 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground font-poppins">
                      <span className="bg-primary/5 text-primary px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider text-[10px]">
                        {featuredStory.category || "Travel Log"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {featuredStory.read_time_minutes || 3} min read
                      </span>
                    </div>
                    <h2 className="font-display text-2xl lg:text-3xl font-bold text-primary leading-tight hover:text-accent transition-colors">
                      {featuredStory.title}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed font-poppins line-clamp-4">
                      {featuredStory.excerpt || featuredStory.content?.slice(0, 200)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/50 pt-6 mt-6 lg:mt-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {featuredStory.author_name?.[0]?.toUpperCase() || "E"}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground leading-none">{featuredStory.author_name || "Anonymous Explorer"}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {featuredStory.created_at ? new Date(featuredStory.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : ""}
                        </p>
                      </div>
                    </div>
                    <button className="text-xs font-poppins font-bold text-accent flex items-center gap-1 group">
                      Read Story <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>
        )}

        {/* Category Filters */}
        <section className="max-w-7xl mx-auto px-5 py-6">
          <Reveal>
            <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none border-b border-border/50">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-poppins font-semibold uppercase tracking-wider transition-all shrink-0 ${
                    (cat === "ALL" && activeCategory === "ALL") || activeCategory.toLowerCase() === cat.toLowerCase()
                      ? "bg-accent text-white shadow-soft"
                      : "bg-card hover:bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </Reveal>
        </section>

        {/* Stories Grid */}
        <section className="max-w-7xl mx-auto px-5 py-10">
          {filteredStories.length === 0 ? (
            <div className="text-center py-20 bg-card border border-dashed rounded-3xl">
              <Compass className="h-10 w-10 text-muted-foreground mx-auto animate-pulse" />
              <p className="text-muted-foreground font-poppins text-sm mt-3">No stories found under this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredStories.map((story, i) => (
                <Reveal key={story.id || i} delay={i % 3} className="group">
                  <article 
                    onClick={() => setSelectedStory(story)}
                    className="cursor-pointer hover-lift border border-border/80 bg-card rounded-3xl overflow-hidden flex flex-col justify-between h-full space-y-4 hover:shadow-elegant"
                  >
                    <div>
                      {story.featured_image && (
                        <div className="h-48 overflow-hidden relative">
                          <img
                            src={story.featured_image}
                            alt={story.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-primary text-[10px] font-poppins font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                            {story.category || "Travel Log"}
                          </div>
                        </div>
                      )}
                      <div className="p-6 space-y-3">
                        <div className="flex items-center justify-between text-[10px] font-poppins text-muted-foreground">
                          <span className="flex items-center gap-1"><User className="h-3 w-3" /> {story.author_name || "Explorer"}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {story.read_time_minutes || 3} min read</span>
                        </div>
                        <h3 className="font-display text-lg font-bold text-primary group-hover:text-accent transition-colors leading-snug line-clamp-2">
                          {story.title}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed font-poppins line-clamp-3">
                          {story.excerpt || story.content?.slice(0, 150)}
                        </p>
                      </div>
                    </div>
                    <div className="px-6 pb-6 pt-0 flex justify-between items-center border-t border-border/30 mt-auto">
                      <button className="text-xs font-poppins font-bold text-secondary flex items-center gap-1 group-hover:gap-2 transition-all">
                        Read Log <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          )}
        </section>

        {/* WhatsApp Community Invite */}
        <section className="max-w-4xl mx-auto px-5 py-12">
          <Reveal>
            <div className="bg-secondary text-white p-8 sm:p-12 rounded-3xl shadow-elegant text-center space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
              <Compass className="h-10 w-10 text-gold mx-auto animate-spin-slow" />
              <h2 className="font-display text-3xl font-bold text-white leading-tight">Join The Nomadik Explorer Tribe</h2>
              <p className="text-sm text-white/80 max-w-xl mx-auto leading-relaxed font-poppins">
                Connect with fellow road travelers, discuss secret routes, access priority bookings, and coordinate co-travels in our private WhatsApp community.
              </p>
              <Button size="lg" variant="hero" className="shadow-gold uppercase tracking-wider text-xs px-8" asChild>
                <a href={BRAND.community} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-4.5 w-4.5 mr-2" /> Join WhatsApp Community
                </a>
              </Button>
            </div>
          </Reveal>
        </section>

      </main>
      <Footer />
      <FloatingUI />

      {/* Reader Mode Modal */}
      <Dialog open={!!selectedStory} onOpenChange={(open) => !open && setSelectedStory(null)}>
        <DialogContent className="max-w-3xl h-[85vh] bg-white overflow-y-auto rounded-2xl p-0 gap-0 border border-border shadow-2xl flex flex-col">
          {selectedStory && (
            <>
              {/* Cover Image Header */}
              <div className="relative h-64 sm:h-80 shrink-0">
                <img
                  src={selectedStory.featured_image || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80"}
                  alt={selectedStory.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                
                {/* Close Button */}
                <button
                  onClick={() => setSelectedStory(null)}
                  className="absolute top-4 right-4 bg-black/60 hover:bg-black text-white p-2 rounded-full backdrop-blur-sm transition-colors border border-white/20"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Categories */}
                <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="bg-accent text-white text-[10px] font-poppins font-bold uppercase tracking-wider px-2.5 py-0.5 rounded">
                      {selectedStory.category || "Explorer Log"}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-white/80 font-poppins">
                      <Clock className="h-3 w-3" /> {selectedStory.read_time_minutes || 3} min read
                    </span>
                  </div>
                  <h2 className="font-display text-xl sm:text-3xl font-bold leading-tight">
                    {selectedStory.title}
                  </h2>
                </div>
              </div>

              {/* Meta details */}
              <div className="px-6 py-4 border-b border-border/50 bg-muted/20 flex flex-wrap items-center justify-between gap-4 shrink-0 font-poppins text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 font-semibold text-foreground">
                    <User className="h-3.5 w-3.5 text-primary" /> {selectedStory.author_name || "Anonymous"}
                  </span>
                  {selectedStory.created_at && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> 
                      {new Date(selectedStory.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleShare(selectedStory)}
                  className="h-8 gap-1.5 text-xs hover:bg-muted"
                >
                  <Share2 className="h-3.5 w-3.5" /> Share Story
                </Button>
              </div>

              {/* Story Content Reader */}
              <div className="p-8 sm:p-10 flex-1 overflow-y-auto bg-white font-poppins text-sm leading-relaxed text-foreground/90 max-w-none">
                <div className="prose prose-sm prose-slate mx-auto">
                  {selectedStory.content ? (
                    selectedStory.content.split('\n\n').map((paragraph, index) => (
                      <p key={index} className="mb-4 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                        {paragraph}
                      </p>
                    ))
                  ) : (
                    <p>{selectedStory.excerpt}</p>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
