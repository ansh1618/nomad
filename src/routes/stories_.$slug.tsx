import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingUI } from "@/components/site/FloatingUI";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Clock,
  Eye,
  Heart,
  Share2,
  ArrowLeft,
  Calendar,
  User,
  Building2,
  ChevronLeft,
  ChevronRight,
  Package,
  MapPin,
  MessageCircle,
  Copy,
  Check,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getStoryBySlug,
  getRelatedStories,
  recordStoryView,
  toggleStoryLike,
  isStoryLiked,
} from "@/lib/queries/stories";
import { motion, AnimatePresence, useScroll, useSpring } from "motion/react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/stories_/$slug")({
  head: ({ loaderData }: any) => {
    const story = loaderData?.story;
    return {
      meta: [
        { title: story ? `${story.title} | Nomadik Stories` : "Story | Nomadik" },
        {
          name: "description",
          content: story?.excerpt || story?.seo_description || "A traveler story from Nomadik",
        },
        { property: "og:title", content: story?.title || "Nomadik Story" },
        { property: "og:description", content: story?.excerpt || "" },
        { property: "og:image", content: story?.cover_image || "" },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: story?.title || "Nomadik Story" },
        { name: "twitter:image", content: story?.cover_image || "" },
      ],
    };
  },
  component: SingleStoryRoute,
});

// ─── Markdown → HTML renderer (simple, no dependencies) ────────────────────
function renderMarkdown(md: string): string {
  if (!md) return "";
  return md
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    // headings
    .replace(/^### (.+)$/gm, "<h3 class='font-display text-xl font-bold text-primary mt-8 mb-3'>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2 class='font-display text-2xl font-bold text-primary mt-10 mb-4'>$2</h2>".replace("$2","$1"))
    .replace(/^# (.+)$/gm, "<h1 class='font-display text-3xl font-bold text-primary mt-10 mb-5'>$1</h1>")
    // blockquote
    .replace(/^&gt; (.+)$/gm, "<blockquote class='border-l-4 border-accent pl-5 py-2 my-6 italic text-muted-foreground bg-accent/5 rounded-r-xl'>$1</blockquote>")
    // hr
    .replace(/^---$/gm, "<hr class='my-10 border-border/50' />")
    // bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong class='text-foreground'>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/~~(.+?)~~/g, "<del>$1</del>")
    // inline code
    .replace(/`(.+?)`/g, "<code class='bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-accent'>$1</code>")
    // unordered lists
    .replace(/^- (.+)$/gm, "<li class='flex gap-2 text-sm leading-relaxed'><span class='text-accent mt-1'>•</span><span>$1</span></li>")
    .replace(/^(\d+)\. (.+)$/gm, "<li class='flex gap-2 text-sm leading-relaxed'><span class='text-accent font-semibold'>$1.</span><span>$2</span></li>")
    // links
    .replace(/\[(.+?)\]\((.+?)\)/g, "<a href='$2' class='text-accent underline underline-offset-4 hover:text-accent/70' target='_blank' rel='noreferrer'>$1</a>")
    // paragraphs
    .split("\n\n")
    .map((p) => {
      p = p.trim();
      if (!p) return "";
      if (p.startsWith("<h") || p.startsWith("<blockquote") || p.startsWith("<hr") || p.startsWith("<li")) return p;
      if (p.includes("<li")) return `<ul class='space-y-2 my-5 pl-1'>${p}</ul>`;
      return `<p class='text-base leading-[1.9] text-foreground/85 mb-5'>${p.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");
}

// ─── Gallery Slider ─────────────────────────────────────────────────────────
function GallerySlider({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0);
  if (!images || images.length === 0) return null;

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
      <AnimatePresence mode="wait">
        <motion.img
          key={current}
          src={images[current]}
          alt={`Gallery ${current + 1}`}
          className="w-full h-full object-cover"
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        />
      </AnimatePresence>
      {images.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1))}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1))}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all ${i === current ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Reading Progress Bar ────────────────────────────────────────────────────
function ReadingProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 z-50 h-1 bg-accent origin-left"
    />
  );
}

// ─── Share Button ────────────────────────────────────────────────────────────
function ShareButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied!");
  };

  const shareItems = [
    {
      label: "WhatsApp",
      icon: MessageCircle,
      color: "bg-green-500 hover:bg-green-600",
      href: `https://wa.me/?text=${encodeURIComponent(`${title} - ${url}`)}`,
    },
    {
      label: "Facebook",
      icon: ExternalLink,
      color: "bg-blue-600 hover:bg-blue-700",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      label: "Twitter",
      icon: ExternalLink,
      color: "bg-sky-500 hover:bg-sky-600",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground font-poppins font-semibold uppercase tracking-wider flex items-center gap-1.5">
        <Share2 className="h-3.5 w-3.5" /> Share
      </span>
      {shareItems.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          title={item.label}
          className={`${item.color} text-white p-2 rounded-full transition-colors`}
        >
          <item.icon className="h-4 w-4" />
        </a>
      ))}
      <button
        onClick={copyLink}
        title="Copy link"
        className="bg-muted hover:bg-muted/70 p-2 rounded-full transition-colors border border-border"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
      </button>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
function SingleStoryRoute() {
  const { slug } = Route.useParams();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const viewRecorded = useRef(false);

  const { data: story, isLoading } = useQuery({
    queryKey: ["story_public", slug],
    queryFn: () => getStoryBySlug(slug),
  });

  const { data: relatedStories = [] } = useQuery({
    queryKey: ["related_stories", story?.id],
    queryFn: () =>
      getRelatedStories(story!.id, {
        packageId: story!.package_id,
        category: story!.category,
      }),
    enabled: !!story?.id,
  });

  // Check if current user liked
  useEffect(() => {
    async function checkLike() {
      if (!story) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const liked = await isStoryLiked(story.id, user.id);
        setLiked(liked);
      }
    }
    checkLike();
    if (story) setLikesCount(story.likes_count);
  }, [story]);

  // Record view once
  useEffect(() => {
    if (story && !viewRecorded.current) {
      viewRecorded.current = true;
      const ua = navigator.userAgent;
      const isMobile = /Mobile|Android|iPhone/.test(ua);
      recordStoryView(story.id, {
        device: isMobile ? "mobile" : "desktop",
        browser: ua.includes("Chrome") ? "Chrome" : ua.includes("Firefox") ? "Firefox" : ua.includes("Safari") ? "Safari" : "Other",
      });
    }
  }, [story]);

  const likeMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to like this story");
        throw new Error("Not authenticated");
      }
      return toggleStoryLike(story!.id, user.id);
    },
    onSuccess: (result) => {
      if (result === "liked") {
        setLiked(true);
        setLikesCount((c) => c + 1);
        toast.success("Story liked! ❤️");
      } else {
        setLiked(false);
        setLikesCount((c) => Math.max(0, c - 1));
      }
    },
    onError: () => {},
  });

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <div className="max-w-3xl mx-auto px-5 pt-24 pb-20 space-y-6 animate-pulse">
          <div className="h-80 bg-muted rounded-3xl" />
          <div className="h-8 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 bg-muted rounded" />
          ))}
        </div>
        <Footer />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="bg-background min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-center px-5">
          <div className="space-y-4">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto" />
            <h1 className="text-2xl font-bold font-display">Story Not Found</h1>
            <p className="text-muted-foreground font-poppins">This story may have been removed or doesn't exist.</p>
            <Link to="/stories">
              <Button className="gap-2 mt-2">
                <ArrowLeft className="h-4 w-4" /> All Stories
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const currentUrl = `${typeof window !== "undefined" ? window.location.origin : "https://nomadik.co.in"}/stories/${slug}`;

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <ReadingProgressBar />
      <Navbar />

      <main className="pt-16 pb-20 flex-1">
        {/* ── Hero Image ── */}
        <div className="relative h-[50vh] sm:h-[60vh] overflow-hidden">
          <motion.img
            src={story.cover_image || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80"}
            alt={story.title}
            className="w-full h-full object-cover"
            initial={{ scale: 1.06 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

          {/* Back link */}
          <Link to="/stories" className="absolute top-6 left-6">
            <Button size="sm" variant="secondary" className="gap-1.5 shadow-md bg-white/80 backdrop-blur-sm hover:bg-white text-foreground border-0">
              <ArrowLeft className="h-4 w-4" /> All Stories
            </Button>
          </Link>
        </div>

        {/* ── Content Container ── */}
        <div className="max-w-3xl mx-auto px-5 -mt-20 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>

            {/* Category + Meta */}
            <div className="flex items-center flex-wrap gap-2 mb-4">
              <Badge className="bg-accent text-white font-poppins text-[10px] uppercase tracking-wider">
                {story.category}
              </Badge>
              <span className="flex items-center gap-1 text-xs text-muted-foreground font-poppins">
                <Clock className="h-3.5 w-3.5" /> {story.reading_time} min read
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground font-poppins">
                <Eye className="h-3.5 w-3.5" /> {story.views.toLocaleString("en-IN")} views
              </span>
              {story.trip_date && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground font-poppins">
                  <Calendar className="h-3.5 w-3.5" /> {new Date(story.trip_date).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                </span>
              )}
              {story.rating && (
                <span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 font-bold px-2.5 py-1 rounded-full border border-amber-200">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> {story.rating} / 5
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-primary leading-tight mb-6">
              {story.title}
            </h1>

            {/* Author + Package row */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-border/50">
              {/* Author */}
              <div className="flex items-center gap-3">
                {story.author_image ? (
                  <img src={story.author_image} alt={story.author_name || ""} className="w-12 h-12 rounded-full object-cover ring-2 ring-border" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {story.author_name?.[0]?.toUpperCase() || "E"}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-foreground font-poppins flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    {story.author_name || "Anonymous Explorer"}
                  </p>
                  {story.college_name && (
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Building2 className="h-3 w-3" /> {story.college_name}
                    </p>
                  )}
                  {story.author_designation && (
                    <p className="text-[11px] text-muted-foreground">{story.author_designation}</p>
                  )}
                </div>
              </div>

              {/* Package pill */}
              {story.package && (
                <Link to="/$slug" params={{ slug: story.package.slug }}>
                  <Badge variant="outline" className="gap-1.5 px-3 py-1.5 hover:bg-primary/5 transition-colors cursor-pointer">
                    <Package className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs">{story.package.name}</span>
                  </Badge>
                </Link>
              )}
            </div>

            {/* Excerpt */}
            {story.excerpt && (
              <p className="text-base text-muted-foreground leading-relaxed font-poppins italic border-l-4 border-accent/30 pl-5 py-2 my-6 bg-accent/3 rounded-r-xl">
                {story.excerpt}
              </p>
            )}

            {/* Rich Content */}
            {story.content && (
              <div
                className="prose prose-sm prose-slate max-w-none my-8"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(story.content) }}
              />
            )}

            {/* Gallery */}
            {story.gallery && story.gallery.length > 0 && (
              <Reveal className="my-10">
                <h3 className="font-display text-xl font-bold text-primary mb-4 flex items-center gap-2">
                  📸 Trip Gallery
                </h3>
                <GallerySlider images={story.gallery} />
              </Reveal>
            )}

            {/* Likes + Share */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-6 border-t border-b border-border/50 my-8">
              {/* Like Button */}
              <button
                onClick={() => likeMutation.mutate()}
                disabled={likeMutation.isPending}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all font-poppins text-sm font-semibold ${
                  liked
                    ? "bg-red-50 border-red-200 text-red-500"
                    : "bg-card border-border text-muted-foreground hover:border-red-200 hover:text-red-500 hover:bg-red-50"
                }`}
              >
                <Heart className={`h-4 w-4 transition-all ${liked ? "fill-red-500 text-red-500 scale-110" : ""}`} />
                {likesCount > 0 ? likesCount : ""} {liked ? "Liked" : "Like this Story"}
              </button>

              {/* Share */}
              <ShareButton url={currentUrl} title={story.title} />
            </div>

            {/* Book This Trip CTA */}
            {story.package && (
              <Reveal className="my-10">
                <div className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-3xl p-8 text-center space-y-4">
                  <MapPin className="h-10 w-10 text-primary mx-auto" />
                  <h3 className="font-display text-2xl font-bold text-primary">
                    Inspired by this Story?
                  </h3>
                  <p className="text-sm text-muted-foreground font-poppins max-w-sm mx-auto">
                    Book the same trip as {story.author_name?.split(" ")[0] || "this traveler"} and create your own unforgettable memories.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link to="/$slug" params={{ slug: story.package.slug }}>
                      <Button size="lg" className="gap-2 px-8">
                        <Package className="h-4 w-4" /> View {story.package.name}
                      </Button>
                    </Link>
                  </div>
                </div>
              </Reveal>
            )}

            {/* Related Stories */}
            {relatedStories.length > 0 && (
              <Reveal className="my-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display text-xl font-bold text-primary">More Stories You'll Love</h3>
                  <Link to="/stories" className="text-xs text-accent font-poppins font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                    All Stories <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {relatedStories.map((s) => (
                    <Link key={s.id} to="/stories/$slug" params={{ slug: s.slug }} className="group block">
                      <div className="rounded-2xl overflow-hidden border border-border/60 hover-lift bg-card">
                        <div className="h-32 overflow-hidden">
                          {s.cover_image ? (
                            <img src={s.cover_image} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                              <BookOpen className="h-8 w-8 text-primary/30" />
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="text-xs text-accent font-poppins font-semibold uppercase tracking-wider mb-1">{s.category}</p>
                          <p className="text-sm font-bold text-primary group-hover:text-accent transition-colors line-clamp-2 leading-snug">{s.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" /> {s.reading_time} min
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </Reveal>
            )}
          </motion.div>
        </div>
      </main>

      <Footer />
      <FloatingUI />
    </div>
  );
}
