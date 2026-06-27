import { motion, useMotionValue, useSpring, useTransform, animate } from "motion/react";
import { useEffect, type ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* VERA primitives — typographic, soft, animated.                      */
/* ------------------------------------------------------------------ */

type BtnVariant = "primary" | "soft" | "ghost" | "danger" | "dark";

export function Button({
  children,
  variant = "primary",
  onClick,
  className = "",
  type = "button",
  disabled = false,
  full = false,
  size = "md",
}: {
  children: ReactNode;
  variant?: BtnVariant;
  onClick?: (e?: any) => void;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  full?: boolean;
  size?: "sm" | "md";
}) {
  const styles: Record<BtnVariant, string> = {
    primary: "bg-[var(--vera-strawberry)] text-[var(--vera-accent-cream)] shadow-[0_14px_30px_-12px_rgba(242,85,95,0.75)] hover:bg-[var(--vera-raspberry)]",
    dark: "bg-[var(--vera-cocoa)] text-[var(--vera-cream)] hover:bg-[#3a2c30]",
    soft: "bg-white/70 text-[var(--vera-cocoa)] border border-[#f1d7cd] hover:bg-white",
    ghost: "bg-transparent text-[var(--vera-brown-gray)] hover:text-[var(--vera-berry)]",
    danger: "bg-white text-[var(--vera-berry)] border border-[#f3c8c8] hover:bg-[#fff3f3]",
  };
  const pad = size === "sm" ? "px-4 py-2 text-[13px]" : "px-6 py-3.5";
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.96, y: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold disabled:opacity-40 disabled:pointer-events-none transition-colors ${pad} ${full ? "w-full" : ""} ${styles[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
}

const dotColor: Record<string, string> = {
  pending: "var(--vera-amber)",
  approved: "var(--vera-mint)",
  rejected: "var(--vera-berry)",
  synced: "var(--vera-mint)",
  syncing: "var(--vera-amber)",
  failed: "var(--vera-berry)",
  idle: "var(--vera-rose-gray)",
};

export function StatusDot({ tone, pulse = false }: { tone: string; pulse?: boolean }) {
  return (
    <span className="relative inline-flex size-2.5">
      {pulse && (
        <motion.span className="absolute inset-0 rounded-full" style={{ background: dotColor[tone] }} animate={{ scale: [1, 2.4], opacity: [0.5, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }} />
      )}
      <span className="relative inline-flex size-2.5 rounded-full" style={{ background: dotColor[tone] }} />
    </span>
  );
}

export function StatusLabel({ tone, children, pulse }: { tone: string; children: ReactNode; pulse?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 text-[13px] font-bold capitalize" style={{ color: dotColor[tone] }}>
      <StatusDot tone={tone} pulse={pulse} />
      {children}
    </span>
  );
}

export function AnimatedNumber({ value, className = "", format = (n: number) => Math.round(n).toString() }: { value: number; className?: string; format?: (n: number) => string }) {
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) => format(v));
  useEffect(() => {
    const controls = animate(mv, value, { duration: 1.1, ease: [0.16, 1, 0.3, 1] });
    return controls.stop;
  }, [value, mv]);
  return <motion.span className={className}>{display}</motion.span>;
}

export function Magnetic({ children, strength = 0.25, className = "" }: { children: ReactNode; strength?: number; className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 15 });
  const sy = useSpring(y, { stiffness: 200, damping: 15 });
  return (
    <motion.div
      style={{ x: sx, y: sy }}
      className={className}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => { x.set(0); y.set(0); }}
    >
      {children}
    </motion.div>
  );
}

export function Avatar({ name, hue = 348, size = 36 }: { name: string; hue?: number; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span
      className="grid place-items-center rounded-full font-bold text-white shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        fontFamily: "Montserrat",
        background: `linear-gradient(140deg, hsl(${hue} 72% 62%), hsl(${hue + 18} 64% 50%))`,
        boxShadow: `0 8px 16px -8px hsl(${hue} 70% 50% / 0.7)`,
      }}
    >
      {initials}
    </span>
  );
}

export function Tag({ children, color }: { children: ReactNode; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold" style={{ color, background: `${color}1f` }}>
      <span className="size-1.5 rounded-full" style={{ background: color }} />
      {children}
    </span>
  );
}

export function VeraMark({ size = 34, light = false }: { size?: number; light?: boolean }) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <div className="relative grid place-items-center rounded-[30%] bg-[var(--vera-strawberry)] shadow-[0_8px_18px_-8px_rgba(242,85,95,0.8)]" style={{ width: size, height: size }}>
        <span className="font-bold text-[var(--vera-accent-cream)]" style={{ fontFamily: "Montserrat", fontSize: size * 0.5 }}>V</span>
        <span className="absolute -top-1 -right-1 rounded-full bg-[var(--vera-cream)]" style={{ width: size * 0.32, height: size * 0.32 }} />
      </div>
      <span className="font-bold tracking-tight" style={{ fontFamily: "Montserrat", fontSize: size * 0.62, color: light ? "var(--vera-cream)" : "var(--vera-berry)" }}>VERA</span>
    </div>
  );
}

export function Atmosphere({ subtle = false }: { subtle?: boolean }) {
  const blobs = [
    { c: "var(--vera-rose-surface)", s: 420, x: "-12%", y: "-10%", d: 16 },
    { c: "var(--vera-peach)", s: 320, x: "78%", y: "8%", d: 20 },
    { c: "var(--vera-blush)", s: 480, x: "55%", y: "72%", d: 24 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {blobs.map((b, i) => (
        <motion.div key={i} className="absolute rounded-full blur-[80px]" style={{ width: b.s, height: b.s, left: b.x, top: b.y, background: b.c, opacity: subtle ? 0.28 : 0.45 }} animate={{ x: [0, 30, -20, 0], y: [0, -25, 20, 0] }} transition={{ duration: b.d, repeat: Infinity, ease: "easeInOut" }} />
      ))}
    </div>
  );
}
