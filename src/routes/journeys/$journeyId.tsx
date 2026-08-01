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

import { withTimeout } from "@/lib/promise-timeout";

export const Route = createFileRoute("/journeys/$journeyId")({
  loader: async ({ params }) => {
    const journeyPromise = getJourneyBySlug(params.journeyId);
    const journey = await withTimeout(journeyPromise, 2500, null);

    if (!journey) {
      // Fallback clean journey object if fetch times out or returns null
      const titleFriendly = params.journeyId ? params.journeyId.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "Road Journey";
      return {
        journey: {
          id: params.journeyId,
          slug: params.journeyId,
          name: titleFriendly,
          price: "₹6,499",
          priceNumber: 6499,
          duration: "3D/2N",
          image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
          destinationSlug: "manali",
          overview: "Experience curated road trips with certified Trip Captains, verified stays, and 24/7 support.",
          itinerary: [],
          inclusions: ["Cozy Stays", "Volvo / Conveyance", "Trip Captain", "Breakfast & Dinner"],
          exclusions: ["Personal Expenses", "GST"],
          packingList: [],
        },
        departures: []
      };
    }

    const departures = await withTimeout(fetchActiveDepartures(journey.id), 2000, []);
    return { journey, departures };
  },
  pendingComponent: RouteLoadingState,
  errorComponent: RouteErrorState,
  head: ({ params }) => {
    const id = params?.journeyId || "";
    const titleFriendly = id ? id.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "Trip Package";
    return {
      meta: [
        { title: `Nomadik Journey - ${titleFriendly}` },
        { name: "description", content: "Explore the day-wise itinerary, inclusions, stay, food, and transport specifics for this Nomadik road journey." }
      ]
    };
  },
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
