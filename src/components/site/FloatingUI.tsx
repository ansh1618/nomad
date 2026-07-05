import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import { ArrowUp, MessageCircle, MessagesSquare, X } from "lucide-react";
import { toast } from "sonner";

export function FloatingUI() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });
  const [showTop, setShowTop] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Scroll progress indicator */}
      <motion.div
        style={{ scaleX: progress }}
        className="fixed inset-x-0 top-0 z-[60] h-1 origin-left bg-gold-gradient"
      />

      {/* Floating action stack */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {chatOpen && (
          <div className="glass w-72 animate-scale-in rounded-2xl p-4 shadow-elegant">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-ocean text-primary-foreground">
                  <MessagesSquare className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-primary">Nomadik Trip Captain</p>
                  <p className="text-xs text-muted-foreground">Typically replies instantly</p>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} aria-label="Close chat">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="mt-3 rounded-xl bg-white/70 p-3 text-sm text-foreground/80">
              👋 Hey explorer! Ready to plan your next road trip? Let's find your perfect journey.
            </div>
            <button
              onClick={() => toast.success("A Trip Captain will connect with you shortly!")}
              className="mt-3 w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Talk to Trip Captain
            </button>
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
          href="https://wa.me/919000000000"
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
