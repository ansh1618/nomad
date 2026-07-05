import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Save } from "lucide-react";

export const Route = createFileRoute("/admin/buses_/$id")({
  component: BusFormPage,
});

function BusFormPage() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [totalSeats, setTotalSeats] = useState("");
  const [layoutType, setLayoutType] = useState("2X2");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [newAmenity, setNewAmenity] = useState("");

  // Load existing vehicle details
  useEffect(() => {
    if (!isNew) {
      const loadBus = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from("buses")
            .select("*")
            .eq("id", id)
            .single();

          if (error) throw error;
          if (data) {
            setName(data.name || "");
            setRegistrationNumber(data.registration_number || "");
            setTotalSeats(data.total_seats?.toString() || "");
            setLayoutType(data.layout_type || "2X2");
            setAmenities(data.amenities || []);
          }
        } catch (err: any) {
          toast.error(err.message || "Failed to load vehicle configuration");
        } finally {
          setLoading(false);
        }
      };
      loadBus();
    }
  }, [id, isNew]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name,
      registration_number: registrationNumber,
      total_seats: parseInt(totalSeats),
      layout_type: layoutType,
      amenities,
    };

    try {
      let busId = id;

      if (isNew) {
        const { data, error } = await supabase
          .from("buses")
          .insert([payload])
          .select("id")
          .single();

        if (error) throw error;
        busId = data.id;
      } else {
        const { error } = await supabase
          .from("buses")
          .update(payload)
          .eq("id", id);

        if (error) throw error;
      }

      // Generate visual seats dynamically in schema context
      // Delete old seats first
      if (!isNew) {
        await supabase.from("bus_seats").delete().eq("bus_id", busId);
      }

      const seatsToInsert: any[] = [];
      const cols = ["A", "B", "C", "D"];
      const rowsCount = Math.ceil(parseInt(totalSeats) / cols.length);

      let seatIndex = 0;
      for (let r = 1; r <= rowsCount; r++) {
        for (let c = 0; c < cols.length; c++) {
          if (seatIndex >= parseInt(totalSeats)) break;
          seatsToInsert.push({
            bus_id: busId,
            seat_number: `${r}${cols[c]}`,
            is_sleeper: false,
          });
          seatIndex++;
        }
      }

      const { error: seatsErr } = await supabase.from("bus_seats").insert(seatsToInsert);
      if (seatsErr) throw seatsErr;

      toast.success("Vehicle and Seat Layout initialized successfully");
      navigate({ to: "/admin/buses" });
    } catch (err: any) {
      toast.error(err.message || "Failed to configure vehicle");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading stays...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/admin/buses" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-poppins text-foreground">
            {isNew ? "Configure New Vehicle" : `Edit ${name}`}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl bg-white p-6 rounded-xl border border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="vname">Vehicle Name / Label</Label>
            <Input id="vname" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Tempo Traveller Elite" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="plate">Number Plate / Reg No</Label>
            <Input id="plate" value={registrationNumber} onChange={e => setRegistrationNumber(e.target.value)} placeholder="e.g. DL-1CA-1234" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="seats">Total seats Capacity</Label>
            <Input id="seats" type="number" value={totalSeats} onChange={e => setTotalSeats(e.target.value)} required placeholder="e.g. 12 or 20" />
          </div>
          <div className="space-y-1">
            <Label>Layout Type</Label>
            <Select value={layoutType} onValueChange={setLayoutType}>
              <SelectTrigger>
                <SelectValue placeholder="Layout Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2X2">2x2 Standard (Tempo/Bus)</SelectItem>
                <SelectItem value="1X2">1x2 Executive</SelectItem>
                <SelectItem value="SLEEPER">Sleeper Coach</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-border">
          <Label>Amenities Available</Label>
          <div className="flex gap-2">
            <Input value={newAmenity} onChange={e => setNewAmenity(e.target.value)} placeholder="e.g. Pushback Seats, AC, Charging Point..." />
            <Button type="button" onClick={() => { if (newAmenity) { setAmenities([...amenities, newAmenity]); setNewAmenity(""); } }}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {amenities.map((item, index) => (
              <span key={index} className="flex items-center gap-1 px-3 py-1 bg-muted rounded-full text-xs font-medium border border-border">
                {item}
                <button type="button" onClick={() => setAmenities(amenities.filter((_, i) => i !== index))} className="text-destructive font-bold ml-1">×</button>
              </span>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 px-8 gap-2">
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="h-4 w-4" /> Save Vehicle Configuration</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
