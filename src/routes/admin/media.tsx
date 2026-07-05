import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Upload,
  Search,
  FolderOpen,
  Image as ImageIcon,
  Copy,
  Trash2,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/admin/media")({
  component: AdminMediaLibrary,
});

function AdminMediaLibrary() {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState("ALL");
  
  // Create / Upload states
  const [fileUrl, setFileUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("Manali");

  const fetchMedia = async () => {
    setLoading(true);
    try {
      let query = supabase.from("gallery").select("*").order("created_at", { ascending: false });
      if (folder !== "ALL") {
        query = query.eq("folder", folder);
      }
      const { data, error } = await query;
      if (error) throw error;
      setMedia(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load media assets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [folder]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUrl) return;

    try {
      const payload = {
        url: fileUrl,
        caption,
        folder: selectedFolder,
        media_type: fileUrl.endsWith(".mp4") ? "VIDEO" : "IMAGE",
      };

      const { error } = await supabase.from("gallery").insert([payload]);
      if (error) throw error;

      toast.success("Asset added to Media Library");
      setFileUrl("");
      setCaption("");
      fetchMedia();
    } catch (err: any) {
      toast.error(err.message || "Failed to save asset");
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Copied to clipboard!");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this asset permanently?")) return;
    try {
      const { error } = await supabase.from("gallery").delete().eq("id", id);
      if (error) throw error;
      toast.success("Asset deleted successfully");
      fetchMedia();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  const filtered = media.filter(m =>
    m.caption?.toLowerCase().includes(search.toLowerCase()) ||
    m.url?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-foreground">Media Library</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          WordPress-style asset manager. Upload images/reels, compress, copy links, and categorize.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Side: Upload Panel */}
        <div className="bg-white p-5 border border-border rounded-xl space-y-4 h-fit">
          <h3 className="font-semibold text-sm flex items-center gap-1.5"><Upload className="h-4.5 w-4.5 text-accent" /> Add Media Asset</h3>
          <form onSubmit={handleUpload} className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <Label>Asset URL</Label>
              <Input value={fileUrl} onChange={e => setFileUrl(e.target.value)} required placeholder="https://unsplash.com/..." />
            </div>
            <div className="space-y-1">
              <Label>Description / Caption</Label>
              <Input value={caption} onChange={e => setCaption(e.target.value)} placeholder="e.g. Paragliding flight" />
            </div>
            <div className="space-y-1">
              <Label>Folder / Tag</Label>
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manali">Manali</SelectItem>
                  <SelectItem value="Jibhi">Jibhi</SelectItem>
                  <SelectItem value="Udaipur">Udaipur</SelectItem>
                  <SelectItem value="McLeodganj">McLeodganj</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full mt-2">Add Asset</Button>
          </form>
        </div>

        {/* Right Side: Assets Grid */}
        <div className="lg:col-span-3 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-xl border border-border">
            <div className="relative flex-1 max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search captions..."
                className="pl-9"
              />
            </div>
            <div className="w-full sm:w-40">
              <Select value={folder} onValueChange={setFolder}>
                <SelectTrigger>
                  <SelectValue placeholder="All Folders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Folders</SelectItem>
                  <SelectItem value="Manali">Manali</SelectItem>
                  <SelectItem value="Jibhi">Jibhi</SelectItem>
                  <SelectItem value="Udaipur">Udaipur</SelectItem>
                  <SelectItem value="McLeodganj">McLeodganj</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading assets...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground bg-white border border-border rounded-xl">
              No assets in this directory.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filtered.map((item) => (
                <div key={item.id} className="bg-white border border-border rounded-lg overflow-hidden group relative h-40">
                  <img src={item.url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col justify-between p-3 transition duration-300">
                    <p className="text-[10px] text-white font-medium line-clamp-2">{item.caption || "No description"}</p>
                    <div className="flex justify-end gap-1.5">
                      <Button size="icon" variant="secondary" onClick={() => handleCopyLink(item.url)} className="h-7 w-7 rounded-md" title="Copy Link">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="destructive" onClick={() => handleDelete(item.id)} className="h-7 w-7 rounded-md" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
