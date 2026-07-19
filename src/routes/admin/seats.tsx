import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Armchair, CircleHelp } from "lucide-react";

export const Route = createFileRoute("/admin/seats")({
  component: AdminLiveSeats,
});

function AdminLiveSeats() {
  const [departures, setDepartures] = useState<any[]>([]);
  const [selectedDepartureId, setSelectedDepartureId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [seats, setSeats] = useState<any[]>([]);

  // Load all departures
  const fetchDepartures = async () => {
    try {
      const { data, error } = await supabase
        .from("departures")
        .select(`
          id,
          departure_date,
          journeys (name)
        `)
        .order("departure_date");

      if (error) throw error;
      setDepartures(data || []);
      if (data && data.length > 0) {
        setSelectedDepartureId(data[0].id);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load departures list");
    }
  };

  // Load live seat map of selected departure
  const fetchLiveSeats = async (departureId: string) => {
    if (!departureId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("departure_inventory")
        .select(`
          *,
          bus_seats (seat_number, is_sleeper)
        `)
        .eq("departure_id", departureId)
        .eq("inventory_type", "SEAT");

      if (error) throw error;
      setSeats(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load live seats layout");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartures();
  }, []);

  useEffect(() => {
    if (selectedDepartureId) {
      fetchLiveSeats(selectedDepartureId);
    }
  }, [selectedDepartureId]);

  // Toggle Manual Seat lock / unlock for admins
  const handleToggleLock = async (seat: any) => {
    const newStatus = seat.status === "AVAILABLE" ? "LOCKED" : "AVAILABLE";
    try {
      const { error } = await supabase
        .from("departure_inventory")
        .update({
          status: newStatus,
          locked_at: newStatus === "LOCKED" ? new Date().toISOString() : null
        })
        .eq("id", seat.id);

      if (error) throw error;
      toast.success(`Seat ${seat.bus_seats?.seat_number} marked as ${newStatus}`);
      fetchLiveSeats(selectedDepartureId);
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle seat status");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-foreground">Live Seat Inventory</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Realtime occupancy status, admin seat locking, and traveller mappings.
        </p>
      </div>

      {/* Select departure */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-border">
        <div className="w-full max-w-sm space-y-1">
          <Label>Select Departure Date</Label>
          <Select value={selectedDepartureId} onValueChange={setSelectedDepartureId}>
            <SelectTrigger>
              <SelectValue placeholder="Select Departure" />
            </SelectTrigger>
            <SelectContent>
              {departures.map(d => (
                <SelectItem key={d.id} value={d.id}>
                  {d.journeys?.name} ({new Date(d.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Visual seat layout grid */}
      <div className="bg-white border border-border p-8 rounded-xl flex flex-col items-center min-h-[300px]">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading Live Layout...</p>
          </div>
        ) : seats.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            No seat inventory assigned to this departure. Configure transport in Departure Settings first.
          </div>
        ) : (
          <div className="space-y-8 w-full max-w-xl">
            <div className="grid grid-cols-4 gap-4">
              {seats.map((seat) => {
                const num = seat.bus_seats?.seat_number || "??";
                const isBooked = seat.status === "BOOKED";
                const isLocked = seat.status === "LOCKED";
                
                return (
                  <div key={seat.id} className="flex flex-col items-center">
                    <button
                      disabled={isBooked}
                      onClick={() => handleToggleLock(seat)}
                      className={`w-14 h-16 rounded-t-xl rounded-b-md border-2 flex flex-col items-center justify-center text-xs font-bold transition-all relative
                        ${isBooked ? "bg-destructive border-destructive text-white cursor-not-allowed" :
                          isLocked ? "bg-amber-500 border-amber-500 text-white" :
                          "bg-white border-border text-foreground hover:border-accent"
                        }
                      `}
                    >
                      <Armchair className="h-5 w-5 mb-0.5" />
                      <span>{num}</span>
                    </button>
                    <span className="text-[10px] text-muted-foreground mt-1 uppercase font-semibold">
                      {seat.status}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center gap-6 mt-6 pt-6 border-t border-border text-xs">
              <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded border border-border bg-white" /> Available</div>
              <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-amber-500" /> Admin Locked</div>
              <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-destructive" /> Booked</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
import { Label } from "@/components/ui/label";
