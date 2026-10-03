import { useState, useRef } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  GraduationCap,
  ShieldCheck,
  UploadCloud,
  FileCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Info,
  Lock,
  FileText,
  Trash2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  getUserStudentVerification,
  submitStudentVerification,
} from "@/lib/college-trips/service";
import { uploadStudentDocumentFn } from "@/lib/college-trips/server-fns";

export const Route = createFileRoute("/student-verification")({
  head: () => ({
    meta: [
      { title: "Student Status Verification — GoNomadik" },
      {
        name: "description",
        content: "Verify your college enrollment to unlock up to 25% student travel discounts on GoNomadik.",
      },
    ],
  }),
  component: StudentVerificationPage,
});

function StudentVerificationPage() {
  const { user, profile, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [collegeEmail, setCollegeEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [studentIdNumber, setStudentIdNumber] = useState("");
  const [courseProgram, setCourseProgram] = useState("");
  const [graduationYear, setGraduationYear] = useState<number>(new Date().getFullYear() + 1);
  const [documentType, setDocumentType] = useState<"ID_CARD" | "ENROLLMENT_DOC" | "COLLEGE_EMAIL_PROOF" | "OTHER">(
    "ID_CARD"
  );

  // Document Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>("");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadedDocMeta, setUploadedDocMeta] = useState<{
    filePath: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  } | null>(null);

  // 1. Fetch Program Settings
  const { data: settings } = useQuery({
    queryKey: ["student_offer_settings"],
    queryFn: getStudentOfferSettings,
  });

  // 2. Fetch User Verification Status
  const { data: verification, isLoading: verificationLoading } = useQuery({
    queryKey: ["user_student_verification", user?.id, user?.email],
    queryFn: () => getUserStudentVerification(user?.id, user?.email),
    enabled: !!user,
  });

  // Pre-fill profile info if available
  useState(() => {
    if (profile?.full_name) setFullName(profile.full_name);
    if (profile?.phone) setPhone(profile.phone);
  });

  // Handle File Selection with client-side validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large. Maximum allowed size is 10MB.");
      return;
    }

    // Validate MIME type
    const validMimes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validMimes.includes(file.type)) {
      toast.error("Invalid file format. Please upload JPG, PNG, WEBP, or PDF.");
      return;
    }

    setSelectedFile(file);

    // Read to Base64
    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit Verification Mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!fullName.trim() || !collegeName.trim() || !studentIdNumber.trim() || !courseProgram.trim()) {
        throw new Error("Please complete all required fields.");
      }

      if (!selectedFile || !fileBase64) {
        throw new Error("Please upload a student verification document (College ID Card or Enrollment Proof).");
      }

      setUploadingDoc(true);

      // 1. Secure server upload to private storage
      const uploadRes = await uploadStudentDocumentFn({
        data: {
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileBase64,
          userId: user?.id,
        },
      });

      // 2. Submit verification record
      return await submitStudentVerification({
        userId: user?.id || null,
        fullName,
        collegeName,
        collegeEmail: collegeEmail || null,
        email: user?.email || profile?.email || "guest@nomadik.in",
        phone: phone || profile?.phone || null,
        studentIdNumber,
        courseProgram,
        graduationYear: Number(graduationYear),
        documents: [
          {
            documentType,
            filePath: uploadRes.filePath,
            fileName: uploadRes.fileName,
            fileSize: uploadRes.fileSize,
            mimeType: uploadRes.mimeType,
          },
        ],
      });
    },
    onSuccess: (res) => {
      setUploadingDoc(false);
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ["user_student_verification"] });
      queryClient.invalidateQueries({ queryKey: ["student_verifications"] });
    },
    onError: (err: any) => {
      setUploadingDoc(false);
      toast.error(err.message || "Failed to submit verification.");
    },
  });

  const maxDiscountPct = settings?.maximum_discount_percentage ?? 25;

  return (
    <div className="min-h-screen bg-background text-foreground font-poppins">
      <Navbar />

      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Header Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link to="/college-trips" className="hover:text-primary transition-colors">
            College Trips
          </Link>
          <span>/</span>
          <span className="text-foreground font-bold">Student Verification</span>
        </div>

        {/* Verification Status Banner if already submitted */}
        {isAuthenticated && verification && (
          <div className="mb-8">
            {verification.status === "VERIFIED" && (
              <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 text-emerald-600 grid place-items-center shrink-0">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-display uppercase tracking-wide text-emerald-800">
                      ✓ Student status verified
                    </h3>
                    <p className="text-xs text-emerald-700/90 mt-1">
                      Enrolled at <strong>{verification.college_name}</strong> ({verification.course_program}). Valid until{" "}
                      <strong>{new Date(verification.expires_at || "").toLocaleDateString("en-IN")}</strong>.
                    </p>
                    <p className="text-[11px] text-emerald-600 mt-0.5">
                      Your student discounts are active and will automatically apply to eligible trip packages.
                    </p>
                  </div>
                </div>

                <Button
                  asChild
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-soft shrink-0"
                >
                  <Link to="/college-trips">Browse Student Trips →</Link>
                </Button>
              </div>
            )}

            {verification.status === "PENDING" && (
              <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-950 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-amber-500/20 text-amber-600 grid place-items-center shrink-0">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-display uppercase tracking-wide text-amber-900">
                      Your student verification is under review
                    </h3>
                    <p className="text-xs text-amber-800/90 mt-1">
                      Submitted on {new Date(verification.created_at).toLocaleDateString("en-IN")} for{" "}
                      <strong>{verification.college_name}</strong>.
                    </p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Our verification team usually reviews submissions within 2–6 hours. You will receive access as soon as it is approved.
                    </p>
                  </div>
                </div>

                <Button
                  asChild
                  variant="outline"
                  className="border-amber-300 text-amber-900 hover:bg-amber-100 font-bold text-xs rounded-xl shrink-0"
                >
                  <Link to="/college-trips">Explore Trips Meanwhile</Link>
                </Button>
              </div>
            )}

            {verification.status === "REJECTED" && (
              <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/30 text-red-950 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-red-500/20 text-red-600 grid place-items-center shrink-0">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-display uppercase tracking-wide text-red-900">
                      Verification could not be approved. Please submit valid student credentials.
                    </h3>
                    <p className="text-xs text-red-800/90 mt-1">
                      Reason: <strong>{verification.rejection_reason || "Document was blurry or could not verify active enrollment."}</strong>
                    </p>
                    <p className="text-[11px] text-red-700 mt-0.5">
                      You can submit a clearer photo of your college ID card or current fee receipt below.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {verification.status === "EXPIRED" && (
              <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-950 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-rose-500/20 text-rose-600 grid place-items-center shrink-0">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-display uppercase tracking-wide text-rose-900">
                      Your student verification has expired. Please verify again.
                    </h3>
                    <p className="text-xs text-rose-800/90 mt-1">
                      Student discount validity is issued for {verification.validity_days || 365} days. Please re-submit your current college credentials to renew your discount.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Not Logged In Warning Card */}
        {!isAuthenticated && (
          <div className="mb-8 p-6 rounded-3xl bg-card border border-[#C8A96A]/30 shadow-elegant flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
            <div className="space-y-1">
              <h3 className="text-base font-bold font-display text-foreground">
                Login Required for Student Verification
              </h3>
              <p className="text-xs text-muted-foreground">
                Your student discount is tied to your verified GoNomadik account. Please sign in or create an account to begin.
              </p>
            </div>

            <Button
              onClick={() => triggerNomadikAuth({ mode: "login", returnTo: "/student-verification" })}
              className="bg-gold-gradient text-gold-foreground font-bold text-xs px-6 py-2.5 rounded-xl shadow-soft shrink-0 hover:brightness-105"
            >
              LOGIN / SIGN UP
            </Button>
          </div>
        )}

        {/* Verification Form Card (Only show if new, rejected, expired, or user wants to re-verify) */}
        {(!verification || verification.status === "REJECTED" || verification.status === "EXPIRED") && (
          <div className="rounded-3xl bg-card border border-border shadow-elegant overflow-hidden">
            {/* Card Header */}
            <div className="p-6 sm:p-8 border-b border-border bg-gradient-to-r from-primary/5 via-card to-card">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F2942]/10 border border-[#C8A96A]/20 text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                <GraduationCap className="h-4 w-4 text-[#C8A96A]" />
                <span>Student Verification Portal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                Verify Your Student Credentials
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Verified college students unlock exclusive prices up to {maxDiscountPct}% below regular trip rates. Documents are securely stored in private storage.
              </p>
            </div>

            {/* Form Body */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitMutation.mutate();
              }}
              className="p-6 sm:p-8 space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Full Legal Name *</Label>
                  <Input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="As shown on college ID"
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">College / University Name *</Label>
                  <Input
                    required
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="e.g. St. Stephen's College / IIT Delhi / BPIT"
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    College / Institutional Email (Optional)
                  </Label>
                  <Input
                    type="email"
                    value={collegeEmail}
                    onChange={(e) => setCollegeEmail(e.target.value)}
                    placeholder="e.g. yourname@college.ac.in"
                    className="rounded-xl text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">Faster verification if you have an official college email.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Phone Number *</Label>
                  <Input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Student ID / Roll / Enrollment No. *</Label>
                  <Input
                    required
                    value={studentIdNumber}
                    onChange={(e) => setStudentIdNumber(e.target.value)}
                    placeholder="e.g. 2023-CS-042"
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Course / Degree Program *</Label>
                  <Input
                    required
                    value={courseProgram}
                    onChange={(e) => setCourseProgram(e.target.value)}
                    placeholder="e.g. B.Tech / B.A. Economics / MBA"
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Graduation Year *</Label>
                  <Select
                    value={String(graduationYear)}
                    onValueChange={(val) => setGraduationYear(Number(val))}
                  >
                    <SelectTrigger className="rounded-xl text-xs">
                      <SelectValue placeholder="Graduation Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {[2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          Class of {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Document Upload Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground">
                    Verification Evidence Document *
                  </Label>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3 text-emerald-600" /> Private & Secure
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1 space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground">Document Type</Label>
                    <Select
                      value={documentType}
                      onValueChange={(v: any) => setDocumentType(v)}
                    >
                      <SelectTrigger className="rounded-xl text-xs">
                        <SelectValue placeholder="Document Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ID_CARD">College ID Card</SelectItem>
                        <SelectItem value="ENROLLMENT_DOC">Enrollment Letter / Fee Receipt</SelectItem>
                        <SelectItem value="COLLEGE_EMAIL_PROOF">Official Email Verification Proof</SelectItem>
                        <SelectItem value="OTHER">Other Proof of Enrollment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                        selectedFile
                          ? "border-emerald-500/50 bg-emerald-500/5"
                          : "border-border hover:border-gold/50 bg-muted/20"
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      {selectedFile ? (
                        <div className="flex items-center justify-between gap-3 text-left">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-600">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-foreground truncate max-w-xs">{selectedFile.name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type || "Document"}
                              </p>
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFile(null);
                              setFileBase64("");
                            }}
                            className="text-destructive hover:bg-destructive/10 text-xs"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <UploadCloud className="h-8 w-8 text-muted-foreground mx-auto" />
                          <p className="text-xs font-semibold text-foreground">
                            Click to upload your College ID or Fee Receipt
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Supports JPG, PNG, WEBP, or PDF (Max 10MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Privacy Notice */}
              <div className="rounded-2xl bg-muted/40 p-4 border border-border text-[11px] text-muted-foreground flex items-start gap-2.5">
                <Lock className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Privacy Guarantee:</strong> Uploaded student documents are stored in secure private storage and accessed exclusively by authorized GoNomadik compliance reviewers. Documents are never exposed publicly or shared with third parties.
                </p>
              </div>

              {/* Submit CTA */}
              <Button
                type="submit"
                disabled={submitMutation.isPending || uploadingDoc || !isAuthenticated}
                className="w-full bg-gold-gradient text-gold-foreground font-bold text-sm py-6 rounded-2xl shadow-soft hover:brightness-105 transition-all"
              >
                {submitMutation.isPending || uploadingDoc ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Uploading & Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> SUBMIT FOR STUDENT VERIFICATION
                  </span>
                )}
              </Button>
            </form>
          </div>
        )}
      </main>

      <Footer />
      <FloatingUI />
    </div>
  );
}
