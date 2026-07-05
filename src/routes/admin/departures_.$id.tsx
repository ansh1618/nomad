import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Save, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/departures_/$id")({
  component: DepartureFormPage,
});

function DepartureFormPage() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Dropdown list states
  const [journeys, setJourneys] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [captains, setCaptains] = useState<any[]>([]);

  // Form states
  const [journeyId, setJourneyId] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [captainId, setCaptainId] = useState("");
  const [busId, setBusId] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropLocation, setDropLocation] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [notes, setNotes] = useState("");

  // Dynamic Pricing Tiers
  const [pricingTiers, setPricingTiers] = useState<any[]>([]);

  // Fetch dropdown arrays
  const fetchDropdowns = async () => {
    try {
      const [journeysRes, busesRes, captainsRes] = await Promise.all([
        supabase.from("journeys").select("id, name"),
        supabase.from("buses").select("id, name, total_seats"),
        supabase.from("admins").select("id, email").eq("role", "TRIP_MANAGER")
      ]);

      setJourneys(journeysRes.data || []);
      setBuses(busesRes.data || []);
      setCaptains(captainsRes.data || []);
    } catch (err: any) {
      console.error(err.message);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  // Fetch departure by ID
  useEffect(() => {
    if (!isNew) {
      const loadDeparture = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from("departures")
            .select("*")
            .eq("id", id)
            .single();

          if (error) throw error;
          if (data) {
            setJourneyId(data.journey_id || "");
            setDepartureDate(data.departure_date || "");
            setReturnDate(data.return_date || "");
            setBasePrice(data.base_price?.toString() || "");
            setCaptainId(data.trip_captain_id || "");
            setIsPublished(data.is_published ?? false);
            setPickupLocation(data.pickup_location || "");
            setDropLocation(data.drop_location || "");
            setNotes(data.notes || "");

            // Fetch linked transport to get the bus_id
            const { data: transportData } = await supabase
              .from("departure_transport")
              .select("bus_id")
              .eq("departure_id", id)
              .single();

            if (transportData) {
              setBusId(transportData.bus_id || "");
            }

            // Fetch pricing tiers
            const { data: tiers } = await supabase
              .from("pricing_tiers")
              .select("*")
              .eq("departure_id", id)
              .order("display_order");

            setPricingTiers(tiers || []);
          }
        } catch (err: any) {
          toast.error(err.message || "Failed to load departure details");
        } finally {
          setLoading(false);
        }
      };
      loadDeparture();
    }
  }, [id, isNew]);

  const handleAddTier = () => {
    setPricingTiers([
      ...pricingTiers,
      { tier_name: "", price: "", seats_threshold: "" }
    ]);
  };

  const handleTierChange = (index: number, field: string, value: any) => {
    setPricingTiers(pricingTiers.map((t, i) => i === index ? { ...t, [field]: value } : t));
  };

  const handleRemoveTier = (index: number) => {
    setPricingTiers(pricingTiers.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journeyId) {
      toast.error("Please select a Journey Package");
      return;
    }
    setSaving(true);

    try {
      const departurePayload = {
        journey_id: journeyId,
        departure_date: departureDate,
        return_date: returnDate,
        base_price: parseFloat(basePrice),
        trip_captain_id: captainId || null,
        is_published: isPublished,
        pickup_location: pickupLocation,
        drop_location: dropLocation,
        notes,
      };

      let departureId = id;

      // 1. Save or Update Departure
      if (isNew) {
        const { data, error } = await supabase
          .from("departures")
          .insert([departurePayload])
          .select("id")
          .single();

        if (error) throw error;
        departureId = data.id;
      } else {
        const { error } = await supabase
          .from("departures")
          .update(departurePayload)
          .eq("id", id);

        if (error) throw error;
      }

      // 2. Save Bus Assignment (departure_transport)
      if (busId) {
        // Upsert transport details
        const transportPayload = {
          departure_id: departureId,
          bus_id: busId,
        };

        const { error: transportErr } = await supabase
          .from("departure_transport")
          .upsert([transportPayload], { onConflict: "departure_id" });

        if (transportErr) throw transportErr;
      }

      // 3. Save Dynamic Pricing Tiers
      // Delete old ones first
      if (!isNew) {
        await supabase.from("pricing_tiers").delete().eq("departure_id", departureId);
      }

      if (pricingTiers.length > 0) {
        const tiersToInsert = pricingTiers.map((t, idx) => ({
          departure_id: departureId,
          tier_name: t.tier_name,
          price: parseFloat(t.price),
          seats_threshold: t.seats_threshold ? parseInt(t.seats_threshold) : null,
          display_order: idx,
        }));

        const { error: tierErr } = await supabase.from("pricing_tiers").insert(tiersToInsert);
        if (tierErr) throw tierErr;
      }

      toast.success("Departure configured successfully");
      navigate({ to: "/admin/departures" });
    } catch (err: any) {
      toast.error(err.message || "Failed to save departure date");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/admin/departures" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-poppins text-foreground">
            {isNew ? "Add Departure Date" : "Configure Departure"}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="bg-muted border border-border w-full justify-start overflow-x-auto rounded-xl">
            <TabsTrigger value="general">Date & Assignments</TabsTrigger>
            <TabsTrigger value="pricing">Dynamic Pricing</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="bg-white p-6 rounded-xl border border-border mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Journey Package</Label>
                <Select value={journeyId} onValueChange={setJourneyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Package" />
                  </SelectTrigger>
                  <SelectContent>
                    {journeys.map(j => (
                      <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="base">Base Price (INR)</Label>
                <Input id="base" type="number" value={basePrice} onChange={e => setBasePrice(e.target.value)} required placeholder="8999" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="dep">Departure Date</Label>
                <Input id="dep" type="date" value={departureDate} onChange={e => setDepartureDate(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ret">Return Date</Label>
                <Input id="ret" type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Assign Bus (Layout & Capacity)</Label>
                <Select value={busId} onValueChange={setBusId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Bus" />
                  </SelectTrigger>
                  <SelectContent>
                    {buses.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name} ({b.total_seats} seats)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Trip Captain</Label>
                <Select value={captainId} onValueChange={setCaptainId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Captain" />
                  </SelectTrigger>
                  <SelectContent>
                    {captains.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="pickup">Departure Pickup Point</Label>
                <Input id="pickup" value={pickupLocation} onChange={e => setPickupLocation(e.target.value)} placeholder="e.g. Kashmiri Gate, 8:00 PM" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="drop">Departure Drop Point</Label>
                <Input id="drop" value={dropLocation} onChange={e => setDropLocation(e.target.value)} placeholder="e.g. Kashmiri Gate, Delhi" />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea id="notes" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Driver contact details, special setup instructions..." />
            </div>

            <div className="flex items-center space-x-2 pt-4">
              <Switch id="is-pub" checked={isPublished} onCheckedChange={setIsPublished} />
              <Label htmlFor="is-pub">Publish this departure date immediately</Label>
            </div>
          </TabsContent>

          {/* Dynamic Pricing Tiers */}
          <TabsContent value="pricing" className="bg-white p-6 rounded-xl border border-border mt-4 space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-semibold">Dynamic Pricing Rules</h3>
                <p className="text-xs text-muted-foreground">Define Early Bird rates or Peak pricing modifiers.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddTier} className="gap-1 text-xs">
                <Plus className="h-3 w-3" /> Add Tier
              </Button>
            </div>

            {pricingTiers.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-4">No dynamic pricing rules configured. Will default to base price.</p>
            ) : (
              <div className="space-y-4">
                {pricingTiers.map((tier, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg bg-muted/15 space-y-3 relative">
                    <button
                      type="button"
                      onClick={() => handleRemoveTier(index)}
                      className="absolute top-2 right-2 text-destructive hover:bg-destructive/10 p-1.5 rounded-md"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label>Tier Name</Label>
                        <Input value={tier.tier_name} onChange={e => handleTierChange(index, "tier_name", e.target.value)} required placeholder="e.g. Early Bird, Last 5 seats" />
                      </div>
                      <div className="space-y-1">
                        <Label>Price (INR)</Label>
                        <Input type="number" value={tier.price} onChange={e => handleTierChange(index, "price", e.target.value)} required placeholder="e.g. 7999" />
                      </div>
                      <div className="space-y-1">
                        <Label>Seats Threshold (Optional)</Label>
                        <Input type="number" value={tier.seats_threshold} onChange={e => handleTierChange(index, "seats_threshold", e.target.value)} placeholder="e.g. first 5 seats" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 px-8 gap-2">
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="h-4 w-4" /> Save Configuration</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
