import { motion } from "motion/react";
import { Microphone, ShieldCheck, ArrowRight, type IconType } from "./icons";
import { Atmosphere, Magnetic } from "./ui";
import { VeraLogo, Petals } from "./brand";
import type { Role } from "./store";

export function Auth({ onPick }: { onPick: (r: Role) => void }) {
  const roles: {
    id: Role;
    title: string;
    line: string;
    Icon: IconType;
    accent: string;
    tint: string;
    bullets: string[];
  }[] = [
    {
      id: "employee",
      title: "On the floor",
      line: "Report write-offs by voice and track every decision.",
      Icon: Microphone,
      accent: "var(--vera-strawberry)",
      tint: "var(--vera-rose-surface)",
      bullets: ["Voice & manual capture", "AI structures the request", "Live status & history"],
    },
    {
      id: "manager",
      title: "Running the point",
      line: "Review, decide, analyse loss, and keep Iiko in sync.",
      Icon: ShieldCheck,
      accent: "var(--vera-berry)",
      tint: "var(--vera-blush)",
      bullets: ["Review queue & approvals", "Loss analytics", "Iiko sync center"],
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative w-full min-h-[100dvh] bg-[var(--vera-cream)] overflow-hidden flex flex-col">
      <Atmosphere />

      <div className="relative px-6 md:px-12 pt-8">
        <VeraLogo width={104} />
      </div>

      <div className="relative flex-1 flex flex-col justify-center px-6 md:px-12 max-w-[1120px] w-full mx-auto py-10">
        <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1, ease: [0.16, 1, 0.3, 1] }} className="text-[clamp(34px,6vw,60px)] leading-[1.0] max-w-[15ch]">
          One system. <span className="text-[var(--vera-strawberry)]">Two sides of the same shift.</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-4 text-[16px] text-[var(--vera-brown-gray)] max-w-[52ch]">
          Choose how you're working today. Everything you do flows into the same live record — switch roles any time.
        </motion.p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {roles.map((r, i) => (
            <Magnetic key={r.id} strength={0.1}>
              <motion.button
                initial={{ y: 28, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.12, type: "spring", stiffness: 140, damping: 18 }}
                whileHover={{ y: -6 }}
                onClick={() => onPick(r.id)}
                className="group relative w-full overflow-hidden rounded-[34px] p-8 text-left bg-white/60 border border-white/70 backdrop-blur-sm shadow-[0_30px_60px_-34px_rgba(184,50,66,0.4)]"
              >
                <span className="absolute -right-12 -top-12 size-48 rounded-full blur-2xl transition-transform duration-500 group-hover:scale-125" style={{ background: r.tint, opacity: 0.7 }} />
                <Petals size={58} className="absolute bottom-6 right-7 opacity-70 transition-transform duration-500 group-hover:-rotate-12" />
                <span className="relative grid place-items-center size-14 rounded-2xl text-white" style={{ background: r.accent }}>
                  <r.Icon size={28} />
                </span>
                <h3 className="relative mt-6 text-[24px]">{r.title}</h3>
                <p className="relative mt-1.5 text-[15px] text-[var(--vera-brown-gray)] max-w-[34ch]">{r.line}</p>
                <ul className="relative mt-5 space-y-1.5">
                  {r.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-[14px] text-[var(--vera-cocoa)]">
                      <span className="size-1.5 rounded-full" style={{ background: r.accent }} /> {b}
                    </li>
                  ))}
                </ul>
                <span className="relative mt-6 inline-flex items-center gap-2 font-bold" style={{ color: r.accent }}>
                  Enter <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1.5" />
                </span>
              </motion.button>
            </Magnetic>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
