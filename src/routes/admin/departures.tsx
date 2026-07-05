import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus,
  Calendar,
  Edit2,
  Trash2,
  Users,
  Bus,
  Hotel,
  ArrowUpRight,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/admin/departures")({
  component: AdminDepartures,
});

function AdminDepartures() {
  const [departures, setDepartures] = useState<any[]>([]);
  const [journeys, setJourneys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJourneyId, setSelectedJourneyId] = useState<string>("ALL");

  const loadFilterData = async () => {
    try {
      const { data, error } = await supabase.from("journeys").select("id, name");
      if (error) throw error;
      setJourneys(data || []);
    } catch (err: any) {
      console.error(err.message);
    }
  };

  const fetchDepartures = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("departures")
        .select(`
          *,
          journeys (name, max_capacity),
          admins (email)
        `)
        .order("departure_date");

      if (selectedJourneyId !== "ALL") {
        query = query.eq("journey_id", selectedJourneyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setDepartures(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load departures");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilterData();
  }, []);

  useEffect(() => {
    fetchDepartures();
  }, [selectedJourneyId]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this departure date? It will wipe seat locks and pricing configurations.")) return;

    try {
      const { error } = await supabase
        .from("departures")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Departure deleted successfully");
      fetchDepartures();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete departure");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-foreground">Departure Management & Calendar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage specific travel dates, dynamic pricing, assigned buses, and trip captains.
          </p>
        </div>
        <Link to="/admin/departures/$id" params={{ id: "new" }}>
          <Button className="gap-1.5 bg-primary">
            <Plus className="h-4 w-4" /> Add Departure Date
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-border">
        <div className="w-full max-w-xs space-y-1">
          <Select value={selectedJourneyId} onValueChange={setSelectedJourneyId}>
            <SelectTrigger>
              <SelectValue placeholder="All Packages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Packages / Journeys</SelectItem>
              {journeys.map(j => (
                <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Departures Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading departures...</p>
          </div>
        ) : departures.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            No departures found. Click "Add Departure Date" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Dates</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Package / Journey</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Captain</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Price</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {departures.map((d) => (
                  <tr key={d.id} className="border-b border-border/50 hover:bg-muted/10 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-accent" />
                        <div>
                          <p className="font-semibold">{new Date(d.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          <p className="text-xs text-muted-foreground">Return: {new Date(d.return_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold">{d.journeys?.name || "Unassigned"}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{d.admins?.email || "No Captain assigned"}</td>
                    <td className="py-3 px-4 font-semibold">₹{Number(d.base_price).toLocaleString("en-IN")}</td>
                    <td className="py-3 px-4">
                      <Badge variant={d.is_published ? "default" : "secondary"}>
                        {d.is_published ? "Published" : "Draft"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <Link to="/admin/departures/$id" params={{ id: d.id }}>
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
