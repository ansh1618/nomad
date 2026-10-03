import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import {
  GraduationCap,
  Settings,
  MapPin,
  Package,
  ShieldCheck,
  MessageSquare,
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Eye,
  Plus,
  Trash2,
  Save,
  Search,
  ArrowRight,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Percent,
  AlertTriangle,
  UserCheck,
  FileText,
  Phone,
  Mail,
  Users,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  getStudentOfferSettings,
  updateStudentOfferSettings,
  getEligibleDestinations,
  updateEligibleDestinations,
  getEligiblePackages,
  updateEligiblePackages,
  getAllStudentVerifications,
  reviewStudentVerification,
  getCollegeTripQueries,
  updateCollegeTripQuery,
  getCollegeTripsAnalytics,
  getStudentDocumentSignedUrl,
} from "@/lib/college-trips/service";
import type {
  StudentOfferSettings,
  StudentOfferDestination,
  StudentOfferPackage,
  StudentVerification,
  CollegeTripQuery,
  CollegeTripQueryStatus,
} from "@/lib/college-trips/types";
import { getDestinations } from "@/lib/queries-client";
import { getPublishedPackages } from "@/lib/queries/packages";

export const Route = createFileRoute("/admin/college-trips")({
  component: AdminCollegeTripsPage,
});

function AdminCollegeTripsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("settings");

  // 1. Data queries
  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ["admin_student_settings"],
    queryFn: getStudentOfferSettings,
  });

  const { data: destinationsList = [], isLoading: loadingDests } = useQuery({
    queryKey: ["admin_student_destinations"],
    queryFn: getEligibleDestinations,
  });

  const { data: packagesList = [], isLoading: loadingPkgs } = useQuery({
    queryKey: ["admin_student_packages"],
    queryFn: getEligiblePackages,
  });

  const { data: verificationsList = [], isLoading: loadingVerifs } = useQuery({
    queryKey: ["admin_student_verifications"],
    queryFn: getAllStudentVerifications,
  });

  const { data: queriesList = [], isLoading: loadingQueries } = useQuery({
    queryKey: ["admin_college_queries"],
    queryFn: getCollegeTripQueries,
  });

  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ["admin_college_analytics"],
    queryFn: getCollegeTripsAnalytics,
  });

  // All catalog destinations & packages for adding to program
  const { data: allDestinations = [] } = useQuery({
    queryKey: ["all_destinations_catalog"],
    queryFn: getDestinations,
  });

  const { data: allPackages = [] } = useQuery<any[]>({
    queryKey: ["all_packages_catalog"],
    queryFn: () => getPublishedPackages(),
  });

  const globalDiscountPct = settings?.discount_percentage ?? 15;
  const maxDiscountPct = settings?.maximum_discount_percentage ?? 25;

  // -------------------------------------------------------------
  // TAB 1: SETTINGS MUTATION
  // -------------------------------------------------------------
  const [formSettings, setFormSettings] = useState<Partial<StudentOfferSettings>>({});

  const settingsMutation = useMutation({
    mutationFn: (updated: Partial<StudentOfferSettings>) => updateStudentOfferSettings(updated),
    onSuccess: () => {
      toast.success("College Student Offer settings saved successfully");
      queryClient.invalidateQueries({ queryKey: ["admin_student_settings"] });
      queryClient.invalidateQueries({ queryKey: ["student_offer_settings"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to update settings"),
  });

  // -------------------------------------------------------------
  // TAB 2: DESTINATIONS
  // -------------------------------------------------------------
  const [addDestId, setAddDestId] = useState("");

  const updateDestsMutation = useMutation({
    mutationFn: (list: StudentOfferDestination[]) => updateEligibleDestinations(list),
    onSuccess: () => {
      toast.success("Eligible destinations updated");
      queryClient.invalidateQueries({ queryKey: ["admin_student_destinations"] });
      queryClient.invalidateQueries({ queryKey: ["student_offer_destinations"] });
    },
  });

  const handleAddDestination = () => {
    if (!addDestId) return;
    const dest = allDestinations.find((d) => d.id === addDestId);
    if (!dest) return;
    if (destinationsList.some((d) => d.destination_id === addDestId)) {
      toast.error("This destination is already in the student program");
      return;
    }

    const newItem: StudentOfferDestination = {
      id: `dest-${Date.now()}`,
      destination_id: dest.id,
      is_eligible: true,
      display_order: destinationsList.length + 1,
      destination: {
        id: dest.id,
        name: dest.name,
        slug: dest.slug,
        hero_image: (dest as any).hero_image || null,
        description: (dest as any).description || null,
      },
    };

    updateDestsMutation.mutate([...destinationsList, newItem]);
    setAddDestId("");
  };

  const handleToggleDest = (destId: string) => {
    const updated = destinationsList.map((d) =>
      d.destination_id === destId ? { ...d, is_eligible: !d.is_eligible } : d
    );
    updateDestsMutation.mutate(updated);
  };

  const handleRemoveDest = (destId: string) => {
    const updated = destinationsList.filter((d) => d.destination_id !== destId);
    updateDestsMutation.mutate(updated);
  };

  // -------------------------------------------------------------
  // TAB 3: PACKAGES
  // -------------------------------------------------------------
  const [addPkgId, setAddPkgId] = useState("");

  const updatePkgsMutation = useMutation({
    mutationFn: (list: StudentOfferPackage[]) => updateEligiblePackages(list),
    onSuccess: () => {
      toast.success("Eligible packages updated");
      queryClient.invalidateQueries({ queryKey: ["admin_student_packages"] });
      queryClient.invalidateQueries({ queryKey: ["student_offer_packages"] });
    },
  });

  const handleAddPackage = () => {
    if (!addPkgId) return;
    const pkg = allPackages.find((p) => p.id === addPkgId);
    if (!pkg) return;
    if (packagesList.some((p) => p.package_id === addPkgId)) {
      toast.error("This package is already in the student program");
      return;
    }

    const newItem: StudentOfferPackage = {
      id: `pkg-${Date.now()}`,
      package_id: pkg.id,
      is_eligible: true,
      override_global_discount: false,
      custom_discount_percentage: null,
      is_active: true,
      display_order: packagesList.length + 1,
      package: {
        id: pkg.id,
        name: pkg.name,
        slug: pkg.slug,
        starting_price: pkg.starting_price || 6499,
        destination_id: (pkg as any).destination_id || "",
        hero_banner: (pkg as any).hero_banner || null,
      },
    };

    updatePkgsMutation.mutate([...packagesList, newItem]);
    setAddPkgId("");
  };

  const handleUpdatePackageItem = (pkgId: string, fields: Partial<StudentOfferPackage>) => {
    const updated = packagesList.map((p) => (p.package_id === pkgId ? { ...p, ...fields } : p));
    updatePkgsMutation.mutate(updated);
  };

  const handleRemovePackage = (pkgId: string) => {
    const updated = packagesList.filter((p) => p.package_id !== pkgId);
    updatePkgsMutation.mutate(updated);
  };

  // -------------------------------------------------------------
  // TAB 4: VERIFICATIONS
  // -------------------------------------------------------------
  const [verifFilter, setVerifFilter] = useState<string>("ALL");
  const [selectedVerifForAction, setSelectedVerifForAction] = useState<StudentVerification | null>(null);
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | "REQUEST_RESUBMISSION" | "REVOKE" | null>(null);
  const [validityDays, setValidityDays] = useState<number>(365);
  const [rejectionReason, setRejectionReason] = useState("");
  const [viewingDocUrl, setViewingDocUrl] = useState<string | null>(null);

  const reviewMutation = useMutation({
    mutationFn: async () => {
      if (!selectedVerifForAction || !actionType) return;
      if (actionType === "REJECT" && !rejectionReason.trim()) {
        throw new Error("Please specify a rejection reason.");
      }
      return await reviewStudentVerification({
        verificationId: selectedVerifForAction.id,
        action: actionType,
        validityDays: Number(validityDays),
        rejectionReason: rejectionReason || undefined,
        reviewerName: "Admin Compliance",
      });
    },
    onSuccess: () => {
      toast.success("Verification updated successfully");
      setSelectedVerifForAction(null);
      setActionType(null);
      setRejectionReason("");
      queryClient.invalidateQueries({ queryKey: ["admin_student_verifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin_college_analytics"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to update verification"),
  });

  const handleViewEvidence = async (filePath: string) => {
    try {
      const url = await getStudentDocumentSignedUrl(filePath);
      if (url) {
        window.open(url, "_blank");
      } else {
        toast.error("Could not generate signed access URL for this document.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to open document");
    }
  };

  // -------------------------------------------------------------
  // TAB 5: QUERIES
  // -------------------------------------------------------------
  const [queryFilter, setQueryFilter] = useState<string>("ALL");
  const [activeQueryDetail, setActiveQueryDetail] = useState<CollegeTripQuery | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editAssignedTo, setEditAssignedTo] = useState("");
  const [editQuotation, setEditQuotation] = useState<number | "">("");

  const updateQueryMutation = useMutation({
    mutationFn: async (params: { id: string; update: Partial<CollegeTripQuery> }) => {
      return await updateCollegeTripQuery(params.id, params.update);
    },
    onSuccess: () => {
      toast.success("Query updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin_college_queries"] });
      queryClient.invalidateQueries({ queryKey: ["admin_college_analytics"] });
      if (activeQueryDetail) {
        setActiveQueryDetail(null);
      }
    },
    onError: (err: any) => toast.error(err.message || "Failed to update query"),
  });

  const filteredVerifications =
    verifFilter === "ALL"
      ? verificationsList
      : verificationsList.filter((v) => v.status === verifFilter);

  const filteredQueries =
    queryFilter === "ALL"
      ? queriesList
      : queriesList.filter((q) => q.status === queryFilter);

  const currentSettings = { ...settings, ...formSettings };

  return (
    <div className="space-y-6 font-poppins pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display flex items-center gap-3 text-foreground">
            <span className="p-2 rounded-xl bg-gold/15 text-gold">
              <GraduationCap className="h-6 w-6" />
            </span>
            College Trips & Student Specials
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Complete administration suite: Program rules, eligible destinations, packages, verification reviews, group leads & real-time analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs gap-1.5 font-bold">
            <Link to="/college-trips" target="_blank">
              <span>View Landing Page</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/70 p-1 rounded-2xl flex flex-wrap gap-1 w-full max-w-4xl border border-border">
          <TabsTrigger value="settings" className="rounded-xl text-xs font-bold gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Settings className="h-3.5 w-3.5" /> Program Settings
          </TabsTrigger>
          <TabsTrigger value="destinations" className="rounded-xl text-xs font-bold gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white">
            <MapPin className="h-3.5 w-3.5" /> Destinations ({destinationsList.length})
          </TabsTrigger>
          <TabsTrigger value="packages" className="rounded-xl text-xs font-bold gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Package className="h-3.5 w-3.5" /> Packages ({packagesList.length})
          </TabsTrigger>
          <TabsTrigger value="verifications" className="rounded-xl text-xs font-bold gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white">
            <ShieldCheck className="h-3.5 w-3.5" /> Verifications ({verificationsList.filter(v => v.status === 'PENDING').length} pending)
          </TabsTrigger>
          <TabsTrigger value="queries" className="rounded-xl text-xs font-bold gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white">
            <MessageSquare className="h-3.5 w-3.5" /> College Queries ({queriesList.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-xl text-xs font-bold gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white">
            <BarChart3 className="h-3.5 w-3.5" /> Offer Analytics
          </TabsTrigger>
        </TabsList>

        {/* ================================================================ */}
        {/* TAB 1: PROGRAM SETTINGS & DISCOUNT RULES */}
        {/* ================================================================ */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">College Student Offer Configuration</CardTitle>
                  <CardDescription className="text-xs">
                    Controls global student discounts, stacking permissions, validity periods and marketing text.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="prog-enabled" className="text-xs font-bold">
                      Program Status: {currentSettings.enabled ? "ACTIVE" : "DISABLED"}
                    </Label>
                    <Switch
                      id="prog-enabled"
                      checked={currentSettings.enabled ?? true}
                      onCheckedChange={(val) => setFormSettings((prev) => ({ ...prev, enabled: val }))}
                    />
                  </div>
                  <Button
                    onClick={() => settingsMutation.mutate(formSettings)}
                    disabled={settingsMutation.isPending}
                    className="gap-2 bg-primary text-white text-xs font-bold rounded-xl"
                  >
                    <Save className="h-4 w-4" />
                    {settingsMutation.isPending ? "Saving..." : "Save Settings"}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label className="text-xs font-semibold">Global Discount Percentage (%) *</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={currentSettings.discount_percentage ?? 25}
                    onChange={(e) =>
                      setFormSettings((prev) => ({ ...prev, discount_percentage: Number(e.target.value) }))
                    }
                    className="mt-1"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Default discount for eligible packages.</p>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Maximum Discount Cap (%) *</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={currentSettings.maximum_discount_percentage ?? 25}
                    onChange={(e) =>
                      setFormSettings((prev) => ({ ...prev, maximum_discount_percentage: Number(e.target.value) }))
                    }
                    className="mt-1"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Hard cap: No package discount can exceed this.</p>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Default Verification Validity (Days)</Label>
                  <Select
                    value={String(currentSettings.verification_validity_days ?? 365)}
                    onValueChange={(val) =>
                      setFormSettings((prev) => ({ ...prev, verification_validity_days: Number(val) }))
                    }
                  >
                    <SelectTrigger className="mt-1 text-xs">
                      <SelectValue placeholder="Validity period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 Days</SelectItem>
                      <SelectItem value="90">90 Days</SelectItem>
                      <SelectItem value="180">180 Days</SelectItem>
                      <SelectItem value="365">365 Days (1 Year - Default)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Coupon Stacking Rule */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-foreground">Allow Coupon Stacking with Student Discount</Label>
                  <p className="text-[11px] text-muted-foreground">
                    When disabled (recommended default), verified student discounts CANNOT be combined with coupons or other promo codes.
                  </p>
                </div>
                <Switch
                  checked={currentSettings.allow_coupon_stacking ?? false}
                  onCheckedChange={(val) => setFormSettings((prev) => ({ ...prev, allow_coupon_stacking: val }))}
                />
              </div>

              {/* Verification Requirement Rule */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-foreground">Student Verification Required Before Booking</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Students must be in VERIFIED status to checkout at the discounted rate. Backend strictly enforces this check.
                  </p>
                </div>
                <Switch
                  checked={currentSettings.verification_required ?? true}
                  onCheckedChange={(val) => setFormSettings((prev) => ({ ...prev, verification_required: val }))}
                />
              </div>

              {/* Copy Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div>
                  <Label className="text-xs font-semibold">Offer Title</Label>
                  <Input
                    value={currentSettings.title ?? "COLLEGE TRIPS"}
                    onChange={(e) => setFormSettings((prev) => ({ ...prev, title: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Subheading</Label>
                  <Input
                    value={currentSettings.subheading ?? "Special prices for college students. Travel more. Pay less."}
                    onChange={(e) => setFormSettings((prev) => ({ ...prev, subheading: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">Offer Description Copy</Label>
                <Textarea
                  rows={2}
                  value={
                    currentSettings.description ??
                    "Exclusive student offers on selected trips. Verified college students can unlock prices up to 25% below the regular trip price."
                  }
                  onChange={(e) => setFormSettings((prev) => ({ ...prev, description: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Terms and Conditions</Label>
                <Textarea
                  rows={3}
                  value={currentSettings.terms ?? ""}
                  onChange={(e) => setFormSettings((prev) => ({ ...prev, terms: e.target.value }))}
                  className="mt-1 font-mono text-[11px]"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================ */}
        {/* TAB 2: ELIGIBLE DESTINATIONS */}
        {/* ================================================================ */}
        <TabsContent value="destinations" className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Eligible Campus Destinations</CardTitle>
                <CardDescription className="text-xs">
                  Manage destinations participating in the student special program. Add, disable, or adjust display priority.
                </CardDescription>
              </div>

              {/* Add Destination Picker */}
              <div className="flex items-center gap-2">
                <Select value={addDestId} onValueChange={setAddDestId}>
                  <SelectTrigger className="w-56 text-xs">
                    <SelectValue placeholder="Select destination to add" />
                  </SelectTrigger>
                  <SelectContent>
                    {allDestinations.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button onClick={handleAddDestination} disabled={!addDestId} size="sm" className="gap-1.5 text-xs font-bold">
                  <Plus className="h-4 w-4" /> Add Destination
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {destinationsList.map((d) => {
                  const name = d.custom_title || d.destination?.name || "Destination";
                  const slug = d.destination?.slug || "";
                  return (
                    <Card key={d.destination_id} className={`border ${d.is_eligible ? "border-border" : "border-dashed opacity-60"}`}>
                      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-[#C8A96A]" />
                          <CardTitle className="text-sm font-bold">{name}</CardTitle>
                        </div>
                        <Switch
                          checked={d.is_eligible}
                          onCheckedChange={() => handleToggleDest(d.destination_id)}
                        />
                      </CardHeader>
                      <CardContent className="p-4 pt-1 space-y-3 text-xs">
                        <p className="text-[11px] text-muted-foreground truncate">Slug: /{slug}</p>
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <span className={`text-[11px] font-semibold ${d.is_eligible ? "text-emerald-600" : "text-slate-400"}`}>
                            {d.is_eligible ? "Eligible" : "Disabled"}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveDest(d.destination_id)}
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================ */}
        {/* TAB 3: ELIGIBLE PACKAGES & CUSTOM DISCOUNT OVERRIDES */}
        {/* ================================================================ */}
        <TabsContent value="packages" className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Eligible Trip Packages & Discount Overrides</CardTitle>
                <CardDescription className="text-xs">
                  Assign packages to the student offer. You can override the global {globalDiscountPct}% discount per package.
                </CardDescription>
              </div>

              {/* Add Package Picker */}
              <div className="flex items-center gap-2">
                <Select value={addPkgId} onValueChange={setAddPkgId}>
                  <SelectTrigger className="w-64 text-xs">
                    <SelectValue placeholder="Select package to add" />
                  </SelectTrigger>
                  <SelectContent>
                    {allPackages.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} (₹{p.starting_price})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button onClick={handleAddPackage} disabled={!addPkgId} size="sm" className="gap-1.5 text-xs font-bold">
                  <Plus className="h-4 w-4" /> Add Package
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-4">
              {packagesList.map((item) => {
                const pkg = item.package;
                const regularPrice = pkg?.starting_price || 6499;
                const effectivePct = item.override_global_discount && typeof item.custom_discount_percentage === "number"
                  ? item.custom_discount_percentage
                  : globalDiscountPct;
                const discountAmt = Math.round((regularPrice * effectivePct) / 100);
                const studentPrice = regularPrice - discountAmt;

                return (
                  <Card key={item.package_id} className="border-border p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Package Basic Info */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          <h4 className="font-bold text-sm text-foreground">{pkg?.name || item.package_id}</h4>
                          <span className="text-[11px] text-muted-foreground">({pkg?.destinations?.name || "Himalayas"})</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>Regular: <strong>₹{regularPrice.toLocaleString("en-IN")}</strong></span>
                          <span>•</span>
                          <span className="text-emerald-600 font-bold">Student Price: ₹{studentPrice.toLocaleString("en-IN")} ({effectivePct}% OFF)</span>
                        </div>
                      </div>

                      {/* Package Controls */}
                      <div className="flex flex-wrap items-center gap-4">
                        {/* Override switch */}
                        <div className="flex items-center gap-2 text-xs">
                          <Label className="text-xs text-muted-foreground">Custom Discount:</Label>
                          <Switch
                            checked={item.override_global_discount}
                            onCheckedChange={(checked) =>
                              handleUpdatePackageItem(item.package_id, {
                                override_global_discount: checked,
                                custom_discount_percentage: checked ? item.custom_discount_percentage ?? globalDiscountPct : null,
                              })
                            }
                          />
                        </div>

                        {/* Custom Percentage Input if enabled */}
                        {item.override_global_discount && (
                          <div className="flex items-center gap-1.5 w-24">
                            <Input
                              type="number"
                              min={1}
                              max={maxDiscountPct}
                              value={item.custom_discount_percentage ?? globalDiscountPct}
                              onChange={(e) =>
                                handleUpdatePackageItem(item.package_id, {
                                  custom_discount_percentage: Number(e.target.value),
                                })
                              }
                              className="h-8 text-xs font-bold text-center"
                            />
                            <span className="text-xs font-bold">%</span>
                          </div>
                        )}

                        {/* Active toggle */}
                        <div className="flex items-center gap-1.5 text-xs">
                          <Label className="text-xs text-muted-foreground">Active:</Label>
                          <Switch
                            checked={item.is_active}
                            onCheckedChange={(checked) =>
                              handleUpdatePackageItem(item.package_id, { is_active: checked })
                            }
                          />
                        </div>

                        {/* Remove */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemovePackage(item.package_id)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================ */}
        {/* TAB 4: STUDENT VERIFICATION PANEL */}
        {/* ================================================================ */}
        <TabsContent value="verifications" className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold">Student Verification Review Panel</CardTitle>
                <CardDescription className="text-xs">
                  Review student ID submissions, approve with configurable validity (30–365 days), reject with reason, or revoke access.
                </CardDescription>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-semibold">Filter:</span>
                <Select value={verifFilter} onValueChange={setVerifFilter}>
                  <SelectTrigger className="w-36 text-xs">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="VERIFIED">Verified</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                    <SelectItem value="REVOKED">Revoked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              {filteredVerifications.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/50 text-muted-foreground font-bold uppercase tracking-wider border-b border-border">
                      <tr>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">College & ID</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Submitted</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Evidence</th>
                        <th className="p-3">Validity Expiry</th>
                        <th className="p-3">Reviewer</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredVerifications.map((v) => (
                        <tr key={v.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3 font-semibold text-foreground">
                            {v.full_name}
                            <span className="block text-[10px] text-muted-foreground font-normal">
                              Graduation: {v.graduation_year}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-primary">{v.college_name}</span>
                            <span className="block text-[10px] text-muted-foreground">
                              ID: {v.student_id_number} ({v.course_program})
                            </span>
                          </td>
                          <td className="p-3">
                            <span>{v.email}</span>
                            {v.college_email && (
                              <span className="block text-[10px] text-emerald-600 truncate max-w-[140px]">
                                {v.college_email}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {new Date(v.created_at).toLocaleDateString("en-IN")}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                v.status === "VERIFIED"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : v.status === "PENDING"
                                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                                  : v.status === "REJECTED"
                                  ? "bg-red-100 text-red-800 border border-red-300"
                                  : v.status === "EXPIRED"
                                  ? "bg-rose-100 text-rose-800 border border-rose-300"
                                  : "bg-slate-100 text-slate-800 border border-slate-300"
                              }`}
                            >
                              {v.status}
                            </span>
                          </td>
                          <td className="p-3">
                            {v.documents && v.documents.length > 0 ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewEvidence(v.documents![0].file_path)}
                                className="h-7 px-2.5 text-[11px] gap-1 rounded-lg"
                              >
                                <Eye className="h-3 w-3" /> View Proof
                              </Button>
                            ) : (
                              <span className="text-muted-foreground italic text-[10px]">No doc</span>
                            )}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {v.expires_at ? new Date(v.expires_at).toLocaleDateString("en-IN") : "—"}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {v.reviewed_by_name || "—"}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {v.status === "PENDING" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedVerifForAction(v);
                                      setActionType("APPROVE");
                                    }}
                                    className="h-7 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg"
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedVerifForAction(v);
                                      setActionType("REJECT");
                                    }}
                                    className="h-7 px-2.5 text-[11px] text-destructive hover:bg-destructive/10 rounded-lg"
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}

                              {v.status === "VERIFIED" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedVerifForAction(v);
                                    setActionType("REVOKE");
                                  }}
                                  className="h-7 px-2.5 text-[11px] text-destructive hover:bg-destructive/10 rounded-lg"
                                >
                                  Revoke
                                </Button>
                              )}

                              {v.status === "REJECTED" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedVerifForAction(v);
                                    setActionType("APPROVE");
                                  }}
                                  className="h-7 px-2.5 text-[11px] rounded-lg"
                                >
                                  Re-Approve
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground space-y-2">
                  <ShieldCheck className="h-8 w-8 mx-auto text-muted-foreground/60" />
                  <p className="text-xs">No verification requests found matching this filter.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================ */}
        {/* TAB 5: COLLEGE TRIP QUERIES */}
        {/* ================================================================ */}
        <TabsContent value="queries" className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold">College Trip Group Leads & Queries</CardTitle>
                <CardDescription className="text-xs">
                  Manage incoming inquiries from college groups, department tours, societies and campus reps.
                </CardDescription>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-semibold">Status:</span>
                <Select value={queryFilter} onValueChange={setQueryFilter}>
                  <SelectTrigger className="w-36 text-xs">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="NEW">New</SelectItem>
                    <SelectItem value="CONTACTED">Contacted</SelectItem>
                    <SelectItem value="QUALIFIED">Qualified</SelectItem>
                    <SelectItem value="QUOTED">Quoted</SelectItem>
                    <SelectItem value="CONVERTED">Converted</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                    <SelectItem value="LOST">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              {filteredQueries.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/50 text-muted-foreground font-bold uppercase tracking-wider border-b border-border">
                      <tr>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">College</th>
                        <th className="p-3">Destination</th>
                        <th className="p-3">Travel Date</th>
                        <th className="p-3">Group Size</th>
                        <th className="p-3">Contact</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Created</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredQueries.map((q) => (
                        <tr key={q.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3 font-semibold text-foreground">
                            {q.student_name}
                            <span className="block text-[10px] text-muted-foreground font-normal">
                              Year: {q.year_semester}
                            </span>
                          </td>
                          <td className="p-3 font-medium text-primary">{q.college_name}</td>
                          <td className="p-3 font-bold text-[#C8A96A]">{q.destination}</td>
                          <td className="p-3 text-muted-foreground">{q.preferred_travel_dates}</td>
                          <td className="p-3 font-bold text-foreground">{q.number_of_students} pax</td>
                          <td className="p-3">
                            <span>{q.phone}</span>
                            <span className="block text-[10px] text-muted-foreground truncate max-w-[130px]">{q.email}</span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                q.status === "NEW"
                                  ? "bg-blue-100 text-blue-800"
                                  : q.status === "CONVERTED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : q.status === "QUOTED"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-slate-100 text-slate-800"
                              }`}
                            >
                              {q.status}
                            </span>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {new Date(q.created_at).toLocaleDateString("en-IN")}
                          </td>
                          <td className="p-3 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setActiveQueryDetail(q);
                                setEditNotes(q.internal_notes || "");
                                setEditAssignedTo(q.assigned_to || "");
                                setEditQuotation(q.quotation_amount || "");
                              }}
                              className="h-7 text-xs font-semibold rounded-lg"
                            >
                              Open Query
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground space-y-2">
                  <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/60" />
                  <p className="text-xs">No college queries found matching this filter.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================ */}
        {/* TAB 6: REAL OFFER ANALYTICS */}
        {/* ================================================================ */}
        <TabsContent value="analytics" className="space-y-6">
          {/* Key KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card className="border-border p-5 space-y-2 bg-card">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs uppercase font-bold tracking-wider">Verifications</span>
                <ShieldCheck className="h-4 w-4 text-[#C8A96A]" />
              </div>
              <p className="text-2xl font-bold font-display text-foreground">{analytics?.totalVerifications ?? 0}</p>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="text-emerald-600 font-bold">{analytics?.verifiedCount ?? 0} Verified</span>
                <span>•</span>
                <span className="text-amber-600 font-bold">{analytics?.pendingCount ?? 0} Pending</span>
              </div>
            </Card>

            <Card className="border-border p-5 space-y-2 bg-card">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs uppercase font-bold tracking-wider">Approval Rate</span>
                <Percent className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold font-display text-emerald-600">{analytics?.approvalRate ?? 0}%</p>
              <p className="text-[11px] text-muted-foreground">Based on completed review decisions</p>
            </Card>

            <Card className="border-border p-5 space-y-2 bg-card">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs uppercase font-bold tracking-wider">Student Bookings</span>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-bold font-display text-primary">{analytics?.studentBookingsCount ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">
                Revenue: ₹{(analytics?.studentBookingsRevenue ?? 0).toLocaleString("en-IN")}
              </p>
            </Card>

            <Card className="border-border p-5 space-y-2 bg-card">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs uppercase font-bold tracking-wider">College Leads</span>
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold font-display text-blue-600">{analytics?.totalQueries ?? 0}</p>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="text-emerald-600 font-bold">{analytics?.convertedQueries ?? 0} Converted</span>
                <span>({analytics?.queryConversionRate ?? 0}% Rate)</span>
              </div>
            </Card>
          </div>

          {/* Top College Trip Destinations Table */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base font-bold">Top Inquired College Destinations</CardTitle>
              <CardDescription className="text-xs">Real database aggregation of popular student destinations.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {analytics && analytics.topDestinations.length > 0 ? (
                <div className="space-y-3">
                  {analytics.topDestinations.map((d, idx) => (
                    <div key={d.name} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="h-6 w-6 rounded-full bg-primary/10 text-primary font-bold grid place-items-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-foreground text-sm">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-muted-foreground">{d.count} Queries</span>
                        <span className="text-emerald-600 font-bold">{d.bookings} Bookings</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-6 text-center">No destination query data yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ================================================================ */}
      {/* REVIEW ACTION MODAL (APPROVE / REJECT / REVOKE) */}
      {/* ================================================================ */}
      <Dialog open={!!actionType} onOpenChange={() => setActionType(null)}>
        <DialogContent className="max-w-md font-poppins">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {actionType === "APPROVE" && "Approve Student Status"}
              {actionType === "REJECT" && "Reject Student Submission"}
              {actionType === "REVOKE" && "Revoke Student Status"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Student: <strong>{selectedVerifForAction?.full_name}</strong> ({selectedVerifForAction?.college_name})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {actionType === "APPROVE" && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Verification Validity Period</Label>
                <Select value={String(validityDays)} onValueChange={(v) => setValidityDays(Number(v))}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select validity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 Days</SelectItem>
                    <SelectItem value="90">90 Days</SelectItem>
                    <SelectItem value="180">180 Days</SelectItem>
                    <SelectItem value="365">365 Days (1 Year - Default)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  The student will be permitted to book student deals until the expiration timestamp.
                </p>
              </div>
            )}

            {actionType === "REJECT" && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-destructive">Rejection Reason *</Label>
                <Textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. ID card expired / Name mismatch with enrollment document / Blurry photo"
                  className="text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  This reason will be displayed to the student so they can correct their credentials.
                </p>
              </div>
            )}

            {actionType === "REVOKE" && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-900 text-xs space-y-1">
                <p className="font-bold">Revoke verification?</p>
                <p className="text-[11px]">
                  This student will immediately lose access to student pricing until they submit fresh verification documents.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setActionType(null)} className="text-xs">
              Cancel
            </Button>
            <Button
              onClick={() => reviewMutation.mutate()}
              disabled={reviewMutation.isPending}
              className={`text-xs font-bold ${
                actionType === "APPROVE" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-destructive text-white"
              }`}
            >
              {reviewMutation.isPending ? "Updating..." : "Confirm Decision"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================ */}
      {/* COLLEGE QUERY DETAIL & EDIT MODAL */}
      {/* ================================================================ */}
      <Dialog open={!!activeQueryDetail} onOpenChange={() => setActiveQueryDetail(null)}>
        <DialogContent className="max-w-xl font-poppins text-xs">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center justify-between">
              <span>College Group Query: {activeQueryDetail?.student_name}</span>
              <span className="text-xs font-normal text-muted-foreground">{activeQueryDetail?.destination}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              College: <strong>{activeQueryDetail?.college_name}</strong> | Year: {activeQueryDetail?.year_semester}
            </DialogDescription>
          </DialogHeader>

          {activeQueryDetail && (
            <div className="space-y-4 py-2">
              {/* Contact and Trip Specs */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-xl border border-border">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Contact</span>
                  <p className="font-medium text-foreground">{activeQueryDetail.phone}</p>
                  <p className="text-[11px] text-muted-foreground">{activeQueryDetail.email}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Trip Specs</span>
                  <p className="font-medium text-foreground">{activeQueryDetail.number_of_students} Students</p>
                  <p className="text-[11px] text-muted-foreground">Dates: {activeQueryDetail.preferred_travel_dates}</p>
                </div>
              </div>

              {/* Faculty Info */}
              {(activeQueryDetail.faculty_coordinator_name || activeQueryDetail.group_type) && (
                <div className="p-3 bg-secondary/10 rounded-xl border border-border space-y-1">
                  <p className="text-[11px] font-bold text-primary">Group / Faculty Details</p>
                  <p className="text-[11px] text-foreground">
                    Type: {activeQueryDetail.group_type || "Standard Batch"} | Faculty:{" "}
                    {activeQueryDetail.faculty_coordinator_name || "N/A"} ({activeQueryDetail.faculty_coordinator_contact || "No contact"})
                  </p>
                </div>
              )}

              {/* Requirements Message */}
              {activeQueryDetail.additional_requirements && (
                <div className="p-3 bg-card border border-border rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">Student Requirements:</span>
                  <p className="text-xs text-foreground/90 whitespace-pre-wrap">{activeQueryDetail.additional_requirements}</p>
                </div>
              )}

              {/* Status Selector */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] font-semibold">Update Lead Status</Label>
                  <Select
                    value={activeQueryDetail.status}
                    onValueChange={(val: any) =>
                      updateQueryMutation.mutate({ id: activeQueryDetail.id, update: { status: val } })
                    }
                  >
                    <SelectTrigger className="text-xs mt-1">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEW">New</SelectItem>
                      <SelectItem value="CONTACTED">Contacted</SelectItem>
                      <SelectItem value="QUALIFIED">Qualified</SelectItem>
                      <SelectItem value="QUOTED">Quoted</SelectItem>
                      <SelectItem value="CONVERTED">Converted</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                      <SelectItem value="LOST">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[11px] font-semibold">Assign Staff Member</Label>
                  <Input
                    value={editAssignedTo}
                    onChange={(e) => setEditAssignedTo(e.target.value)}
                    placeholder="Staff name"
                    className="text-xs mt-1"
                  />
                </div>
              </div>

              {/* Quotation Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] font-semibold">Quotation Amount (₹)</Label>
                  <Input
                    type="number"
                    value={editQuotation}
                    onChange={(e) => setEditQuotation(e.target.value ? Number(e.target.value) : "")}
                    placeholder="e.g. 150000"
                    className="text-xs mt-1"
                  />
                </div>
              </div>

              {/* Internal Notes */}
              <div>
                <Label className="text-[11px] font-semibold">Internal Notes</Label>
                <Textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Notes on communication, bus requirements, payment terms..."
                  className="text-xs mt-1"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${activeQueryDetail.phone}`}
                    className="p-2 rounded-lg border border-border text-foreground hover:bg-accent"
                    title="Call"
                  >
                    <Phone className="h-4 w-4" />
                  </a>
                  <a
                    href={`mailto:${activeQueryDetail.email}`}
                    className="p-2 rounded-lg border border-border text-foreground hover:bg-accent"
                    title="Email"
                  >
                    <Mail className="h-4 w-4" />
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateQueryMutation.mutate({ id: activeQueryDetail.id, update: { status: "CONVERTED" } })
                    }
                    className="text-xs text-emerald-600 hover:bg-emerald-50 border-emerald-300 font-bold"
                  >
                    Mark Converted
                  </Button>

                  <Button
                    size="sm"
                    onClick={() =>
                      updateQueryMutation.mutate({
                        id: activeQueryDetail.id,
                        update: {
                          internal_notes: editNotes,
                          assigned_to: editAssignedTo,
                          quotation_amount: editQuotation ? Number(editQuotation) : null,
                        },
                      })
                    }
                    disabled={updateQueryMutation.isPending}
                    className="text-xs font-bold bg-primary text-white"
                  >
                    Save Notes & Quote
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
