import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Compass } from "lucide-react";

export function LoadingScreen() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDone(true), 1400);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] grid place-items-center bg-primary"
        >
          <div className="flex flex-col items-center gap-5">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="grid h-16 w-16 place-items-center rounded-2xl bg-gold-gradient text-gold-foreground shadow-gold"
            >
              <Compass className="h-8 w-8" />
            </motion.span>
            <motion.span
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, repeat: Infinity, repeatType: "reverse" }}
              className="font-display text-2xl font-bold tracking-wide text-white"
            >
              Nomadik
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
