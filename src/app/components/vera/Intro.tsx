import { motion } from "motion/react";
import { useEffect } from "react";
import { Atmosphere } from "./ui";
import { VeraLogo, Petals } from "./brand";

/* Brand reveal built around the real VERA sticker logo. */
export function Intro({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 3200);
    return () => window.clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="relative grid place-items-center w-full min-h-[100dvh] bg-[var(--vera-cream)] overflow-hidden"
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.6 }}
    >
      <Atmosphere />

      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.3, rotate: -14, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 160, damping: 13, delay: 0.15 }}
          className="relative"
        >
          <VeraLogo width={230} float className="max-w-[68vw]" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-8 text-[14px] font-bold tracking-[0.22em] uppercase text-[var(--vera-rose-gray)]"
        >
          Speak · Structure · Verify
        </motion.p>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1.3, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 h-1 w-28 origin-left rounded-full bg-[var(--vera-strawberry)]"
        />
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        onClick={onDone}
        className="absolute bottom-10 text-[13px] font-semibold text-[var(--vera-rose-gray)] hover:text-[var(--vera-berry)]"
      >
        Skip
      </motion.button>
    </motion.div>
  );
}
