import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Send, Phone, MessageSquare, Download, CreditCard } from "lucide-react";

export const Route = createFileRoute("/admin/bookings_/$id")({
  component: BookingDetailPage,
});

const STATUS_COLORS: Record<string, string> = {
  CREATED: "bg-gray-100 text-gray-700",
  SEAT_LOCKED: "bg-purple-100 text-purple-700",
  PAYMENT_PENDING: "bg-yellow-100 text-yellow-700",
  PARTIAL_PAID: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-green-100 text-green-700",
  CHECKED_IN: "bg-teal-100 text-teal-700",
  COMPLETED: "bg-indigo-100 text-indigo-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-orange-100 text-orange-700",
};

function BookingDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [status, setStatus] = useState("");

  const fetchBookingDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          users (*),
          departures (
            departure_date,
            return_date,
            journeys (name, duration, pickup_point, drop_point)
          ),
          booking_travellers (*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setBooking(data);
      setStatus(data.status || "");
    } catch (err: any) {
      toast.error(err.message || "Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingDetails();
  }, [id]);

  const handleUpdateStatus = async () => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      toast.success("Booking status updated successfully");
      fetchBookingDetails();
    } catch (err: any) {
      toast.error(err.message || "Failed to update booking status");
    } finally {
      setUpdating(false);
    }
  };

  const sendWhatsAppTicket = () => {
    if (!booking?.users?.phone) return;
    const msg = `Hi ${booking.users.full_name}, your booking for ${booking.departures?.journeys?.name} is confirmed! Booking ID: ${booking.booking_id}.`;
    const url = `https://wa.me/${booking.users.phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading details...</p>
      </div>
    );
  }

  if (!booking) return <div className="p-8 text-center text-muted-foreground">Booking not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/admin/bookings" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-poppins text-foreground flex items-center gap-3">
            <span>Booking Details: {booking.booking_id}</span>
            <Badge className={`${STATUS_COLORS[booking.status]} text-xs border-0`}>
              {booking.status.replace("_", " ")}
            </Badge>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Summary and travellers details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Journey Summary */}
          <div className="bg-white border border-border p-6 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold border-b border-border pb-2">Trip Configuration</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <Label className="text-muted-foreground uppercase">Package</Label>
                <p className="font-semibold text-sm mt-0.5">{booking.departures?.journeys?.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground uppercase">Duration</Label>
                <p className="font-semibold text-sm mt-0.5">{booking.departures?.journeys?.duration}</p>
              </div>
              <div>
                <Label className="text-muted-foreground uppercase">Departure</Label>
                <p className="font-semibold text-sm mt-0.5">{new Date(booking.departures?.departure_date).toLocaleDateString('en-IN')}</p>
              </div>
              <div>
                <Label className="text-muted-foreground uppercase">Return</Label>
                <p className="font-semibold text-sm mt-0.5">{new Date(booking.departures?.return_date).toLocaleDateString('en-IN')}</p>
              </div>
            </div>
          </div>

          {/* Travellers List */}
          <div className="bg-white border border-border p-6 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold border-b border-border pb-2">Travellers Details</h3>
            <div className="space-y-4">
              {booking.booking_travellers?.map((traveller: any, idx: number) => (
                <div key={traveller.id} className="p-4 border border-border rounded-lg bg-muted/15 space-y-2">
                  <p className="font-semibold text-sm">Explorer {idx + 1}: {traveller.full_name} {traveller.is_primary && <Badge className="ml-1 bg-primary text-[10px]">Primary</Badge>}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
                    <p>Phone: <span className="text-foreground">{traveller.phone || "N/A"}</span></p>
                    <p>Email: <span className="text-foreground">{traveller.email || "N/A"}</span></p>
                    <p>Gender/DOB: <span className="text-foreground">{traveller.gender || "N/A"} / {traveller.dob || "N/A"}</span></p>
                    <p>Aadhaar: <span className="text-foreground">{traveller.aadhaar_number || "N/A"}</span></p>
                    <p>Passport: <span className="text-foreground">{traveller.passport_number || "N/A"}</span></p>
                    <p>Food: <span className="text-foreground">{traveller.food_preference || "N/A"}</span></p>
                  </div>
                  {traveller.medical_conditions && (
                    <p className="text-xs text-red-500 font-semibold bg-red-500/5 p-2 rounded">Medical Condition: {traveller.medical_conditions}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Financials & Status Management */}
        <div className="space-y-6">
          
          {/* Status Controls */}
          <div className="bg-white border border-border p-6 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold border-b border-border pb-2">Admin Actions</h3>
            <div className="space-y-3">
              <div>
                <Label>Update Status</Label>
                <div className="flex gap-2 mt-1.5">
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(STATUS_COLORS).map(s => (
                        <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleUpdateStatus} disabled={updating}>
                    {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={sendWhatsAppTicket} className="gap-1.5 text-xs text-green-600 hover:text-green-700">
                  <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Download className="h-3.5 w-3.5" /> Invoice
                </Button>
              </div>
            </div>
          </div>

          {/* Pricing & GST details */}
          <div className="bg-white border border-border p-6 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold border-b border-border pb-2">Financial Breakdown</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Amount</span>
                <span className="font-semibold">₹{Number(booking.base_amount).toLocaleString("en-IN")}</span>
              </div>
              {booking.addon_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Add-on experiences</span>
                  <span className="font-semibold">₹{Number(booking.addon_amount).toLocaleString("en-IN")}</span>
                </div>
              )}
              {booking.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>- ₹{Number(booking.discount_amount).toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST (5%)</span>
                <span className="font-semibold">₹{Number(booking.gst_amount).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-sm font-bold text-foreground">
                <span>Total Amount</span>
                <span>₹{Number(booking.total_amount).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-green-600">
                <span>Amount Paid</span>
                <span>₹{Number(booking.amount_paid).toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
