import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Save } from "lucide-react";

export const Route = createFileRoute("/admin/blog_/$id")({
  component: BlogFormPage,
});

function BlogFormPage() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");

  useEffect(() => {
    if (!isNew) {
      const loadBlog = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from("blogs")
            .select("*")
            .eq("id", id)
            .single();

          if (error) throw error;
          if (data) {
            setTitle(data.title || "");
            setSlug(data.slug || "");
            setContent(data.content || "");
            setFeaturedImage(data.featured_image || "");
            setIsPublished(data.is_published ?? true);
            setSeoTitle(data.seo?.title || "");
            setSeoDescription(data.seo?.description || "");
          }
        } catch (err: any) {
          toast.error(err.message || "Failed to load blog post");
        } finally {
          setLoading(false);
        }
      };
      loadBlog();
    }
  }, [id, isNew]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      title,
      slug: slug.toLowerCase().replace(/\s+/g, "-"),
      content,
      featured_image: featuredImage,
      is_published: isPublished,
      seo: { title: seoTitle, description: seoDescription },
    };

    try {
      if (isNew) {
        const { error } = await supabase.from("blogs").insert([payload]);
        if (error) throw error;
        toast.success("Blog post created");
      } else {
        const { error } = await supabase.from("blogs").update(payload).eq("id", id);
        if (error) throw error;
        toast.success("Blog post updated");
      }
      navigate({ to: "/admin/blog" });
    } catch (err: any) {
      toast.error(err.message || "Failed to save blog post");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading stays...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/admin/blog" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-poppins text-foreground">
            {isNew ? "Write Blog Post" : `Edit ${title}`}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 bg-white p-6 rounded-xl border border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="btitle">Article Title</Label>
            <Input id="btitle" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Best Travel Spots in Jibhi" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bslug">Slug URL</Label>
            <Input id="bslug" value={slug} onChange={e => setSlug(e.target.value)} required placeholder="e.g. travel-spots-jibhi" />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="featured">Featured Image URL</Label>
          <Input id="featured" value={featuredImage} onChange={e => setFeaturedImage(e.target.value)} placeholder="https://unsplash.com/..." />
        </div>

        <div className="space-y-1">
          <Label htmlFor="content">Markdown Content</Label>
          <Textarea id="content" rows={10} value={content} onChange={e => setContent(e.target.value)} required placeholder="Write in Markdown format..." />
        </div>

        <div className="border-t border-border pt-4 space-y-4">
          <h3 className="text-sm font-semibold">SEO Configs</h3>
          <div className="space-y-1">
            <Label htmlFor="seot">Meta Title</Label>
            <Input id="seot" value={seoTitle} onChange={e => setSeoTitle(e.target.value)} placeholder="Title tags" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="seod">Meta Description</Label>
            <Textarea id="seod" rows={3} value={seoDescription} onChange={e => setSeoDescription(e.target.value)} placeholder="Snippet snippet" />
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-4">
          <Switch id="is-pub" checked={isPublished} onCheckedChange={setIsPublished} />
          <Label htmlFor="is-pub">Publish this blog immediately</Label>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 px-8 gap-2">
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="h-4 w-4" /> Save Post</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
