import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, BedDouble } from "lucide-react";

export const Route = createFileRoute("/admin/rooms")({
  component: AdminLiveRooms,
});

function AdminLiveRooms() {
  const [departures, setDepartures] = useState<any[]>([]);
  const [selectedDepartureId, setSelectedDepartureId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);

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

  // Load live room inventory of selected departure
  const fetchLiveRooms = async (departureId: string) => {
    if (!departureId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("departure_inventory")
        .select(`
          *,
          hotel_rooms (room_type, capacity)
        `)
        .eq("departure_id", departureId)
        .eq("inventory_type", "ROOM_BED");

      if (error) throw error;
      setRooms(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load live rooms layout");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartures();
  }, []);

  useEffect(() => {
    if (selectedDepartureId) {
      fetchLiveRooms(selectedDepartureId);
    }
  }, [selectedDepartureId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-foreground">Live Room Inventory</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Realtime stays availability, allocated sharing rooms, and check-in statuses.
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

      {/* Rooms occupancy */}
      <div className="bg-white border border-border p-6 rounded-xl min-h-[300px]">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading Live Rooms...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            No rooms or stay inventory assigned to this departure. Configure stay in Hotel Settings first.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {rooms.map((room) => {
              const isBooked = room.status === "BOOKED";
              return (
                <div key={room.id} className="p-4 border border-border rounded-xl bg-muted/20 flex flex-col justify-between h-32">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <BedDouble className="h-5 w-5 text-accent" />
                      <div>
                        <p className="font-semibold text-sm">{room.hotel_rooms?.room_type || "Standard Bed"}</p>
                        <p className="text-xs text-muted-foreground">Cap: {room.hotel_rooms?.capacity || 2} Pax</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-border mt-3">
                    <Badge variant={isBooked ? "destructive" : "default"}>
                      {room.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
