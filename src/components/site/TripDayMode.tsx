import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Compass, MapPin, Clock, Phone, AlertTriangle, Radio, Navigation,
  Calendar, CheckCircle2, ShieldAlert, Sparkles, ChevronRight, Bus
} from "lucide-react";

interface TripDayModeProps {
  booking: any;
  onExitMode?: () => void;
}

export function TripDayMode({ booking, onExitMode }: TripDayModeProps) {
  // Determine current day number based on departure date
  const departureDate = booking.departures?.departure_date ? new Date(booking.departures.departure_date) : new Date();
  const today = new Date();
  const diffTime = today.getTime() - departureDate.getTime();
  const currentDayNumber = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);

  // Fetch journey itinerary days
  const { data: itineraryDays = [] } = useQuery({
    queryKey: ["active_itinerary", booking.journey_id],
    enabled: Boolean(booking.journey_id),
    queryFn: async () => {
      const { data } = await supabase
        .from("itinerary_days")
        .select("*")
        .eq("journey_id", booking.journey_id)
        .order("day_number", { ascending: true });
      return data || [];
    },
  });

  // Fetch live trip announcements for this departure
  const { data: announcements = [] } = useQuery({
    queryKey: ["active_announcements", booking.departure_id],
    enabled: Boolean(booking.departure_id),
    queryFn: async () => {
      const { data } = await supabase
        .from("trip_announcements")
        .select("*")
        .eq("departure_id", booking.departure_id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    refetchInterval: 30000, // Live refresh every 30s
  });

  const todayItinerary = itineraryDays.find((d: any) => d.day_number === currentDayNumber) || itineraryDays[0] || {
    day_number: currentDayNumber,
    title: "Expedition in Progress",
    description: "Follow convoy captain instructions and stay on schedule for today's activities.",
    stay: "Hotel / Campsite",
  };

  const captain = booking.departures?.trip_captains;

  return (
    <div className="bg-[#0A192F] text-white rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 font-poppins relative overflow-hidden border border-[#C8A96A]/30">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#C8A96A]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Mode Header Badge */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-700/60 pb-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#C8A96A]/20 border border-[#C8A96A]/50 flex items-center justify-center text-[#C8A96A] animate-pulse">
            <Radio className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C8A96A]">LIVE TRIP DAY MODE</span>
              <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px]">
                Day {currentDayNumber} Active
              </Badge>
            </div>
            <h2 className="font-display text-xl font-bold text-white mt-0.5">
              {booking.journeys?.name || "Active Nomadik Expedition"}
            </h2>
          </div>
        </div>

        {onExitMode && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onExitMode}
            className="text-slate-400 hover:text-white hover:bg-white/10 text-xs"
          >
            Dashboard View
          </Button>
        )}
      </div>

      {/* Live Convoy Broadcast Banner */}
      {announcements.length > 0 && (
        <div className="bg-[#C8A96A]/15 border border-[#C8A96A]/40 rounded-2xl p-4 flex items-start gap-3 animate-pulse">
          <Sparkles className="h-5 w-5 text-[#C8A96A] shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-[#C8A96A]">Convoy Alert: {announcements[0].title}</p>
            <p className="text-slate-200">{announcements[0].message}</p>
          </div>
        </div>
      )}

      {/* Today's Schedule Card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#C8A96A]" />
            <h3 className="font-bold text-sm text-[#C8A96A]">Today's Itinerary (Day {todayItinerary.day_number})</h3>
          </div>
          <span className="text-xs font-semibold text-slate-300">{todayItinerary.title}</span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">{todayItinerary.description}</p>

        {todayItinerary.stay && (
          <div className="flex items-center gap-2 text-xs text-[#C8A96A] bg-[#C8A96A]/10 px-3 py-2 rounded-xl">
            <MapPin className="h-3.5 w-3.5" />
            <span>Overnight Stay: <strong>{todayItinerary.stay}</strong></span>
          </div>
        )}
      </div>

      {/* Trip Operations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Assembly & Pickup */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-[#C8A96A]">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Reporting & Pickup</span>
          </div>
          <p className="text-sm font-bold text-white">{booking.departures?.pickup_time || "07:30 PM"}</p>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <MapPin className="h-3 w-3 text-[#C8A96A]" /> {booking.departures?.pickup_location || booking.pickup_point || "Nomadik Assembly Hub"}
          </p>
        </div>

        {/* Trip Captain Contact */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-[#C8A96A]">
            <Navigation className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Convoy Captain</span>
          </div>
          <p className="text-sm font-bold text-white">{captain?.full_name || "Nomadik Captain"}</p>
          {captain?.phone ? (
            <a href={`tel:${captain.phone}`} className="text-xs text-[#C8A96A] hover:underline flex items-center gap-1">
              <Phone className="h-3 w-3" /> {captain.phone}
            </a>
          ) : (
            <p className="text-xs text-slate-400">Assigned on assembly</p>
          )}
        </div>

        {/* Emergency Hotline */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-red-400">
            <ShieldAlert className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">24/7 Emergency Support</span>
          </div>
          <p className="text-sm font-bold text-white">+91 99999 99999</p>
          <p className="text-[10px] text-slate-400">Direct Nomadik Operations Hotline</p>
        </div>
      </div>
    </div>
  );
}
