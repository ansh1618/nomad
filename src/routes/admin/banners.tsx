import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Image as ImageIcon,
  Loader2,
  Tv,
} from "lucide-react";

export const Route = createFileRoute("/admin/banners")({
  component: AdminBanners,
});

function AdminBanners() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [placement, setPlacement] = useState("HERO");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [ctaLink, setCtaLink] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("display_order");

      if (error) throw error;
      setBanners(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this banner?")) return;
    try {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
      toast.success("Banner deleted");
      fetchBanners();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete banner");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        placement,
        title,
        subtitle,
        image_url: imageUrl,
        cta_text: ctaText,
        cta_link: ctaLink,
        is_active: isActive,
      };

      const { error } = await supabase.from("banners").insert([payload]);
      if (error) throw error;

      toast.success("Banner configured successfully");
      setOpen(false);
      setTitle("");
      setSubtitle("");
      setImageUrl("");
      setCtaText("");
      setCtaLink("");
      fetchBanners();
    } catch (err: any) {
      toast.error(err.message || "Failed to save banner");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-foreground">Banner & Homepage Hero Manager</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure homepage banners, visual advertisements, announcements, and popups.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5 bg-primary">
              <Plus className="h-4 w-4" /> Add Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Configure Banner Placement</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Placement Type</Label>
                  <Select value={placement} onValueChange={setPlacement}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HERO">Homepage Hero</SelectItem>
                      <SelectItem value="OFFER">Special Offer Section</SelectItem>
                      <SelectItem value="POPUP">Popup modal window</SelectItem>
                      <SelectItem value="ANNOUNCEMENT">Announcement Ticker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Headline / Title</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Early Bird Discounts" />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Subtitle / Description</Label>
                <Input value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="e.g. Save flat 10% on pre-bookings" />
              </div>

              <div className="space-y-1">
                <Label>Image / Graphics URL</Label>
                <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} required placeholder="https://..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>CTA Link</Label>
                  <Input value={ctaLink} onChange={e => setCtaLink(e.target.value)} placeholder="/journeys/jibhi" />
                </div>
                <div className="space-y-1">
                  <Label>CTA Text</Label>
                  <Input value={ctaText} onChange={e => setCtaText(e.target.value)} placeholder="Explore Now" />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Switch id="act" checked={isActive} onCheckedChange={setIsActive} />
                <Label htmlFor="act">Mark Active immediately</Label>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit">Publish Banner</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Banners display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 md:col-span-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading stays...</p>
          </div>
        ) : banners.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground md:col-span-2 bg-white border border-border rounded-xl">
            No banners configured yet.
          </div>
        ) : (
          banners.map((b) => (
            <div key={b.id} className="bg-white border border-border rounded-xl overflow-hidden shadow-none flex flex-col justify-between">
              <div className="h-48 relative bg-muted flex items-center justify-center border-b border-border">
                {b.image_url ? (
                  <img src={b.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
                <Badge className="absolute top-3 left-3 font-bold uppercase tracking-wider">{b.placement}</Badge>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-base text-primary">{b.title || "No Headline"}</h3>
                  <p className="text-xs text-muted-foreground">{b.subtitle || "No description provided."}</p>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground font-mono">Link: {b.cta_link || "None"}</span>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)} className="h-8 w-8 text-destructive hover:text-destructive">
                      <Trash2 className="h-4.5 w-4.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
