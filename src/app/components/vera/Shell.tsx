import { motion } from "motion/react";
import { type ReactNode } from "react";
import type { IconType } from "./icons";
import { SignOut, Bell } from "./icons";
import { Avatar } from "./ui";
import { VeraLogo } from "./brand";
import { translate as T } from "./i18n";

export type NavItem = { id: string; label: string; Icon: IconType };

/* nav id -> i18n key, so labels translate regardless of caller */
const NAV_KEY: Record<string, string> = {
  home: "home", new: "capture", requests: "requests", products: "products", profile: "profile",
  overview: "overview", queue: "queue", records: "records", employees: "team", sync: "iiko",
};
function signedInName(): string {
  try { return (localStorage.getItem("vera.user") || "").trim(); } catch { return ""; }
}

/* ------------------------------------------------------------------ */
/* App architecture: a coral header band carrying identity, with the   */
/* page content in a cream sheet that overlaps it. Full-width tab bar.  */
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
  const who = signedInName() || user;
  const first = (who || "").trim().split(" ")[0] || "—";
  const roleText = roleLabel === "Manager" ? T("managerRole") : T("employeeRole");
  return (
    <div className="relative w-full min-h-[100dvh] bg-[var(--vera-cocoa)] flex justify-center">
      <div className="relative w-full max-w-[460px] flex flex-col min-h-[100dvh]">
        {/* coral identity band */}
        <div className="relative shrink-0 overflow-hidden px-5 pt-6 pb-12" style={{ background: "linear-gradient(160deg, #ec5158, var(--vera-strawberry) 55%, var(--vera-berry))" }}>
          <motion.div
            className="absolute -top-20 -right-12 size-60 rounded-full blur-[60px]"
            style={{ background: "rgba(255,255,255,0.22)" }}
            animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.85, 0.5] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative flex items-center justify-between">
            <div className="rounded-2xl bg-white/95 px-2.5 py-1.5 shadow-md">
              <VeraLogo width={66} />
            </div>
            <div className="flex items-center gap-2.5">
              <button onClick={onExit} className="grid place-items-center size-9 rounded-full bg-white/18 text-[var(--vera-accent-cream)] active:scale-95 transition-transform" aria-label="Sign out">
                <SignOut size={18} />
              </button>
              <button className="relative grid place-items-center size-9 rounded-full bg-white/18 text-[var(--vera-accent-cream)] active:scale-95 transition-transform" aria-label="Notifications">
                <Bell size={18} />
                <span className="absolute top-2 right-2 size-1.5 rounded-full bg-white" />
              </button>
              <Avatar name={who || "U"} hue={hue} size={36} />
            </div>
          </div>

          <div className="relative mt-5 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-white/18 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--vera-accent-cream)]">
              {roleText}
            </span>
          </div>
          <h2 className="relative mt-2 text-[clamp(22px,6vw,28px)] font-bold leading-tight tracking-tight text-[var(--vera-accent-cream)]">
            {T("hi")}, {first}
          </h2>
        </div>

        {/* content sheet */}
        <main className="relative flex-1 -mt-6 rounded-t-[28px] bg-[var(--vera-cream)] text-[var(--vera-cocoa)] overflow-y-auto pb-24 shadow-[0_-10px_30px_-20px_rgba(0,0,0,0.25)]">
          {children}
        </main>

        {/* full-width bottom bar */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-30 w-full max-w-[460px] px-3 pb-3 pointer-events-none">
          <motion.nav
            initial={{ y: 70, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 26 }}
            style={{ willChange: "transform", transform: "translateZ(0)" }}
            className="pointer-events-auto flex w-full items-stretch rounded-[22px] bg-[var(--vera-white-cream)]/95 backdrop-blur-md border border-[#ece4dd] shadow-[0_16px_36px_-16px_rgba(29,26,25,0.4)] px-1.5 py-1.5"
          >
            {nav.map(({ id, label, Icon }) => {
              const on = active === id;
              return (
                <button key={id} onClick={() => onNav(id)} className="relative flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-2xl">
                  {on && <motion.span layoutId="navActive" transition={{ type: "spring", stiffness: 380, damping: 32 }} className="absolute inset-0 rounded-2xl bg-[var(--vera-strawberry)]/12" />}
                  <Icon size={21} weight={on ? "fill" : "regular"} style={{ color: on ? "var(--vera-strawberry)" : "var(--vera-rose-gray)" }} />
                  <span className="relative text-[10.5px] font-semibold leading-none" style={{ color: on ? "var(--vera-strawberry)" : "var(--vera-rose-gray)" }}>{NAV_KEY[id] ? T(NAV_KEY[id]) : label}</span>
                </button>
              );
            })}
          </motion.nav>
        </div>
      </div>
    </div>
  );
}

/* Section header used inside the content sheet */
export function PageHead({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 px-5 pt-6">
      <div className="min-w-0">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ease: [0.16, 1, 0.3, 1] }}
          className="text-[clamp(22px,6vw,28px)] leading-[1.1] tracking-tight"
        >
          {title}
        </motion.h1>
        {subtitle && <p className="mt-1.5 text-[13.5px] text-[var(--vera-brown-gray)]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
