import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Car, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

export function TransportSelectionStep({ data, updateData, onNext, onPrev }: any) {
  const [seats, setSeats] = useState<Array<{ id: string; status: string; type: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSeats() {
      if (!data.departureId) {
        setIsLoading(false);
        return;
      }

      const { data: inventory, error } = await supabase
        .from("departure_inventory")
        .select("seat_id, status")
        .eq("departure_id", data.departureId)
        .eq("inventory_type", "SEAT");

      if (error) {
        console.error("Error fetching seats:", error);
      }

      if (inventory && inventory.length > 0) {
        const mappedSeats = inventory.map((inv) => ({
          id: inv.seat_id || "",
          status: inv.status,
          type: inv.seat_id?.includes("A") || inv.seat_id?.includes("D") ? "window" : "aisle",
        }));
        
        // Sort by row number and then seat letter
        mappedSeats.sort((a, b) => {
          const aRow = parseInt(a.id);
          const bRow = parseInt(b.id);
          if (aRow !== bRow) return aRow - bRow;
          return a.id.localeCompare(b.id);
        });

        setSeats(mappedSeats);
      } else {
        // Fallback dummy layout if no inventory is set up
        const arr: Array<{ id: string; status: string; type: string }> = [];
        for (let i = 1; i <= 5; i++) {
          arr.push({ id: `${i}A`, status: 'AVAILABLE', type: 'window' });
          arr.push({ id: `${i}B`, status: 'AVAILABLE', type: 'aisle' });
          arr.push({ id: `${i}C`, status: 'AVAILABLE', type: 'aisle' });
          arr.push({ id: `${i}D`, status: 'AVAILABLE', type: 'window' });
        }
        setSeats(arr);
      }
      setIsLoading(false);
    }
    fetchSeats();
  }, [data.departureId]);

  const toggleSeat = (seatId: string, status: string) => {
    if (status !== 'AVAILABLE') return;
    
    updateData((prev: any) => {
      const selected = prev.selectedSeats;
      if (selected.includes(seatId)) {
        return { ...prev, selectedSeats: selected.filter((id: string) => id !== seatId) };
      }
      
      // Limit selection to number of travellers
      if (selected.length >= prev.travellers.length) {
        return prev;
      }
      
      return { ...prev, selectedSeats: [...selected, seatId] };
    });
  };

  const selectedCount = data.selectedSeats.length;
  const totalTravellers = data.travellers.length;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-display font-bold text-primary">Transport & Seats</h2>
        <p className="text-sm text-muted-foreground mt-1">Select your preferred seats for the journey.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Seat Map */}
        <div className="lg:col-span-7 bg-white border border-border p-8 rounded-3xl shadow-soft flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-8 border-b border-border pb-4">
            <div className="flex items-center gap-2 text-primary font-poppins font-semibold">
              <Car className="h-5 w-5 text-accent" /> Front
            </div>
            <div className="text-xs text-muted-foreground">Driver</div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-accent" />
              <p>Loading real-time seat map...</p>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-y-4 gap-x-2 w-full max-w-sm">
              {seats.map((seat, index) => {
                const isSelected = data.selectedSeats.includes(seat.id);
                const isBooked = seat.status === 'BOOKED' || seat.status === 'LOCKED';
                
                return (
                  <div key={seat.id} className={cn("flex justify-center", (index % 4 === 1) && "mr-8")}>
                    <button
                      disabled={isBooked}
                      onClick={() => toggleSeat(seat.id, seat.status)}
                      className={cn(
                        "w-12 h-14 rounded-t-xl rounded-b-md border-2 flex items-center justify-center text-xs font-bold transition-all relative overflow-hidden",
                        isBooked ? "bg-muted border-muted text-muted-foreground/30 cursor-not-allowed" :
                        isSelected ? "bg-accent border-accent text-white shadow-md transform scale-105" :
                        "bg-white border-border text-foreground hover:border-accent/50 hover:bg-accent/5"
                      )}
                    >
                      {seat.id}
                      {isSelected && <div className="absolute bottom-1 w-4 h-1 bg-white/40 rounded-full" />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="w-full flex justify-center gap-6 mt-10 pt-6 border-t border-border text-xs">
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border-2 border-border bg-white" /> Available</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border-2 border-accent bg-accent" /> Selected</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded border-2 border-muted bg-muted" /> Booked</div>
          </div>
        </div>

        {/* Instructions */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl flex gap-3 text-blue-800">
            <Info className="h-5 w-5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-semibold">Seat Selection</p>
              <p className="text-xs leading-relaxed">
                You have {totalTravellers} traveller(s). Please select exactly {totalTravellers} seat(s).
              </p>
            </div>
          </div>

          <div className="bg-white border border-border p-6 rounded-2xl shadow-soft">
            <h4 className="font-poppins font-bold text-sm mb-4 border-b border-border pb-2">Your Seats</h4>
            {data.selectedSeats.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No seats selected yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.selectedSeats.map((id: string) => (
                  <span key={id} className="px-3 py-1 bg-accent/10 text-accent font-bold text-sm rounded-lg">
                    {id}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrev}>Back to Travellers</Button>
        <Button 
          onClick={onNext} 
          disabled={selectedCount !== totalTravellers}
          className="bg-primary hover:bg-primary/90"
        >
          Continue to Accommodation
        </Button>
      </div>
    </div>
  );
}
