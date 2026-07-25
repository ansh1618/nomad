import { BRAND } from "@/config/brand";

export interface WhatsAppNotificationInput {
  phone: string;
  customerName: string;
  bookingId: string;
  tripName: string;
  departureDate: string;
  pickupPoint?: string;
}

export async function sendWhatsAppConfirmation(input: WhatsAppNotificationInput) {
  const { phone, customerName, bookingId, tripName, departureDate, pickupPoint } = input;

  const dateStr = new Date(departureDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const cleanPhone = phone.replace(/[^\d]/g, "");
  const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const message = `*Booking Confirmed!* 🎉\n\n` +
    `Hello ${customerName},\n` +
    `Your booking with Nomadik is confirmed.\n\n` +
    `*Booking ID:* ${bookingId}\n` +
    `*Package:* ${tripName}\n` +
    `*Departure Date:* ${dateStr}\n` +
    `*Pickup Point:* ${pickupPoint || "Delhi/Majnu ka Tila (Standard)"}\n` +
    `*Support Number:* ${BRAND.phones[0]}\n\n` +
    `Get ready for the adventure! 🧭🎒`;

  const whatsappApiUrl = process.env.WHATSAPP_API_URL;
  const whatsappApiKey = process.env.WHATSAPP_API_KEY;

  if (whatsappApiUrl && whatsappApiKey) {
    try {
      const response = await fetch(whatsappApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${whatsappApiKey}`,
        },
        body: JSON.stringify({
          to: finalPhone,
          message: message,
        }),
      });
      console.log("[WhatsApp API] Send Status:", response.status);
    } catch (err) {
      console.error("[WhatsApp API] Call failed:", err);
    }
  } else {
    console.log("=========================================");
    console.log("[WhatsApp Simulation] Sent To:", finalPhone);
    console.log("[WhatsApp Simulation] Message:\n", message);
    console.log("=========================================");
  }

  return { success: true, message: "WhatsApp message simulation completed." };
}
