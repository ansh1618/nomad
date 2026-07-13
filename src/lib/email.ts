import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY || "";
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// ─── Core sendEmail ────────────────────────────────────────────────────────────
interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailPayload) {
  if (resend) {
    try {
      const response = await resend.emails.send({
        from: "Nomadik Travels <bookings@nomadiktravels.com>",
        to,
        subject,
        html,
      });
      console.log("[Email] Sent:", response.data?.id);
      return response;
    } catch (error) {
      console.error("[Email] Resend error:", error);
      throw error;
    }
  } else {
    console.log(`[Email] MOCK MODE — To: ${to} | Subject: ${subject}`);
    return { mock: true, id: "mock-" + Date.now() };
  }
}

// ─── Booking Confirmation Email ────────────────────────────────────────────────
export interface BookingConfirmationEmailInput {
  customerName: string;
  customerEmail: string;
  bookingId: string;
  amountPaid: number;
  tripName?: string;
  departureDate?: string;
}

export async function sendBookingConfirmationEmail(
  input: BookingConfirmationEmailInput
) {
  const { customerName, customerEmail, bookingId, amountPaid, tripName, departureDate } = input;

  const formattedAmount = amountPaid.toLocaleString("en-IN");
  const tripLine = tripName ? `<p style="margin:4px 0;font-size:14px;color:#555;">Trip: <strong>${tripName}</strong></p>` : "";
  const dateLine = departureDate
    ? `<p style="margin:4px 0;font-size:14px;color:#555;">Departure: <strong>${new Date(departureDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong></p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Booking Confirmed</title></head>
<body style="margin:0;padding:0;background:#f8f7f3;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7f3;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#163A5F 0%,#244B3D 100%);padding:40px 40px 32px;text-align:center;">
          <h1 style="margin:0;font-size:28px;font-weight:800;color:#C8A96A;letter-spacing:-0.5px;">NOMADIK</h1>
          <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.7);letter-spacing:2px;text-transform:uppercase;">The Nomadic Traveller</p>
        </td></tr>

        <!-- Success Badge -->
        <tr><td style="padding:32px 40px 16px;text-align:center;">
          <div style="display:inline-block;background:#dcfce7;border-radius:50px;padding:12px 28px;margin-bottom:16px;">
            <span style="font-size:16px;font-weight:700;color:#16a34a;">✓ Booking Confirmed!</span>
          </div>
          <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#163A5F;">You're going on an adventure!</h2>
          <p style="margin:0;font-size:15px;color:#666;">Hi <strong>${customerName}</strong>, your booking is confirmed.</p>
        </td></tr>

        <!-- Booking Details Box -->
        <tr><td style="padding:16px 40px;">
          <div style="background:#f8f7f3;border-radius:12px;padding:24px;border:1px solid #e4e2da;">
            <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:1px;">Booking Details</p>
            <p style="margin:4px 0;font-size:18px;font-weight:800;color:#163A5F;font-family:monospace;">${bookingId}</p>
            ${tripLine}
            ${dateLine}
            <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e4e2da;">
              <p style="margin:4px 0;font-size:14px;color:#555;">Amount Paid: <strong style="font-size:18px;color:#163A5F;">₹${formattedAmount}</strong></p>
            </div>
          </div>
        </td></tr>

        <!-- Next Steps -->
        <tr><td style="padding:16px 40px;">
          <div style="background:#eff6ff;border-radius:12px;padding:20px;border-left:4px solid #3b82f6;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#1e40af;">What's Next?</p>
            <ul style="margin:0;padding-left:16px;font-size:13px;color:#555;line-height:1.8;">
              <li>You'll receive packing list & trip itinerary 7 days before departure</li>
              <li>Our trip captain will connect with you on WhatsApp</li>
              <li>Pickup point & time will be shared 3 days prior</li>
            </ul>
          </div>
        </td></tr>

        <!-- Support -->
        <tr><td style="padding:16px 40px 32px;text-align:center;">
          <p style="margin:0;font-size:13px;color:#888;">Questions? Reach us at <a href="mailto:hello@nomadiktravels.com" style="color:#163A5F;font-weight:600;">hello@nomadiktravels.com</a></p>
          <p style="margin:8px 0 0;font-size:13px;color:#888;">or WhatsApp us at <a href="https://wa.me/91XXXXXXXXXX" style="color:#163A5F;font-weight:600;">+91-XXXXXXXXXX</a></p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f0f0ea;padding:20px 40px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#999;">© 2026 Nomadik Travels · <a href="#" style="color:#163A5F;">Unsubscribe</a></p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendEmail({
    to: customerEmail,
    subject: `🎉 Booking Confirmed — ${bookingId} | Nomadik Travels`,
    html,
  });
}
