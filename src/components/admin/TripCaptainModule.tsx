import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Users, CheckCircle2, XCircle, AlertTriangle, Radio, Phone, Mail,
  Calendar, MapPin, Loader2, ShieldCheck, Megaphone, Camera, FileSpreadsheet
} from "lucide-react";

interface TripCaptainModuleProps {
  captainId?: string;
  isCaptainRole?: boolean;
}

export function TripCaptainModule({ captainId, isCaptainRole = true }: TripCaptainModuleProps) {
  const queryClient = useQueryClient();
  const [selectedDepartureId, setSelectedDepartureId] = useState<string | null>(null);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [incidentTitle, setIncidentTitle] = useState("");
  const [incidentDetails, setIncidentDetails] = useState("");
  const [isIncidentOpen, setIsIncidentOpen] = useState(false);

  // Fetch departures assigned to this Captain (or all if Admin)
  const { data: departures = [], isLoading: loadingDeps } = useQuery({
    queryKey: ["captain_departures", captainId],
    queryFn: async () => {
      let query = supabase
        .from("departures")
        .select(`
          id, departure_date, return_date, available_seats, booked_seats, total_seats, pickup_location, pickup_time,
          journeys (id, name, slug)
        `)
        .order("departure_date", { ascending: true });

      if (captainId) {
        query = query.eq("trip_captain_id", captainId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const activeDeparture = departures.find((d: any) => d.id === selectedDepartureId) || departures[0];

  // Fetch passenger manifest for active departure
  const { data: manifest = [], isLoading: loadingManifest } = useQuery({
    queryKey: ["passenger_manifest", activeDeparture?.id],
    enabled: Boolean(activeDeparture?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id, booking_id, customer_name, phone, email, status, booking_status, payment_status, travellers_count, room_sharing, pickup_point,
          booking_travellers (id, full_name, phone, gender, age, room_sharing, is_primary)
        `)
        .eq("departure_id", activeDeparture.id)
        .in("booking_status", ["CONFIRMED", "PENDING"]);

      if (error) throw error;
      return data || [];
    },
  });

  // Handle Attendance Toggle
  const toggleAttendanceMutation = useMutation({
    mutationFn: async ({ travellerId, currentStatus }: { travellerId: string; currentStatus: string }) => {
      const newStatus = currentStatus === "BOARDED" ? "ABSENT" : "BOARDED";
      const { error } = await supabase
        .from("booking_travellers")
        .update({ attendance_status: newStatus })
        .eq("id", travellerId);

      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      toast.success(`Attendance marked: ${newStatus}`);
      queryClient.invalidateQueries({ queryKey: ["passenger_manifest", activeDeparture?.id] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update attendance.");
    },
  });

  // Handle Emergency Broadcast
  const sendBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast.error("Please enter both title and message for broadcast.");
      return;
    }

    try {
      const { error } = await supabase.from("trip_announcements").insert({
        departure_id: activeDeparture?.id,
        captain_id: captainId || null,
        title: broadcastTitle,
        message: broadcastMessage,
        type: "IMPORTANT",
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success("🚨 Live broadcast sent to all passengers on this departure!");
      setIsBroadcastOpen(false);
      setBroadcastTitle("");
      setBroadcastMessage("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send broadcast.");
    }
  };

  return (
    <div className="space-y-6 font-poppins text-left">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0A192F] text-white p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-[#C8A96A]/20 border border-[#C8A96A]/40 flex items-center justify-center text-[#C8A96A]">
            <Radio className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-[#C8A96A]">Trip Captain Command Portal</h2>
            <p className="text-xs text-slate-300">Live operational manifest, attendance marking & convoy broadcasts</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsBroadcastOpen(true)}
            size="sm"
            className="bg-[#C8A96A] text-[#0A192F] hover:bg-[#D4B87C] font-semibold text-xs rounded-xl"
          >
            <Megaphone className="h-4 w-4 mr-1.5" /> Broadcast Alert
          </Button>
        </div>
      </div>

      {/* Departures Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {loadingDeps ? (
          <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading assigned trips...
          </div>
        ) : departures.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No assigned departures found.</p>
        ) : (
          departures.map((dep: any) => {
            const isActive = (activeDeparture?.id === dep.id);
            const journeyName = dep.journeys?.name || "Trip Batch";
            const dateStr = dep.departure_date ? new Date(dep.departure_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Upcoming";

            return (
              <button
                key={dep.id}
                onClick={() => setSelectedDepartureId(dep.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
                  isActive
                    ? "bg-[#0A192F] text-[#C8A96A] border-[#C8A96A]/50 shadow-md"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>{journeyName} ({dateStr})</span>
              </button>
            );
          })
        )}
      </div>

      {/* Selected Departure Manifest Card */}
      {activeDeparture && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
            <div>
              <h3 className="font-display font-bold text-lg text-primary">
                {activeDeparture.journeys?.name || "Departure Manifest"}
              </h3>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-[#C8A96A]" /> {activeDeparture.pickup_location || "Standard Assembly Point"}
                </span>
                <span>•</span>
                <span>Reporting: {activeDeparture.pickup_time || "07:30 PM"}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Passengers</span>
                <p className="text-lg font-bold text-primary font-poppins">
                  {manifest.reduce((sum: number, b: any) => sum + (b.booking_travellers?.length || b.travellers_count || 1), 0)} Explorers
                </p>
              </div>
            </div>
          </div>

          {/* Passenger Roster List */}
          {loadingManifest ? (
            <div className="flex items-center justify-center py-12 text-slate-500 text-xs gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Fetching live passenger roster...
            </div>
          ) : manifest.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No confirmed passengers for this departure yet.
            </div>
          ) : (
            <div className="space-y-4">
              {manifest.map((booking: any, idx: number) => {
                const travellers = booking.booking_travellers?.length > 0
                  ? booking.booking_travellers
                  : [{ id: booking.id, full_name: booking.customer_name, phone: booking.phone, gender: "", age: null }];

                return (
                  <div key={booking.id} className="border border-slate-200 rounded-2xl p-4 hover:border-[#C8A96A]/40 transition-all bg-slate-50/50">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                          #{idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{booking.booking_id || booking.id.slice(0, 8)}</span>
                        <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                          {booking.booking_status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-600">
                        {booking.phone && (
                          <a href={`tel:${booking.phone}`} className="flex items-center gap-1 hover:text-[#C8A96A]">
                            <Phone className="h-3 w-3" /> {booking.phone}
                          </a>
                        )}
                        <span className="text-slate-400">|</span>
                        <span>Sharing: <strong className="text-slate-900">{booking.room_sharing || "Standard"}</strong></span>
                      </div>
                    </div>

                    {/* Travellers Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {travellers.map((t: any) => {
                        const isBoarded = t.attendance_status === "BOARDED";

                        return (
                          <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2 shadow-xs">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {t.full_name || "Explorer"}
                                {t.is_primary && <span className="ml-1 text-[9px] text-[#C8A96A] font-normal">(Primary)</span>}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {t.gender || "N/A"} {t.age ? `• ${t.age} yrs` : ""}
                              </p>
                            </div>

                            <Button
                              size="sm"
                              variant={isBoarded ? "default" : "outline"}
                              onClick={() => toggleAttendanceMutation.mutate({ travellerId: t.id, currentStatus: t.attendance_status })}
                              className={`h-7 px-2.5 text-[10px] font-bold rounded-lg ${
                                isBoarded
                                  ? "bg-green-600 hover:bg-green-700 text-white"
                                  : "border-slate-300 text-slate-600 hover:bg-slate-100"
                              }`}
                            >
                              {isBoarded ? (
                                <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Boarded</span>
                              ) : (
                                <span>Mark Present</span>
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Live Broadcast Modal */}
      <Dialog open={isBroadcastOpen} onOpenChange={setIsBroadcastOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary font-display">
              <Radio className="h-5 w-5 text-[#C8A96A] animate-pulse" /> Send Convoy Broadcast
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Broadcast Headline</label>
              <Input
                placeholder="e.g. Departure Time Update / Bus Assembly Point"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Message Detail</label>
              <Textarea
                rows={4}
                placeholder="Enter live operational announcement for all travelers on this departure..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsBroadcastOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="bg-[#0A192F] text-white hover:bg-[#102A43]" onClick={sendBroadcast}>
              Broadcast Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
