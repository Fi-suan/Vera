import { motion } from "motion/react";

/* Soft pulsing strawberry waveform — reacts to "listening" */
export function Waveform({ active }: { active: boolean }) {
  const bars = Array.from({ length: 40 });
  return (
    <div className="flex items-end justify-center gap-[4px] h-16 w-full">
      {bars.map((_, i) => {
        const base = 8 + ((i * 13) % 22);
        return (
          <motion.span
            key={i}
            className="w-[4px] rounded-full"
            style={{
              background: active ? "var(--vera-strawberry)" : "var(--vera-rose-surface)",
            }}
            animate={
              active
                ? { height: [base, base + 30, base * 0.6, base + 18, base] }
                : { height: base * 0.6 }
            }
            transition={{
              duration: 1 + (i % 6) * 0.1,
              repeat: active ? Infinity : 0,
              ease: "easeInOut",
              delay: (i % 9) * 0.05,
            }}
          />
        );
      })}
    </div>
  );
}

/* Tactile microphone orb with layered breathing halos */
export function MicOrb({
  active,
  onClick,
  size = 150,
}: {
  active: boolean;
  onClick?: () => void;
  size?: number;
}) {
  return (
    <div className="relative grid place-items-center" style={{ width: size * 1.5, height: size * 1.5 }}>
      {active &&
        [0, 0.5, 1].map((delay) => (
          <motion.span
            key={delay}
            className="absolute rounded-full"
            style={{ width: size, height: size, background: "var(--vera-strawberry)" }}
            animate={{ scale: [1, 1.7], opacity: [0.3, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay }}
          />
        ))}
      <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.93 }}
        animate={active ? { scale: [1, 1.05, 1] } : { scale: 1 }}
        transition={
          active
            ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
            : { type: "spring", stiffness: 300, damping: 18 }
        }
        className="relative z-10 grid place-items-center rounded-full bg-gradient-to-br from-[var(--vera-strawberry)] to-[var(--vera-berry)] shadow-[0_26px_50px_-18px_rgba(217,70,85,0.9)]"
        style={{ width: size, height: size }}
      >
        {/* soft inner highlight */}
        <span className="absolute inset-2 rounded-full bg-gradient-to-b from-white/25 to-transparent" />
        <svg
          width={size * 0.34}
          height={size * 0.34}
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--vera-accent-cream)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="relative"
        >
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M5 10a7 7 0 0 0 14 0M12 17v5" />
        </svg>
      </motion.button>
    </div>
  );
}
