import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/create-order")({
  POST: async ({ request }) => {
    try {
      const body = await request.json().catch(() => ({}));
      const { amount, currency = "INR", receipt } = body;

      // Validate inputs
      if (amount === undefined || amount === null) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing required field: amount" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const amountNum = Number(amount);
      if (isNaN(amountNum) || amountNum < 100) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid amount. Minimum amount is 100 paise." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Read credentials
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;

      if (!keyId || !keySecret) {
        return new Response(
          JSON.stringify({ success: false, error: "Razorpay credentials are not configured on the server." }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      // Generate receipt if not provided
      const finalReceipt = receipt || `rcpt_${Date.now()}`;

      // Call Razorpay API
      const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${credentials}`,
        },
        body: JSON.stringify({
          amount: amountNum,
          currency,
          receipt: finalReceipt,
        }),
      });

      // Handle Razorpay response
      if (response.status === 401) {
        console.error("[Razorpay API] Auth Failure: Invalid Key ID or Key Secret.");
        return new Response(
          JSON.stringify({ success: false, error: "Razorpay authentication failed." }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[Razorpay API Error] Status: ${response.status}`, errText);
        return new Response(
          JSON.stringify({ success: false, error: `Razorpay error: ${errText}` }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      const order = await response.json();
      return new Response(
        JSON.stringify({
          order_id: order.id,
          amount: order.amount,
          currency: order.currency,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("[Create Order API] Unexpected error:", err);
      return new Response(
        JSON.stringify({ success: false, error: errMsg }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
});
