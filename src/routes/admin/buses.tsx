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
  Bus,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/admin/buses")({
  component: AdminBuses,
});

function AdminBuses() {
  const [buses, setBuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchBuses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("buses")
        .select("*")
        .order("name");

      if (error) throw error;
      setBuses(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuses();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vehicle configuration? All seats maps linked to departures will be cleared.")) return;

    try {
      const { error } = await supabase
        .from("buses")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Vehicle configuration deleted");
      fetchBuses();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete vehicle");
    }
  };

  const filtered = buses.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.registration_number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-foreground">Bus & Traveller Inventory</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure vehicle sizes, registration plates, drivers, and layout formats.
          </p>
        </div>
        <Link to="/admin/buses/$id" params={{ id: "new" }}>
          <Button className="gap-1.5 bg-primary">
            <Plus className="h-4 w-4" /> Add Vehicle
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search vehicles..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading vehicle configurations...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            No vehicle layouts configured. Create one below.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Vehicle</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Number Plate</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Layout type</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Capacity</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="border-b border-border/50 hover:bg-muted/10 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded bg-primary/10 flex items-center justify-center text-primary">
                          <Bus className="h-5 w-5" />
                        </div>
                        <span className="font-semibold text-sm">{b.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">{b.registration_number || "N/A"}</td>
                    <td className="py-3 px-4 text-muted-foreground uppercase text-xs font-bold">{b.layout_type || "2X2"}</td>
                    <td className="py-3 px-4 text-muted-foreground font-semibold">{b.total_seats} seats</td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <Link to="/admin/buses/$id" params={{ id: b.id }}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(b.id)}
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
