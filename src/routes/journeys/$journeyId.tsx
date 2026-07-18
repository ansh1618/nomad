import { createFileRoute } from "@tanstack/react-router";
import { JourneyDetailTemplate } from "@/components/site/JourneyDetailTemplate";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingUI } from "@/components/site/FloatingUI";
import { getJourneyBySlug } from "@/lib/queries-client";
import { supabase } from "@/lib/supabase";
import { RouteLoadingState, RouteErrorState } from "@/components/site/RouteStates";

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

export const Route = createFileRoute("/journeys/$journeyId")({
  loader: async ({ params }) => {
    const journey = await getJourneyBySlug(params.journeyId);
    if (!journey) {
      throw new Error("Journey not found");
    }
    const departures = await fetchActiveDepartures(journey.id);
    return { journey, departures };
  },
  pendingComponent: RouteLoadingState,
  errorComponent: RouteErrorState,
  head: ({ params }) => ({
    meta: [
      { title: `Nomadik Journey - ${params.journeyId.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}` },
      { name: "description", content: "Explore the day-wise itinerary, inclusions, stay, food, and transport specifics for this Nomadik road journey." }
    ]
  }),
  component: JourneyRoute,
});

function JourneyRoute() {
  const { journeyId } = Route.useParams();

  return (
    <div className="bg-background min-h-screen flex flex-col justify-between">
      <Navbar />
      <main className="flex-1">
        <JourneyDetailTemplate slug={journeyId} />
      </main>
      <Footer />
      <FloatingUI />
    </div>
  );
}
