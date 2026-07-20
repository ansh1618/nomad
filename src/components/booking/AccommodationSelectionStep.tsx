import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Hotel, Users, CheckCircle2, BedDouble, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

export function AccommodationSelectionStep({ data, updateData, onNext, onPrev, journey, isSidebar = false }: any) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRooms() {
      setIsLoading(true);
      try {
        let activeHotelId = null;

        // 1. Try to get hotel_id from the selected departure
        if (data.departureId) {
          const { data: dep } = await supabase
            .from("departures")
            .select("hotel_id")
            .eq("id", data.departureId)
            .single();
          if (dep?.hotel_id) {
            activeHotelId = dep.hotel_id;
          }
        }

        // 2. If no departure hotel, try package/journey level hotel_id
        if (!activeHotelId) {
          activeHotelId = journey?.hotel_id || journey?.accommodation?.id;
        }

        if (activeHotelId) {
          const { data: dbRooms, error: roomsError } = await supabase
            .from("hotel_rooms")
            .select(`
              id,
              room_type,
              sharing_type,
              capacity,
              price_modifier,
              hotels (
                id,
                name,
                gallery,
                city,
                state,
                address
              )
            `)
            .eq("hotel_id", activeHotelId)
            .eq("is_active", true);

          if (!roomsError && dbRooms && dbRooms.length > 0) {
            const mapped = dbRooms.map((r: any) => {
              const hotel = r.hotels;
              const galleryList = (hotel?.gallery as any[])?.map((item: any) => typeof item === 'string' ? item : item.url).filter(Boolean) || [];
              const fallbackUrl = 'https://images.unsplash.com/photo-1551882547-ff40c0d5fc4f?w=400&q=80';
              
              return {
                id: r.id,
                type: r.room_type || `${r.sharing_type} Sharing`,
                hotel: hotel?.name || "Premium Stay",
                pricePerPerson: Number(r.price_modifier || 0),
                image: galleryList[0] || fallbackUrl,
                description: `Comfortable ${r.room_type || r.sharing_type} stay at ${hotel?.name || 'verified property'} in ${hotel?.city || 'the mountains'}.`,
                capacity: r.capacity || 2,
              };
            });
            setRooms(mapped);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Failed to fetch dynamic accommodation rooms:", err);
      }

      // No accommodation found
      setRooms([]);
      setIsLoading(false);
    }
    fetchRooms();
  }, [data.departureId, journey]);

  const selectRoom = (roomId: string, priceModifier: number) => {
    const selectedObj = rooms.find(r => r.id === roomId);
    updateData((prev: any) => ({
      ...prev,
      selectedRooms: [roomId],
      selectedRoomObj: selectedObj
    }));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold text-primary">Accommodation</h2>
        <p className="text-sm text-muted-foreground mt-1">Choose your preferred stay style. Prices update automatically.</p>
      </div>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-white border border-border rounded-2xl">
          <Loader2 className="h-8 w-8 animate-spin mb-4 text-accent" />
          <p>Finding available rooms...</p>
        </div>
      ) : rooms.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground bg-white border border-border rounded-2xl">
          <Hotel className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="font-poppins font-semibold text-foreground">No accommodation assigned</p>
          <p className="text-xs mt-1">Please proceed to next step.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => {
            const isSelected = data.selectedRooms.includes(room.id);
            return (
              <div 
                key={room.id}
                onClick={() => selectRoom(room.id, room.pricePerPerson)}
                className={cn(
                  "group relative border-2 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300",
                  isSelected ? "border-accent shadow-md transform scale-[1.02]" : "border-border hover:border-accent/50"
                )}
              >
                <div className="h-40 overflow-hidden relative">
                  <img src={room.image} alt={room.type} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{room.hotel}</p>
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
                      <span>{room.pricePerPerson === 0 ? "Included" : `+ ₹${room.pricePerPerson}/head`}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={cn("flex justify-between pt-4 gap-3", isSidebar && "flex-col-reverse w-full")}>
        <Button variant="outline" onClick={onPrev} className={cn(isSidebar && "w-full h-10")}>Back to Traveller Details</Button>
        <Button 
          onClick={onNext} 
          disabled={rooms.length > 0 && data.selectedRooms.length === 0}
          className={cn("bg-primary hover:bg-primary/90", isSidebar && "w-full h-10")}
        >
          Continue to Add-ons
        </Button>
      </div>
    </div>
  );
}
