import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import {
  GraduationCap,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  Calendar,
  Users,
  ArrowRight,
  Send,
  Building,
  Mail,
  Phone,
  FileCheck,
  Check,
  ChevronRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingUI } from "@/components/site/FloatingUI";
import { useAuth } from "@/components/site/AuthContext";
import { triggerNomadikAuth } from "@/components/site/AuthModal";
import { toast } from "sonner";
import {
  getStudentOfferSettings,
  getEligibleDestinations,
  getEligiblePackages,
  getUserStudentVerification,
  submitCollegeTripQuery,
} from "@/lib/college-trips/service";
import type { StudentOfferPackage, StudentOfferDestination } from "@/lib/college-trips/types";

export const Route = createFileRoute("/college-trips")({
  head: () => ({
    meta: [
      { title: "College Trips & Student Specials — GoNomadik" },
      {
        name: "description",
        content:
          "Exclusive student travel offers on curated road trips and treks to Manali, Chopta & Tungnath, Jibhi, and more. Verified college students unlock special discounted rates.",
      },
      { property: "og:title", content: "College Trips & Student Specials — GoNomadik" },
      {
        property: "og:description",
        content: "Special prices for college students. Travel more. Pay less. Exclusive student offers on selected trips.",
      },
    ],
  }),
  component: CollegeTripsPage,
});

function CollegeTripsPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedDestinationFilter, setSelectedDestinationFilter] = useState<string>("ALL");
  const [unverifiedModalOpen, setUnverifiedModalOpen] = useState(false);
  const [selectedPackageForModal, setSelectedPackageForModal] = useState<StudentOfferPackage | null>(null);

  // Form state for College Trip Query
  const [formName, setFormName] = useState("");
  const [formCollege, setFormCollege] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formDestination, setFormDestination] = useState("Manali");
  const [formDates, setFormDates] = useState("");
  const [formStudents, setFormStudents] = useState<number>(20);
  const [formYear, setFormYear] = useState("3rd Year");
  const [formRequirements, setFormRequirements] = useState("");
  const [formFacultyName, setFormFacultyName] = useState("");
  const [formFacultyContact, setFormFacultyContact] = useState("");
  const [formGroupType, setFormGroupType] = useState("College Society / Club");
  const [querySubmitted, setQuerySubmitted] = useState(false);

  // 1. Fetch Global Offer Settings
  const { data: settings } = useQuery({
    queryKey: ["student_offer_settings"],
    queryFn: getStudentOfferSettings,
  });

  // 2. Fetch Eligible Destinations
  const { data: destinations = [] } = useQuery({
    queryKey: ["student_offer_destinations"],
    queryFn: getEligibleDestinations,
  });

  // 3. Fetch Eligible Packages
  const { data: packages = [] } = useQuery({
    queryKey: ["student_offer_packages"],
    queryFn: getEligiblePackages,
  });

  // 4. Fetch User's Student Verification Status
  const { data: verification, isLoading: verificationLoading } = useQuery({
    queryKey: ["user_student_verification", user?.id, user?.email],
    queryFn: () => getUserStudentVerification(user?.id, user?.email),
    enabled: !!user,
  });

  // Query Submission Mutation
  const queryMutation = useMutation({
    mutationFn: async () => {
      if (!formName.trim() || !formCollege.trim() || !formEmail.trim() || !formPhone.trim()) {
        throw new Error("Please fill in all required fields (Name, College, Email, Phone).");
      }
      return await submitCollegeTripQuery({
        student_name: formName,
        college_name: formCollege,
        email: formEmail,
        phone: formPhone,
        destination: formDestination,
        preferred_travel_dates: formDates || "Flexible Dates",
        number_of_students: Number(formStudents) || 15,
        year_semester: formYear,
        additional_requirements: formRequirements || null,
        faculty_coordinator_name: formFacultyName || null,
        faculty_coordinator_contact: formFacultyContact || null,
        group_type: formGroupType || null,
      });
    },
    onSuccess: (res) => {
      setQuerySubmitted(true);
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ["college_trip_queries"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit college trip request.");
    },
  });

  const maxDiscountPct = settings?.maximum_discount_percentage ?? 25;
  const globalDiscountPct = settings?.discount_percentage ?? 25;

  const activeDestinations = destinations.filter((d) => d.is_eligible);
  const activePackages = packages.filter((p) => p.is_eligible && p.is_active !== false);

  const filteredPackages =
    selectedDestinationFilter === "ALL"
      ? activePackages
      : activePackages.filter((p) => {
          const destSlug = p.package?.destinations?.slug?.toLowerCase();
          const destId = p.package?.destination_id;
          return destSlug === selectedDestinationFilter.toLowerCase() || destId === selectedDestinationFilter;
        });

  const handleBookPackage = (pkg: StudentOfferPackage) => {
    if (!isAuthenticated) {
      triggerNomadikAuth({ mode: "login", returnTo: "/college-trips" });
      return;
    }

    if (verification?.status === "VERIFIED") {
      // Verified student: navigate to booking with student offer enabled
      const slug = pkg.package?.slug;
      if (slug) {
        navigate({
          to: "/journeys/$journeyId",
          params: { journeyId: slug },
          search: { studentOffer: "true" } as any,
        });
      }
    } else {
      // Unverified, pending or expired: show modal
      setSelectedPackageForModal(pkg);
      setUnverifiedModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-poppins overflow-x-hidden">
      <Navbar />

      <main className="pt-24 pb-20">
        {/* ================================================================ */}
        {/* HERO SECTION */}
        {/* ================================================================ */}
        <section className="relative px-4 sm:px-6 lg:px-8 py-12 md:py-20 overflow-hidden">
          {/* Subtle ambient lighting */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-r from-blue-600/10 via-[#C8A96A]/15 to-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-6xl mx-auto text-center relative z-10 space-y-6">
            {/* Pill Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0F2942]/10 border border-[#C8A96A]/30 text-xs font-semibold text-primary uppercase tracking-widest"
            >
              <GraduationCap className="h-4 w-4 text-[#C8A96A]" />
              <span className="font-bold text-[#C8A96A]">{settings?.title || "COLLEGE TRIPS"}</span>
              <span className="h-1 w-1 rounded-full bg-[#C8A96A]" />
              <span>Up to {maxDiscountPct}% OFF Regular Price</span>
            </motion.div>

            {/* Main Headings */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold tracking-tight text-foreground uppercase"
            >
              {settings?.title || "COLLEGE TRIPS"}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-lg sm:text-2xl font-display font-semibold text-[#C8A96A] max-w-2xl mx-auto"
            >
              {settings?.subheading || "Special prices for college students. Travel more. Pay less."}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto font-sans leading-relaxed"
            >
              {settings?.description ||
                `Exclusive student offers on selected trips. Verified college students can unlock prices up to ${maxDiscountPct}% below the regular trip price.`}
            </motion.p>

            {/* Verification Status Card / CTA Banner */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              className="max-w-xl mx-auto pt-2"
            >
              {isAuthenticated && verification ? (
                <div
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-4 text-left shadow-sm ${
                    verification.status === "VERIFIED"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800"
                      : verification.status === "PENDING"
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-800"
                      : verification.status === "EXPIRED"
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-800"
                      : "bg-red-500/10 border-red-500/30 text-red-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {verification.status === "VERIFIED" ? (
                      <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                    ) : verification.status === "PENDING" ? (
                      <Clock className="h-6 w-6 text-amber-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-6 w-6 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <p className="text-xs font-bold font-poppins uppercase tracking-wide">
                        {verification.status === "VERIFIED" && "✓ Student Status Verified"}
                        {verification.status === "PENDING" && "Your student verification is under review"}
                        {verification.status === "EXPIRED" && "Your student verification has expired"}
                        {verification.status === "REJECTED" && "Verification could not be approved"}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {verification.status === "VERIFIED" &&
                          `Valid until ${new Date(verification.expires_at || "").toLocaleDateString("en-IN")}. Student discount applied at checkout.`}
                        {verification.status === "PENDING" &&
                          "Our team is reviewing your college documents. You will be notified once approved."}
                        {verification.status === "EXPIRED" && "Please re-verify with your current enrollment document."}
                        {verification.status === "REJECTED" && (verification.rejection_reason || "Please submit valid credentials.")}
                      </p>
                    </div>
                  </div>

                  {verification.status !== "VERIFIED" && (
                    <Button
                      size="sm"
                      asChild
                      className="text-xs font-bold shrink-0 bg-primary text-white rounded-xl"
                    >
                      <Link to="/student-verification">Verify Again</Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="bg-card/80 backdrop-blur-md border border-[#C8A96A]/30 p-4 sm:p-5 rounded-2xl shadow-elegant flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gold/15 text-gold">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-foreground">
                        Unlock up to {maxDiscountPct}% Off Regular Price
                      </p>
                      <p className="text-[11px] sm:text-xs text-muted-foreground">
                        Complete quick student verification with your college ID.
                      </p>
                    </div>
                  </div>

                  <Button
                    asChild
                    className="bg-gold-gradient text-gold-foreground font-bold text-xs px-5 py-2.5 rounded-xl shadow-soft hover:brightness-105 shrink-0"
                  >
                    <Link to="/student-verification">
                      VERIFY STUDENT STATUS
                    </Link>
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* DESTINATIONS & PACKAGES SHOWCASE */}
        {/* ================================================================ */}
        <section className="px-4 sm:px-6 lg:px-8 py-10 max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-border pb-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C8A96A] mb-1">
                <MapPin className="h-3.5 w-3.5" />
                <span>Eligible Campus Destinations</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                Select Your College Getaway
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Curated Himalayan road trips and high-altitude treks with verified student discounts.
              </p>
            </div>

            {/* Destination Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedDestinationFilter("ALL")}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                  selectedDestinationFilter === "ALL"
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:bg-accent hover:text-foreground"
                }`}
              >
                All Trips
              </button>

              {activeDestinations.map((d) => {
                const name = d.custom_title || d.destination?.name || "Destination";
                const slug = d.destination?.slug || d.destination_id;
                const isSelected = selectedDestinationFilter.toLowerCase() === slug.toLowerCase();
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDestinationFilter(slug)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                      isSelected
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-card text-muted-foreground border-border hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Packages Grid */}
          {filteredPackages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {filteredPackages.map((item) => {
                const pkg = item.package;
                if (!pkg) return null;

                const regularPrice = pkg.starting_price || 6499;
                const discountPct =
                  item.override_global_discount && typeof item.custom_discount_percentage === "number"
                    ? item.custom_discount_percentage
                    : globalDiscountPct;

                const discountAmount = Math.round((regularPrice * discountPct) / 100);
                const studentPrice = Math.max(0, regularPrice - discountAmount);
                const destName = pkg.destinations?.name || "Himalayan Region";

                return (
                  <div
                    key={item.id}
                    className="group rounded-3xl overflow-hidden bg-card border border-border/80 shadow-elegant hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
                  >
                    {/* Top Image Banner */}
                    <div className="relative h-60 w-full overflow-hidden bg-muted">
                      <img
                        src={pkg.hero_banner || "/images/manali.jpg"}
                        alt={pkg.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                      {/* Offer Percentage Badge */}
                      <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 text-white font-bold text-xs shadow-lg">
                        <Sparkles className="h-3 w-3 text-amber-200" />
                        <span>{discountPct}% Student Offer</span>
                      </div>

                      {/* Destination Label */}
                      <div className="absolute top-4 right-4 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/60 text-white/90 backdrop-blur-md text-xs font-semibold border border-white/10">
                        <MapPin className="h-3 w-3 text-[#C8A96A]" />
                        <span>{destName}</span>
                      </div>

                      {/* Title on Image */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-xl font-display font-bold text-white leading-tight drop-shadow-md">
                          {pkg.name}
                        </h3>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                      <div className="space-y-4">
                        {/* Features chip list */}
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1 bg-secondary/15 px-2.5 py-1 rounded-lg">
                            <Users className="h-3 w-3 text-primary" /> Verified Student Cohort
                          </span>
                          <span className="inline-flex items-center gap-1 bg-secondary/15 px-2.5 py-1 rounded-lg">
                            <ShieldCheck className="h-3 w-3 text-emerald-600" /> Certified Trip Captains
                          </span>
                        </div>

                        {/* Price Presentation: Regular Price Strikethrough vs Student Price */}
                        <div className="bg-muted/40 p-4 rounded-2xl border border-border/60 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                              Regular Price
                            </span>
                            <span className="text-sm font-semibold text-muted-foreground line-through">
                              ₹{regularPrice.toLocaleString("en-IN")}
                            </span>
                            <span className="block text-[10px] text-emerald-600 font-semibold mt-0.5">
                              Save ₹{discountAmount.toLocaleString("en-IN")}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-[#C8A96A] uppercase font-bold tracking-wider block">
                              Verified Student Price
                            </span>
                            <span className="text-2xl sm:text-3xl font-display font-bold text-primary">
                              ₹{studentPrice.toLocaleString("en-IN")}
                              <span className="text-xs font-normal text-muted-foreground">/seat</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* CTA Section */}
                      <div className="pt-2 border-t border-border/40 flex items-center gap-3">
                        <Button
                          variant="outline"
                          asChild
                          className="flex-1 rounded-xl text-xs font-bold border-border"
                        >
                          <Link to="/journeys/$journeyId" params={{ journeyId: pkg.slug }}>
                            View Itinerary
                          </Link>
                        </Button>

                        <Button
                          onClick={() => handleBookPackage(item)}
                          className="flex-1 rounded-xl text-xs font-bold bg-gold-gradient text-gold-foreground hover:brightness-105 shadow-soft"
                        >
                          {verification?.status === "VERIFIED" ? "Book Student Rate" : "Unlock Student Price"}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-card border border-border rounded-3xl p-8 space-y-3">
              <GraduationCap className="h-10 w-10 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-bold text-foreground">No Packages Available</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                No active packages currently match this destination filter. Check back soon or query for a custom college group trip below.
              </p>
            </div>
          )}
        </section>

        {/* ================================================================ */}
        {/* COLLEGE TRIP QUERY / LEAD SECTION */}
        {/* ================================================================ */}
        <section id="plan-trip" className="px-4 sm:px-6 lg:px-8 py-16 max-w-5xl mx-auto scroll-mt-20">
          <div className="rounded-3xl bg-card border border-border shadow-elegant overflow-hidden">
            <div className="bg-gradient-to-r from-[#0F2942] via-[#1A365D] to-[#0E2038] text-white p-8 sm:p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#C8A96A]/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-2xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold tracking-wider text-slate-200 uppercase">
                  <Building className="h-3.5 w-3.5 text-[#C8A96A]" />
                  <span>College Societies & Batches</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">
                  Plan a College Trip
                </h2>

                <p className="text-sm sm:text-base text-slate-300 font-sans leading-relaxed">
                  Looking for a trip for your college group? Tell us your college and requirements and our team will get in touch with a customized group quote.
                </p>
              </div>
            </div>

            {/* Query Form */}
            <div className="p-6 sm:p-10">
              {querySubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12 space-y-4 max-w-md mx-auto"
                >
                  <div className="h-16 w-16 bg-emerald-500/15 text-emerald-600 rounded-full grid place-items-center mx-auto">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-foreground">
                    Request Received!
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    "Your college trip request has been received. Our team will contact you shortly."
                  </p>
                  <Button
                    onClick={() => {
                      setQuerySubmitted(false);
                      setFormName("");
                      setFormCollege("");
                      setFormRequirements("");
                    }}
                    variant="outline"
                    className="rounded-xl text-xs font-bold mt-4"
                  >
                    Submit Another Query
                  </Button>
                </motion.div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    queryMutation.mutate();
                  }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">Student Name *</Label>
                      <Input
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Ananya Sharma"
                        className="rounded-xl text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">College / University Name *</Label>
                      <Input
                        required
                        value={formCollege}
                        onChange={(e) => setFormCollege(e.target.value)}
                        placeholder="e.g. Delhi University / IIT / Miranda House"
                        className="rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">Email Address *</Label>
                      <Input
                        type="email"
                        required
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        placeholder="e.g. ananya@college.edu or gmail"
                        className="rounded-xl text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">Phone Number *</Label>
                      <Input
                        type="tel"
                        required
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        placeholder="e.g. +91 9876543210"
                        className="rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">Destination *</Label>
                      <Select value={formDestination} onValueChange={setFormDestination}>
                        <SelectTrigger className="rounded-xl text-xs">
                          <SelectValue placeholder="Select Destination" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Manali">Manali</SelectItem>
                          <SelectItem value="Chopta & Tungnath">Chopta & Tungnath</SelectItem>
                          <SelectItem value="Jibhi">Jibhi</SelectItem>
                          <SelectItem value="Udaipur">Udaipur</SelectItem>
                          <SelectItem value="Kasol">Kasol</SelectItem>
                          <SelectItem value="Spiti Valley">Spiti Valley</SelectItem>
                          <SelectItem value="Other Destination">Other Destination</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">Preferred Travel Dates</Label>
                      <Input
                        value={formDates}
                        onChange={(e) => setFormDates(e.target.value)}
                        placeholder="e.g. 15-20 October / Diwali Break"
                        className="rounded-xl text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">Number of Students *</Label>
                      <Input
                        type="number"
                        min={5}
                        required
                        value={formStudents}
                        onChange={(e) => setFormStudents(Number(e.target.value))}
                        className="rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">Year / Semester *</Label>
                      <Select value={formYear} onValueChange={setFormYear}>
                        <SelectTrigger className="rounded-xl text-xs">
                          <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1st Year">1st Year</SelectItem>
                          <SelectItem value="2nd Year">2nd Year</SelectItem>
                          <SelectItem value="3rd Year">3rd Year</SelectItem>
                          <SelectItem value="4th Year / Final Year">4th Year / Final Year</SelectItem>
                          <SelectItem value="Postgraduate / Masters">Postgraduate / Masters</SelectItem>
                          <SelectItem value="Mixed Batch">Mixed Batch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">Group Type (Optional)</Label>
                      <Select value={formGroupType} onValueChange={setFormGroupType}>
                        <SelectTrigger className="rounded-xl text-xs">
                          <SelectValue placeholder="Group Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="College Society / Club">College Society / Club</SelectItem>
                          <SelectItem value="Entire Batch">Entire Batch</SelectItem>
                          <SelectItem value="All-Girls Gang">All-Girls Gang</SelectItem>
                          <SelectItem value="Friends Squad">Friends Squad</SelectItem>
                          <SelectItem value="Official Department Trip">Official Department Trip</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Optional Faculty Details */}
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-3">
                    <p className="text-xs font-bold text-foreground">
                      Faculty / College Coordinator (Optional)
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Coordinator Name</Label>
                        <Input
                          value={formFacultyName}
                          onChange={(e) => setFormFacultyName(e.target.value)}
                          placeholder="e.g. Prof. R. Sharma"
                          className="rounded-xl text-xs mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Coordinator Contact / Email</Label>
                        <Input
                          value={formFacultyContact}
                          onChange={(e) => setFormFacultyContact(e.target.value)}
                          placeholder="e.g. prof.sharma@college.ac.in"
                          className="rounded-xl text-xs mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Additional Requirements</Label>
                    <Textarea
                      rows={3}
                      value={formRequirements}
                      onChange={(e) => setFormRequirements(e.target.value)}
                      placeholder="Tell us about food preferences, bonfire jam sessions, stay preferences, custom pickup points..."
                      className="rounded-xl text-xs"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={queryMutation.isPending}
                    className="w-full bg-gold-gradient text-gold-foreground font-bold text-sm py-6 rounded-2xl shadow-soft hover:brightness-105 transition-all"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {queryMutation.isPending ? "SUBMITTING QUERY..." : "SEND QUERY"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* TRANSPARENCY & TERMS SECTION */}
        {/* ================================================================ */}
        <section className="px-4 sm:px-6 lg:px-8 py-10 max-w-4xl mx-auto">
          <div className="rounded-2xl border border-border bg-card/60 p-6 space-y-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 font-bold text-foreground text-sm">
              <Info className="h-4 w-4 text-[#C8A96A]" />
              <span>Program Terms & Transparency</span>
            </div>

            <ul className="list-disc list-inside space-y-1.5 leading-relaxed font-sans">
              <li>Student pricing is available only to verified college students.</li>
              <li>Verification may be required before booking.</li>
              <li>Student pricing applies only to eligible packages and travel dates.</li>
              <li>Student offers cannot be combined with other promotions unless explicitly allowed.</li>
              {settings?.terms && settings.terms !== DEFAULT_STUDENT_SETTINGS.terms && (
                <li className="text-primary font-medium">{settings.terms}</li>
              )}
            </ul>
          </div>
        </section>
      </main>

      {/* ================================================================ */}
      {/* UNVERIFIED STUDENT MODAL */}
      {/* ================================================================ */}
      <AnimatePresence>
        {unverifiedModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border shadow-2xl rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 text-center relative"
            >
              <div className="h-14 w-14 rounded-full bg-gold/15 text-gold grid place-items-center mx-auto">
                <GraduationCap className="h-7 w-7" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-display font-bold text-foreground">
                  Student Verification Required
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  To prevent unauthorized bookings, student pricing is reserved for actively enrolled college students. Please complete verification with your college ID card.
                </p>
              </div>

              {selectedPackageForModal && (
                <div className="p-3 rounded-2xl bg-muted/50 border border-border text-xs flex justify-between items-center text-left">
                  <div>
                    <p className="font-bold text-primary">{selectedPackageForModal.package?.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Regular: ₹{selectedPackageForModal.package?.starting_price.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                    Up to {maxDiscountPct}% OFF
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-2.5 pt-2">
                <Button
                  asChild
                  className="w-full bg-gold-gradient text-gold-foreground font-bold text-xs py-3 rounded-xl shadow-soft"
                >
                  <Link to="/student-verification">
                    VERIFY STUDENT STATUS
                  </Link>
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setUnverifiedModalOpen(false)}
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
      <FloatingUI />
    </div>
  );
}

const DEFAULT_STUDENT_SETTINGS = {
  terms:
    "Student pricing is available only to verified college students. Verification may be required before booking. Student pricing applies only to eligible packages and travel dates. Student offers cannot be combined with other promotions unless explicitly allowed.",
};
