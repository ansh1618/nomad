import { createFileRoute, redirect } from "@tanstack/react-router";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { getJourneyBySlug } from "@/lib/queries-client";
import { RouteLoadingState, RouteErrorState } from "@/components/site/RouteStates";
import { supabase } from "@/lib/supabase";

const fetchActiveDepartures = async (journeyId: string) => {
  const today = new Date().toISOString().split("T")[0];
  try {
    const { data, error } = await supabase
      .from("departures")
      .select("id, departure_date, return_date, base_price, available_seats, status")
      .eq("journey_id", journeyId)
      .neq("status", "CANCELLED")
      .gte("departure_date", today)
      .order("departure_date");
      
    if (!error && data) {
      return data.map(d => ({
        id: d.id,
        date: d.departure_date,
        returnDate: d.return_date || d.departure_date,
        basePrice: Number(d.base_price),
        availableSeats: d.available_seats || 20
      }));
    }
  } catch (e) {
    console.warn("Departures query failed, falling back to trip_batches:", e);
  }

  // Fallback to trip_batches
  const { data: legacyData, error: legacyError } = await supabase
    .from("trip_batches")
    .select("id, departure_date, return_date, price, remaining_seats")
    .eq("journey_id", journeyId)
    .neq("status", "CANCELLED")
    .gte("departure_date", today)
    .order("departure_date");

  if (legacyError || !legacyData) return [];

  return legacyData.map(d => ({
    id: d.id,
    date: d.departure_date,
    returnDate: d.return_date || d.departure_date,
    basePrice: Number(d.price || 0),
    availableSeats: d.remaining_seats || 20
  }));
};

export const Route = createFileRoute("/book/$journeyId")({
  loader: async ({ params }) => {
    // 1. Fetch Journey Details
    const journey = await getJourneyBySlug(params.journeyId);
    if (!journey) {
      throw new Error("Journey not found");
    }
    
    // 2. Fetch Departures for this Journey
    const departures = await fetchActiveDepartures(journey.id);

    return { journey, departures };
  },
  pendingComponent: RouteLoadingState,
  errorComponent: RouteErrorState,
  component: BookJourneyRoute,
});

function BookJourneyRoute() {
  const { journey, departures } = Route.useLoaderData();
  
  return (
    <div className="bg-muted/10 min-h-screen">
      <BookingWizard journey={journey} departures={departures} />
    </div>
  );
}
