import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

interface GoNomadikLoadingScreenProps {
  fullPage?: boolean;
  statusText?: string;
}

const WORD = "GoNomadik";
const CHAR_TYPING_SPEED = 90; // ms per character

export function GoNomadikLoadingScreen({
  fullPage = true,
  statusText = "Loading journeys",
}: GoNomadikLoadingScreenProps) {
  // Sequence animation steps: 0 = start, 1 = icon loaded, 2 = wordmark typing, 3 = wordmark complete / tagline fade, 4 = progress & status
  const [charIndex, setCharIndex] = useState(0);
  const [iconReady, setIconReady] = useState(false);
  const [taglineReady, setTaglineReady] = useState(false);
  const [dotsCount, setDotsCount] = useState(3);

  // Step 1: Icon fade/scale-in trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setIconReady(true);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // Step 2: Start typing "GoNomadik" after icon is fully visible (~750ms)
  useEffect(() => {
    if (!iconReady) return;

    const startTypingTimer = setTimeout(() => {
      let currentIdx = 0;
      const interval = setInterval(() => {
        currentIdx++;
        setCharIndex(currentIdx);
        if (currentIdx >= WORD.length) {
          clearInterval(interval);
          setTaglineReady(true);
        }
      }, CHAR_TYPING_SPEED);
    }, 550);

    return () => clearTimeout(startTypingTimer);
  }, [iconReady]);

  // Step 3: Animated dots for loading status
  useEffect(() => {
    const timer = setInterval(() => {
      setDotsCount((prev) => (prev % 3) + 1);
    }, 450);
    return () => clearInterval(timer);
  }, []);

  const containerClasses = fullPage
    ? "fixed inset-0 z-[9999] bg-[#FAFAFC] flex flex-col items-center justify-center p-6 select-none"
    : "w-full min-h-[60vh] bg-[#FAFAFC] flex flex-col items-center justify-center p-6 select-none";

  // Helper to render letter-by-letter with Navy "Go" and Gold "Nomadik"
  const currentTypedText = WORD.slice(0, charIndex);

  const renderStyledWordmark = () => {
    const goPart = currentTypedText.slice(0, 2); // "Go"
    const nomadikPart = currentTypedText.slice(2); // "Nomadik"

    return (
      <div
        className="font-extrabold text-3xl sm:text-5xl tracking-tight select-none flex items-center justify-center min-h-[52px]"
        style={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', 'Manrope', sans-serif" }}
      >
        {goPart.split("").map((char, i) => (
          <motion.span
            key={`go-${i}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="text-[#0A2540]"
          >
            {char}
          </motion.span>
        ))}
        {nomadikPart.split("").map((char, i) => (
          <motion.span
            key={`nomadik-${i}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="text-[#C8A96A]"
          >
            {char}
          </motion.span>
        ))}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className={containerClasses}
    >
      <div className="flex flex-col items-center justify-center space-y-6 max-w-md mx-auto text-center">
        {/* 1. ROUND GO NOMADIK ICON (Fade & Scale In) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={iconReady ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative flex items-center justify-center shrink-0"
        >
          <img
            src="/images/gonomadik-round-emblem.png"
            alt="GoNomadik Emblem"
            className="h-20 sm:h-28 w-auto aspect-square object-contain pointer-events-none drop-shadow-md bg-transparent"
          />
        </motion.div>

        {/* 2. "GoNomadik" WORDMARK (Progressive Letter-by-Letter Reveal) */}
        <div className="pt-1">
          {renderStyledWordmark()}
        </div>

        {/* 3. TAGLINE (TRAVEL MORE • DISCOVER DEEPER) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={taglineReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="space-y-1"
        >
          <p className="text-[10px] sm:text-xs font-bold tracking-[0.25em] text-[#0A2540] font-poppins uppercase">
            TRAVEL MORE <span className="text-[#C8A96A] mx-1">•</span> DISCOVER DEEPER
          </p>
        </motion.div>

        {/* 4. ELEGANT NAVY + GOLD PROGRESS INDICATOR */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={taglineReady ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="pt-2 flex flex-col items-center gap-4 w-full"
        >
          <div className="w-44 sm:w-56 h-1.5 rounded-full bg-slate-200/80 relative overflow-hidden">
            <motion.div
              className="absolute top-0 bottom-0 bg-gradient-to-r from-[#0A2540] via-[#C8A96A] to-[#0A2540] rounded-full"
              initial={{ x: "-100%", width: "45%" }}
              animate={{ x: "250%", width: "45%" }}
              transition={{
                repeat: Infinity,
                duration: 1.4,
                ease: "easeInOut",
              }}
            />
          </div>

          {/* 5. LOADING STATUS TEXT */}
          <p className="text-xs text-slate-500 font-poppins font-medium">
            {statusText}
            {".".repeat(dotsCount)}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
