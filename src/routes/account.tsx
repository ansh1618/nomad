import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/site/AuthContext";
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
  ChevronRight, Compass, MessageCircle, CircleHelp, FileText, CheckCircle2, Settings,
  Eye, Loader2
} from "lucide-react";
import { getJourneys } from "@/lib/queries-client";

export const Route = createFileRoute("/account")({
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: search.tab as string | undefined,
  }),
  head: () => ({
    meta: [
      { title: "My Account & Bookings | Nomadik" },
      { name: "description", content: "Manage your Nomadik user profile, track upcoming road trips, join convoy WhatsApp groups, and access support." },
    ],
  }),
  component: AccountDashboard,
});

type ActiveTab = "profile" | "bookings" | "wishlist" | "travelers" | "support" | "settings" | "documents";

function AccountDashboard() {
  const { user, profile, isAuthenticated, updateProfile, refreshProfile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { tab } = useSearch({ from: "/account" });
  const [activeTab, setActiveTab] = useState<ActiveTab>((tab as ActiveTab) || "bookings");

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate({ to: "/login", search: { returnTo: "/account" } });
    }
  }, [loading, isAuthenticated, navigate]);

  // Sync tab from URL search param
  useEffect(() => {
    if (tab && tab !== activeTab) {
      setActiveTab(tab as ActiveTab);
    }
  }, [tab]);

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

  const [recentViews, setRecentViews] = useState<any[]>([]);
  const [availableDocs, setAvailableDocs] = useState<any[]>([]);
  const [loadingDocsData, setLoadingDocsData] = useState(false);

  useEffect(() => {
    if (user && activeTab === "documents") {
      setLoadingDocsData(true);
      
      // 1. Fetch recently viewed pdfs
      supabase
        .from("pdf_views")
        .select(`
          id,
          viewed_at,
          last_page_viewed,
          progress_percent,
          package_documents (
            id,
            title,
            document_type,
            file_url
          ),
          journeys (
            name,
            slug
          )
        `)
        .eq("user_id", user.id)
        .order("viewed_at", { ascending: false })
        .limit(6)
        .then(({ data, error }) => {
          if (!error && data) {
            // Filter duplicates by document_id manually
            const unique: any[] = [];
            const ids = new Set();
            data.forEach((item: any) => {
              const docId = item.package_documents?.id;
              if (docId && !ids.has(docId)) {
                ids.add(docId);
                unique.push(item);
              }
            });
            setRecentViews(unique);
          }
        });

      // 2. Fetch available documents
      supabase
        .from("package_documents")
        .select(`
          *,
          journeys (
            name,
            slug
          )
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .then(({ data, error }) => {
          setLoadingDocsData(false);
          if (!error && data) {
            setAvailableDocs(data);
          }
        });
    }
  }, [user, activeTab]);

  const loadTravelers = async () => {
    if (!user) return;
    const { data } = await supabase.from("travellers").select("*").eq("user_id", user.id);
    if (data) setTravelers(data);
  };

  const loadBookings = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        departures (
          id,
          departure_date,
          journeys (id, name, slug, hero_banner)
        ),
        booking_travellers (*),
        booking_timeline (*),
        payments (*)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setBookings(data);
    } else {
      const { data: fallbackData } = await supabase.from("bookings").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (fallbackData) setBookings(fallbackData);
    }
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
      await updateProfile({
        full_name: fullName,
        phone,
        gender,
        dob: dob || undefined,
        city,
        emergency_contact: emergencyContact,
      });
      toast.success("Profile updated successfully!");
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

  // Loading
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Compass className="h-10 w-10 text-gold animate-spin-slow" />
      </div>
    );
  }

  // Not authenticated — redirect handled by useEffect above
  if (!isAuthenticated) return null;


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
                { id: "documents", label: "Premium Documents", icon: FileText },
                { id: "profile", label: "Profile Information", icon: User },
                { id: "wishlist", label: "Wishlist", icon: Heart },
                { id: "travelers", label: "Saved Travelers", icon: Users },
                { id: "support", label: "Support & Help", icon: CircleHelp },
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
                        const journeyName = b.departures?.journeys?.name || allJourneys.find(j => j.id === b.journey_id)?.name || "Nomadik Road Journey";
                        const travelDate = b.departures?.departure_date ? new Date(b.departures.departure_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : b.travel_date || "Upcoming";
                        const travellersCount = b.traveller_count || b.travellers_count || 1;
                        const isPaid = b.payment_status === "SUCCESS" || b.status === "CONFIRMED" || b.booking_status === "CONFIRMED";

                        return (
                          <div key={b.id} className="border border-border rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-soft transition-all bg-card">
                            <div className="flex justify-between items-start flex-wrap gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] bg-secondary/15 text-secondary font-bold font-poppins px-2 py-0.5 rounded">
                                    ID: {b.booking_id || b.id?.slice(0, 8).toUpperCase() || "NOM-Pending"}
                                  </span>
                                  {b.room_sharing && (
                                    <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded">
                                      Stay: {b.room_sharing}
                                    </span>
                                  )}
                                </div>
                                <h4 className="font-display font-bold text-lg text-primary mt-1.5">{journeyName}</h4>
                                <span className="text-xs text-muted-foreground block mt-0.5">
                                  Departure: {travelDate} · {travellersCount} Explorer(s) {b.pickup_point ? `· Pickup: ${b.pickup_point}` : ''}
                                </span>
                              </div>

                              <div className="flex flex-col items-end gap-1.5">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-poppins ${
                                  isPaid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                }`}>
                                  Payment: {isPaid ? "CONFIRMED" : b.payment_status || "PENDING"}
                                </span>
                                <span className="text-sm font-bold text-primary">₹{Number(b.total_amount || b.final_amount || 0).toLocaleString("en-IN")}</span>
                                {b.balance_due > 0 && (
                                  <span className="text-[10px] text-amber-700 font-semibold">₹{Number(b.balance_due).toLocaleString("en-IN")} due</span>
                                )}
                              </div>
                            </div>

                            {/* Booking Status Timeline */}
                            <div className="pt-3 border-t border-border space-y-2">
                              <p className="text-[10px] font-poppins font-bold uppercase tracking-wider text-muted-foreground">
                                Booking Timeline & Allocation
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px] font-poppins">
                                <div className="p-2 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-800">
                                  <FileText className="h-3.5 w-3.5 mx-auto mb-1 text-emerald-600" />
                                  <span className="font-bold block">1. Initialized</span>
                                  <span className="text-[9px] opacity-80">Booking Saved</span>
                                </div>

                                <div className={`p-2 rounded-xl border ${isPaid ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                                  <CreditCard className="h-3.5 w-3.5 mx-auto mb-1 text-amber-600" />
                                  <span className="font-bold block">2. Payment</span>
                                  <span className="text-[9px] opacity-80">{isPaid ? 'Confirmed' : 'Pending'}</span>
                                </div>

                                <div className={`p-2 rounded-xl border ${b.assigned_bus_id || b.assigned_hotel_id ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                  <Compass className="h-3.5 w-3.5 mx-auto mb-1 text-blue-600" />
                                  <span className="font-bold block">3. Convoy Stays</span>
                                  <span className="text-[9px] opacity-80">{b.assigned_bus_id || b.assigned_hotel_id ? 'Assigned' : 'In Progress'}</span>
                                </div>

                                <div className={`p-2 rounded-xl border ${b.booking_status === 'COMPLETED' ? 'bg-purple-50 border-purple-200 text-purple-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                  <CheckCircle2 className="h-3.5 w-3.5 mx-auto mb-1 text-purple-600" />
                                  <span className="font-bold block">4. Journey</span>
                                  <span className="text-[9px] opacity-80">{b.booking_status === 'COMPLETED' ? 'Completed' : 'Upcoming'}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 pt-3 border-t border-border justify-between items-center">
                              <div className="flex gap-2 flex-wrap">
                                {isPaid && (
                                  <a href={`/account/itinerary/${b.departures?.journeys?.slug || 'manali-road-trip'}`} target="_blank" rel="noreferrer">
                                    <Button variant="default" size="sm" className="h-8 text-xs font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                                      <FileText className="h-3.5 w-3.5" /> Unlock Itinerary PDF
                                    </Button>
                                  </a>
                                )}
                                <Button variant="outline" size="sm" asChild className="h-8 text-xs">
                                  <a href="https://wa.me/917857037041" target="_blank" rel="noreferrer" className="flex items-center gap-1">
                                    <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" /> Join Convoy Group
                                  </a>
                                </Button>
                                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => toast.success(`Generating Invoice for ${b.booking_id || 'Booking'}...`)}>
                                  <FileText className="h-3.5 w-3.5" /> Invoice PDF
                                </Button>
                              </div>
                              <span className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5 text-secondary" /> Status: {b.booking_status || b.status || "Pending"}
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

            {/* DOCUMENTS TAB */}
            {activeTab === "documents" && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-display text-2xl font-bold text-primary">Premium Documents</h2>
                  <p className="text-xs text-muted-foreground mt-1">Access secure PDF travel guides, schedules, packing lists, and vouchers.</p>
                </div>

                {/* 1. Recently Viewed */}
                {recentViews.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-poppins font-bold uppercase tracking-wider text-accent border-b border-border pb-2">Recently Read</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recentViews.map((view: any) => (
                        <div key={view.id} className="border border-border rounded-2xl p-4 bg-muted/5 flex justify-between items-center shadow-sm">
                          <div className="space-y-1 min-w-0">
                            <span className="text-[9px] font-bold font-poppins uppercase bg-secondary/15 text-secondary px-2 py-0.5 rounded">
                              {view.package_documents?.document_type}
                            </span>
                            <h4 className="font-display font-semibold text-sm text-primary truncate mt-1">{view.package_documents?.title}</h4>
                            <p className="text-[10px] text-muted-foreground truncate">{view.journeys?.name}</p>
                            
                            {/* progress bar */}
                            <div className="flex items-center gap-2 pt-1">
                              <div className="w-24 bg-muted h-1 rounded-full overflow-hidden">
                                <div className="bg-emerald-600 h-full" style={{ width: `${view.progress_percent || 0}%` }} />
                              </div>
                              <span className="text-[9px] font-mono font-bold text-emerald-700">{view.progress_percent || 0}% read</span>
                            </div>
                          </div>

                          <a href={`/account/itinerary/${view.journeys?.slug}?type=${view.package_documents?.document_type}`} target="_blank" rel="noreferrer">
                            <Button size="sm" className="h-8 font-poppins text-[10px] font-bold shadow-sm gap-1">
                              <Eye className="h-3 w-3" /> Resume
                            </Button>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Public / Travel Guides */}
                <div className="space-y-4">
                  <h3 className="text-xs font-poppins font-bold uppercase tracking-wider text-accent border-b border-border pb-2">Travel Guides & Inclusions</h3>
                  {loadingDocsData ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    </div>
                  ) : availableDocs.filter(d => ['ITINERARY', 'PACKING', 'GUIDE', 'TERMS', 'OTHER'].includes(d.document_type)).length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-2">No itineraries are configured for public download at this moment.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {availableDocs.filter(d => ['ITINERARY', 'PACKING', 'GUIDE', 'TERMS', 'OTHER'].includes(d.document_type)).map((doc: any) => (
                        <div key={doc.id} className="border border-border/80 hover:border-accent/40 rounded-2xl p-4 space-y-3 bg-card hover:shadow-soft transition-all">
                          <div className="flex justify-between items-start">
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-bold font-poppins uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                                {doc.document_type}
                              </span>
                              <h4 className="font-display font-semibold text-sm text-primary mt-1">{doc.title}</h4>
                              <p className="text-[10px] text-muted-foreground">{doc.journeys?.name}</p>
                            </div>
                            <FileText className="h-5 w-5 text-muted-foreground/50" />
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t text-[10px] text-muted-foreground font-poppins">
                            <span>Ver: v{doc.version} · {Math.round(doc.size / 1024)} KB</span>
                            <a href={`/account/itinerary/${doc.journeys?.slug}?type=${doc.document_type}`} target="_blank" rel="noreferrer">
                              <span className="text-accent font-bold hover:underline cursor-pointer flex items-center gap-0.5">
                                View Guide →
                              </span>
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Booked Vouchers & Invoices */}
                <div className="space-y-4">
                  <h3 className="text-xs font-poppins font-bold uppercase tracking-wider text-accent border-b border-border pb-2">My Invoices & Booking Vouchers</h3>
                  {bookings.length === 0 ? (
                    <div className="text-center py-6 bg-muted/15 border border-dashed rounded-2xl">
                      <Lock className="h-6 w-6 text-muted-foreground/50 mx-auto mb-1.5" />
                      <p className="text-xs text-muted-foreground font-poppins">No dynamic vouchers/invoices. Booking a trip unlocks official vouchers.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {bookings.map((b: any) => {
                        const journey = allJourneys.find(j => j.id === b.journey_id);
                        // Filter invoice / voucher documents for this package
                        const pkgDocs = availableDocs.filter(d => d.package_id === b.journey_id && ['VOUCHER', 'INVOICE'].includes(d.document_type));

                        return (
                          <div key={b.id} className="border border-border/80 rounded-2xl p-4 bg-muted/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="space-y-1">
                              <h4 className="font-display font-semibold text-sm text-primary">{journey?.name}</h4>
                              <p className="text-[10px] text-muted-foreground">Booking ID: {b.booking_id || "NOM-Pending"} · Status: {b.status}</p>
                            </div>

                            <div className="flex gap-2 w-full md:w-auto">
                              {pkgDocs.length === 0 ? (
                                <span className="text-[10px] text-muted-foreground italic">Admin hasn't uploaded voucher/invoice templates yet.</span>
                              ) : (
                                pkgDocs.map((doc: any) => (
                                  <a key={doc.id} href={`/account/itinerary/${journey?.slug}?type=${doc.document_type}`} target="_blank" rel="noreferrer" className="flex-1 md:flex-none">
                                    <Button variant="outline" size="sm" className="w-full text-[10px] font-bold font-poppins h-8 px-3 gap-1">
                                      <FileText className="h-3 w-3" /> {doc.document_type === 'VOUCHER' ? 'Voucher' : 'Invoice'}
                                    </Button>
                                  </a>
                                ))
                              )}
                            </div>
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
