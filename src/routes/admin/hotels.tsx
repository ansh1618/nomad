import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Hotel,
  MapPin,
  Star,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/admin/hotels")({
  component: AdminHotels,
});

function AdminHotels() {
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("hotels")
        .select(`
          *,
          destinations (name)
        `)
        .order("name");

      if (error) throw error;
      setHotels(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load hotels");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this hotel? All rooms and allocations will be deleted.")) return;

    try {
      const { error } = await supabase
        .from("hotels")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Hotel deleted successfully");
      fetchHotels();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete hotel");
    }
  };

  const filtered = hotels.filter(h =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.location?.toLowerCase().includes(search.toLowerCase()) ||
    h.destinations?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-foreground">Hotel Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage vendor stays, available room types, and allocations.
          </p>
        </div>
        <Link to="/admin/hotels/$id" params={{ id: "new" }}>
          <Button className="gap-1.5 bg-primary">
            <Plus className="h-4 w-4" /> Add Hotel
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
            placeholder="Search hotels..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Hotels Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading hotels...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            No hotels found. Click "Add Hotel" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Stay</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Destination</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Location</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Rating</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((h) => (
                  <tr key={h.id} className="border-b border-border/50 hover:bg-muted/10 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded bg-primary/10 flex items-center justify-center text-primary">
                          <Hotel className="h-5 w-5" />
                        </div>
                        <span className="font-semibold text-sm">{h.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{h.destinations?.name || "Unassigned"}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      <span className="flex items-center gap-1 text-xs">
                        <MapPin className="h-3.5 w-3.5" /> {h.location || "N/A"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1 text-xs text-amber-500 font-semibold">
                        <Star className="h-3.5 w-3.5 fill-current" /> {h.rating || "N/A"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <Link to="/admin/hotels/$id" params={{ id: h.id }}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(h.id)}
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
