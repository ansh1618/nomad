import { useEffect, useState, useRef } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import { ArrowUp, MessageCircle, MessagesSquare, X, Compass, Send, Phone } from "lucide-react";
import { toast } from "sonner";
import { BRAND } from "@/config/brand";
import { getDestinations, getJourneys } from "@/lib/queries-client";
import { Link, useNavigate } from "@tanstack/react-router";

interface Message {
  id: string;
  sender: "assistant" | "user";
  text: string | React.ReactNode;
  timestamp: Date;
}

export function FloatingUI() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });
  
  const [showTop, setShowTop] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [input, setInput] = useState("");
  
  const [dbDestinations, setDbDestinations] = useState<any[]>([]);
  const [dbJourneys, setDbJourneys] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      sender: "assistant",
      text: (
        <div className="space-y-1">
          <p className="font-bold text-sm font-poppins">Hi Explorer 👋</p>
          <p className="font-sans">How can I help you today?</p>
        </div>
      ),
      timestamp: new Date(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (chatOpen && dbDestinations.length === 0) {
      setLoadingData(true);
      Promise.all([getDestinations(), getJourneys()])
        .then(([dests, journeys]) => {
          setDbDestinations(dests);
          setDbJourneys(journeys);
        })
        .catch((err) => console.error("Error loading chat data:", err))
        .finally(() => setLoadingData(false));
    }
  }, [chatOpen, dbDestinations.length]);

  const handleOptionClick = (optionKey: string, label: string) => {
    // 1. Add User Message
    const userMsg = {
      id: Math.random().toString(),
      sender: "user" as const,
      text: label,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMsg]);

    // 2. Add Typing Indicator
    const typingId = "typing-" + Math.random();
    setMessages((prev) => [...prev, { id: typingId, sender: "assistant" as const, text: "typing", timestamp: new Date() }]);

    // 3. Perform actions or format response
    setTimeout(() => {
      // Remove typing indicator
      setMessages((prev) => prev.filter((m) => m.id !== typingId));

      let responseText: React.ReactNode = "";

      if (optionKey === "destinations") {
        responseText = dbDestinations.length > 0 ? (
          <div className="space-y-2">
            <p className="font-semibold text-primary font-poppins">🏔 Our Travel Destinations:</p>
            <div className="grid grid-cols-1 gap-2 mt-1 max-h-48 overflow-y-auto pr-1">
              {dbDestinations.map(d => (
                <Link
                  key={d.slug}
                  to={`/${d.slug}` as any}
                  onClick={() => setChatOpen(false)}
                  className="flex justify-between items-center bg-white hover:bg-gold/10 border border-border px-3 py-2 rounded-xl text-xs transition duration-200 group font-sans"
                >
                  <span className="font-bold text-primary group-hover:text-gold transition-colors">{d.name}</span>
                  <span className="text-[10px] text-muted-foreground group-hover:translate-x-0.5 transition-transform">Explore →</span>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <p className="font-sans">We are fetching our active destinations. Please check back in a second! Or explore our packages page.</p>
        );
      } else if (optionKey === "upcoming_trips") {
        responseText = dbJourneys.length > 0 ? (
          <div className="space-y-2">
            <p className="font-semibold text-primary font-poppins">📅 Upcoming Departures:</p>
            <div className="space-y-2 mt-1 max-h-56 overflow-y-auto pr-1">
              {dbJourneys.map(j => (
                <div key={j.slug} className="bg-white border border-border p-3 rounded-xl space-y-2 shadow-sm font-sans">
                  <div className="flex justify-between items-start gap-1">
                    <h5 className="font-bold text-xs text-primary leading-tight">{j.name}</h5>
                    <span className="text-[10px] font-bold text-gold shrink-0">{j.price}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                    <span>Duration: {j.duration}</span>
                    <span className={j.remainingSeats <= 3 ? "text-orange-500 font-semibold" : ""}>
                      {j.remainingSeats} seats left
                    </span>
                  </div>
                  <Link
                    to="/journeys/$journeyId"
                    params={{ journeyId: j.slug }}
                    onClick={() => setChatOpen(false)}
                    className="block text-center text-[10px] bg-accent hover:bg-accent/90 text-white font-bold py-1.5 rounded-lg transition-colors font-poppins"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="font-sans">No active convoy trips found. Connect with support or check back soon!</p>
        );
      } else if (optionKey === "pricing") {
        responseText = (
          <div className="space-y-2">
            <p className="font-semibold text-primary font-poppins">💰 Pricing & Deals:</p>
            <p className="text-xs text-foreground/80 leading-relaxed font-sans">
              Nomadik trips feature all-inclusive pricing covering cozy stays, transfers, captains, and activities.
            </p>
            <div className="bg-white border border-border p-3 rounded-xl space-y-2 text-xs font-sans">
              <div className="flex items-start gap-2">
                <span className="text-gold">★</span>
                <div>
                  <p className="font-bold text-primary">Group Booking Deal</p>
                  <p className="text-[10px] text-muted-foreground">Get flat ₹1,000 off per explorer for bookings of 4+ members.</p>
                </div>
              </div>
              <div className="flex items-start gap-2 border-t border-border pt-2">
                <span className="text-gold">★</span>
                <div>
                  <p className="font-bold text-primary">Student Discount</p>
                  <p className="text-[10px] text-muted-foreground">Extra 5% off with coupon code <strong className="font-mono text-accent">STUDENT5</strong>.</p>
                </div>
              </div>
              <div className="flex items-start gap-2 border-t border-border pt-2">
                <span className="text-gold">★</span>
                <div>
                  <p className="font-bold text-primary">Early Bird Special</p>
                  <p className="text-[10px] text-muted-foreground">Save ₹500 by reserving your seats 30 days prior to departure.</p>
                </div>
              </div>
            </div>
          </div>
        );
      } else if (optionKey === "students") {
        responseText = (
          <div className="space-y-2">
            <p className="font-semibold text-primary font-poppins">🎒 Student Specials:</p>
            <p className="text-xs text-foreground/80 leading-relaxed font-sans">
              Pack your backpacks! Students get exclusive discount rates on all road trips:
            </p>
            <div className="bg-white border border-border p-3 rounded-xl text-xs space-y-2 font-sans">
              <p className="font-bold text-accent">Flat 5% Off Any Trip</p>
              <p className="text-[10px] text-muted-foreground">
                Apply coupon code <strong className="text-primary font-mono bg-muted px-1.5 py-0.5 rounded border border-border">STUDENT5</strong> when you book.
              </p>
              <p className="text-[10px] text-muted-foreground italic">
                *Note: A valid student ID card must be verified by the Trip Captain before departure.
              </p>
            </div>
          </div>
        );
      } else if (optionKey === "plan_trip") {
        responseText = (
          <div className="space-y-2">
            <p className="font-semibold text-primary font-poppins">🧳 Custom Trip Planner:</p>
            <p className="text-xs text-foreground/80 leading-relaxed font-sans">
              Have specific dates, a private group, or want a tailor-made road route? We'll plan it for you!
            </p>
            <button
              onClick={() => {
                setChatOpen(false);
                navigate({ to: "/destinations" });
              }}
              className="w-full text-center text-xs bg-gold-gradient text-gold-foreground font-bold py-2.5 rounded-xl shadow-soft hover:brightness-105 transition-all font-poppins"
            >
              Browse Destinations
            </button>
          </div>
        );
      } else if (optionKey === "support") {
        responseText = (
          <div className="space-y-2">
            <p className="font-semibold text-primary font-poppins">☎️ Contact Support:</p>
            <p className="text-xs text-foreground/80 leading-relaxed font-sans">
              Need immediate booking help? Our customer support is available 24/7.
            </p>
            <div className="space-y-2 mt-1">
              <a
                href={BRAND.community}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#25D366] text-white text-xs font-bold py-2.5 rounded-xl transition-colors hover:bg-[#20bd5a] font-poppins"
              >
                <MessageCircle className="h-4 w-4" /> Join WhatsApp Tribe
              </a>
              {BRAND.phones.map(phone => (
                <a
                  key={phone}
                  href={`tel:${phone}`}
                  className="flex items-center justify-center gap-2 border border-border bg-white text-primary text-xs font-bold py-2.5 rounded-xl hover:border-gold transition-all font-sans"
                >
                  <Phone className="h-4 w-4 text-accent" /> Call {phone}
                </a>
              ))}
            </div>
          </div>
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: "assistant",
          text: responseText,
          timestamp: new Date()
        }
      ]);
    }, 500);
  };

  const handleSendMessage = (inputText: string) => {
    if (!inputText.trim()) return;
    const userMsg = {
      id: Math.random().toString(),
      sender: "user" as const,
      text: inputText,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const typingId = "typing-" + Math.random();
    setMessages((prev) => [...prev, { id: typingId, sender: "assistant" as const, text: "typing", timestamp: new Date() }]);

    setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== typingId));
      const cleanText = inputText.toLowerCase();

      let key = "";
      let label = "";

      if (cleanText.includes("trip") || cleanText.includes("upcoming") || cleanText.includes("departure") || cleanText.includes("batch")) {
        key = "upcoming_trips";
        label = "📅 Upcoming Trips";
      } else if (cleanText.includes("destination") || cleanText.includes("place") || cleanText.includes("route") || cleanText.includes("map")) {
        key = "destinations";
        label = "🏔 Explore Destinations";
      } else if (cleanText.includes("price") || cleanText.includes("pricing") || cleanText.includes("cost") || cleanText.includes("rate") || cleanText.includes("offer") || cleanText.includes("deal") || cleanText.includes("discount")) {
        key = "pricing";
        label = "💰 Pricing & Offers";
      } else if (cleanText.includes("student") || cleanText.includes("college") || cleanText.includes("school")) {
        key = "students";
        label = "🎒 Student Specials";
      } else if (cleanText.includes("plan") || cleanText.includes("custom") || cleanText.includes("create") || cleanText.includes("book")) {
        key = "plan_trip";
        label = "🧳 Plan My Trip";
      } else if (cleanText.includes("contact") || cleanText.includes("support") || cleanText.includes("help") || cleanText.includes("phone") || cleanText.includes("whatsapp") || cleanText.includes("number")) {
        key = "support";
        label = "☎️ Contact Support";
      }

      if (key) {
        let responseText: React.ReactNode = "";
        if (key === "destinations") {
          responseText = dbDestinations.length > 0 ? (
            <div className="space-y-2">
              <p className="font-semibold text-primary font-poppins">🏔 Our Travel Destinations:</p>
              <div className="grid grid-cols-1 gap-2 mt-1 max-h-48 overflow-y-auto pr-1">
                {dbDestinations.map(d => (
                  <Link
                    key={d.slug}
                    to={`/${d.slug}` as any}
                    onClick={() => setChatOpen(false)}
                    className="flex justify-between items-center bg-white hover:bg-gold/10 border border-border px-3 py-2 rounded-xl text-xs transition duration-200 group font-sans"
                  >
                    <span className="font-bold text-primary group-hover:text-gold transition-colors">{d.name}</span>
                    <span className="text-[10px] text-muted-foreground group-hover:translate-x-0.5 transition-transform">Explore →</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <p className="font-sans">We are fetching our active destinations. Please check back in a second! Or explore our packages page.</p>
          );
        } else if (key === "upcoming_trips") {
          responseText = dbJourneys.length > 0 ? (
            <div className="space-y-2">
              <p className="font-semibold text-primary font-poppins">📅 Upcoming Departures:</p>
              <div className="space-y-2 mt-1 max-h-56 overflow-y-auto pr-1">
                {dbJourneys.map(j => (
                  <div key={j.slug} className="bg-white border border-border p-3 rounded-xl space-y-2 shadow-sm font-sans">
                    <div className="flex justify-between items-start gap-1">
                      <h5 className="font-bold text-xs text-primary leading-tight">{j.name}</h5>
                      <span className="text-[10px] font-bold text-gold shrink-0">{j.price}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                      <span>Duration: {j.duration}</span>
                      <span className={j.remainingSeats <= 3 ? "text-orange-500 font-semibold" : ""}>
                        {j.remainingSeats} seats left
                      </span>
                    </div>
                    <Link
                      to="/journeys/$journeyId"
                      params={{ journeyId: j.slug }}
                      onClick={() => setChatOpen(false)}
                      className="block text-center text-[10px] bg-accent hover:bg-accent/90 text-white font-bold py-1.5 rounded-lg transition-colors font-poppins"
                    >
                      View Details
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="font-sans">No active convoy trips found. Connect with support or check back soon!</p>
          );
        } else if (key === "pricing") {
          responseText = (
            <div className="space-y-2">
              <p className="font-semibold text-primary font-poppins">💰 Pricing & Deals:</p>
              <p className="text-xs text-foreground/80 leading-relaxed font-sans">
                Nomadik trips feature all-inclusive pricing covering cozy stays, transfers, captains, and activities.
              </p>
              <div className="bg-white border border-border p-3 rounded-xl space-y-2 text-xs font-sans">
                <div className="flex items-start gap-2">
                  <span className="text-gold">★</span>
                  <div>
                    <p className="font-bold text-primary">Group Booking Deal</p>
                    <p className="text-[10px] text-muted-foreground">Get flat ₹1,000 off per explorer for bookings of 4+ members.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 border-t border-border pt-2">
                  <span className="text-gold">★</span>
                  <div>
                    <p className="font-bold text-primary">Student Discount</p>
                    <p className="text-[10px] text-muted-foreground">Extra 5% off with coupon code <strong className="font-mono text-accent">STUDENT5</strong>.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 border-t border-border pt-2">
                  <span className="text-gold">★</span>
                  <div>
                    <p className="font-bold text-primary">Early Bird Special</p>
                    <p className="text-[10px] text-muted-foreground">Save ₹500 by reserving your seats 30 days prior to departure.</p>
                  </div>
                </div>
              </div>
            </div>
          );
        } else if (key === "students") {
          responseText = (
            <div className="space-y-2">
              <p className="font-semibold text-primary font-poppins">🎒 Student Specials:</p>
              <p className="text-xs text-foreground/80 leading-relaxed font-sans">
                Pack your backpacks! Students get exclusive discount rates on all road trips:
              </p>
              <div className="bg-white border border-border p-3 rounded-xl text-xs space-y-2 font-sans">
                <p className="font-bold text-accent">Flat 5% Off Any Trip</p>
                <p className="text-[10px] text-muted-foreground">
                  Apply coupon code <strong className="text-primary font-mono bg-muted px-1.5 py-0.5 rounded border border-border">STUDENT5</strong> when you book.
                </p>
                <p className="text-[10px] text-muted-foreground italic">
                  *Note: A valid student ID card must be verified by the Trip Captain before departure.
                </p>
              </div>
            </div>
          );
        } else if (key === "plan_trip") {
          responseText = (
            <div className="space-y-2">
              <p className="font-semibold text-primary font-poppins">🧳 Custom Trip Planner:</p>
              <p className="text-xs text-foreground/80 leading-relaxed font-sans">
                Have specific dates, a private group, or want a tailor-made road route? We'll plan it for you!
              </p>
              <button
                onClick={() => {
                  setChatOpen(false);
                  navigate({ to: "/destinations" });
                }}
                className="w-full text-center text-xs bg-gold-gradient text-gold-foreground font-bold py-2.5 rounded-xl shadow-soft hover:brightness-105 transition-all font-poppins"
              >
                Browse Destinations
              </button>
            </div>
          );
        } else if (key === "support") {
          responseText = (
            <div className="space-y-2">
              <p className="font-semibold text-primary font-poppins">☎️ Contact Support:</p>
              <p className="text-xs text-foreground/80 leading-relaxed font-sans">
                Need immediate booking help? Our customer support is available 24/7.
              </p>
              <div className="space-y-2 mt-1">
                <a
                  href={BRAND.community}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#25D366] text-white text-xs font-bold py-2.5 rounded-xl transition-colors hover:bg-[#20bd5a] font-poppins"
                >
                  <MessageCircle className="h-4 w-4" /> Join WhatsApp Tribe
                </a>
                {BRAND.phones.map(phone => (
                  <a
                    key={phone}
                    href={`tel:${phone}`}
                    className="flex items-center justify-center gap-2 border border-border bg-white text-primary text-xs font-bold py-2.5 rounded-xl hover:border-gold transition-all font-sans"
                  >
                    <Phone className="h-4 w-4 text-accent" /> Call {phone}
                  </a>
                ))}
              </div>
            </div>
          );
        }

        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            sender: "assistant",
            text: responseText,
            timestamp: new Date()
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            sender: "assistant",
            text: (
              <div className="space-y-2 font-sans">
                <p>I'm a simple FAQ chatbot. Please click one of the quick action buttons below or ask about trips, destinations, pricing, student specials, or support! 😊</p>
              </div>
            ),
            timestamp: new Date()
          }
        ]);
      }
    }, 500);
  };

  return (
    <>
      {/* Scroll progress indicator */}
      <motion.div
        style={{ scaleX: progress }}
        className="fixed inset-x-0 top-0 z-[60] h-1 origin-left bg-gold-gradient"
      />

      {/* Floating action stack */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-sans">
        {chatOpen && (
          <div className="glass w-[340px] animate-scale-in rounded-3xl overflow-hidden shadow-elegant flex flex-col border border-white/20">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary/95 text-white px-4 py-3.5 flex items-center justify-between border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <span className="relative grid h-9 w-9 place-items-center rounded-full bg-gold/20 text-gold border border-gold/30">
                  <Compass className="h-5 w-5 animate-spin-slow" />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border border-primary animate-pulse" />
                </span>
                <div>
                  <p className="text-sm font-bold font-display tracking-wide">Nomadik AI Assistant</p>
                  <p className="text-[10px] text-white/70 font-sans">Typically replies instantly</p>
                </div>
              </div>
              <button 
                onClick={() => setChatOpen(false)} 
                aria-label="Close chat"
                className="text-white/70 hover:text-white transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="h-80 overflow-y-auto p-4 space-y-3 bg-white/95 flex-1 min-h-[320px] max-h-[380px]">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"} animate-scale-in`}
                >
                  {m.sender === "assistant" && m.text === "typing" ? (
                    <div className="bg-secondary/10 border border-border p-3 rounded-2xl rounded-tl-sm text-xs flex gap-1.5 items-center">
                      <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : (
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed shadow-soft ${
                        m.sender === "user"
                          ? "bg-accent text-white rounded-tr-sm font-sans"
                          : "bg-secondary/10 border border-border text-foreground rounded-tl-sm"
                      }`}
                    >
                      {m.text}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Reply Options */}
            <div className="bg-muted/40 p-3 border-t border-border space-y-2 shrink-0">
              <p className="text-[10px] font-bold text-muted-foreground font-poppins tracking-wider uppercase px-1">Quick Actions:</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleOptionClick("destinations", "🏔 Explore Destinations")}
                  className="bg-white border border-border hover:border-gold hover:text-gold px-2.5 py-1.5 rounded-full text-[10px] font-semibold text-primary transition-all duration-200 shadow-soft"
                >
                  🏔 Destinations
                </button>
                <button
                  onClick={() => handleOptionClick("upcoming_trips", "📅 Upcoming Trips")}
                  className="bg-white border border-border hover:border-gold hover:text-gold px-2.5 py-1.5 rounded-full text-[10px] font-semibold text-primary transition-all duration-200 shadow-soft"
                >
                  📅 Upcoming Trips
                </button>
                <button
                  onClick={() => handleOptionClick("pricing", "💰 Pricing & Offers")}
                  className="bg-white border border-border hover:border-gold hover:text-gold px-2.5 py-1.5 rounded-full text-[10px] font-semibold text-primary transition-all duration-200 shadow-soft"
                >
                  💰 Pricing
                </button>
                <button
                  onClick={() => handleOptionClick("students", "🎒 Student Specials")}
                  className="bg-white border border-border hover:border-gold hover:text-gold px-2.5 py-1.5 rounded-full text-[10px] font-semibold text-primary transition-all duration-200 shadow-soft"
                >
                  🎒 Student Trips
                </button>
                <button
                  onClick={() => handleOptionClick("plan_trip", "🧳 Plan My Trip")}
                  className="bg-white border border-border hover:border-gold hover:text-gold px-2.5 py-1.5 rounded-full text-[10px] font-semibold text-primary transition-all duration-200 shadow-soft"
                >
                  🧳 Plan My Trip
                </button>
                <button
                  onClick={() => handleOptionClick("support", "☎️ Contact Support")}
                  className="bg-white border border-border hover:border-gold hover:text-gold px-2.5 py-1.5 rounded-full text-[10px] font-semibold text-primary transition-all duration-200 shadow-soft"
                >
                  ☎️ Contact Support
                </button>
              </div>
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(input);
              }}
              className="bg-white p-2 border-t border-border flex gap-2 items-center shrink-0"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask assistant something..."
                className="flex-1 px-3 py-1.5 text-xs bg-muted/50 rounded-xl focus:outline-none focus:bg-muted border border-transparent focus:border-border transition-colors"
              />
              <button
                type="submit"
                className="p-1.5 rounded-xl bg-accent text-white hover:bg-accent/90 transition-colors shrink-0 disabled:opacity-50"
                disabled={!input.trim()}
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        )}

        {showTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Back to top"
            className="grid h-12 w-12 animate-scale-in place-items-center rounded-full bg-primary text-primary-foreground shadow-elegant transition hover:-translate-y-1"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        )}

        <button
          onClick={() => setChatOpen((v) => !v)}
          aria-label="Live chat"
          className="grid h-12 w-12 place-items-center rounded-full bg-white text-primary shadow-elegant transition hover:-translate-y-1"
        >
          <MessagesSquare className="h-5 w-5" />
        </button>

        <a
          href={BRAND.community}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat on WhatsApp"
          className="grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-elegant transition hover:-translate-y-1"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute inline-flex h-14 w-14 animate-ping rounded-full bg-[#25D366]/40" />
        </a>
      </div>
    </>
  );
}

