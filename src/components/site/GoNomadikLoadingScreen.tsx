import { useState, useEffect } from "react";
import { motion } from "motion/react";

interface GoNomadikLoadingScreenProps {
  fullPage?: boolean;
  statusText?: string;
}

const FULL_WORD = "gonomadik.";
const TYPING_SPEED = 90; // ms per character
const DELETING_SPEED = 55; // ms per character
const PAUSE_DURATION = 800; // ms pause at full word

export function GoNomadikLoadingScreen({
  fullPage = true,
  statusText = "Loading journeys",
}: GoNomadikLoadingScreenProps) {
  // Typewriter state
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [dotsCount, setDotsCount] = useState(3);

  // Blinking cursor pulse (every 500ms)
  useEffect(() => {
    const timer = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 500);
    return () => clearInterval(timer);
  }, []);

  // Dots animation pulse (every 400ms)
  useEffect(() => {
    const timer = setInterval(() => {
      setDotsCount((prev) => (prev % 3) + 1);
    }, 400);
    return () => clearInterval(timer);
  }, []);

  // Continuous Typewriter Loop
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (!isDeleting && displayText === FULL_WORD) {
      // Pause at full word before deleting
      timeoutId = setTimeout(() => {
        setIsDeleting(true);
      }, PAUSE_DURATION);
    } else if (isDeleting && displayText === "") {
      // Pause briefly at blank before typing again
      timeoutId = setTimeout(() => {
        setIsDeleting(false);
      }, 300);
    } else {
      const currentSpeed = isDeleting ? DELETING_SPEED : TYPING_SPEED;
      timeoutId = setTimeout(() => {
        setDisplayText((prev) =>
          isDeleting
            ? FULL_WORD.slice(0, prev.length - 1)
            : FULL_WORD.slice(0, prev.length + 1)
        );
      }, currentSpeed);
    }

    return () => clearTimeout(timeoutId);
  }, [displayText, isDeleting]);

  // Color formatter matching logo (go: Navy, noma: Gold, dik: Navy, .: Gold)
  const renderStyledWordmark = (str: string) => {
    const part1 = str.slice(0, 2); // "go" -> Navy
    const part2 = str.slice(2, 6); // "noma" -> Gold
    const part3 = str.slice(6, 9); // "dik" -> Navy
    const part4 = str.slice(9, 10); // "." -> Gold

    return (
      <span
        className="font-bold text-3xl sm:text-4xl tracking-[-0.03em] select-none"
        style={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', 'Manrope', sans-serif" }}
      >
        {part1 && <span className="text-[#0A2540]">{part1}</span>}
        {part2 && <span className="text-[#C8A96A]">{part2}</span>}
        {part3 && <span className="text-[#0A2540]">{part3}</span>}
        {part4 && <span className="text-[#C8A96A]">{part4}</span>}
      </span>
    );
  };

  const containerClasses = fullPage
    ? "fixed inset-0 z-[9999] bg-white bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/5 via-white to-white flex flex-col items-center justify-center p-6 select-none shadow-none border-none"
    : "w-full min-h-[60vh] bg-white flex flex-col items-center justify-center p-6 select-none";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className={containerClasses}
    >
      <div className="flex flex-col items-center justify-center space-y-5 max-w-sm mx-auto text-center">
        {/* 1. TOP LOGO: Static G Monogram with single subtle fade-in */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative flex items-center justify-center"
        >
          <img
            src="/images/gonomadik-g-monogram.png"
            alt="GoNomadik"
            className="h-16 sm:h-20 w-auto object-contain pointer-events-none drop-shadow-none border-none shadow-none"
          />
        </motion.div>

        {/* 2. ANIMATED WORDMARK WITH TYPEWRITER EFFECT */}
        <div className="flex items-center justify-center min-h-[44px]">
          {renderStyledWordmark(displayText)}
          {/* Blinking Cursor | */}
          <span
            className={`font-display font-light text-3xl sm:text-4xl text-[#0A2540] ml-0.5 transition-opacity duration-100 ${
              cursorVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            |
          </span>
        </div>

        {/* 3. SUBTITLE */}
        <p className="text-xs sm:text-sm tracking-[0.25em] text-slate-400 font-poppins uppercase font-medium">
          Curated Road Trips Across India
        </p>

        {/* 4. PREMIUM HORIZONTAL LOADING BAR */}
        <div className="w-48 sm:w-56 h-1 rounded-full bg-slate-100 relative overflow-hidden mt-4">
          <motion.div
            className="absolute top-0 bottom-0 bg-gradient-to-r from-[#C8A96A] via-[#D4AF37] to-[#C8A96A] rounded-full"
            initial={{ x: "-100%", width: "40%" }}
            animate={{ x: "280%", width: "40%" }}
            transition={{
              repeat: Infinity,
              duration: 1.4,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* 5. BOTTOM STATUS WITH ANIMATED DOTS */}
        <p className="text-xs text-slate-400 font-poppins font-medium pt-1">
          {statusText}
          {".".repeat(dotsCount)}
        </p>
      </div>
    </motion.div>
  );
}
