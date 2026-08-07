import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { useEffect } from "react";
import { BRAND } from "@/config/brand";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, Download, ShieldCheck, Mail, Phone, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Server Function ─────────────────────────────────────────────────────────
export const getInvoiceDetailsFn = createServerFn({ method: "GET" })
  .validator((bookingId: string) => bookingId)
  .handler(async ({ data: bookingId }) => {
    // 1. Fetch invoice from invoices table
    let { data: invoice } = await supabaseAdmin
      .from("invoices")
      .select("*")
      .or(`booking_id.eq.${bookingId},invoice_number.eq.${bookingId}`)
      .maybeSingle();

    let actualBookingId = bookingId;

    // Fallback to bookings table if no invoice row exists yet
    if (!invoice) {
      const { data: booking } = await supabaseAdmin
        .from("bookings")
        .select("id, booking_id, customer_name, phone, email, amount, discount_amount, coupon_discount, gst_rate, gst_amount, total_amount, amount_paid, departure_id")
        .or(`id.eq.${bookingId},booking_id.eq.${bookingId}`)
        .maybeSingle();

      if (booking) {
        actualBookingId = booking.id;
        let tripName = "Nomadik Road Trip";
        let departureDate = null;
        if (booking.departure_id) {
          const { data: dep } = await supabaseAdmin
            .from("departures")
            .select("departure_date, journeys(name)")
            .eq("id", booking.departure_id)
            .maybeSingle();
          if (dep) {
            departureDate = dep.departure_date;
            tripName = (dep as any).journeys?.name || "Nomadik Road Trip";
          }
        }

        const baseSubtotal = Number(booking.amount || 0);
        const discountVal = Number(booking.discount_amount || booking.coupon_discount || 0);
        const subtotalVal = Math.max(0, (baseSubtotal > 0 ? baseSubtotal : Number(booking.total_amount || 0)) - discountVal);
        const calculatedGst = booking.gst_amount > 0 ? booking.gst_amount : Math.round(subtotalVal * 0.05);
        const calculatedTotal = booking.total_amount > 0 ? booking.total_amount : subtotalVal + calculatedGst;

        invoice = {
          invoice_number: `NM-INV-${booking.booking_id || booking.id.slice(0, 8)}`,
          customer_name: booking.customer_name || "Explorer",
          customer_email: booking.email || "",
          customer_phone: booking.phone || "",
          customer_address: "Delhi/NCR",
          trip_name: tripName,
          departure_date: departureDate,
          subtotal: subtotalVal,
          amount: subtotalVal,
          discount_amount: discountVal,
          gst_rate: booking.gst_rate || 5,
          gst_amount: calculatedGst,
          total_amount: calculatedTotal,
          amount_paid: booking.amount_paid || calculatedTotal,
          balance_due: Math.max(0, calculatedTotal - (booking.amount_paid ?? calculatedTotal)),
          status: (booking.amount_paid || 0) > 0 ? "PAID" : "ISSUED",
          issued_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        } as any;
      }
    } else {
      actualBookingId = invoice.booking_id;
    }

    if (!invoice) {
      throw new Error("Invoice or associated booking could not be found.");
    }

    // 2. Fetch booking travellers
    let travellers: any[] = [];
    if (actualBookingId) {
      const { data: travellersData } = await supabaseAdmin
        .from("booking_travellers")
        .select("id, full_name, age, gender, is_primary")
        .eq("booking_id", actualBookingId)
        .order("is_primary", { ascending: false });
      travellers = travellersData || [];
    }

    // 3. Fetch transaction ID (payment)
    let paymentId = "";
    if (actualBookingId) {
      const { data: payment } = await supabaseAdmin
        .from("payments")
        .select("gateway_payment_id, transaction_id")
        .eq("booking_id", actualBookingId)
        .eq("status", "Paid")
        .maybeSingle();
      paymentId = payment?.gateway_payment_id || payment?.transaction_id || "";
    }

    return { invoice, travellers, paymentId };
  });

// ─── File Route ──────────────────────────────────────────────────────────────
export const Route = createFileRoute("/invoice/$id")({
  component: InvoiceDetailsPage,
});

function InvoiceDetailsPage() {
  const { id } = Route.useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["invoice_details", id],
    queryFn: () => getInvoiceDetailsFn({ data: id }),
  });

  useEffect(() => {
    if (data?.invoice) {
      // Auto open print dialog after brief delay for rendering
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F7F3] flex flex-col items-center justify-center font-poppins">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm mt-4 text-muted-foreground">Generating tax invoice details...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F8F7F3] flex flex-col items-center justify-center font-poppins text-center p-4">
        <h2 className="text-xl font-bold text-red-600 mb-2">Invoice Not Found</h2>
        <p className="text-sm text-muted-foreground mb-4">We could not load the invoice. Please check the URL or contact support.</p>
        <Button onClick={() => window.close()} className="bg-primary text-white">Close Window</Button>
      </div>
    );
  }

  const { invoice, travellers, paymentId } = data;
  const isPaid = invoice.status === "PAID" || invoice.amount_paid >= invoice.total_amount;

  return (
    <div className="min-h-screen bg-[#F8F7F3] py-8 px-4 font-poppins print:p-0 print:bg-white print:min-h-0">
      {/* Print styles */}
      <style>{`
        @media print {
          body {
            background-color: white;
            color: black;
            font-size: 12px;
          }
          .no-print {
            display: none !important;
          }
          .print-border-none {
            border: none !important;
          }
          .shadow-box {
            box-shadow: none !important;
            border: 1px solid #e5e7eb !important;
          }
        }
      `}</style>

      {/* Control bar */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between no-print bg-white p-4 rounded-2xl border shadow-sm">
        <Button variant="ghost" size="sm" onClick={() => window.close()} className="gap-1 text-xs">
          <ArrowLeft className="w-3.5 h-3.5" /> Close
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5 text-xs font-semibold">
            <Printer className="w-3.5 h-3.5" /> Print Invoice
          </Button>
          <Button size="sm" onClick={() => window.print()} className="bg-primary text-white gap-1.5 text-xs font-semibold">
            <Download className="w-3.5 h-3.5" /> Save PDF
          </Button>
        </div>
      </div>

      {/* Invoice Sheet */}
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border shadow-sm p-8 sm:p-12 shadow-box relative overflow-hidden">
        {/* Paid Watermark Stamp */}
        {isPaid && (
          <div className="absolute right-8 top-32 sm:right-16 sm:top-12 border-4 border-emerald-500 text-emerald-500 font-extrabold text-sm uppercase tracking-widest px-4 py-2 rounded-lg transform rotate-12 opacity-80 pointer-events-none">
            Paid
          </div>
        )}

        {/* Top Header Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b pb-8 border-gray-100">
          {/* Logo & Company details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-poppins font-black text-2xl tracking-tighter text-primary">{BRAND.name.toUpperCase()}</span>
              <span className="text-[10px] text-muted-foreground tracking-widest uppercase border-l pl-2 font-semibold">The Nomadic Traveller</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              Officially registered travel convoys and custom curated experiential journeys across India.
            </p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><Globe className="w-3 h-3 text-primary" /> {BRAND.website}</div>
              <div className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-primary" /> {BRAND.email}</div>
              <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-primary" /> {BRAND.phones[0]}</div>
            </div>
          </div>

          {/* Invoice Meta */}
          <div className="md:text-right space-y-2">
            <h1 className="text-xl font-bold text-gray-900 font-poppins">TAX INVOICE</h1>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between md:justify-end gap-4"><span className="text-muted-foreground">Invoice No:</span> <span className="font-semibold font-mono">{invoice.invoice_number}</span></div>
              <div className="flex justify-between md:justify-end gap-4"><span className="text-muted-foreground">Invoice Date:</span> <span className="font-semibold">{new Date(invoice.issued_at || invoice.created_at).toLocaleDateString("en-IN")}</span></div>
              {paymentId && (
                <div className="flex justify-between md:justify-end gap-4"><span className="text-muted-foreground">Payment ID:</span> <span className="font-semibold font-mono">{paymentId}</span></div>
              )}
              <div className="flex justify-between md:justify-end gap-4">
                <span className="text-muted-foreground">Status:</span> 
                <span className={cn("font-bold text-xs uppercase px-2 py-0.5 rounded-full border", isPaid ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200")}>
                  {isPaid ? "Paid" : "Issued / Unpaid"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer & Bill details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-b border-gray-100 text-xs">
          <div>
            <h3 className="font-bold text-gray-900 uppercase tracking-wider mb-2 text-muted-foreground text-[10px]">BILLED TO</h3>
            <p className="font-bold text-sm text-gray-800">{invoice.customer_name}</p>
            {invoice.customer_phone && <p className="text-muted-foreground mt-1">Phone: {invoice.customer_phone}</p>}
            {invoice.customer_email && <p className="text-muted-foreground">Email: {invoice.customer_email}</p>}
            {invoice.customer_address && <p className="text-muted-foreground mt-1">Pickup/Address: {invoice.customer_address}</p>}
          </div>

          <div>
            <h3 className="font-bold text-gray-900 uppercase tracking-wider mb-2 text-muted-foreground text-[10px]">JOURNEY DETAILS</h3>
            <p className="font-bold text-sm text-gray-800">{invoice.trip_name}</p>
            <p className="text-muted-foreground mt-1">
              Departure Date: <span className="font-semibold text-gray-800">{invoice.departure_date ? new Date(invoice.departure_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "TBA"}</span>
            </p>
            <p className="text-muted-foreground">
              HSN Code: <span className="font-semibold">998551</span> (Travel Arranger Services)
            </p>
          </div>
        </div>

        {/* Travellers Info list */}
        {travellers.length > 0 && (
          <div className="py-8 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 uppercase tracking-wider mb-4 text-muted-foreground text-[10px]">PASSENGER MANIFEST</h3>
            <div className="border rounded-2xl overflow-hidden bg-gray-50/50 print-border-none text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100/80 border-b text-gray-700 font-semibold">
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-4">Name</th>
                    <th className="py-2.5 px-4">Age / Gender</th>
                    <th className="py-2.5 px-4 text-right">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {travellers.map((traveller, index) => (
                    <tr key={traveller.id || index} className="text-gray-800">
                      <td className="py-2.5 px-4 font-semibold text-muted-foreground">{index + 1}</td>
                      <td className="py-2.5 px-4 font-bold">{traveller.full_name}</td>
                      <td className="py-2.5 px-4">{traveller.age ? `${traveller.age} Yrs` : "—"} / {traveller.gender || "—"}</td>
                      <td className="py-2.5 px-4 text-right font-semibold">
                        {traveller.is_primary ? "Primary Buyer" : "Co-Explorer"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pricing breakdown */}
        <div className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
          {/* Note section */}
          <div className="space-y-4">
            <div className="bg-[#F8F7F3] p-4 rounded-2xl border border-[#E4E2DA]/80 leading-relaxed text-muted-foreground print-border-none">
              <p className="font-bold text-gray-800 text-[10px] uppercase tracking-wider mb-1">CANCELLATION & REFUNDS</p>
              <p className="text-[10px]">
                Cancellations made more than 15 days prior to departure are eligible for a 100% refund.
                Between 7 to 15 days are eligible for a 50% refund. Cancellations made within 7 days are non-refundable.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure payment processed by Razorpay.
            </div>
          </div>

          {/* Totals Table */}
          <div className="space-y-2">
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-muted-foreground">Subtotal Base Amount</span>
              <span className="font-semibold">₹{Number(invoice.amount || invoice.subtotal || invoice.total_amount || 0).toLocaleString("en-IN")}</span>
            </div>
            
            {invoice.discount_amount > 0 && (
              <div className="flex justify-between py-1.5 text-emerald-600 border-b border-gray-50">
                <span>Coupon / Campaign Discount</span>
                <span>- ₹{Number(invoice.discount_amount).toLocaleString("en-IN")}</span>
              </div>
            )}

            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-muted-foreground">GST ({invoice.gst_rate ?? 5}%)</span>
              <span className="font-semibold">₹{Number(invoice.gst_amount).toLocaleString("en-IN")}</span>
            </div>

            <div className="flex justify-between py-2 text-base font-bold text-gray-900 border-b border-gray-100">
              <span>Total Gross Price</span>
              <span>₹{Number(invoice.total_amount).toLocaleString("en-IN")}</span>
            </div>

            <div className="flex justify-between py-1.5 font-semibold text-emerald-600 border-b border-gray-50">
              <span>Amount Paid</span>
              <span>₹{Number(invoice.amount_paid).toLocaleString("en-IN")}</span>
            </div>

            <div className="flex justify-between py-1.5 font-bold text-gray-900">
              <span>Balance Due</span>
              <span>₹{Number(invoice.balance_due).toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Print signature footer */}
        <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center text-[10px] text-muted-foreground">
          <p>© 2026 Nomadik Travels. All rights reserved. HSN Code 998551. Thank you for booking with us!</p>
          <div className="mt-4 sm:mt-0 text-center sm:text-right">
            <div className="w-32 h-1 border-b border-gray-300 mx-auto sm:ml-auto mb-2"></div>
            <p className="font-bold text-gray-700">Authorized Signatory</p>
            <p>Nomadik Travels</p>
          </div>
        </div>
      </div>
    </div>
  );
}
