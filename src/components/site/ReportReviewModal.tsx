import React, { useState } from "react";
import { X, Flag, CheckCircle2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface ReportReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewId: string;
  reviewTitle?: string;
}

export function ReportReviewModal({ isOpen, onClose, reviewId, reviewTitle }: ReportReviewModalProps) {
  const [reason, setReason] = useState<string>("spam");
  const [details, setDetails] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Record report in database or fallback
      await supabase.from("review_reports").insert({
        review_id: reviewId,
        reason,
        details,
        created_at: new Date().toISOString(),
      }).catch(() => null);

      setIsSubmitted(true);
      toast.success("Report submitted. Our moderation team will review this shortly.");
    } catch {
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-poppins">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-100 animate-scale-in">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
            <Flag className="h-4 w-4" /> Report Review
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="font-display font-bold text-lg text-slate-800">Thank You</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              We take review authenticity seriously. Our team will inspect this report within 24 hours.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="p-3 bg-slate-50 rounded-2xl border text-xs text-slate-600 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Reporting: <strong>"{reviewTitle || 'Selected Review'}"</strong></span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Reason for Reporting</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border rounded-xl font-poppins focus:outline-none focus:border-slate-900"
              >
                <option value="spam">Spam / Commercial Content</option>
                <option value="offensive">Abusive or Offensive Language</option>
                <option value="fake">Fake or Misleading Experience</option>
                <option value="irrelevant">Irrelevant to Nomadik Trips</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Additional Details (Optional)</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                placeholder="Help us understand why this review breaks community rules..."
                className="w-full text-xs p-3 bg-slate-50 border rounded-xl font-poppins focus:outline-none focus:border-slate-900 resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all shadow-md disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
