import { motion } from "motion/react";
import type { ReactNode } from "react";
import logo from "../../../imports/Adobe_Express_-_file.png";

/* ================================================================== */
/* VERA brand kit — derived from the real sticker logo.                */
/* Lives in its own module so the look stays consistent app-wide.      */
/* ================================================================== */

export const LOGO_SRC = logo;

/* The actual logo asset, for splash / auth / big moments */
export function VeraLogo({ width = 180, className = "", float = false }: { width?: number; className?: string; float?: boolean }) {
  const img = (
    <img
      src={logo}
      alt="VERA"
      style={{ width, height: "auto" }}
      className={`block h-auto object-contain drop-shadow-[0_22px_40px_-16px_rgba(184,50,66,0.5)] ${className}`}
    />
  );
  if (!float) return img;
  return (
    <motion.div animate={{ y: [0, -7, 0] }} transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}>
      {img}
    </motion.div>
  );
}

/* Compact "sticker" wordmark badge — bitten corner, coral fill, cream type */
export function VeraMark({ size = 34, biteColor = "var(--vera-cream)" }: { size?: number; biteColor?: string }) {
  const h = size;
  const bite = h * 0.52;
  return (
    <div
      className="relative inline-flex items-center justify-center select-none"
      style={{
        height: h,
        paddingInline: h * 0.5,
        background: "var(--vera-strawberry)",
        borderRadius: h * 0.42,
        border: `${Math.max(2, h * 0.07)}px solid var(--vera-berry)`,
        boxShadow: "0 10px 22px -10px rgba(184,50,66,0.7)",
      }}
    >
      <span style={{ fontFamily: "Montserrat", fontWeight: 700, fontSize: h * 0.5, color: "var(--vera-accent-cream)", lineHeight: 1 }}>
        VERA
      </span>
      <span className="absolute rounded-full" style={{ width: bite, height: bite, top: -bite * 0.4, right: -bite * 0.16, background: biteColor }} />
    </div>
  );
}

/* Petal / leaf cluster accent lifted from the logo */
export function Petals({ size = 44, className = "", style }: { size?: number; className?: string; style?: any }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} style={style} aria-hidden="true">
      <g fill="var(--vera-peach)">
        <path d="M24 5c3.2 4.4 3.2 9.6 0 14-3.2-4.4-3.2-9.6 0-14Z" />
        <path d="M35 11c-1 5.4-4.3 8.7-9.7 9.7 1-5.4 4.3-8.7 9.7-9.7Z" opacity="0.9" />
        <path d="M13 11c1 5.4 4.3 8.7 9.7 9.7-1-5.4-4.3-8.7-9.7-9.7Z" opacity="0.9" />
        <path d="M24 21c3.2 4.4 3.2 9.6 0 14-3.2-4.4-3.2-9.6 0-14Z" opacity="0.75" />
      </g>
      <circle cx="24" cy="19.5" r="2.3" fill="var(--vera-rose-surface)" />
    </svg>
  );
}

/* Signature "bitten sticker" surface — the logo shape as a container.
   Used for hero moments. Coral by default; pass tone="cream" for light. */
export function Sticker({
  children,
  tone = "coral",
  className = "",
  bite = true,
}: {
  children: ReactNode;
  tone?: "coral" | "cream";
  className?: string;
  bite?: boolean;
}) {
  const coral = tone === "coral";
  return (
    <div
      className={`relative ${className}`}
      style={{
        background: coral
          ? "linear-gradient(155deg, #ec5158 0%, var(--vera-strawberry) 45%, var(--vera-berry) 100%)"
          : "var(--vera-white-cream)",
        border: coral ? "1px solid rgba(168,44,57,0.6)" : "1px solid #e7ddd6",
        borderRadius: 28,
        boxShadow: coral
          ? "0 30px 60px -28px rgba(168,44,57,0.65), inset 0 1px 0 rgba(255,255,255,0.22)"
          : "0 20px 44px -30px rgba(40,30,30,0.35), inset 0 1px 0 rgba(255,255,255,0.7)",
      }}
    >
      {bite && (
        <span
          className="absolute rounded-full"
          style={{ width: 54, height: 54, top: -22, right: 26, background: "var(--vera-cream)", border: "2.5px solid transparent" }}
        />
      )}
      {children}
    </div>
  );
}
