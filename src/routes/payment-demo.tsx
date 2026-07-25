import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Terminal,
  ArrowRight,
  Database,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";

export const Route = createFileRoute("/payment-demo")({
  head: () => ({
    meta: [
      { title: "Razorpay Standard Checkout Playground | Nomadik" },
      { name: "description", content: "Test and verify Razorpay payment gateway integration." },
    ],
  }),
  component: PaymentDemoRoute,
});

function PaymentDemoRoute() {
  const [amountInInr, setAmountInInr] = useState("10.00"); // Default 10 INR (1000 paise)
  const [receiptId, setReceiptId] = useState("");
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [status, setStatus] = useState<"idle" | "creating" | "paying" | "verifying" | "success" | "failed">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Detailed Logs for Debugging
  const [logs, setLogs] = useState<Array<{ time: string; type: "info" | "success" | "error" | "api"; message: string; data?: any }>>([]);

  const addLog = (type: "info" | "success" | "error" | "api", message: string, data?: any) => {
    setLogs((prev) => [
      {
        time: new Date().toLocaleTimeString(),
        type,
        message,
        data,
      },
      ...prev,
    ]);
  };

  // Helper to load Razorpay script
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.id = "razorpay-checkout-script";
      script.onload = () => {
        addLog("info", "Razorpay JS SDK loaded successfully.");
        resolve(true);
      };
      script.onerror = () => {
        addLog("error", "Failed to load Razorpay JS SDK.");
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  // Fetch recent bookings from Supabase
  const fetchRecentBookings = async () => {
    setIsLoadingBookings(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, booking_id, total_amount, booking_status, created_at")
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      setBookings(data || []);
      addLog("info", "Fetched recent bookings from Supabase database.", data);
    } catch (err: any) {
      console.error(err);
      addLog("error", `Failed to fetch bookings: ${err.message}`);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchRecentBookings();
    setReceiptId(`rcpt_demo_${Math.floor(Math.random() * 100000)}`);
  }, []);

  const handleDemoPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("creating");
    setErrorMsg("");
    setLogs([]);

    const amountInPaise = Math.round(parseFloat(amountInInr) * 100);
    if (isNaN(amountInPaise) || amountInPaise < 100) {
      setStatus("failed");
      setErrorMsg("Amount must be at least 100 paise (₹1.00)");
      addLog("error", "Validation failed: Amount is below 100 paise.");
      return;
    }

    addLog("info", `Initiating payment flow. Amount: ₹${amountInInr} (${amountInPaise} paise)`);

    try {
      // 1. Create order on backend
      addLog("api", "Calling Backend API POST /api/create-order...", {
        amount: amountInPaise,
        currency: "INR",
        receipt: receiptId,
      });

      const createRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: "INR",
          receipt: receiptId,
        }),
      });

      const orderData = await createRes.json();

      if (!createRes.ok) {
        throw new Error(orderData.error || `Server returned status ${createRes.status}`);
      }

      addLog("success", "Backend order created successfully.", orderData);
      setStatus("paying");

      // 2. Load Razorpay JS SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Could not load Razorpay SDK. Please check your network connection.");
      }

      // 3. Open Razorpay Checkout Modal
      addLog("info", "Opening Razorpay checkout modal...");
      const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;

      if (!keyId) {
        addLog("error", "VITE_RAZORPAY_KEY_ID environment variable is missing on client.");
        toast.warning("VITE_RAZORPAY_KEY_ID not found. Razorpay might fail to open.");
      }

      const options = {
        key: keyId || "rzp_test_THglveAvyMzLiC", // fallback
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Nomadik Travels",
        description: selectedBookingId 
          ? `Booking Confirmation (${selectedBookingId.slice(0, 8)})`
          : "Razorpay Standard Checkout Test",
        order_id: orderData.order_id,
        handler: async function (response: any) {
          addLog("success", "Payment successful on Razorpay gateway.", response);
          setStatus("verifying");

          // 4. Send signature to backend verification endpoint
          try {
            addLog("api", "Calling Backend API POST /api/verify-payment...", {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              booking_id: selectedBookingId || undefined,
            });

            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                booking_id: selectedBookingId || undefined,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok) {
              throw new Error(verifyData.error || "Payment signature verification failed.");
            }

            addLog("success", "Backend verified signature successfully! Booking updated.", verifyData);
            setStatus("success");
            toast.success("Payment verified and confirmed!");
            fetchRecentBookings(); // refresh booking statuses
          } catch (verifyErr: any) {
            console.error(verifyErr);
            addLog("error", `Verification failed: ${verifyErr.message}`);
            setErrorMsg(verifyErr.message);
            setStatus("failed");
          }
        },
        prefill: {
          name: "Nomadik Explorer",
          email: "explorer@nomadik.co.in",
          contact: "9999999999",
        },
        theme: {
          color: "#E06A42", // Brand secondary color
        },
        modal: {
          ondismiss: function () {
            addLog("error", "Checkout process cancelled by the user.");
            setErrorMsg("Payment process was cancelled.");
            setStatus("failed");
            toast.error("Payment cancelled.");
          },
        },
      };

      // @ts-expect-error window.Razorpay constructor is dynamic
      const rzp = new (window as any).Razorpay(options);

      rzp.on("payment.failed", function (response: any) {
        addLog("error", `Payment failed: ${response.error.description}`, response.error);
        setErrorMsg(`Payment failed: ${response.error.description}`);
        setStatus("failed");
        toast.error("Payment failed.");
      });

      rzp.open();
    } catch (err: any) {
      console.error(err);
      addLog("error", `Process error: ${err.message}`);
      setErrorMsg(err.message);
      setStatus("failed");
    }
  };

  return (
    <div className="bg-[#FAF8F5] min-h-screen flex flex-col justify-between">
      <Navbar />
      <main className="pt-28 pb-20 font-sans max-w-7xl mx-auto px-5 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Payment Form & Details */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-border/60 rounded-[24px] p-6 sm:p-8 shadow-soft space-y-6">
            <div>
              <span className="text-[11px] font-poppins font-bold uppercase tracking-widest text-[#E06A42]">
                Developer Tools
              </span>
              <h1 className="text-3xl font-display font-bold text-primary mt-1">
                Razorpay Checkout Integration
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                Use this playground to verify the REST API endpoints and Razorpay modal loading.
              </p>
            </div>

            {/* Status alerts */}
            {status === "success" && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-[16px] p-4 flex gap-3 items-start animate-fade-in">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs font-poppins">
                  <p className="font-bold text-emerald-950">Payment Verified!</p>
                  <p className="mt-1">
                    The backend correctly verified the HMAC-SHA256 signature.
                    {selectedBookingId && " The booking status was updated to CONFIRMED."}
                  </p>
                </div>
              </div>
            )}

            {status === "failed" && (
              <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-[16px] p-4 flex gap-3 items-start animate-fade-in">
                <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs font-poppins">
                  <p className="font-bold text-rose-950">Checkout Failed</p>
                  <p className="mt-1">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Checkout Form */}
            <form onSubmit={handleDemoPayment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold font-poppins text-muted-foreground uppercase tracking-wider block">
                    Amount (INR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1.00"
                    value={amountInInr}
                    onChange={(e) => setAmountInInr(e.target.value)}
                    required
                    disabled={status === "creating" || status === "paying" || status === "verifying"}
                    className="w-full bg-muted/20 border border-border/80 px-4 py-3 rounded-[12px] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <span className="text-[10px] text-muted-foreground/80 font-poppins">
                    Minimum ₹1.00 (converted to 100 paise)
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold font-poppins text-muted-foreground uppercase tracking-wider block">
                    Receipt ID
                  </label>
                  <input
                    type="text"
                    value={receiptId}
                    onChange={(e) => setReceiptId(e.target.value)}
                    required
                    disabled={status === "creating" || status === "paying" || status === "verifying"}
                    className="w-full bg-muted/20 border border-border/80 px-4 py-3 rounded-[12px] font-mono text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Optional Booking Selection */}
              <div className="bg-muted/30 border border-border/60 rounded-[16px] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold font-poppins text-primary uppercase tracking-wider flex items-center gap-2">
                    <Database className="h-4 w-4 text-accent" /> Associate with Supabase Booking (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={fetchRecentBookings}
                    disabled={isLoadingBookings}
                    className="text-xs text-accent hover:text-[#c4522c] flex items-center gap-1 font-semibold transition-colors"
                  >
                    <RefreshCw className={`h-3 w-3 ${isLoadingBookings ? "animate-spin" : ""}`} /> Refresh
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground font-poppins">
                  Select a booking. On successful payment, the backend will update this booking status and show it confirmed in the Admin Panel.
                </p>

                <select
                  value={selectedBookingId}
                  onChange={(e) => {
                    setSelectedBookingId(e.target.value);
                    const booking = bookings.find((b) => b.id === e.target.value);
                    if (booking) {
                      setAmountInInr(String(booking.total_amount || "10.00"));
                    }
                  }}
                  disabled={status === "creating" || status === "paying" || status === "verifying" || isLoadingBookings}
                  className="w-full bg-white border border-border/80 px-3 py-2.5 rounded-[12px] text-xs font-poppins focus:outline-none"
                >
                  <option value="">-- No booking (Test signature validation only) --</option>
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.booking_id || b.id.slice(0, 8)} | Total: ₹{b.total_amount?.toLocaleString() || "0"} | Status: {b.booking_status}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={status === "creating" || status === "paying" || status === "verifying"}
                className="w-full h-[54px] rounded-[16px] bg-[#E06A42] hover:bg-[#c4522c] active:scale-[0.99] disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-2.5 shadow-md transition-all duration-200"
              >
                {status === "creating" && (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Creating Order...</span>
                  </>
                )}
                {status === "paying" && (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Awaiting Payment...</span>
                  </>
                )}
                {status === "verifying" && (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Verifying Signature...</span>
                  </>
                )}
                {status !== "creating" && status !== "paying" && status !== "verifying" && (
                  <>
                    <CreditCard className="h-5 w-5" />
                    <span>Pay ₹{parseFloat(amountInInr || "0").toLocaleString("en-IN")} Securely</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Integration Specs Helper */}
          <div className="bg-white border border-border/60 rounded-[24px] p-6 shadow-soft space-y-4">
            <h2 className="font-display text-lg font-bold text-primary flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-accent" /> Integration Checklist
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-poppins">
              <div className="p-3 bg-ocean/5 rounded-[12px] border border-ocean/10">
                <span className="font-bold text-ocean block mb-1">Backend Enpoints</span>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li><code>POST /api/create-order</code></li>
                  <li><code>POST /api/verify-payment</code></li>
                </ul>
              </div>
              <div className="p-3 bg-ocean/5 rounded-[12px] border border-ocean/10">
                <span className="font-bold text-ocean block mb-1">Frontend Script</span>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground font-mono">
                  <li>checkout.js loaded</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Terminal / Request Logs */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-[#121214] text-gray-300 rounded-[24px] p-6 shadow-soft font-mono flex-grow flex flex-col justify-between max-h-[600px] border border-gray-800">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2 text-xs">
                <Terminal className="h-4 w-4 text-emerald-500" />
                <span className="font-bold text-emerald-500">PAYMENT LOG CONSOLE</span>
              </div>
              <span className="text-[10px] text-gray-500">Live API Requests</span>
            </div>

            <div className="flex-grow overflow-y-auto space-y-4 my-4 pr-1 text-xs select-text scrollbar-thin">
              {logs.length === 0 ? (
                <div className="text-gray-600 text-center py-20 italic">
                  Await payment trigger. Real-time REST API requests, responses, and gateway state changes will be logged here.
                </div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="space-y-1 animate-fade-in">
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="text-gray-500">[{log.time}]</span>
                      <span
                        className={`font-bold uppercase ${
                          log.type === "success"
                            ? "text-emerald-500"
                            : log.type === "error"
                              ? "text-rose-500"
                              : log.type === "api"
                                ? "text-amber-500"
                                : "text-sky-400"
                        }`}
                      >
                        {log.type}
                      </span>
                      <span>— {log.message}</span>
                    </div>
                    {log.data && (
                      <pre className="bg-[#1C1C1F] text-gray-400 p-2.5 rounded-[8px] text-[10px] overflow-x-auto border border-gray-800 max-w-full">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-gray-800 text-[10px] text-gray-500 flex justify-between">
              <span>SYSTEM: READY</span>
              <span>NOMADIK INTEGRATION</span>
            </div>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}
