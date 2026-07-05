import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/site/AuthContext";
import { triggerNomadikAuth } from "@/components/site/AuthModal";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingUI } from "@/components/site/FloatingUI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { 
  User, Calendar, MapPin, Phone, Heart, Users, ShieldAlert, LogOut, Lock, 
  ChevronRight, Compass, MessageCircle, HelpCircle, FileText, CheckCircle2 
} from "lucide-react";
import { getJourneys } from "@/lib/queries-client";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Account & Bookings | Nomadik" },
      { name: "description", content: "Manage your Nomadik user profile, track upcoming road trips, join convoy WhatsApp groups, and access support." },
    ],
  }),
  component: AccountDashboard,
});

type ActiveTab = "profile" | "bookings" | "wishlist" | "travelers" | "support" | "settings";

function AccountDashboard() {
  const { user, profile, refreshProfile, signOut, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("bookings");
  const navigate = useNavigate();

  // Profile Edit fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [city, setCity] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Travelers logic
  const [travelers, setTravelers] = useState<any[]>([]);
  const [tName, setTName] = useState("");
  const [tAge, setTAge] = useState("");
  const [tGender, setTGender] = useState("");
  const [tIdProof, setTIdProof] = useState("");
  const [tPhone, setTPhone] = useState("");
  const [addingTraveler, setAddingTraveler] = useState(false);

  // Bookings & Wishlist
  const [bookings, setBookings] = useState<any[]>([]);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [allJourneys, setAllJourneys] = useState<any[]>([]);

  // Load user data
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setGender(profile.gender || "");
      setDob(profile.dob || "");
      setCity(profile.city || "");
      setEmergencyContact(profile.emergency_contact || "");
      loadTravelers();
      loadBookings();
      loadWishlist();
    }
  }, [profile]);

  useEffect(() => {
    getJourneys().then(setAllJourneys).catch(console.error);
  }, []);

  const loadTravelers = async () => {
    if (!user) return;
    const { data } = await supabase.from("travellers").select("*").eq("user_id", user.id);
    if (data) setTravelers(data);
  };

  const loadBookings = async () => {
    if (!user) return;
    const { data } = await supabase.from("bookings").select("*").eq("user_id", user.id);
    if (data) setBookings(data);
  };

  const loadWishlist = async () => {
    if (!user) return;
    const { data } = await supabase.from("wishlist").select("*").eq("user_id", user.id);
    if (data) setWishlistItems(data);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({
          full_name: fullName,
          phone,
          gender,
          dob: dob || null,
          city,
          emergency_contact: emergencyContact,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profile updated successfully!");
      refreshProfile();
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddTraveler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!tName || !tAge || !tGender) {
      toast.error("Please fill in required fields.");
      return;
    }

    setAddingTraveler(true);
    try {
      const { error } = await supabase.from("travellers").insert([
        {
          user_id: user.id,
          name: tName,
          age: parseInt(tAge),
          gender: tGender,
          id_proof: tIdProof || null,
          phone: tPhone || null
        }
      ]);
      if (error) throw error;

      toast.success("Traveler saved!");
      setTName("");
      setTAge("");
      setTGender("");
      setTIdProof("");
      setTPhone("");
      loadTravelers();
    } catch (err: any) {
      toast.error(err.message || "Failed to save traveler.");
    } finally {
      setAddingTraveler(false);
    }
  };

  const handleDeleteTraveler = async (id: string) => {
    const { error } = await supabase.from("travellers").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete traveler.");
    } else {
      toast.success("Traveler removed.");
      loadTravelers();
    }
  };

  const handleRemoveWishlist = async (id: string) => {
    const { error } = await supabase.from("wishlist").delete().eq("id", id);
    if (error) {
      toast.error("Failed to remove item.");
    } else {
      toast.success("Removed from wishlist.");
      loadWishlist();
    }
  };

  // If loading session
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Compass className="h-10 w-10 text-gold animate-spin-slow" />
      </div>
    );
  }

  // Not logged in Lock Screen
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-between">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-5 py-32">
          <div className="max-w-md w-full bg-card border border-border rounded-3xl p-8 shadow-elegant text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
              <Lock className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-bold text-primary">Explorer Dashboard Lock</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Log in to check your upcoming convoy details, view travel history, download invoices, or message your Captain.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={() => triggerNomadikAuth({ mode: "login" })} variant="hero" className="w-full h-11">
                Log In Now
              </Button>
              <Link to="/" className="text-xs text-accent font-semibold hover:underline block">
                Go back to Homepage
              </Link>
            </div>
          </div>
        </main>
        <Footer />
        <FloatingUI />
      </div>
    );
  }

  // Helper groupings
  const upcomingBookings = bookings.filter(b => b.booking_status === "PENDING" || b.booking_status === "CONFIRMED");
  const pastBookings = bookings.filter(b => b.booking_status === "COMPLETED");

  return (
    <div className="bg-background min-h-screen flex flex-col justify-between">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-5 pt-28 pb-20 font-sans text-foreground">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Sidebar Navigation */}
          <aside className="lg:col-span-3 bg-white border border-border p-6 rounded-3xl shadow-soft space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gold-gradient flex items-center justify-center font-bold text-gold-foreground font-poppins text-lg shadow-sm">
                {profile?.full_name?.slice(0, 2).toUpperCase() || "N"}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-base text-primary truncate">
                  {profile?.full_name || "Nomadik Explorer"}
                </h3>
                <p className="text-[10px] text-muted-foreground truncate">{profile?.email}</p>
              </div>
            </div>

            <nav className="flex flex-col gap-1.5 pt-4 border-t border-border">
              {[
                { id: "bookings", label: "My Bookings", icon: Calendar },
                { id: "profile", label: "Profile Information", icon: User },
                { id: "wishlist", label: "Wishlist", icon: Heart },
                { id: "travelers", label: "Saved Travelers", icon: Users },
                { id: "support", label: "Support & Help", icon: HelpCircle },
                { id: "settings", label: "Settings", icon: Lock }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as ActiveTab)}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-poppins font-semibold transition-all ${
                      activeTab === tab.id
                        ? "bg-secondary text-white shadow-soft"
                        : "text-muted-foreground hover:bg-secondary/10 hover:text-primary"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4" /> {tab.label}
                    </span>
                    <ChevronRight className="h-3 w-3 opacity-60" />
                  </button>
                );
              })}
              <button
                onClick={() => signOut().then(() => navigate({ to: "/" }))}
                className="flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-poppins font-semibold text-[#E53E3E] hover:bg-red-50 transition-all mt-4"
              >
                <span className="flex items-center gap-2.5">
                  <LogOut className="h-4 w-4" /> Log Out
                </span>
              </button>
            </nav>
          </aside>

          {/* Right Dashboard Area */}
          <section className="lg:col-span-9 bg-white border border-border p-6 md:p-8 rounded-3xl shadow-soft min-h-[60vh]">
            
            {/* BOOKINGS TAB */}
            {activeTab === "bookings" && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-display text-2xl font-bold text-primary">My Bookings</h2>
                  <p className="text-xs text-muted-foreground mt-1">Track details, invoices, and join active convoys.</p>
                </div>

                {/* Upcoming Trips */}
                <div className="space-y-4">
                  <h3 className="text-xs font-poppins font-bold uppercase tracking-wider text-accent border-b border-border pb-2">Upcoming Trips</h3>
                  {upcomingBookings.length === 0 ? (
                    <div className="text-center py-8 bg-muted/20 border border-dashed border-border rounded-2xl">
                      <Calendar className="h-8 w-8 text-muted-foreground/60 mx-auto animate-pulse" />
                      <p className="mt-2 text-xs text-muted-foreground">No upcoming convoys found.</p>
                      <Link to="/" className="mt-3 inline-block text-xs text-accent font-semibold hover:underline">Browse Journeys</Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {upcomingBookings.map((b) => {
                        const journey = allJourneys.find(j => j.id === b.journey_id);
                        return (
                          <div key={b.id} className="border border-border rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-soft transition-all bg-card">
                            <div className="flex justify-between items-start flex-wrap gap-2">
                              <div>
                                <span className="text-[10px] bg-secondary/10 text-secondary font-bold font-poppins px-2 py-0.5 rounded">
                                  ID: {b.booking_id || "NOM-Pending"}
                                </span>
                                <h4 className="font-display font-bold text-lg text-primary mt-1.5">{journey?.name || "Premium Journey"}</h4>
                                <span className="text-xs text-muted-foreground block mt-0.5">Travel Date: {b.travel_date || "To be decided"} · {b.travellers_count} Explorers</span>
                              </div>
                              <div className="flex flex-col items-end gap-1.5">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-poppins ${
                                  b.payment_status === "SUCCESS" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                                }`}>
                                  Payment: {b.payment_status}
                                </span>
                                <span className="text-xs font-bold text-primary">₹{Number(b.final_amount).toLocaleString()}</span>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 pt-3 border-t border-border justify-between items-center">
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" asChild>
                                  <a href="https://wa.me/917857037041" target="_blank" rel="noreferrer" className="flex items-center gap-1">
                                    <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" /> Join Convoy Group
                                  </a>
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => toast.success("Invoice will be generated and emailed shortly.")}>
                                  <FileText className="h-3.5 w-3.5" /> Download Invoice
                                </Button>
                              </div>
                              <span className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5 text-secondary" /> Status: {b.booking_status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Travel History */}
                <div className="space-y-4">
                  <h3 className="text-xs font-poppins font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Travel History</h3>
                  {pastBookings.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic pl-2">No completed trips found.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {pastBookings.map((b) => {
                        const journey = allJourneys.find(j => j.id === b.journey_id);
                        return (
                          <div key={b.id} className="border border-border rounded-xl p-4 flex justify-between items-center bg-muted/10">
                            <div>
                              <h5 className="font-poppins font-bold text-xs text-primary">{journey?.name || "Completed Road Trip"}</h5>
                              <span className="text-[10px] text-muted-foreground">{b.travel_date}</span>
                            </div>
                            <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded">Completed</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PROFILE TAB */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-primary">Profile Information</h2>
                  <p className="text-xs text-muted-foreground mt-1">Keep your explorer details updated for booking auto-fill.</p>
                </div>

                <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground">Phone Number</label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                    <Input value={profile?.email || ""} disabled className="bg-muted opacity-80 cursor-not-allowed" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground">Gender</label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Non-binary">Non-binary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground">Date of Birth</label>
                    <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground">City</label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Delhi NCR" />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground">Emergency Contact (Relation - Name - Phone)</label>
                    <Input value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} placeholder="Father - Rakesh Vardhan - 9876543210" />
                  </div>
                  <div className="md:col-span-2 pt-4">
                    <Button type="submit" variant="hero" disabled={savingProfile}>
                      {savingProfile ? "Saving Changes..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* WISHLIST TAB */}
            {activeTab === "wishlist" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-primary">My Wishlist</h2>
                  <p className="text-xs text-muted-foreground mt-1 font-sans">Scenic roads you are planning to cover next.</p>
                </div>

                {wishlistItems.length === 0 ? (
                  <div className="text-center py-12 bg-muted/20 border border-dashed border-border rounded-2xl">
                    <Heart className="h-8 w-8 text-muted-foreground/60 mx-auto animate-pulse" />
                    <p className="mt-2 text-xs text-muted-foreground">Your wishlist is currently empty.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {wishlistItems.map((w) => {
                      const journey = allJourneys.find(j => j.id === w.journey_id);
                      if (!journey) return null;
                      return (
                        <div key={w.id} className="border border-border rounded-2xl overflow-hidden flex flex-col justify-between">
                          <img src={journey.image} alt={journey.name} className="h-40 w-full object-cover" />
                          <div className="p-4 space-y-4">
                            <div>
                              <h4 className="font-display font-bold text-base text-primary">{journey.name}</h4>
                              <p className="text-[10px] text-muted-foreground">{journey.duration} · Starting at {journey.price}</p>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" size="sm" onClick={() => handleRemoveWishlist(w.id)}>Remove</Button>
                              <Button size="sm" variant="hero" asChild>
                                <Link to="/journeys/$journeyId" params={{ journeyId: journey.slug }}>Book Now</Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TRAVELERS TAB */}
            {activeTab === "travelers" && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-display text-2xl font-bold text-primary">Saved Travelers</h2>
                  <p className="text-xs text-muted-foreground mt-1">Manage friends and family profiles for quick passenger mapping.</p>
                </div>

                {/* Travelers Form */}
                <form onSubmit={handleAddTraveler} className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-border pb-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground">Name</label>
                    <Input value={tName} onChange={(e) => setTName(e.target.value)} placeholder="Full Name" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground">Age</label>
                    <Input type="number" value={tAge} onChange={(e) => setTAge(e.target.value)} placeholder="24" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground">Gender</label>
                    <Select value={tGender} onValueChange={setTGender}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground">ID Proof (Aadhaar / Passport)</label>
                    <Input value={tIdProof} onChange={(e) => setTIdProof(e.target.value)} placeholder="ID number / details" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground">Phone (Optional)</label>
                    <Input value={tPhone} onChange={(e) => setTPhone(e.target.value)} placeholder="Phone number" />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" variant="hero" className="w-full" disabled={addingTraveler}>
                      {addingTraveler ? "Saving..." : "Add Traveler"}
                    </Button>
                  </div>
                </form>

                {/* Saved list */}
                <div className="space-y-3">
                  <h4 className="text-xs font-poppins font-bold uppercase tracking-wider text-muted-foreground">Saved Profiles</h4>
                  {travelers.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No saved travelers yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {travelers.map((t) => (
                        <div key={t.id} className="border border-border rounded-xl p-4 flex justify-between items-center shadow-xs">
                          <div>
                            <h5 className="font-poppins font-bold text-xs text-primary">{t.name} ({t.age} y/o)</h5>
                            <span className="text-[10px] text-muted-foreground">Gender: {t.gender} {t.phone ? `· Phone: ${t.phone}` : ""}</span>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteTraveler(t.id)} className="text-[#E53E3E] hover:bg-red-50">
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUPPORT TAB */}
            {activeTab === "support" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-primary">Support & Help</h2>
                  <p className="text-xs text-muted-foreground mt-1">Get immediate support from our Trip Captains.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div className="border border-border p-6 rounded-2xl shadow-soft space-y-4">
                    <MessageCircle className="h-8 w-8 text-[#25D366]" />
                    <h4 className="font-poppins font-bold text-sm text-primary">WhatsApp Support</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">Connect directly with our 24/7 emergency and bookings assistance team.</p>
                    <Button variant="hero" asChild className="w-full">
                      <a href="https://wa.me/917857037041" target="_blank" rel="noreferrer">Chat on WhatsApp</a>
                    </Button>
                  </div>

                  <div className="border border-border p-6 rounded-2xl shadow-soft space-y-4">
                    <Phone className="h-8 w-8 text-accent" />
                    <h4 className="font-poppins font-bold text-sm text-primary">Phone Assistance</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">Give us a call directly for emergency convoy coordination or booking changes.</p>
                    <Button variant="outline" asChild className="w-full">
                      <a href="tel:+917857037041">Call Assistance</a>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-primary">Account Settings</h2>
                  <p className="text-xs text-muted-foreground mt-1">Manage credentials and authentication preferences.</p>
                </div>

                <div className="max-w-md space-y-4 pt-4">
                  <div className="border border-border p-5 rounded-2xl space-y-2.5">
                    <h4 className="font-poppins font-bold text-sm text-primary">Change Password</h4>
                    <p className="text-xs text-muted-foreground leading-normal">
                      We will send a secure link to your email to configure a new password.
                    </p>
                    <Button
                      onClick={async () => {
                        if (user?.email) {
                          const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                            redirectTo: `${window.location.origin}/account?reset=true`
                          });
                          if (error) toast.error("Failed to send reset link.");
                          else toast.success("Reset link sent to your email!");
                        }
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Request Password Reset
                    </Button>
                  </div>
                </div>
              </div>
            )}

          </section>

        </div>

      </main>
      <Footer />
      <FloatingUI />
    </div>
  );
}
