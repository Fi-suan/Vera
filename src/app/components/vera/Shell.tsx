import { motion } from "motion/react";
import { type ReactNode } from "react";
import type { IconType } from "./icons";
import { SignOut, Bell } from "./icons";
import { Atmosphere, Avatar } from "./ui";
import { VeraLogo } from "./brand";

export type NavItem = { id: string; label: string; Icon: IconType };

/* ------------------------------------------------------------------ */
/* Mobile-first shell: airy content, a floating glass dock, slim rail. */
/* No heavy chrome boxes — navigation floats over the content.         */
/* ------------------------------------------------------------------ */

export function Shell({
  nav,
  active,
  onNav,
  roleLabel,
  user,
  hue,
  onExit,
  children,
}: {
  nav: NavItem[];
  active: string;
  onNav: (id: string) => void;
  roleLabel: string;
  user: string;
  hue: number;
  onExit: () => void;
  children: ReactNode;
}) {
  return (
    <div className="relative w-full min-h-[100dvh] bg-[var(--vera-cream)] text-[var(--vera-cocoa)] flex">
      <Atmosphere subtle />

      {/* Desktop slim rail */}
      <aside className="relative z-10 hidden md:flex w-[88px] hover:w-[230px] transition-[width] duration-300 group shrink-0 flex-col items-stretch px-4 py-7 overflow-hidden">
        <div className="px-1.5 mb-8">
          <VeraLogo width={92} />
        </div>
        <nav className="flex flex-col gap-1">
          {nav.map(({ id, label, Icon }) => {
            const on = active === id;
            return (
              <button key={id} onClick={() => onNav(id)} className="relative flex items-center gap-3 rounded-2xl px-3 py-3 text-left">
                {on && (
                  <motion.span layoutId="rail-pill" className="absolute inset-0 rounded-2xl bg-white shadow-[0_12px_28px_-18px_rgba(184,50,66,0.5)]" transition={{ type: "spring", stiffness: 380, damping: 32 }} />
                )}
                <Icon size={22} className="relative z-10 shrink-0" style={{ color: on ? "var(--vera-strawberry)" : "var(--vera-rose-gray)" }} />
                <span className="relative z-10 font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: on ? "var(--vera-cocoa)" : "var(--vera-brown-gray)" }}>{label}</span>
              </button>
            );
          })}
        </nav>
        <button onClick={onExit} className="mt-auto flex items-center gap-3 rounded-2xl px-3 py-3 text-[var(--vera-rose-gray)] hover:text-[var(--vera-berry)]">
          <SignOut size={22} className="shrink-0" />
          <span className="font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Switch role</span>
        </button>
      </aside>

      <div className="relative z-10 flex-1 min-w-0 flex flex-col">
        {/* Top bar — context, not a box */}
        <header className="flex items-center justify-between px-6 md:px-9 pt-6">
          <div className="md:hidden"><VeraLogo width={78} /></div>
          <div className="hidden md:block text-[13px] font-semibold text-[var(--vera-rose-gray)]">{roleLabel} workspace</div>
          <div className="flex items-center gap-3">
            <button className="relative grid place-items-center size-9 rounded-full bg-white/60 text-[var(--vera-cocoa)] hover:bg-white">
              <Bell size={18} />
              <span className="absolute top-2 right-2 size-1.5 rounded-full bg-[var(--vera-strawberry)]" />
            </button>
            <Avatar name={user} hue={hue} size={34} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-32 md:pb-12">{children}</main>

        {/* Mobile floating glass dock */}
        <div className="md:hidden fixed bottom-0 inset-x-0 z-30 px-5 pb-5 pointer-events-none">
          <motion.nav
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 26 }}
            className="pointer-events-auto mx-auto flex max-w-md items-center justify-between rounded-[26px] px-3 py-2.5 bg-[rgba(255,252,248,0.72)] backdrop-blur-xl border border-white/70 shadow-[0_18px_44px_-18px_rgba(184,50,66,0.45),inset_0_1px_0_rgba(255,255,255,0.6)]"
          >
            {nav.map(({ id, label, Icon }) => {
              const on = active === id;
              return (
                <button key={id} onClick={() => onNav(id)} className="relative flex flex-1 flex-col items-center gap-1 py-1.5">
                  {on && <motion.span layoutId="dock-pill" className="absolute -top-0.5 inset-x-3 h-9 rounded-2xl bg-[var(--vera-strawberry)]/12" transition={{ type: "spring", stiffness: 380, damping: 30 }} />}
                  <motion.span animate={{ y: on ? -1 : 0, scale: on ? 1.08 : 1 }} transition={{ type: "spring", stiffness: 400, damping: 22 }} className="relative">
                    <Icon size={23} style={{ color: on ? "var(--vera-strawberry)" : "var(--vera-rose-gray)" }} />
                  </motion.span>
                  <span className="relative text-[10px] font-bold tracking-wide" style={{ color: on ? "var(--vera-strawberry)" : "var(--vera-rose-gray)" }}>{label}</span>
                </button>
              );
            })}
          </motion.nav>
        </div>
      </div>
    </div>
  );
}

/* Page header — large, left-aligned, editorial. No box. */
export function PageHead({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 px-6 md:px-9 pt-5 md:pt-7">
      <div className="min-w-0">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ease: [0.16, 1, 0.3, 1] }}
          className="text-[clamp(28px,7vw,40px)] leading-[1.03] tracking-tight"
        >
          {title}
        </motion.h1>
        {subtitle && <p className="mt-1.5 text-[14px] text-[var(--vera-brown-gray)] max-w-[48ch]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
