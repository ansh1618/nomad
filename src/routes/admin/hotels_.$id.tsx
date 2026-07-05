import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Save, Plus, Trash2, BedDouble } from "lucide-react";

export const Route = createFileRoute("/admin/hotels_/$id")({
  component: HotelFormPage,
});

function HotelFormPage() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [destinations, setDestinations] = useState<any[]>([]);

  // Form states
  const [name, setName] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [location, setLocation] = useState("");
  const [rating, setRating] = useState("");
  const [gallery, setGallery] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  // Helper helper states
  const [newImage, setNewImage] = useState("");
  const [newAmenity, setNewAmenity] = useState("");

  const fetchDropdowns = async () => {
    try {
      const { data, error } = await supabase.from("destinations").select("id, name");
      if (error) throw error;
      setDestinations(data || []);
    } catch (err: any) {
      console.error(err.message);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  // Fetch hotel and rooms by ID
  useEffect(() => {
    if (!isNew) {
      const loadHotel = async () => {
        setLoading(true);
        try {
          const { data: hotel, error: hotelErr } = await supabase
            .from("hotels")
            .select("*")
            .eq("id", id)
            .single();

          if (hotelErr) throw hotelErr;
          if (hotel) {
            setName(hotel.name || "");
            setDestinationId(hotel.destination_id || "");
            setLocation(hotel.location || "");
            setRating(hotel.rating?.toString() || "");
            setGallery(hotel.gallery || []);
            setAmenities(hotel.amenities || []);
          }

          // Fetch rooms
          const { data: hotelRooms, error: roomsErr } = await supabase
            .from("hotel_rooms")
            .select("*")
            .eq("hotel_id", id);

          if (roomsErr) throw roomsErr;
          setRooms(hotelRooms || []);
        } catch (err: any) {
          toast.error(err.message || "Failed to load hotel details");
        } finally {
          setLoading(false);
        }
      };
      loadHotel();
    }
  }, [id, isNew]);

  const handleAddRoomType = () => {
    setRooms([
      ...rooms,
      { room_type: "", capacity: 2, amenities: [] }
    ]);
  };

  const handleRoomChange = (index: number, field: string, value: any) => {
    setRooms(rooms.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const handleRemoveRoomType = (index: number) => {
    setRooms(rooms.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const hotelPayload = {
        name,
        destination_id: destinationId || null,
        location,
        rating: rating ? parseFloat(rating) : null,
        gallery,
        amenities,
      };

      let hotelId = id;

      // 1. Save / Update Hotel Stay
      if (isNew) {
        const { data, error } = await supabase
          .from("hotels")
          .insert([hotelPayload])
          .select("id")
          .single();

        if (error) throw error;
        hotelId = data.id;
      } else {
        const { error } = await supabase
          .from("hotels")
          .update(hotelPayload)
          .eq("id", id);

        if (error) throw error;
      }

      // 2. Save Room Types (hotel_rooms)
      // Delete old ones first (simpler for mock/sync schema)
      if (!isNew) {
        await supabase.from("hotel_rooms").delete().eq("hotel_id", hotelId);
      }

      if (rooms.length > 0) {
        const roomsToInsert = rooms.map(r => ({
          hotel_id: hotelId,
          room_type: r.room_type,
          capacity: parseInt(r.capacity),
          amenities: r.amenities || [],
        }));

        const { error: roomsErr } = await supabase.from("hotel_rooms").insert(roomsToInsert);
        if (roomsErr) throw roomsErr;
      }

      toast.success("Hotel configured successfully");
      navigate({ to: "/admin/hotels" });
    } catch (err: any) {
      toast.error(err.message || "Failed to save hotel");
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
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/admin/hotels" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-poppins text-foreground">
            {isNew ? "Add Hotel Stay" : `Edit ${name}`}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="bg-muted border border-border w-full justify-start overflow-x-auto rounded-xl">
            <TabsTrigger value="general">Stay Details</TabsTrigger>
            <TabsTrigger value="rooms">Rooms</TabsTrigger>
            <TabsTrigger value="gallery">Gallery & Amenities</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="bg-white p-6 rounded-xl border border-border mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="hname">Hotel Name</Label>
                <Input id="hname" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Pine Stay Resort" />
              </div>
              <div className="space-y-1">
                <Label>Destination Location</Label>
                <Select value={destinationId} onValueChange={setDestinationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinations.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="loc">Google Map location / Address</Label>
                <Input id="loc" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Near River Bridge, Jibhi" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="rating">Rating (Stars)</Label>
                <Input id="rating" type="number" step="0.1" max="5" min="1" value={rating} onChange={e => setRating(e.target.value)} placeholder="e.g. 4.5" />
              </div>
            </div>
          </TabsContent>

          {/* Rooms List */}
          <TabsContent value="rooms" className="bg-white p-6 rounded-xl border border-border mt-4 space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-sm font-semibold">Available Stay Categories</h3>
              <Button type="button" variant="outline" size="sm" onClick={handleAddRoomType} className="gap-1 text-xs">
                <Plus className="h-3 w-3" /> Add Room Category
              </Button>
            </div>

            {rooms.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-4">No room categories created yet. Click Add Category.</p>
            ) : (
              <div className="space-y-4">
                {rooms.map((room, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg bg-muted/15 space-y-3 relative">
                    <button
                      type="button"
                      onClick={() => handleRemoveRoomType(index)}
                      className="absolute top-2 right-2 text-destructive hover:bg-destructive/10 p-1.5 rounded-md"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>Room Category</Label>
                        <Input value={room.room_type} onChange={e => handleRoomChange(index, "room_type", e.target.value)} required placeholder="e.g. Deluxe Suite / Quad Sharing" />
                      </div>
                      <div className="space-y-1">
                        <Label>Bed Capacity (Heads)</Label>
                        <Input type="number" value={room.capacity} onChange={e => handleRoomChange(index, "capacity", e.target.value)} required placeholder="2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Gallery and Amenities */}
          <TabsContent value="gallery" className="bg-white p-6 rounded-xl border border-border mt-4 space-y-6">
            <div className="space-y-3">
              <Label>Gallery Images</Label>
              <div className="flex gap-2">
                <Input value={newImage} onChange={e => setNewImage(e.target.value)} placeholder="Add image URL..." />
                <Button type="button" onClick={() => { if (newImage) { setGallery([...gallery, newImage]); setNewImage(""); } }}>Add</Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                {gallery.map((img, index) => (
                  <div key={index} className="relative group rounded-lg overflow-hidden border border-border h-24">
                    <img src={img} className="w-full h-full object-cover" alt="" />
                    <button
                      type="button"
                      onClick={() => setGallery(gallery.filter((_, i) => i !== index))}
                      className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <Label>Amenities</Label>
              <div className="flex gap-2">
                <Input value={newAmenity} onChange={e => setNewAmenity(e.target.value)} placeholder="Add amenity (e.g. Free Wi-Fi, Geyser)..." />
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
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 px-8 gap-2">
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="h-4 w-4" /> Save Stay Stay</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
