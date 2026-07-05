import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Star, Check, X, MessageSquare, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/admin/reviews")({
  component: AdminReviews,
});

function AdminReviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          journeys (name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleApprove = async (id: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from("reviews")
        .update({ approved })
        .eq("id", id);

      if (error) throw error;
      toast.success(approved ? "Review approved" : "Review hidden");
      fetchReviews();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    }
  };

  const handleReply = async (id: string) => {
    if (!replyText.trim()) return;
    try {
      const { error } = await supabase
        .from("reviews")
        .update({ admin_reply: replyText })
        .eq("id", id);

      if (error) throw error;
      toast.success("Reply saved successfully");
      setReplyText("");
      setActiveReplyId(null);
      fetchReviews();
    } catch (err: any) {
      toast.error(err.message || "Failed to save reply");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-foreground">Review Moderation Center</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Approve or reject customer reviews, feature testimonials, and post official operator replies.
        </p>
      </div>

      {/* Moderation Queue */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading reviews queue...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground bg-white border border-border rounded-xl">
            No testimonials or reviews in queue.
          </div>
        ) : (
          reviews.map((rev) => (
            <div key={rev.id} className="bg-white border border-border p-5 rounded-xl space-y-4 shadow-none">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                    {rev.author_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{rev.author_name}</h3>
                    <p className="text-[10px] text-muted-foreground">Trip: <span className="font-bold text-foreground">{rev.journeys?.name || "General"}</span></p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-0.5 text-xs text-amber-500 font-bold">
                    <Star className="h-3.5 w-3.5 fill-current" /> {rev.rating} / 5
                  </span>
                  <Badge variant={rev.approved ? "default" : "secondary"}>
                    {rev.approved ? "Approved" : "Pending Approval"}
                  </Badge>
                </div>
              </div>

              {/* Review Content */}
              <p className="text-sm text-muted-foreground italic leading-relaxed">
                "{rev.content}"
              </p>

              {/* Official reply thread */}
              {rev.admin_reply && (
                <div className="bg-muted/30 p-3.5 border border-border rounded-lg text-xs space-y-1">
                  <p className="font-bold text-primary">Official Reply:</p>
                  <p className="text-muted-foreground">{rev.admin_reply}</p>
                </div>
              )}

              {/* Moderation Controls */}
              <div className="flex items-center justify-between pt-2 border-t border-border mt-3 text-xs">
                <div className="flex items-center gap-2">
                  {!rev.approved ? (
                    <Button size="sm" onClick={() => handleApprove(rev.id, true)} className="h-8 gap-1 text-xs bg-green-600 hover:bg-green-700">
                      <Check className="h-3.5 w-3.5" /> Approve
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => handleApprove(rev.id, false)} className="h-8 gap-1 text-xs text-destructive hover:text-destructive">
                      <X className="h-3.5 w-3.5" /> Unapprove
                    </Button>
                  )}
                  
                  <Button size="sm" variant="ghost" className="h-8 gap-1" onClick={() => setActiveReplyId(rev.id)}>
                    <MessageSquare className="h-3.5 w-3.5" /> Reply
                  </Button>
                </div>
              </div>

              {/* Reply Box */}
              {activeReplyId === rev.id && (
                <div className="space-y-2 pt-2 border-t border-border mt-3">
                  <Textarea
                    placeholder="Write official response..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={2}
                    className="text-xs"
                  />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => { setActiveReplyId(null); setReplyText(""); }}>Cancel</Button>
                    <Button size="sm" onClick={() => handleReply(rev.id)}>Save Reply</Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
