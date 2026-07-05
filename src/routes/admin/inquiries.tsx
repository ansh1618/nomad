import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Phone,
  MessageSquare,
  UserPlus,
  Loader2,
  Calendar,
  CheckCircle,
} from "lucide-react";

export const Route = createFileRoute("/admin/inquiries")({
  component: AdminInquiries,
});

const PIPELINE_STATUSES = [
  { id: "NEW", label: "New Lead", color: "bg-blue-500/10 border-blue-500/20 text-blue-500" },
  { id: "CONTACTED", label: "Contacted", color: "bg-yellow-500/10 border-yellow-500/20 text-yellow-500" },
  { id: "INTERESTED", label: "Interested", color: "bg-purple-500/10 border-purple-500/20 text-purple-500" },
  { id: "PAYMENT_PENDING", label: "Payment Pending", color: "bg-orange-500/10 border-orange-500/20 text-orange-500" },
  { id: "BOOKED", label: "Booked", color: "bg-green-500/10 border-green-500/20 text-green-500" },
];

function AdminInquiries() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("inquiries")
        .select(`
          *,
          destinations (name),
          journeys (name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInquiries(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("inquiries")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;
      toast.success("Lead status updated");
      fetchInquiries();
    } catch (err: any) {
      toast.error(err.message || "Failed to update lead status");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-foreground">Inquiry & Lead Pipeline</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Follow up with prospects, mark leads contacted, and convert inquiries to bookings.
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading Lead Pipeline...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {PIPELINE_STATUSES.map((column) => {
            const columnLeads = inquiries.filter(i => i.status === column.id);
            return (
              <div key={column.id} className="bg-muted/30 p-3 rounded-xl border border-border flex flex-col min-w-[250px] max-h-[70vh]">
                <div className="flex justify-between items-center mb-3 px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{column.label}</span>
                  <Badge variant="secondary" className="text-[10px] font-bold">{columnLeads.length}</Badge>
                </div>

                <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                  {columnLeads.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-6 bg-white/40 rounded border border-dashed">No leads here</p>
                  ) : (
                    columnLeads.map((lead) => (
                      <Card key={lead.id} className="border border-border shadow-none hover:shadow-soft transition-shadow">
                        <CardContent className="p-3.5 space-y-3">
                          <div>
                            <p className="font-semibold text-sm">{lead.name}</p>
                            <p className="text-xs text-muted-foreground">{lead.phone}</p>
                          </div>

                          <div className="text-xs space-y-1 border-t border-border pt-2 text-muted-foreground">
                            <p>Trip: <span className="text-foreground font-semibold">{lead.journeys?.name || lead.destinations?.name || "General"}</span></p>
                            <p className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(lead.created_at).toLocaleDateString('en-IN')}</p>
                          </div>

                          {lead.message && (
                            <p className="text-xs bg-muted/50 p-2 rounded italic text-muted-foreground line-clamp-2">"{lead.message}"</p>
                          )}

                          {/* Quick buttons */}
                          <div className="flex gap-1.5 justify-end border-t border-border pt-2">
                            <a href={`tel:${lead.phone}`} title="Call Customer">
                              <Button size="icon" variant="outline" className="h-7 w-7 rounded-md">
                                <Phone className="h-3.5 w-3.5" />
                              </Button>
                            </a>
                            <a href={`https://wa.me/${lead.phone}`} target="_blank" title="WhatsApp Message">
                              <Button size="icon" variant="outline" className="h-7 w-7 rounded-md text-green-600 hover:text-green-700">
                                <MessageSquare className="h-3.5 w-3.5" />
                              </Button>
                            </a>

                            {column.id !== "BOOKED" && (
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => {
                                  const nextStatusIdx = PIPELINE_STATUSES.findIndex(s => s.id === column.id) + 1;
                                  if (nextStatusIdx < PIPELINE_STATUSES.length) {
                                    updateStatus(lead.id, PIPELINE_STATUSES[nextStatusIdx].id);
                                  }
                                }}
                                className="h-7 w-7 rounded-md text-primary"
                                title="Move Forward"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
