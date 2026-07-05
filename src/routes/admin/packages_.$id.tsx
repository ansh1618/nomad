import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Plus, Trash2, Save, MoveUp, MoveDown } from "lucide-react";

export const Route = createFileRoute("/admin/packages_/$id")({
  component: PackageFormPage,
});

function PackageFormPage() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [destinations, setDestinations] = useState<any[]>([]);

  // Form states
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [distance, setDistance] = useState("");
  const [bestSeason, setBestSeason] = useState("");
  const [groupSize, setGroupSize] = useState("");
  const [pickupPoint, setPickupPoint] = useState("");
  const [dropPoint, setDropPoint] = useState("");
  const [overview, setOverview] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  // Arrays
  const [highlights, setHighlights] = useState<string[]>([]);
  const [inclusions, setInclusions] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [packingList, setPackingList] = useState<string[]>([]);
  const [gallery, setGallery] = useState<string[]>([]);
  const [itinerary, setItinerary] = useState<any[]>([]);

  // Helpers
  const [newHighlight, setNewHighlight] = useState("");
  const [newInclusion, setNewInclusion] = useState("");
  const [newExclusion, setNewExclusion] = useState("");
  const [newPacking, setNewPacking] = useState("");
  const [newMedia, setNewMedia] = useState("");

  // Load dropdown destinations
  const loadDestinations = async () => {
    try {
      const { data, error } = await supabase.from("destinations").select("id, name");
      if (error) throw error;
      setDestinations(data || []);
    } catch (err: any) {
      console.error(err.message);
    }
  };

  useEffect(() => {
    loadDestinations();
  }, []);

  // Load existing package
  useEffect(() => {
    if (!isNew) {
      const loadPackage = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from("journeys")
            .select("*")
            .eq("id", id)
            .single();

          if (error) throw error;
          if (data) {
            setName(data.name || "");
            setSlug(data.slug || "");
            setDestinationId(data.destination_id || "");
            setDuration(data.duration || "");
            setPrice(data.price?.toString() || "");
            setDifficulty(data.difficulty || "");
            setDistance(data.distance || "");
            setBestSeason(data.best_season || "");
            setGroupSize(data.group_size || "");
            setPickupPoint(data.pickup_point || "");
            setDropPoint(data.drop_point || "");
            setOverview(data.description || "");
            setIsPublished(data.is_published ?? true);

            setHighlights(data.highlights || []);
            setInclusions(data.inclusions || []);
            setExclusions(data.exclusions || []);
            setPackingList(data.packing_list || []);
            setGallery(data.gallery || []);
            setItinerary(data.itinerary || []);
          }
        } catch (err: any) {
          toast.error(err.message || "Failed to load package");
        } finally {
          setLoading(false);
        }
      };
      loadPackage();
    }
  }, [id, isNew]);

  // Itinerary methods
  const handleAddItineraryDay = () => {
    const nextDay = itinerary.length + 1;
    setItinerary([
      ...itinerary,
      { day: nextDay, title: `Day ${nextDay} Plan`, desc: "", stay: "", meals: { breakfast: true, lunch: false, dinner: true } }
    ]);
  };

  const handleItineraryChange = (index: number, field: string, value: any) => {
    setItinerary(itinerary.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleItineraryMealToggle = (index: number, meal: string) => {
    setItinerary(itinerary.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          meals: {
            ...item.meals,
            [meal]: !item.meals?.[meal]
          }
        };
      }
      return item;
    }));
  };

  const moveDay = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === itinerary.length - 1) return;

    const newIdx = direction === "up" ? index - 1 : index + 1;
    const items = [...itinerary];
    const temp = items[index];
    items[index] = items[newIdx];
    items[newIdx] = temp;

    // Recalculate day numbers
    const updated = items.map((item, i) => ({ ...item, day: i + 1 }));
    setItinerary(updated);
  };

  const handleRemoveItineraryDay = (index: number) => {
    const filtered = itinerary.filter((_, i) => i !== index);
    const updated = filtered.map((item, i) => ({ ...item, day: i + 1 }));
    setItinerary(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationId) {
      toast.error("Please select a destination");
      return;
    }
    setSaving(true);

    const payload = {
      name,
      slug: slug.toLowerCase().replace(/\s+/g, "-"),
      destination_id: destinationId,
      duration,
      price: price ? parseFloat(price) : 0,
      difficulty,
      distance,
      best_season: bestSeason,
      group_size: groupSize,
      pickup_point: pickupPoint,
      drop_point: dropPoint,
      description: overview,
      is_published: isPublished,
      highlights,
      inclusions,
      exclusions,
      packing_list: packingList,
      gallery,
      itinerary,
    };

    try {
      if (isNew) {
        const { error } = await supabase.from("journeys").insert([payload]);
        if (error) throw error;
        toast.success("Package created successfully");
      } else {
        const { error } = await supabase.from("journeys").update(payload).eq("id", id);
        if (error) throw error;
        toast.success("Package updated successfully");
      }
      navigate({ to: "/admin/packages" });
    } catch (err: any) {
      toast.error(err.message || "Failed to save package");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading package details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/admin/packages" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-poppins text-foreground">
            {isNew ? "Create Package" : `Edit ${name}`}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="bg-muted border border-border w-full justify-start overflow-x-auto rounded-xl">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="media">Gallery</TabsTrigger>
            <TabsTrigger value="itinerary">Itinerary Builder</TabsTrigger>
            <TabsTrigger value="inclusions">Inclusions & More</TabsTrigger>
          </TabsList>

          {/* General Section */}
          <TabsContent value="general" className="bg-white p-6 rounded-xl border border-border mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="name">Package Name</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Jibhi Backpacking" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" value={slug} onChange={e => setSlug(e.target.value)} required placeholder="e.g. jibhi-backpacking" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Destination</Label>
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
              <div className="space-y-1">
                <Label htmlFor="duration">Duration</Label>
                <Input id="duration" value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 3 Days / 2 Nights" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="price">Base Price (INR)</Label>
                <Input id="price" type="number" value={price} onChange={e => setPrice(e.target.value)} required placeholder="8999" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Input id="difficulty" value={difficulty} onChange={e => setDifficulty(e.target.value)} placeholder="e.g. Easy to Moderate" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="distance">Distance</Label>
                <Input id="distance" value={distance} onChange={e => setDistance(e.target.value)} placeholder="e.g. 450 km" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="season">Best Season</Label>
                <Input id="season" value={bestSeason} onChange={e => setBestSeason(e.target.value)} placeholder="e.g. March to June" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="size">Group Size</Label>
                <Input id="size" value={groupSize} onChange={e => setGroupSize(e.target.value)} placeholder="e.g. 12 - 18 Explorers" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="pickup">Pickup Point</Label>
                <Input id="pickup" value={pickupPoint} onChange={e => setPickupPoint(e.target.value)} placeholder="e.g. Majnu ka Tilla, Delhi" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="drop">Drop Point</Label>
                <Input id="drop" value={dropPoint} onChange={e => setDropPoint(e.target.value)} placeholder="e.g. Majnu ka Tilla, Delhi" />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="overview">Trip Overview</Label>
              <Textarea id="overview" rows={4} value={overview} onChange={e => setOverview(e.target.value)} placeholder="Describe the trip..." />
            </div>

            <div className="flex items-center space-x-2 pt-4">
              <Switch id="is-published" checked={isPublished} onCheckedChange={setIsPublished} />
              <Label htmlFor="is-published">Publish package immediately</Label>
            </div>
          </TabsContent>

          {/* Media Section */}
          <TabsContent value="media" className="bg-white p-6 rounded-xl border border-border mt-4 space-y-4">
            <div className="flex gap-2">
              <Input
                value={newMedia}
                onChange={e => setNewMedia(e.target.value)}
                placeholder="Enter image URL"
              />
              <Button
                type="button"
                onClick={() => {
                  if (newMedia) {
                    setGallery([...gallery, newMedia]);
                    setNewMedia("");
                  }
                }}
              >
                Add
              </Button>
            </div>
            {gallery.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No gallery images added yet.</p>
            ) : (
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
            )}
          </TabsContent>

          {/* Itinerary Section */}
          <TabsContent value="itinerary" className="bg-white p-6 rounded-xl border border-border mt-4 space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-sm font-semibold">Itinerary Days</h3>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItineraryDay} className="gap-1 text-xs">
                <Plus className="h-3 w-3" /> Add Day
              </Button>
            </div>

            {itinerary.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-4">No itinerary days added yet.</p>
            ) : (
              <div className="space-y-4">
                {itinerary.map((item, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg bg-muted/15 space-y-4 relative">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">Day {item.day}</span>
                      <div className="flex items-center gap-1">
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveDay(index, "up")}>
                          <MoveUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveDay(index, "down")}>
                          <MoveDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveItineraryDay(index)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>Day Title</Label>
                        <Input value={item.title} onChange={e => handleItineraryChange(index, "title", e.target.value)} required placeholder="e.g. Arrival & Local Walk" />
                      </div>
                      <div className="space-y-1">
                        <Label>Stay / Hotel Name</Label>
                        <Input value={item.stay} onChange={e => handleItineraryChange(index, "stay", e.target.value)} placeholder="e.g. Forest Stay Resort" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label>Description</Label>
                      <Textarea value={item.desc} onChange={e => handleItineraryChange(index, "desc", e.target.value)} required placeholder="Detailed activity description..." />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Meals Included</Label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm font-medium">
                          <input type="checkbox" checked={item.meals?.breakfast ?? false} onChange={() => handleItineraryMealToggle(index, "breakfast")} className="rounded text-primary focus:ring-primary/20" />
                          Breakfast
                        </label>
                        <label className="flex items-center gap-2 text-sm font-medium">
                          <input type="checkbox" checked={item.meals?.lunch ?? false} onChange={() => handleItineraryMealToggle(index, "lunch")} className="rounded text-primary focus:ring-primary/20" />
                          Lunch
                        </label>
                        <label className="flex items-center gap-2 text-sm font-medium">
                          <input type="checkbox" checked={item.meals?.dinner ?? false} onChange={() => handleItineraryMealToggle(index, "dinner")} className="rounded text-primary focus:ring-primary/20" />
                          Dinner
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Inclusions & Highlights Section */}
          <TabsContent value="inclusions" className="bg-white p-6 rounded-xl border border-border mt-4 space-y-6">
            
            {/* Highlights */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Highlights</h3>
              <div className="flex gap-2">
                <Input value={newHighlight} onChange={e => setNewHighlight(e.target.value)} placeholder="Add highlight..." />
                <Button type="button" onClick={() => { if (newHighlight) { setHighlights([...highlights, newHighlight]); setNewHighlight(""); } }}>Add</Button>
              </div>
              <ul className="space-y-2">
                {highlights.map((h, i) => (
                  <li key={i} className="flex justify-between items-center text-sm bg-muted/20 p-2 rounded border border-border">
                    <span>{h}</span>
                    <button type="button" onClick={() => setHighlights(highlights.filter((_, idx) => idx !== i))} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Inclusions */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Inclusions</h3>
              <div className="flex gap-2">
                <Input value={newInclusion} onChange={e => setNewInclusion(e.target.value)} placeholder="Add inclusion..." />
                <Button type="button" onClick={() => { if (newInclusion) { setInclusions([...inclusions, newInclusion]); setNewInclusion(""); } }}>Add</Button>
              </div>
              <ul className="space-y-2">
                {inclusions.map((item, i) => (
                  <li key={i} className="flex justify-between items-center text-sm bg-muted/20 p-2 rounded border border-border">
                    <span>{item}</span>
                    <button type="button" onClick={() => setInclusions(inclusions.filter((_, idx) => idx !== i))} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Exclusions */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Exclusions</h3>
              <div className="flex gap-2">
                <Input value={newExclusion} onChange={e => setNewExclusion(e.target.value)} placeholder="Add exclusion..." />
                <Button type="button" onClick={() => { if (newExclusion) { setExclusions([...exclusions, newExclusion]); setNewExclusion(""); } }}>Add</Button>
              </div>
              <ul className="space-y-2">
                {exclusions.map((item, i) => (
                  <li key={i} className="flex justify-between items-center text-sm bg-muted/20 p-2 rounded border border-border">
                    <span>{item}</span>
                    <button type="button" onClick={() => setExclusions(exclusions.filter((_, idx) => idx !== i))} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Packing List */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Packing List Recommendations</h3>
              <div className="flex gap-2">
                <Input value={newPacking} onChange={e => setNewPacking(e.target.value)} placeholder="Add item..." />
                <Button type="button" onClick={() => { if (newPacking) { setPackingList([...packingList, newPacking]); setNewPacking(""); } }}>Add</Button>
              </div>
              <ul className="space-y-2">
                {packingList.map((item, i) => (
                  <li key={i} className="flex justify-between items-center text-sm bg-muted/20 p-2 rounded border border-border">
                    <span>{item}</span>
                    <button type="button" onClick={() => setPackingList(packingList.filter((_, idx) => idx !== i))} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 px-8 gap-2">
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="h-4 w-4" /> Save Package</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
