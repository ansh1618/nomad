import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Hotel, Users, CheckCircle2, BedDouble, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

export function AccommodationSelectionStep({ data, updateData, onNext, onPrev, journey }: any) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRooms() {
      if (!data.departureId) {
        setIsLoading(false);
        return;
      }

      let fetchedDepRooms: any[] = [];
      try {
        const { data: depRooms, error } = await supabase
          .from("departure_rooms")
          .select(`
            hotel_room_id,
            allocated_count,
            hotel_rooms (
              id,
              room_type,
              capacity,
              hotels (
                name,
                gallery
              )
            )
          `)
          .eq("departure_id", data.departureId);

        if (error) {
          console.error("Error fetching rooms:", error);
        } else if (depRooms) {
          fetchedDepRooms = depRooms;
        }
      } catch (err) {
        console.error("Failed to query departure_rooms:", err);
      }

      if (fetchedDepRooms && fetchedDepRooms.length > 0) {
        const mappedRooms = fetchedDepRooms.map((dr: any) => {
          const hotelRoom = dr.hotel_rooms;
          const hotel = hotelRoom?.hotels;
          const gallery = hotel?.gallery as string[] | null;
          
          return {
            id: hotelRoom?.id || dr.hotel_room_id,
            type: hotelRoom?.room_type || "Standard Room",
            hotel: hotel?.name || "Premium Stay",
            pricePerPerson: 0, // Base price covers standard rooms
            image: gallery?.[0] || 'https://images.unsplash.com/photo-1551882547-ff40c0d5fc4f?w=400&q=80',
            description: `Comfortable ${hotelRoom?.room_type || 'room'} accommodating up to ${hotelRoom?.capacity || 2} people.`,
            capacity: hotelRoom?.capacity || 2,
          };
        });
        
        // Remove duplicates if any
        const uniqueRooms = mappedRooms.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
        setRooms(uniqueRooms);
      } else if (journey?.accommodation && ((journey.accommodation as any).id || (journey.accommodation as any).name)) {
        // Dynamic fallback to staying accommodation configs configured in packages edit staying tab!
        const rawStay = journey.accommodation as any;
        const stay = {
          hotel_name: rawStay.name,
          location: rawStay.city ? `${rawStay.city}${rawStay.state ? `, ${rawStay.state}` : ''}` : (rawStay.address || rawStay.location),
          cover_image: rawStay.cover_image || (rawStay.gallery as any[])?.[0]?.url || (rawStay.gallery as any[])?.[0] || '',
          gallery: (rawStay.gallery as any[])?.map((img: any) => typeof img === 'string' ? img : img.url).filter(Boolean) || [],
          room_types: rawStay.hotel_rooms?.map((r: any) => r.room_type || r.sharing_type).filter(Boolean) || rawStay.room_types || [],
        };
        const roomTypes = stay.room_types && stay.room_types.length > 0
          ? stay.room_types
          : ['Double Sharing', 'Triple Sharing', 'Quad Sharing'];
        const coverImg = stay.cover_image || 'https://images.unsplash.com/photo-1551882547-ff40c0d5fc4f?w=400&q=80';
        const galleryList = stay.gallery || [];

        const mappedRooms = roomTypes.map((type: string, idx: number) => {
          let capacity = 2;
          if (type.toLowerCase().includes('triple')) capacity = 3;
          else if (type.toLowerCase().includes('quad')) capacity = 4;
          else if (type.toLowerCase().includes('single')) capacity = 1;

          let pricePerPerson = 0;
          if (type.toLowerCase().includes('double') || type.toLowerCase().includes('twin')) pricePerPerson = 800;
          else if (type.toLowerCase().includes('triple')) pricePerPerson = 500;

          return {
            id: `stay-room-${idx}`,
            type: type,
            hotel: stay.hotel_name || "Premium Stay",
            pricePerPerson: pricePerPerson,
            image: galleryList[idx] || coverImg,
            description: `Comfortable ${type} stay at ${stay.hotel_name || 'verified property'} in ${stay.location || 'stay valley'}.`,
            capacity: capacity,
          };
        });
        setRooms(mappedRooms);
      } else {
        // Fallback dummy layout if no rooms or accommodations are set up
        setRooms([
          { id: 'r1', type: 'Quad Sharing', hotel: 'Mountain View Stay', pricePerPerson: 0, image: 'https://images.unsplash.com/photo-1551882547-ff40c0d5fc4f?w=400&q=80', description: 'Cozy room with 4 beds.' },
          { id: 'r2', type: 'Triple Sharing', hotel: 'Mountain View Stay', pricePerPerson: 1000, image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=400&q=80', description: 'Spacious room for 3.' },
          { id: 'r3', type: 'Twin Sharing', hotel: 'Premium Resort Jibhi', pricePerPerson: 2500, image: 'https://images.unsplash.com/photo-1522771731474-c94bfaf80c7d?w=400&q=80', description: 'Luxury twin sharing.' }
        ]);
      }
      setIsLoading(false);
    }
    fetchRooms();
  }, [data.departureId, journey]);

  const selectRoom = (roomId: string, priceModifier: number) => {
    updateData((prev: any) => ({
      ...prev,
      selectedRooms: [roomId],
      totalAmount: prev.baseAmount + (priceModifier * prev.travellers.length)
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

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrev}>Back to Transport</Button>
        <Button 
          onClick={onNext} 
          disabled={data.selectedRooms.length === 0}
          className="bg-primary hover:bg-primary/90"
        >
          Continue to Add-ons
        </Button>
      </div>
    </div>
  );
}
