import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Plus, Trash2, Save } from "lucide-react";

export const Route = createFileRoute("/admin/destinations_/$id")({
  component: DestinationFormPage,
});

function DestinationFormPage() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [heroVideo, setHeroVideo] = useState("");
  const [temperature, setTemperature] = useState("");
  const [bestSeason, setBestSeason] = useState("");
  const [howToReach, setHowToReach] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [weatherData, setWeatherData] = useState<any>({ summer: "", winter: "", monsoon: "" });
  const [faqs, setFaqs] = useState<any[]>([]);

  // Load existing data
  useEffect(() => {
    if (!isNew) {
      const loadDestination = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from("destinations")
            .select("*")
            .eq("id", id)
            .single();

          if (error) throw error;
          if (data) {
            setName(data.name || "");
            setSlug(data.slug || "");
            setSubtitle(data.subtitle || "");
            setDescription(data.description || "");
            setHeroImage(data.hero_image || "");
            setHeroVideo(data.hero_video || "");
            setTemperature(data.temperature || "");
            setBestSeason(data.best_season || "");
            setHowToReach(data.how_to_reach || "");
            setLatitude(data.latitude?.toString() || "");
            setLongitude(data.longitude?.toString() || "");
            setIsPublished(data.is_published ?? true);
            setSeoTitle(data.seo?.title || "");
            setSeoDescription(data.seo?.description || "");
            setWeatherData(data.weather || { summer: "", winter: "", monsoon: "" });
            setFaqs(data.faqs || []);
          }
        } catch (err: any) {
          toast.error(err.message || "Failed to load destination");
        } finally {
          setLoading(false);
        }
      };
      loadDestination();
    }
  }, [id, isNew]);

  const handleAddFaq = () => {
    setFaqs([...faqs, { question: "", answer: "" }]);
  };

  const handleRemoveFaq = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const handleFaqChange = (index: number, field: string, value: string) => {
    const updated = faqs.map((faq, i) => {
      if (i === index) {
        return { ...faq, [field]: value };
      }
      return faq;
    });
    setFaqs(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name,
      slug: slug.toLowerCase().replace(/\s+/g, "-"),
      subtitle,
      description,
      hero_image: heroImage,
      hero_video: heroVideo,
      temperature,
      best_season: bestSeason,
      how_to_reach: howToReach,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      is_published: isPublished,
      seo: { title: seoTitle, description: seoDescription },
      weather: weatherData,
      faqs,
    };

    try {
      if (isNew) {
        const { error } = await supabase
          .from("destinations")
          .insert([payload]);
        if (error) throw error;
        toast.success("Destination created successfully");
      } else {
        const { error } = await supabase
          .from("destinations")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
        toast.success("Destination updated successfully");
      }
      navigate({ to: "/admin/destinations" });
    } catch (err: any) {
      toast.error(err.message || "Failed to save destination");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/admin/destinations" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-poppins text-foreground">
            {isNew ? "Create Destination" : `Edit ${name}`}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="bg-muted border border-border w-full justify-start overflow-x-auto rounded-xl">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="media">Media & Video</TabsTrigger>
            <TabsTrigger value="details">Weather & Travel</TabsTrigger>
            <TabsTrigger value="faqs">FAQs</TabsTrigger>
            <TabsTrigger value="seo">SEO Settings</TabsTrigger>
          </TabsList>

          {/* General Section */}
          <TabsContent value="general" className="bg-white p-6 rounded-xl border border-border mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="name">Destination Name</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Manali" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" value={slug} onChange={e => setSlug(e.target.value)} required placeholder="e.g. manali" />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="subtitle">Subtitle / Catchphrase</Label>
              <Input id="subtitle" value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="e.g. Valley of Gods" />
            </div>

            <div className="space-y-1">
              <Label htmlFor="description">Overview Description</Label>
              <Textarea id="description" rows={5} value={description} onChange={e => setDescription(e.target.value)} placeholder="Overview of the destination" />
            </div>

            <div className="flex items-center space-x-2 pt-4">
              <Switch id="is-published" checked={isPublished} onCheckedChange={setIsPublished} />
              <Label htmlFor="is-published">Publish destination immediately</Label>
            </div>
          </TabsContent>

          {/* Media Section */}
          <TabsContent value="media" className="bg-white p-6 rounded-xl border border-border mt-4 space-y-4">
            <div className="space-y-1">
              <Label htmlFor="hero-image">Hero Image URL</Label>
              <Input id="hero-image" value={heroImage} onChange={e => setHeroImage(e.target.value)} placeholder="https://unsplash.com/..." />
            </div>
            <div className="space-y-1">
              <Label htmlFor="hero-video">Hero Video URL (Optional)</Label>
              <Input id="hero-video" value={heroVideo} onChange={e => setHeroVideo(e.target.value)} placeholder="https://youtube.com/..." />
            </div>
          </TabsContent>

          {/* Details Section */}
          <TabsContent value="details" className="bg-white p-6 rounded-xl border border-border mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="temperature">Average Temperature</Label>
                <Input id="temperature" value={temperature} onChange={e => setTemperature(e.target.value)} placeholder="e.g. 15°C - 25°C" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="best-season">Best Season</Label>
                <Input id="best-season" value={bestSeason} onChange={e => setBestSeason(e.target.value)} placeholder="e.g. March to June" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="lat">Latitude (Map)</Label>
                <Input id="lat" type="number" step="any" value={latitude} onChange={e => setLatitude(e.target.value)} placeholder="32.2396" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lng">Longitude (Map)</Label>
                <Input id="lng" type="number" step="any" value={longitude} onChange={e => setLongitude(e.target.value)} placeholder="77.1887" />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="reach">How to Reach</Label>
              <Textarea id="reach" rows={3} value={howToReach} onChange={e => setHowToReach(e.target.value)} placeholder="Details on airport, rail, and road connections" />
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <h3 className="text-sm font-semibold">Seasonal Weather Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Summer</Label>
                  <Input value={weatherData.summer} onChange={e => setWeatherData({ ...weatherData, summer: e.target.value })} placeholder="e.g. Warm days, cool nights" />
                </div>
                <div className="space-y-1">
                  <Label>Winter</Label>
                  <Input value={weatherData.winter} onChange={e => setWeatherData({ ...weatherData, winter: e.target.value })} placeholder="e.g. Heavy snowfall, sub-zero" />
                </div>
                <div className="space-y-1">
                  <Label>Monsoon</Label>
                  <Input value={weatherData.monsoon} onChange={e => setWeatherData({ ...weatherData, monsoon: e.target.value })} placeholder="e.g. Landslide prone, green valleys" />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* FAQs Section */}
          <TabsContent value="faqs" className="bg-white p-6 rounded-xl border border-border mt-4 space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-sm font-semibold">Frequently Asked Questions</h3>
              <Button type="button" variant="outline" size="sm" onClick={handleAddFaq} className="gap-1 text-xs">
                <Plus className="h-3 w-3" /> Add FAQ
              </Button>
            </div>

            {faqs.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-4">No FAQs added yet.</p>
            ) : (
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg bg-muted/15 space-y-3 relative">
                    <button
                      type="button"
                      onClick={() => handleRemoveFaq(index)}
                      className="absolute top-2 right-2 text-destructive hover:bg-destructive/10 p-1.5 rounded-md"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="space-y-1 pr-8">
                      <Label>Question</Label>
                      <Input value={faq.question} onChange={e => handleFaqChange(index, "question", e.target.value)} required placeholder="What is the best way to travel?" />
                    </div>
                    <div className="space-y-1">
                      <Label>Answer</Label>
                      <Textarea value={faq.answer} onChange={e => handleFaqChange(index, "answer", e.target.value)} required placeholder="The best way is by road..." />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* SEO Section */}
          <TabsContent value="seo" className="bg-white p-6 rounded-xl border border-border mt-4 space-y-4">
            <div className="space-y-1">
              <Label htmlFor="seo-title">Meta Title</Label>
              <Input id="seo-title" value={seoTitle} onChange={e => setSeoTitle(e.target.value)} placeholder="SEO Meta Title" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="seo-desc">Meta Description</Label>
              <Textarea id="seo-desc" rows={4} value={seoDescription} onChange={e => setSeoDescription(e.target.value)} placeholder="SEO Meta Description" />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 px-8 gap-2">
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="h-4 w-4" /> Save Destination</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
