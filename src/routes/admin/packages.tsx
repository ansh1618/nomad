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
  Package,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/admin/packages")({
  component: AdminPackages,
});

function AdminPackages() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("journeys")
        .select(`
          *,
          destinations (name)
        `)
        .order("name");

      if (error) throw error;
      setPackages(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load packages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this package? All associated departures and itineraries will be permanently deleted.")) return;

    try {
      const { error } = await supabase
        .from("journeys")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Package deleted successfully");
      fetchPackages();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete package");
    }
  };

  const filtered = packages.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase()) ||
    p.destinations?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-foreground">Packages (Journeys)</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your trip itineraries, pricing, and configurations.
          </p>
        </div>
        <Link to="/admin/packages/$id" params={{ id: "new" }}>
          <Button className="gap-1.5 bg-primary">
            <Plus className="h-4 w-4" /> Add Package
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
            placeholder="Search packages..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Packages Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading packages...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            No packages found. Click "Add Package" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Icon</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Package Name</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Destination</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Duration</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Base Price</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-muted/10 transition">
                    <td className="py-3 px-4">
                      <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary">
                        <Package className="h-5 w-5" />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{p.slug}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{p.destinations?.name || "Unassigned"}</td>
                    <td className="py-3 px-4 text-muted-foreground">{p.duration || "N/A"}</td>
                    <td className="py-3 px-4 font-semibold">₹{p.price ? Number(p.price).toLocaleString("en-IN") : "N/A"}</td>
                    <td className="py-3 px-4">
                      <Badge variant={p.is_published ? "default" : "secondary"}>
                        {p.is_published ? "Published" : "Draft"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <Link to="/admin/packages/$id" params={{ id: p.id }}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(p.id)}
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
