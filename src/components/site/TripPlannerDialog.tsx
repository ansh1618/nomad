import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarCheck, MessageSquare, Phone, CheckCircle2, User, CalendarIcon, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Route } from "@/routes/index";
import { submitInquiryFn } from "@/lib/server-fns";
import { useAuth } from "./AuthContext";
import { triggerNomadikAuth } from "./AuthModal";

export function TripPlannerDialog() {
  const { destinations, journeys } = Route.useLoaderData();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"planner" | "consultation" | "callback">("planner");
  const [selectedDest, setSelectedDest] = useState<string>("");
  const [selectedJourney, setSelectedJourney] = useState<string>("");
  const [date, setDate] = useState<Date>();
  const [budget, setBudget] = useState("");
  const [groupSize, setGroupSize] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.tab) {
        setActiveTab(customEvent.detail.tab);
      } else {
        setActiveTab("planner");
      }
      if (customEvent.detail?.journeySlug) {
        const j = journeys.find((item) => item.slug === customEvent.detail.journeySlug);
        if (j) {
          setSelectedDest(j.destinationSlug);
          setSelectedJourney(j.slug);
        }
      }
      setSubmitted(false);
      setOpen(true);
    };

    window.addEventListener("open-nomadik-planner", handleOpen);
    return () => window.removeEventListener("open-nomadik-planner", handleOpen);
  }, []);

  const performSubmit = async () => {
    try {
      await submitInquiryFn({
        data: {
          name,
          phone,
          email,
          destination: selectedDest,
          journey: selectedJourney,
          date: date ? format(date, "yyyy-MM-dd") : "",
          travellers: groupSize,
          message: notes
        }
      });
      setSubmitted(true);
      toast.success("Details received! A Nomadik Explorer Captain will connect shortly.");
      setTimeout(() => {
        setOpen(false);
        // Reset form
        setName("");
        setEmail("");
        setPhone("");
        setNotes("");
        setSelectedDest("");
        setSelectedJourney("");
        setDate(undefined);
        setBudget("");
        setGroupSize("");
      }, 2000);
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      toast.error("Please fill in name and phone number.");
      return;
    }

    if (user) {
      await performSubmit();
    } else {
      // User not logged in, trigger auth modal first and execute submission upon login/guest
      triggerNomadikAuth({
        mode: "signup",
        allowGuest: true,
        onSuccess: async () => {
          await performSubmit();
        }
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl bg-background border border-border overflow-hidden p-0 rounded-2xl">
        <div className="bg-ocean py-8 px-6 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <DialogHeader>
            <DialogTitle className="font-display text-3xl font-bold tracking-wide text-white">
              Start Your Journey
            </DialogTitle>
            <DialogDescription className="text-white/80 font-sans text-sm mt-1">
              Join the tribe of Nomadik Explorers. Let's design your ideal road travel story.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex border-b border-border bg-muted/30">
          <button
            onClick={() => setActiveTab("planner")}
            className={cn(
              "flex-1 py-3.5 text-xs font-poppins font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center justify-center gap-2",
              activeTab === "planner" ? "border-accent text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageSquare className="h-4 w-4" /> Trip Planner
          </button>
          <button
            onClick={() => setActiveTab("consultation")}
            className={cn(
              "flex-1 py-3.5 text-xs font-poppins font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center justify-center gap-2",
              activeTab === "consultation" ? "border-accent text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <CalendarCheck className="h-4 w-4" /> Consultation
          </button>
          <button
            onClick={() => setActiveTab("callback")}
            className={cn(
              "flex-1 py-3.5 text-xs font-poppins font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center justify-center gap-2",
              activeTab === "callback" ? "border-accent text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Phone className="h-4 w-4" /> Call Back
          </button>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in">
              <CheckCircle2 className="h-16 w-16 text-secondary animate-bounce" />
              <h3 className="mt-4 font-display text-2xl font-bold text-primary">Inquiry Sent!</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                We have registered your exploration details. A Trip Captain will reach out within 2 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === "planner" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-poppins font-semibold uppercase tracking-wider text-muted-foreground">
                      Destination
                    </label>
                    <Select value={selectedDest} onValueChange={(val) => {
                      setSelectedDest(val);
                      setSelectedJourney("");
                    }}>
                      <SelectTrigger className="h-11 bg-white border-border">
                        <SelectValue placeholder="Select Destination" />
                      </SelectTrigger>
                      <SelectContent>
                        {destinations.map((d) => (
                          <SelectItem key={d.slug} value={d.slug}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-poppins font-semibold uppercase tracking-wider text-muted-foreground">
                      Signature Journey
                    </label>
                    <Select value={selectedJourney} onValueChange={setSelectedJourney}>
                      <SelectTrigger className="h-11 bg-white border-border">
                        <SelectValue placeholder="Select Journey" />
                      </SelectTrigger>
                      <SelectContent>
                        {journeys
                          .filter((j) => !selectedDest || j.destinationSlug === selectedDest)
                          .map((j) => (
                            <SelectItem key={j.slug} value={j.slug}>
                              {j.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-poppins font-semibold uppercase tracking-wider text-muted-foreground block">
                      Travel Date
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "h-11 w-full justify-start bg-white border-border text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-accent" />
                          {date ? format(date, "PP") : "Select departure"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-poppins font-semibold uppercase tracking-wider text-muted-foreground">
                      Who's Coming?
                    </label>
                    <Select value={groupSize} onValueChange={setGroupSize}>
                      <SelectTrigger className="h-11 bg-white border-border">
                        <SelectValue placeholder="Select Group Size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solo">Solo Explorer</SelectItem>
                        <SelectItem value="couple">Couple / Twin Travelers</SelectItem>
                        <SelectItem value="group-small">3-5 Friends</SelectItem>
                        <SelectItem value="group-large">5+ Explorers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-poppins font-semibold uppercase tracking-wider text-muted-foreground">
                      Budget Range
                    </label>
                    <Select value={budget} onValueChange={setBudget}>
                      <SelectTrigger className="h-11 bg-white border-border">
                        <SelectValue placeholder="Select Budget Range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under-10k">Under ₹10,000 / Person</SelectItem>
                        <SelectItem value="10k-20k">₹10,000 – ₹20,000 / Person</SelectItem>
                        <SelectItem value="20k-40k">₹20,000 – ₹40,000 / Person</SelectItem>
                        <SelectItem value="above-40k">₹40,000+ / Person</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {activeTab === "consultation" && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-poppins font-semibold uppercase tracking-wider text-muted-foreground block">
                      Preferred Date
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "h-11 w-full justify-start bg-white border-border text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-accent" />
                          {date ? format(date, "PP") : "Select call date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-poppins font-semibold uppercase tracking-wider text-muted-foreground">
                      Preferred Time Slot
                    </label>
                    <Select>
                      <SelectTrigger className="h-11 bg-white border-border">
                        <SelectValue placeholder="Select Time Slot" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning (10:00 AM – 1:00 PM)</SelectItem>
                        <SelectItem value="afternoon">Afternoon (1:00 PM – 4:00 PM)</SelectItem>
                        <SelectItem value="evening">Evening (4:00 PM – 7:00 PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Shared Contact Info */}
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Your Name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9 h-11 bg-white"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="Phone / WhatsApp Number"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-9 h-11 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <Input
                    type="email"
                    placeholder="Email Address"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 bg-white"
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="Tell us about your road trip dream or special requirements..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-20 bg-white"
                  />
                </div>
              </div>

              <Button type="submit" variant="hero" className="w-full h-12 text-base shadow-gold">
                {activeTab === "planner" && "Generate My Itinerary"}
                {activeTab === "consultation" && "Schedule Free Consultation"}
                {activeTab === "callback" && "Request Immediate Callback"}
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
export function triggerNomadikPlanner(options?: { tab?: "planner" | "consultation" | "callback"; journeySlug?: string }) {
  window.dispatchEvent(new CustomEvent("open-nomadik-planner", { detail: options }));
}
