import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingUI } from "@/components/site/FloatingUI";
import { Reveal } from "@/components/site/Reveal";
import { Phone, MessageCircle, Mail, MapPin, Clock, Loader2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { submitContactInquiryFn, submitConsultationRequestFn, submitCallbackRequestFn } from "@/lib/server-fns";
import { BRAND } from "@/config/brand";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us & Book Consultation | Nomadik" },
      { name: "description", content: "Contact Nomadik. Schedule a free consultation call, request callback, or message our Trip Captains directly on WhatsApp." },
    ],
  }),
  component: ContactRoute,
});

const hours = [
  { day: "Monday – Sunday", time: "Open 24 Hours" },
  { day: "Support Available", time: "12:00 AM – 11:59 PM" },
  { day: "Availability", time: "Open 24×7" },
];

function ContactRoute() {
  // Main form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  // Modals state
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [isCallbackOpen, setIsCallbackOpen] = useState(false);

  // Consultation form states
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cDestination, setCDestination] = useState("");
  const [cBudget, setCBudget] = useState("");
  const [cDate, setCDate] = useState("");
  const [cTime, setCTime] = useState("");
  const [cNotes, setCNotes] = useState("");
  const [submittingConsultation, setSubmittingConsultation] = useState(false);

  // Callback form states
  const [cbName, setCbName] = useState("");
  const [cbPhone, setCbPhone] = useState("");
  const [cbTime, setCbTime] = useState("");
  const [cbNotes, setCbNotes] = useState("");
  const [submittingCallback, setSubmittingCallback] = useState(false);

  // Submission validation & action for Main Contact Inquiry
  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error("Please fill in all required fields (Name, Email, Phone).");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }

    setSubmittingInquiry(true);
    try {
      await submitContactInquiryFn({
        data: {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          subject: subject.trim() || "General Inquiry",
          message: message.trim()
        }
      });
      toast.success("Inquiry submitted successfully! A confirmation email has been sent.");
      setName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit inquiry. Please try again.");
    } finally {
      setSubmittingInquiry(false);
    }
  };

  // Submission validation & action for Free Consultation
  const handleConsultationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim() || !cPhone.trim()) {
      toast.error("Name and Phone contact are required.");
      return;
    }
    const cleanPhone = cPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }

    setSubmittingConsultation(true);
    try {
      await submitConsultationRequestFn({
        data: {
          name: cName.trim(),
          email: cEmail.trim() || undefined,
          phone: cPhone.trim(),
          destination: cDestination.trim() || undefined,
          budget: cBudget.trim() || undefined,
          preferred_date: cDate || undefined,
          preferred_time: cTime.trim() || undefined,
          notes: cNotes.trim() || undefined
        }
      });
      toast.success("Consultation scheduled! Confirmation email has been sent.");
      setIsConsultationOpen(false);
      setCName("");
      setCEmail("");
      setCPhone("");
      setCDestination("");
      setCBudget("");
      setCDate("");
      setCTime("");
      setCNotes("");
    } catch (error: any) {
      toast.error(error.message || "Failed to schedule consultation. Please try again.");
    } finally {
      setSubmittingConsultation(false);
    }
  };

  // Submission validation & action for Request Callback
  const handleCallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cbName.trim() || !cbPhone.trim()) {
      toast.error("Name and Phone number are required.");
      return;
    }
    const cleanPhone = cbPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }

    setSubmittingCallback(true);
    try {
      await submitCallbackRequestFn({
        data: {
          name: cbName.trim(),
          phone: cbPhone.trim(),
          preferred_time: cbTime.trim() || undefined,
          notes: cbNotes.trim() || undefined
        }
      });
      toast.success("Callback request submitted! We will call you shortly.");
      setIsCallbackOpen(false);
      setCbName("");
      setCbPhone("");
      setCbTime("");
      setCbNotes("");
    } catch (error: any) {
      toast.error(error.message || "Failed to request callback. Please try again.");
    } finally {
      setSubmittingCallback(false);
    }
  };


  return (
    <div className="bg-background min-h-screen flex flex-col justify-between">
      <Navbar />
      <main className="pt-24 pb-20 font-sans text-foreground">
        
        {/* Banner */}
        <section className="bg-ocean py-20 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10 max-w-7xl mx-auto px-5 text-center space-y-4">
            <Reveal>
              <span className="text-xs font-poppins font-bold uppercase tracking-[0.25em] text-gold">GET IN TOUCH</span>
              <h1 className="font-display text-4xl font-bold sm:text-6xl mt-2">Connect With Nomadik</h1>
              <p className="max-w-2xl mx-auto text-sm text-white/80 mt-3">
                Have questions about a route? Want to coordinate a custom corporate trip? We're ready to explore with you.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Contact Split */}
        <section className="max-w-7xl mx-auto px-5 py-20">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            
            {/* Form Column */}
            <Reveal>
              <form onSubmit={handleInquirySubmit} className="rounded-3xl border border-border bg-card p-8 shadow-elegant space-y-4">
                <h3 className="font-display text-2xl font-bold text-primary">Send a Message</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Full Name" 
                    required 
                    className="h-12 bg-white" 
                  />
                  <Input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="Email Address" 
                    required 
                    className="h-12 bg-white" 
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="Phone Number" 
                    required 
                    className="h-12 bg-white" 
                  />
                  <Input 
                    value={subject} 
                    onChange={(e) => setSubject(e.target.value)} 
                    placeholder="Route of Interest" 
                    className="h-12 bg-white" 
                  />
                </div>
                <Textarea 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  placeholder="How can we help you plan your road trip?" 
                  className="min-h-32 bg-white" 
                />
                <Button type="submit" variant="hero" size="lg" className="w-full h-12 shadow-gold" disabled={submittingInquiry}>
                  {submittingInquiry ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                  {submittingInquiry ? "Sending Inquiry..." : "Send Inquiry"}
                </Button>

                {/* Instant Actions */}
                <div className="pt-4 flex flex-col sm:flex-row gap-3 border-t border-border mt-6">
                  <Button type="button" variant="ocean" className="flex-1" onClick={() => setIsConsultationOpen(true)}>
                    Book Free Consultation
                  </Button>
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsCallbackOpen(true)}>
                    Request Call Back
                  </Button>
                </div>
              </form>
            </Reveal>

            {/* Info Column */}
            <Reveal className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-border rounded-2xl bg-card p-6 shadow-soft">
                  <MapPin className="h-6 w-6 text-accent" />
                  <h4 className="mt-3 font-poppins font-bold text-sm text-primary uppercase">Office Hub</h4>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                    Rohini Sector 11{"\n"}New Delhi - 110085{"\n"}India
                  </p>
                </div>
                <div className="border border-border rounded-2xl bg-card p-6 shadow-soft">
                  <Mail className="h-6 w-6 text-accent" />
                  <h4 className="mt-3 font-poppins font-bold text-sm text-primary uppercase">Email Support</h4>
                  <a href={`mailto:${BRAND.email}`} className="mt-1 text-xs text-muted-foreground hover:text-accent transition-colors block">
                    {BRAND.email}
                  </a>
                </div>
              </div>

              {/* Hours */}
              <div className="border border-border rounded-2xl bg-card p-6 shadow-soft space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <Clock className="h-5 w-5 text-accent" />
                  <h4 className="font-poppins font-bold text-sm text-primary uppercase tracking-wide">Business Hours</h4>
                </div>
                <ul className="space-y-2">
                  {hours.map((h) => (
                    <li key={h.day} className="flex justify-between text-xs">
                      <span className="text-muted-foreground font-sans">{h.day}</span>
                      <span className="font-semibold text-foreground font-poppins">{h.time}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Interactive OpenStreetMap */}
              <div className="overflow-hidden rounded-2xl border border-border shadow-soft">
                <iframe
                  title="Nomadik Rohini Hub Location"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=77.09%2C28.71%2C77.13%2C28.75&layer=mapnik&marker=28.73%2C77.11"
                  className="h-60 w-full border-0"
                  loading="lazy"
                />
              </div>
            </Reveal>

          </div>
        </section>

      </main>
      <Footer />
      <FloatingUI />

      {/* Book Free Consultation Modal */}
      <Dialog open={isConsultationOpen} onOpenChange={setIsConsultationOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-bold text-primary">Book Free Consultation</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Schedule a 1-on-1 virtual call with our Senior Route Captains to craft your perfect trip itinerary.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConsultationSubmit} className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <Input 
                value={cName} 
                onChange={(e) => setCName(e.target.value)} 
                placeholder="Full Name" 
                required 
                className="bg-white" 
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input 
                type="email" 
                value={cEmail} 
                onChange={(e) => setCEmail(e.target.value)} 
                placeholder="Email Address (Optional)" 
                className="bg-white" 
              />
              <Input 
                type="tel" 
                value={cPhone} 
                onChange={(e) => setCPhone(e.target.value)} 
                placeholder="Phone Number" 
                required 
                className="bg-white" 
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input 
                value={cDestination} 
                onChange={(e) => setCDestination(e.target.value)} 
                placeholder="Destination of Interest" 
                className="bg-white" 
              />
              <Input 
                value={cBudget} 
                onChange={(e) => setCBudget(e.target.value)} 
                placeholder="Trip Budget (e.g. ₹20,000)" 
                className="bg-white" 
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase font-poppins">Preferred Date</label>
                <Input 
                  type="date" 
                  value={cDate} 
                  onChange={(e) => setCDate(e.target.value)} 
                  className="bg-white text-xs" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase font-poppins">Preferred Time</label>
                <Input 
                  value={cTime} 
                  onChange={(e) => setCTime(e.target.value)} 
                  placeholder="e.g. 4:00 PM"
                  className="bg-white text-xs" 
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Textarea 
                value={cNotes} 
                onChange={(e) => setCNotes(e.target.value)} 
                placeholder="Share any other group details, or specific requirements..." 
                className="min-h-20 bg-white" 
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" variant="hero" disabled={submittingConsultation} className="w-full h-11">
                {submittingConsultation ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {submittingConsultation ? "Booking..." : "Confirm Booking"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Request Callback Modal */}
      <Dialog open={isCallbackOpen} onOpenChange={setIsCallbackOpen}>
        <DialogContent className="sm:max-w-sm bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-bold text-primary">Request a Call Back</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Leave your contact details and our team will get in touch with you immediately.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCallbackSubmit} className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <Input 
                value={cbName} 
                onChange={(e) => setCbName(e.target.value)} 
                placeholder="Full Name" 
                required 
                className="bg-white" 
              />
            </div>
            <div className="grid grid-cols-1 gap-3">
              <Input 
                type="tel" 
                value={cbPhone} 
                onChange={(e) => setCbPhone(e.target.value)} 
                placeholder="Phone Number" 
                required 
                className="bg-white" 
              />
              <Input 
                value={cbTime} 
                onChange={(e) => setCbTime(e.target.value)} 
                placeholder="Preferred Time (e.g. Tomorrow 10 AM)" 
                className="bg-white" 
              />
            </div>
            <div className="space-y-1.5">
              <Textarea 
                value={cbNotes} 
                onChange={(e) => setCbNotes(e.target.value)} 
                placeholder="Best time to call, or any quick notes..." 
                className="min-h-20 bg-white" 
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" variant="hero" disabled={submittingCallback} className="w-full h-11">
                {submittingCallback ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {submittingCallback ? "Requesting..." : "Request Callback"}
              </Button>
            </div>
          </form>
        </DialogContent>

      </Dialog>
    </div>
  );
}
