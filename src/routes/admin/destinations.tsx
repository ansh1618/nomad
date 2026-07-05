import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Eye,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/admin/destinations")({
  component: AdminDestinations,
});

function AdminDestinations() {
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchDestinations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("destinations")
        .select("*")
        .order("name");

      if (error) throw error;
      setDestinations(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load destinations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDestinations();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this destination? All associated journeys will be affected.")) return;

    try {
      const { error } = await supabase
        .from("destinations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Destination deleted successfully");
      fetchDestinations();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete destination");
    }
  };

  const filtered = destinations.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-foreground">Destinations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your travel destinations and packages.
          </p>
        </div>
        <Link to="/admin/destinations/$id" params={{ id: "new" }}>
          <Button className="gap-1.5 bg-primary">
            <Plus className="h-4 w-4" /> Add Destination
          </Button>
        </Link>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search destinations..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Destinations Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading destinations...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            No destinations found. Click "Add Destination" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Hero</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Name</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Slug</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Temperature</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className="border-b border-border/50 hover:bg-muted/10 transition">
                    <td className="py-3 px-4">
                      {d.hero_image ? (
                        <img
                          src={d.hero_image}
                          alt={d.name}
                          className="w-12 h-8 rounded object-cover border border-border"
                        />
                      ) : (
                        <div className="w-12 h-8 rounded bg-muted flex items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-4 w-4" />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold">{d.name}</td>
                    <td className="py-3 px-4 font-mono text-xs">{d.slug}</td>
                    <td className="py-3 px-4 text-muted-foreground">{d.temperature || "N/A"}</td>
                    <td className="py-3 px-4">
                      <Badge variant={d.is_published ? "default" : "secondary"}>
                        {d.is_published ? "Published" : "Draft"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <Link to="/admin/destinations/$id" params={{ id: d.id }}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(d.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
