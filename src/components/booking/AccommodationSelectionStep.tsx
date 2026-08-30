import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Hotel, Users, CheckCircle2, BedDouble, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { GoNomadikLoadingScreen } from "@/components/site/GoNomadikLoadingScreen";
import { getJourneyAccommodationPrices } from "@/lib/queries/accommodation-prices";
import { trackEvent } from "@/lib/analytics";

/**
 * AccommodationSelectionStep
 *
 * Pricing source: journey_accommodation_prices (journey_id + accommodation_type)
 * NOT: hotel_rooms.price_modifier
 *
 * Hotel info (name, images) is still shown from hotel_rooms for display purposes,
 * but the PRICE comes exclusively from journey_accommodation_prices.
 *
 * If a journey has no configured prices → shows "Not configured" state.
 * The booking cannot proceed until prices are configured by an admin.
 */

const ACCOMMODATION_TYPE_LABELS: Record<string, string> = {
  QUAD: "Quad Sharing",
  TRIPLE: "Triple Sharing",
  DOUBLE: "Double Sharing",
  SINGLE: "Single Sharing",
  DORM: "Dormitory",
};

const ACCOMMODATION_TYPE_CAPACITY: Record<string, number> = {
  QUAD: 4,
  TRIPLE: 3,
  DOUBLE: 2,
  SINGLE: 1,
  DORM: 8,
};

// Fallback images per type (for when hotel images are unavailable)
const ACCOMMODATION_TYPE_IMAGES: Record<string, string> = {
  QUAD: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80",
  TRIPLE: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&q=80",
  DOUBLE: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&q=80",
  SINGLE: "https://images.unsplash.com/photo-1551882547-ff40c0d5fc4f?w=400&q=80",
  DORM: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&q=80",
};

const ACCOMMODATION_TYPE_DESCRIPTIONS: Record<string, string> = {
  QUAD: "Budget-friendly shared room for 4 travelers.",
  TRIPLE: "Comfortable room for 3 travelers with premium amenities.",
  DOUBLE: "Private room for couples or pairs with king/twin beds.",
  SINGLE: "Private single-occupancy room.",
  DORM: "Dormitory-style shared accommodation.",
};

export function AccommodationSelectionStep({
  data,
  updateData,
  onNext,
  onPrev,
  journey,
  isSidebar = false,
}: any) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnconfigured, setIsUnconfigured] = useState(false);
  const [hotelName, setHotelName] = useState<string>("Verified Stay");
  const [hotelImage, setHotelImage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAccommodationOptions() {
      setIsLoading(true);
      setIsUnconfigured(false);

      try {
        const journeyId = journey?.id;

        if (!journeyId) {
          console.warn("[AccommodationSelectionStep] No journey.id — cannot fetch prices");
          setIsUnconfigured(true);
          setIsLoading(false);
          return;
        }

        // === STEP 1: Fetch journey-scoped accommodation prices ===
        // Pricing identity: journey_id + accommodation_type
        // This is the ONLY source of truth for selling price.
        const journeyPrices = await getJourneyAccommodationPrices(journeyId);

        if (!journeyPrices || journeyPrices.length === 0) {
          // No prices configured for this journey — show "Not configured" state
          // Do NOT invent prices from starting_price or any offset
          setIsUnconfigured(true);
          setIsLoading(false);
          return;
        }

        // === STEP 2: Fetch hotel info for display (name, gallery) ===
        // Hotel info is purely for display — NOT for pricing
        let resolvedHotelName = "Verified Stay";
        let resolvedHotelImage: string | null = null;

        try {
          let activeHotelId: string | null = null;

          // Try departure-level hotel first
          if (data.departureId) {
            const { data: dep } = await supabase
              .from("departures")
              .select("hotel_id")
              .eq("id", data.departureId)
              .single();
            if (dep?.hotel_id) activeHotelId = dep.hotel_id;
          }

          // Fall back to journey-level hotel
          if (!activeHotelId) {
            activeHotelId = journey?.hotel_id || null;
          }

          if (activeHotelId) {
            const { data: hotel } = await supabase
              .from("hotels")
              .select("name, gallery")
              .eq("id", activeHotelId)
              .single();

            if (hotel) {
              resolvedHotelName = hotel.name || "Verified Stay";
              const galleryList = (hotel.gallery as any[])
                ?.map((item: any) => (typeof item === "string" ? item : item.url))
                .filter(Boolean) || [];
              resolvedHotelImage = galleryList[0] || null;
            }
          }
        } catch (hotelErr) {
          console.warn("[AccommodationSelectionStep] Hotel info fetch failed (non-fatal):", hotelErr);
        }

        setHotelName(resolvedHotelName);
        setHotelImage(resolvedHotelImage);

        // === STEP 3: Map journey prices → room option cards ===
        const mapped = journeyPrices.map((jp) => {
          const typeLabel = ACCOMMODATION_TYPE_LABELS[jp.accommodation_type] || jp.accommodation_type;
          const image =
            resolvedHotelImage ||
            ACCOMMODATION_TYPE_IMAGES[jp.accommodation_type] ||
            ACCOMMODATION_TYPE_IMAGES.QUAD;

          return {
            id: `jap-${jp.journey_id}-${jp.accommodation_type}`,
            type: typeLabel,
            accommodation_type: jp.accommodation_type,
            sharing_type: jp.accommodation_type,
            hotel: resolvedHotelName,
            // Price comes ONLY from journey_accommodation_prices
            price: jp.price,
            pricePerPerson: jp.price,
            image,
            description:
              ACCOMMODATION_TYPE_DESCRIPTIONS[jp.accommodation_type] ||
              `${typeLabel} at ${resolvedHotelName}.`,
            capacity: ACCOMMODATION_TYPE_CAPACITY[jp.accommodation_type] || 2,
          };
        });

        // Sort: QUAD → TRIPLE → DOUBLE → SINGLE → DORM
        const typeOrder = ["QUAD", "TRIPLE", "DOUBLE", "SINGLE", "DORM"];
        mapped.sort(
          (a, b) =>
            typeOrder.indexOf(a.accommodation_type) -
            typeOrder.indexOf(b.accommodation_type)
        );

        setRooms(mapped);
      } catch (err) {
        console.warn("[AccommodationSelectionStep] Failed to fetch accommodation options:", err);
        setIsUnconfigured(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAccommodationOptions();
  }, [data.departureId, journey?.id]);

  const selectRoom = (roomId: string) => {
    const selectedObj = rooms.find((r) => r.id === roomId);
    if (!selectedObj) return;

    const absPrice = Number(selectedObj.price);

    trackEvent("accommodation_selected", {
      room_type: selectedObj.sharing_type || selectedObj.type,
      journey_id: journey?.id,
      price: absPrice,
    });

    updateData((prev: any) => ({
      ...prev,
      selectedRooms: [roomId],
      basePrice: absPrice,
      selectedRoomObj: {
        ...selectedObj,
        price: absPrice,
        pricePerPerson: absPrice,
        priceModifier: 0,
        price_modifier: 0,
        sharing_type: selectedObj.sharing_type || selectedObj.accommodation_type,
      },
      roomSharing: selectedObj.sharing_type || selectedObj.accommodation_type,
    }));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold text-primary">Accommodation</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose your preferred stay style. Prices update automatically.
        </p>
      </div>

      {isLoading ? (
        <GoNomadikLoadingScreen fullPage={false} statusText="Finding available rooms" />
      ) : isUnconfigured ? (
        <div className="py-16 text-center bg-amber-50 border border-amber-200 rounded-2xl">
          <AlertTriangle className="h-10 w-10 mx-auto text-amber-500 mb-3" />
          <p className="font-poppins font-semibold text-foreground">
            Accommodation pricing not configured
          </p>
          <p className="text-xs mt-1 text-muted-foreground max-w-xs mx-auto">
            Pricing for this package hasn't been set up yet. Please contact us or check back
            shortly — our team is on it.
          </p>
        </div>
      ) : rooms.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground bg-white border border-border rounded-2xl">
          <Hotel className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="font-poppins font-semibold text-foreground">No accommodation options available</p>
          <p className="text-xs mt-1">Please proceed to next step or contact support.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => {
            const isSelected = data.selectedRooms.includes(room.id);
            const displayPrice = Number(room.price);
            return (
              <div
                key={room.id}
                onClick={() => selectRoom(room.id)}
                className={cn(
                  "group relative border-2 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300",
                  isSelected
                    ? "border-accent shadow-md transform scale-[1.02]"
                    : "border-border hover:border-accent/50"
                )}
              >
                <div className="h-40 overflow-hidden relative">
                  <img
                    src={room.image}
                    alt={room.type}
                    className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
                      {room.hotel}
                    </p>
                    <h3 className="text-lg font-display font-bold">{room.type}</h3>
                  </div>
                  {isSelected && (
                    <div className="absolute top-3 right-3 bg-accent text-white p-1 rounded-full shadow-md">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="p-4 bg-white space-y-4">
                  <p className="text-xs text-muted-foreground line-clamp-2">{room.description}</p>
                  <div className="flex justify-between items-center border-t border-border pt-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <BedDouble className="h-4 w-4 text-accent" />
                      <span>₹{displayPrice.toLocaleString("en-IN")}</span>
                      <span className="text-muted-foreground font-normal">/ person</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>Up to {room.capacity}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div
        className={cn(
          "flex flex-col-reverse sm:flex-row justify-between pt-4 gap-3 w-full",
          isSidebar && "flex-col-reverse w-full"
        )}
      >
        <Button
          variant="outline"
          onClick={onPrev}
          className={cn("w-full sm:w-auto h-11", isSidebar && "w-full h-10")}
        >
          Back to Traveller Details
        </Button>
        <Button
          onClick={onNext}
          disabled={
            isUnconfigured || (rooms.length > 0 && data.selectedRooms.length === 0)
          }
          className={cn(
            "w-full sm:w-auto bg-primary hover:bg-primary/90 h-11",
            isSidebar && "w-full h-10"
          )}
        >
          Continue to Add-ons
        </Button>
      </div>
    </div>
  );
}
