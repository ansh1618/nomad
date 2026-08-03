import { useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import { GoNomadikLoadingScreen } from "./GoNomadikLoadingScreen";

export function LoadingScreen() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDone(true), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {!done && <GoNomadikLoadingScreen fullPage={true} statusText="Loading journeys" />}
    </AnimatePresence>
  );
}
