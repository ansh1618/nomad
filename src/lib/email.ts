import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY || "";
const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailPayload) {
  console.log(`[Email Service] Attempting to send email to: ${to}, subject: ${subject}`);
  
  if (resend) {
    try {
      const response = await resend.emails.send({
        from: "Nomadik Travels <onboarding@resend.dev>",
        to,
        subject,
        html,
      });
      console.log("[Email Service] Email sent successfully via Resend:", response);
      return response;
    } catch (error) {
      console.error("[Email Service] Error sending email via Resend:", error);
      throw error;
    }
  } else {
    console.log(
      `[Email Service] (MOCK MODE - RESEND_API_KEY not set) Email content:\nTo: ${to}\nSubject: ${subject}\nHTML: ${html}`
    );
    return { mock: true, id: "mock-email-id-" + Date.now() };
  }
}
