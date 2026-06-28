import { useState, useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import {
  House, Microphone, ClipboardText, Package, User, CaretLeft, Check, Sparkle,
  Camera, ArrowRight, MagnifyingGlass, PencilSimple, ForkKnife, Clock,
  CheckCircle, Tray, CaretRight, SignOut,
} from "./icons";
import { Shell, PageHead, type NavItem } from "./Shell";
import { Button, StatusLabel, AnimatedNumber, Avatar, Tag } from "./ui";
import { Sticker, Petals } from "./brand";
import { Waveform, MicOrb } from "./voice";
import {
  useStore, timeAgo, tenge, tengeShort, CATEGORY_COLOR,
  type WriteOff,
} from "./store";
import type { Extraction, CreateFields } from "./api";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { translate as T } from "./i18n";
import { getPrefs, setPref, haptic, getHomePoint, setHomePoint } from "./prefs";

const navItems = (): NavItem[] => [
  { id: "home", label: T("home"), Icon: House },
  { id: "new", label: T("capture"), Icon: Microphone },
  { id: "requests", label: T("requests"), Icon: ClipboardText },
  { id: "products", label: T("products"), Icon: Package },
  { id: "profile", label: T("profile"), Icon: User },
];

const fade = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
};

export function Employee({ onExit }: { onExit: () => void }) {
  const { me } = useStore();
  const [tab, setTab] = useState("home");
  const [flow, setFlow] = useState(false);

  function nav(id: string) {
    if (id === "new") setFlow(true);
    else setTab(id);
  }

  return (
    <>
      <Shell nav={navItems()} active={flow ? "new" : tab} onNav={nav} roleLabel="Employee" user={me.name} hue={me.hue} onExit={onExit}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} {...fade}>
            {tab === "home" && <Dashboard onCapture={() => setFlow(true)} onTab={setTab} />}
            {tab === "requests" && <MyRequests />}
            {tab === "products" && <Products />}
            {tab === "profile" && <Profile onExit={onExit} />}
          </motion.div>
        </AnimatePresence>
      </Shell>

      <AnimatePresence>
        {flow && <Flow onClose={() => setFlow(false)} onSubmitted={() => { setFlow(false); setTab("requests"); }} />}
      </AnimatePresence>
    </>
  );
}

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const rise: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 140, damping: 18 } },
};

function Dashboard({ onCapture, onTab }: { onCapture: () => void; onTab: (t: string) => void }) {
  const { me, requests } = useStore();
  const mine = requests.filter((r) => r.employeeId === me.id);
  const pending = mine.filter((r) => r.status === "pending").length;
  const approved = mine.filter((r) => r.status === "approved").length;
  const avoided = mine.filter((r) => r.status === "approved").reduce((s, r) => s + r.loss, 0);
  const WEEK_TARGET = 50000;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="px-5">
      {/* slim context row (identity lives in the header band) */}
      <motion.div variants={rise} className="pt-6 flex items-center gap-2 text-[13px] font-semibold text-[var(--vera-rose-gray)]">
        {greeting()} <span className="size-1 rounded-full bg-[var(--vera-rose-gray)]/50" /> <LiveClock /> <span className="size-1 rounded-full bg-[var(--vera-rose-gray)]/50" /> {me.point}
      </motion.div>

      {/* HERO — dramatic voice capture */}
      <motion.div variants={rise} className="mt-6">
        <Sticker tone="coral" className="overflow-hidden">
          <button onClick={onCapture} className="relative w-full flex flex-col items-center px-6 pt-9 pb-7 text-[var(--vera-accent-cream)]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/18 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
              <Sparkle size={13} /> {T("voiceFirst")}
            </span>

            {/* orb with rotating energy ring */}
            <div className="relative my-6 grid place-items-center" style={{ width: 188, height: 188 }}>
              <motion.div
                className="absolute rounded-full"
                style={{ width: 188, height: 188, background: "conic-gradient(from 0deg, rgba(255,241,232,0), rgba(255,241,232,0.55), rgba(255,241,232,0))", filter: "blur(2px)" }}
                animate={{ rotate: 360 }}
                transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
              />
              <span className="absolute rounded-full border border-white/25" style={{ width: 188, height: 188 }} />
              <motion.span
                className="absolute rounded-full border border-white/20"
                style={{ width: 150, height: 150 }}
                animate={{ scale: [1, 1.06, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
                className="relative grid place-items-center rounded-full bg-[var(--vera-cream)]"
                style={{ width: 116, height: 116, boxShadow: "0 18px 36px -14px rgba(43,32,35,0.45), inset 0 2px 6px rgba(255,255,255,0.7)" }}
              >
                <Microphone size={46} className="text-[var(--vera-strawberry)]" />
              </motion.div>
            </div>

            <h2 className="text-[22px] leading-tight text-[var(--vera-accent-cream)]">{T("tapToTell")}</h2>
            <p className="mt-1 text-[13.5px] text-[var(--vera-accent-cream)]/80 max-w-[28ch] text-center">
              {T("tapSub")}
            </p>
          </button>
        </Sticker>
      </motion.div>

      {/* This week — big gauge beside a divided stat column, no boxes */}
      <motion.div variants={rise} className="mt-8 flex items-center gap-6 border-t border-[#e6ded7] pt-6">
        <RadialGauge value={avoided} target={WEEK_TARGET} />
        <div className="flex-1 divide-y divide-[#e6ded7]">
          {[
            { Icon: Clock, value: pending, label: T("pending"), tab: "requests" },
            { Icon: CheckCircle, value: approved, label: T("approved"), tab: "requests" },
          ].map((s) => (
            <button key={s.label} onClick={() => onTab(s.tab)} className="flex w-full items-center gap-3 py-3 text-left">
              <s.Icon size={18} className="text-[var(--vera-rose-gray)]" />
              <span className="text-[28px] font-bold text-[var(--vera-cocoa)] leading-none" style={{ fontFamily: "Montserrat" }}>
                <AnimatedNumber value={s.value} />
              </span>
              <span className="text-[13px] font-semibold text-[var(--vera-rose-gray)]">{s.label}</span>
              <CaretRight size={16} className="ml-auto text-[var(--vera-rose-gray)]" />
            </button>
          ))}
        </div>
      </motion.div>

      {/* Actions — clean inline rows, not boxes */}
      <motion.div variants={rise} className="mt-7">
        <h3 className="text-[15px] mb-1 px-1">{T("quickActions")}</h3>
        <div className="divide-y divide-[#e6ded7]">
          {[
            { Icon: PencilSimple, label: T("manualEntry"), desc: T("manualSub"), onClick: onCapture },
            { Icon: Package, label: T("products"), desc: T("productsSub"), onClick: () => onTab("products") },
            { Icon: ClipboardText, label: T("requests"), desc: T("requestsSub"), onClick: () => onTab("requests") },
          ].map((q) => (
            <button key={q.label} onClick={q.onClick} className="group flex w-full items-center gap-3.5 py-3.5 text-left">
              <span className="grid place-items-center size-10 rounded-xl bg-[var(--vera-blush)] text-[var(--vera-strawberry)] transition-colors group-hover:bg-[var(--vera-strawberry)] group-hover:text-[var(--vera-accent-cream)]">
                <q.Icon size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-[var(--vera-cocoa)]">{q.label}</span>
                <span className="block text-[12.5px] text-[var(--vera-rose-gray)]">{q.desc}</span>
              </span>
              <CaretRight size={18} className="text-[var(--vera-rose-gray)] transition-transform group-hover:translate-x-1" />
            </button>
          ))}
        </div>
      </motion.div>

      {/* Activity timeline */}
      <motion.div variants={rise} className="mt-7">
        <div className="flex items-center justify-between">
          <h2 className="text-[20px]">{T("recentActivity")}</h2>
          <button onClick={() => onTab("requests")} className="inline-flex items-center gap-1 text-[14px] font-semibold text-[var(--vera-strawberry)]">{T("all")} <ArrowRight size={15} /></button>
        </div>
        {mine.length === 0 ? (
          <Empty label={T("noWriteoffs")} onAction={onCapture} actionLabel={T("capture")} />
        ) : (
          <div className="relative mt-4 pl-5">
            <motion.span
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-[5px] top-1 bottom-3 w-[2px] origin-top rounded-full bg-[#f0d8cf]"
            />
            <div className="space-y-1">
              {mine.slice(0, 5).map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.07 }}
                  className="relative"
                >
                  <span className="absolute -left-5 top-5 size-2.5 rounded-full border-2 border-[var(--vera-cream)]" style={{ background: CATEGORY_COLOR[r.category] }} />
                  <RequestRow r={r} i={i} expandable />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function LiveClock() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setT(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return <span className="font-mono tabular-nums">{t.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>;
}

function RadialGauge({ value, target }: { value: number; target: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / target));
  const tip = (pct: number) => {
    const ang = (-90 + pct * 360) * (Math.PI / 180);
    return { x: 70 + r * Math.cos(ang), y: 70 + r * Math.sin(ang) };
  };
  const p = tip(pct);
  return (
    <div className="relative grid place-items-center" style={{ width: 140, height: 140 }}>
      {/* soft glow */}
      <div className="absolute size-[120px] rounded-full blur-2xl" style={{ background: "radial-gradient(closest-side, rgba(224,70,77,0.28), transparent)" }} />
      <svg width={140} height={140} viewBox="0 0 140 140" className="-rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--vera-rose-surface)" strokeWidth="11" />
        <motion.circle
          cx="70" cy="70" r={r} fill="none" stroke="url(#gaugeGrad)" strokeWidth="11" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          style={{ filter: "drop-shadow(0 2px 6px rgba(224,70,77,0.45))" }}
        />
        {pct > 0.02 && (
          <motion.circle
            cx={p.x} cy={p.y} r="6" fill="#fff" stroke="var(--vera-strawberry)" strokeWidth="3"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}
          />
        )}
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ec5158" />
            <stop offset="100%" stopColor="var(--vera-berry)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <div className="text-[18px] font-bold text-[var(--vera-cocoa)] leading-none" style={{ fontFamily: "Montserrat" }}>
          <AnimatedNumber value={value} format={(v) => tengeShort(v)} />
        </div>
        <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-[var(--vera-strawberry)]/12 px-2 py-0.5 text-[10px] font-bold text-[var(--vera-strawberry)]">
          {Math.round(pct * 100)}% {T("ofCapPct")}
        </div>
      </div>
    </div>
  );
}

const STATUS_TONE: Record<string, { c: string; label: string }> = {
  pending: { c: "var(--vera-amber)", label: "Pending" },
  approved: { c: "var(--vera-mint)", label: "Approved" },
  rejected: { c: "var(--vera-berry)", label: "Rejected" },
};

function StatusChip({ tone, children, pulse }: { tone: string; children: React.ReactNode; pulse?: boolean }) {
  const c = STATUS_TONE[tone]?.c ?? "var(--vera-rose-gray)";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-bold capitalize" style={{ color: c, background: `${c}1f` }}>
      <span className="relative inline-flex size-1.5">
        {pulse && <motion.span className="absolute inset-0 rounded-full" style={{ background: c }} animate={{ scale: [1, 2.6], opacity: [0.6, 0] }} transition={{ duration: 1.6, repeat: Infinity }} />}
        <span className="relative inline-flex size-1.5 rounded-full" style={{ background: c }} />
      </span>
      {children}
    </span>
  );
}

function MyRequests() {
  const { me, requests } = useStore();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const mine = requests.filter((r) => r.employeeId === me.id);
  const list = filter === "all" ? mine : mine.filter((r) => r.status === filter);
  const filters = ["all", "pending", "approved", "rejected"] as const;

  return (
    <div className="px-5">
      <PageHead title={T("myRequests")} subtitle={T("myRequestsSub")} />
      {/* segmented filter with sliding indicator */}
      <div className="mt-6 flex gap-1 rounded-full bg-[var(--vera-blush)] p-1">
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className="relative flex-1 rounded-full py-2 text-[12.5px] font-bold capitalize">
            {filter === f && <motion.span layoutId="reqFilter" transition={{ type: "spring", stiffness: 380, damping: 32 }} className="absolute inset-0 rounded-full bg-[var(--vera-cocoa)]" />}
            <span className="relative" style={{ color: filter === f ? "var(--vera-cream)" : "var(--vera-brown-gray)" }}>{T(f)}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 divide-y divide-[#ece4dd]">
        {list.map((r, i) => <RequestRow key={r.id} r={r} i={i} expandable />)}
        {list.length === 0 && <Empty label={T("nothingHere")} />}
      </div>
    </div>
  );
}

function RequestRow({ r, i, expandable }: { r: WriteOff; i: number; expandable?: boolean }) {
  const [open, setOpen] = useState(false);
  const cat = CATEGORY_COLOR[r.category];
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
      <button onClick={() => expandable && setOpen((o) => !o)} className="group w-full flex items-center gap-3.5 py-4 text-left">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl">
          {r.photo ? (
            <ImageWithFallback src={r.photo} alt={r.product} className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center" style={{ background: `${cat}22`, color: cat }}><ForkKnife size={22} /></div>
          )}
          <span className="absolute left-0 top-0 h-full w-1" style={{ background: cat }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-[var(--vera-cocoa)] truncate">{r.qty} · {r.product}</div>
          <div className="text-[12.5px] text-[var(--vera-rose-gray)] truncate">{r.reason}</div>
          <div className="mt-1.5 flex items-center gap-2">
            <StatusChip tone={r.status} pulse={r.status === "pending"}>{T(r.status)}</StatusChip>
            {r.status === "approved" && r.sync !== "idle" && (
              <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold" style={{ color: r.sync === "failed" ? "var(--vera-berry)" : "var(--vera-mint)" }}>
                {r.sync === "syncing" ? T("syncingShort") : r.sync === "synced" ? T("syncedShort") : T("syncFailedShort")}
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-[13px] font-bold text-[var(--vera-cocoa)]">{tenge(r.loss)}</div>
          <div className="text-[11.5px] text-[var(--vera-rose-gray)]">{timeAgo(r.createdAt)}</div>
        </div>
        {expandable && <CaretRight size={18} className={`shrink-0 text-[var(--vera-rose-gray)] transition-transform ${open ? "rotate-90" : "group-hover:translate-x-0.5"}`} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mb-4 ml-[68px] rounded-2xl bg-white/70 border border-[#ece4dd] p-4">
              <p className="text-[13.5px] text-[var(--vera-cocoa)] leading-relaxed">{r.comment}</p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-[var(--vera-rose-gray)]">
                <span>{r.doc}</span><span>·</span><span>{r.point}</span><span>·</span><span>{r.deduction === "without" ? T("withoutDeduction") : T("withDeduction")}</span>
              </div>
              {r.reviewerNote && <div className="mt-3 rounded-xl bg-[var(--vera-berry)]/10 px-3.5 py-2.5 text-[12.5px] font-medium text-[var(--vera-berry)]">{r.reviewerNote}</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Products() {
  const { products } = useStore();
  const [q, setQ] = useState("");
  const list = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase())),
    [products, q],
  );
  const cats = Array.from(new Set(list.map((p) => p.category)));
  return (
    <div className="px-5">
      <PageHead title={T("productsTitle")} subtitle={T("productsCatalogSub")} />
      <div className="relative mt-6 max-w-md">
        <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--vera-rose-gray)]" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={T("searchProducts")} className="w-full rounded-full border border-[#f0d8cf] bg-white/70 py-3 pl-11 pr-4 outline-none focus:border-[var(--vera-strawberry)]" />
      </div>
      {list.length === 0 && <Empty label={T("noProducts")} />}
      {cats.map((c) => (
        <div key={c} className="mt-7">
          <div className="flex items-center gap-2 mb-2"><h3 className="text-[16px]">{c}</h3><Tag color={CATEGORY_COLOR[c]}>{list.filter((p) => p.category === c).length}</Tag></div>
          <div className="divide-y divide-[#f0d8cf]">
            {list.filter((p) => p.category === c).map((p) => (
              <div key={p.name} className="flex items-center justify-between py-3.5">
                <div className="flex items-center gap-3">
                  <span className="size-9 rounded-xl grid place-items-center" style={{ background: `${CATEGORY_COLOR[c]}22`, color: CATEGORY_COLOR[c] }}><ForkKnife size={18} /></span>
                  <span className="font-semibold text-[var(--vera-cocoa)]">{p.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-[var(--vera-cocoa)] text-[14px]">{tenge(p.cost)}</div>
                  <div className="text-[12px] text-[var(--vera-rose-gray)]">{T("per")} {p.unit}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Profile({ onExit }: { onExit: () => void }) {
  const { me, requests, tradePoints } = useStore();
  const mine = requests.filter((r) => r.employeeId === me.id);
  const total = mine.reduce((s, r) => s + r.loss, 0);
  const [opts, setOpts] = useState(getPrefs);
  const [homePoint, setHomePointState] = useState(getHomePoint);

  return (
    <div className="px-5 max-w-2xl">
      <PageHead title={T("profileTitle")} />
      <div className="mt-5 relative overflow-hidden rounded-[24px] p-5 text-[var(--vera-accent-cream)]" style={{ background: "linear-gradient(150deg, #ec5158, var(--vera-strawberry) 55%, var(--vera-berry))", boxShadow: "0 24px 48px -28px rgba(168,44,57,0.7)" }}>
        <div className="absolute -top-10 -right-8 size-40 rounded-full bg-white/15 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <div className="rounded-full ring-2 ring-white/40"><Avatar name={me.name} hue={me.hue} size={64} /></div>
          <div className="min-w-0">
            <h2 className="text-[22px] text-[var(--vera-accent-cream)] truncate">{me.name}</h2>
            <div className="mt-0.5 inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-[12px] font-semibold">{me.point}</div>
          </div>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 border-y border-[#ecd5cc] py-5">
        {[
          { n: mine.length, l: T("writeoffs") },
          { n: mine.filter((r) => r.status === "approved").length, l: T("approved") },
          { n: total, l: T("totalLogged"), money: true },
        ].map((s, idx) => (
          <div key={s.l} className={`text-center ${idx > 0 ? "border-l border-[#ecd5cc]" : ""}`}>
            <div className="text-[22px] font-bold text-[var(--vera-cocoa)]" style={{ fontFamily: "Montserrat" }}>{s.money ? <AnimatedNumber value={s.n} format={(v) => tenge(v)} /> : <AnimatedNumber value={s.n} />}</div>
            <div className="text-[12px] font-semibold text-[var(--vera-rose-gray)]">{s.l}</div>
          </div>
        ))}
      </div>
      {tradePoints.length > 0 && (
        <div className="mt-8">
          <h3 className="text-[16px]">{T("yourTradePoint")}</h3>
          <p className="text-[13px] text-[var(--vera-rose-gray)]">{T("yourTradePointSub")}</p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {tradePoints.map((tp) => {
              const on = homePoint === tp.id;
              return (
                <button
                  key={tp.id}
                  onClick={() => { const next = on ? null : tp.id; setHomePoint(next); setHomePointState(next); }}
                  className={`rounded-full px-4 py-2.5 text-[14px] font-semibold transition-colors ${on ? "bg-[var(--vera-strawberry)] text-[var(--vera-accent-cream)]" : "bg-white/70 text-[var(--vera-cocoa)] border border-[#f0d8cf]"}`}
                >
                  {tp.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <h3 className="mt-8 text-[16px]">{T("preferences")}</h3>
      <div className="mt-2 divide-y divide-[#f0d8cf]">
        {([
          ["haptics", T("haptics"), T("hapticsSub")],
          ["voiceHints", T("voiceHints"), T("voiceHintsSub")],
          ["autoPhoto", T("autoPhoto"), T("autoPhotoSub")],
        ] as const).map(([k, t, d]) => (
          <div key={k} className="flex items-center justify-between py-4">
            <div><div className="font-semibold text-[var(--vera-cocoa)]">{t}</div><div className="text-[13px] text-[var(--vera-rose-gray)]">{d}</div></div>
            <Toggle on={opts[k]} onToggle={() => setOpts(setPref(k, !opts[k]))} />
          </div>
        ))}
      </div>
      <Button variant="soft" className="mt-8" onClick={onExit}><SignOut size={18} /> {T("switchRole")}</Button>
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="relative h-7 w-12 rounded-full transition-colors" style={{ background: on ? "var(--vera-mint)" : "var(--vera-rose-surface)" }}>
      <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 30 }} className="absolute top-1 size-5 rounded-full bg-white shadow" style={{ left: on ? 26 : 4 }} />
    </button>
  );
}

function Empty({ label, onAction, actionLabel }: { label: string; onAction?: () => void; actionLabel?: string }) {
  return (
    <div className="py-14 flex flex-col items-center text-center">
      <motion.div animate={{ y: [0, -7, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="grid place-items-center size-16 rounded-3xl bg-white/70 text-[var(--vera-strawberry)]"><Tray size={30} /></motion.div>
      <p className="mt-4 text-[14px] text-[var(--vera-brown-gray)] max-w-[28ch]">{label}</p>
      {onAction && <Button className="mt-4" size="sm" onClick={onAction}><Microphone size={16} /> {actionLabel}</Button>}
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? T("goodMorning") : h < 18 ? T("goodAfternoon") : T("goodEvening");
}

/* =============================== Capture flow ============================= */
type Step = "record" | "transcript" | "extract" | "missing" | "photo" | "confirm" | "done";
const PROGRESS: Record<Step, number> = { record: 1, transcript: 2, extract: 3, missing: 4, photo: 5, confirm: 6, done: 6 };

function Flow({ onClose, onSubmitted }: { onClose: () => void; onSubmitted: () => void }) {
  const store = useStore();
  const [prefs] = useState(getPrefs);
  // The employee's saved default trade point, validated against the live catalog.
  const homePointId = useMemo(() => {
    const h = getHomePoint();
    return h && store.tradePoints.some((t) => t.id === h) ? h : null;
  }, [store.tradePoints]);
  const [step, setStep] = useState<Step>("record");
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [transcript, setTranscript] = useState("");
  const [ext, setExt] = useState<Extraction | null>(null);

  // Structured fields (prefilled from extraction, editable in the missing step).
  const [productId, setProductId] = useState<string | null>(null);
  const [tradePointId, setTradePointId] = useState<string | null>(homePointId);
  const [quantity, setQuantity] = useState<number | null>(null);
  const [unit, setUnit] = useState<string | null>(null);
  const [deductionType, setDeductionType] = useState<"with_deduction" | "without_deduction" | null>(null);
  const [reason, setReason] = useState("");

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const product = store.products.find((p) => p.id === productId) ?? null;
  const point = store.tradePoints.find((t) => t.id === tradePointId) ?? null;
  const estLoss = product && quantity ? product.cost * quantity : 0;

  const needs = { product: !productId, point: !tradePointId, qty: quantity == null, deduction: !deductionType };
  const hasMissing = needs.product || needs.point || needs.qty || needs.deduction;

  function applyExtraction(x: Extraction) {
    setExt(x);
    setProductId(x.productId);
    setTradePointId(x.tradePointId ?? homePointId);
    setQuantity(x.quantity);
    setUnit(x.unit ?? store.products.find((p) => p.id === x.productId)?.unit ?? null);
    setDeductionType(x.deductionType);
    setReason(x.reason ?? "");
  }

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = () => stream.getTracks().forEach((t) => t.stop());
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      haptic(8);
    } catch {
      // Mic blocked/unavailable — fall back to typing the transcript.
      setError(T("micUnavailable"));
      setStep("transcript");
    }
  }

  async function stopAndTranscribe() {
    const mr = mediaRef.current;
    if (!mr) return;
    const blob: Blob = await new Promise((resolve) => {
      mr.addEventListener("stop", () => resolve(new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" })), { once: true });
      mr.stop();
    });
    setRecording(false);
    haptic(8);
    setBusy(true);
    setError(null);
    try {
      const res = await store.transcribe(blob);
      setTranscript(res.transcript);
    } catch {
      setError(T("transcribeFailed"));
    } finally {
      setBusy(false);
      setStep("transcript");
    }
  }

  async function runExtraction() {
    if (!transcript.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const x = await store.extract(transcript.trim());
      applyExtraction(x);
      // Auto-camera: when nothing is missing, skip the review screen and jump
      // straight to the photo step (computed from the extraction, not state,
      // since the setters above haven't flushed yet).
      const willMiss = !x.productId || !(x.tradePointId ?? homePointId) || x.quantity == null || !x.deductionType;
      setStep(prefs.autoPhoto && !willMiss ? "photo" : "extract");
    } catch (e) {
      setError(e instanceof Error ? e.message : T("extractionFailed"));
    } finally {
      setBusy(false);
    }
  }

  function pickPhoto(file: File) {
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function buildFields(): CreateFields {
    return {
      productId: productId ?? undefined,
      productName: productId ? undefined : ext?.productName ?? undefined,
      tradePointId: tradePointId ?? undefined,
      quantity: quantity ?? undefined,
      unit: unit ?? product?.unit ?? undefined,
      reason: reason.trim() || undefined,
      deductionType: deductionType ?? undefined,
      comment: ext?.aiGeneratedComment ?? ext?.comment ?? undefined,
      voiceTranscript: transcript.trim() || undefined,
      aiGeneratedComment: ext?.aiGeneratedComment ?? undefined,
      aiConfidenceScore: ext?.confidenceScore ?? undefined,
    };
  }

  async function finish() {
    setBusy(true);
    setError(null);
    try {
      await store.submitWriteOff({ fields: buildFields(), photoFile });
      haptic([10, 40, 10]);
      setStep("done");
      window.setTimeout(onSubmitted, 1600);
    } catch (e) {
      setError(e instanceof Error ? e.message : T("couldNotSubmit"));
    } finally {
      setBusy(false);
    }
  }

  const reviewRows = [
    { k: "product", label: T("fieldProduct"), value: product?.name ?? ext?.productName ?? "—" },
    { k: "qty", label: T("fieldQuantity"), value: quantity != null ? `${quantity}${unit ? ` ${unit}` : ""}` : "—" },
    { k: "point", label: T("fieldTradePoint"), value: point?.name ?? "—" },
    { k: "reason", label: T("fieldReason"), value: reason || "—" },
    { k: "deduction", label: T("fieldDeduction"), value: deductionType === "with_deduction" ? T("withDeduction") : deductionType === "without_deduction" ? T("withoutDeduction") : "—" },
  ];

  const progress = PROGRESS[step];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-[var(--vera-cream)]">
      <div className="relative mx-auto max-w-[560px] h-[100dvh] px-6 pt-7 pb-10 flex flex-col">
        {step !== "done" && (
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="grid place-items-center size-10 rounded-full bg-white/70 text-[var(--vera-cocoa)]"><CaretLeft size={20} /></button>
            <div className="flex-1 flex gap-1.5">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-1.5 flex-1 rounded-full bg-[var(--vera-rose-surface)] overflow-hidden">
                  <motion.div className="h-full bg-[var(--vera-strawberry)]" animate={{ width: progress >= n ? "100%" : "0%" }} transition={{ duration: 0.4 }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <p className="mt-3 rounded-xl bg-[var(--vera-blush)] px-3.5 py-2.5 text-[12.5px] font-medium text-[var(--vera-strawberry)]">{error}</p>}

        <AnimatePresence mode="wait">
          {step === "record" && (
            <motion.div key="rec" {...fade} className="flex-1 flex flex-col items-center justify-center text-center">
              <h2 className="text-[22px]">{recording ? T("listening") : T("tellVera")}</h2>
              <p className="mt-2 text-[14px] text-[var(--vera-brown-gray)] max-w-[30ch]">{T("tellVeraSub")}</p>
              <div className="my-8"><MicOrb active={recording} onClick={() => (recording ? stopAndTranscribe() : startRecording())} size={140} /></div>
              <Waveform active={recording} />
              <p className="mt-8 text-[15px] leading-relaxed min-h-[48px] max-w-[34ch] text-[var(--vera-rose-gray)]">
                {recording ? T("recordingTapFinish") : busy ? T("transcribingShort") : T("tapMicSpeak")}
              </p>
              {prefs.voiceHints && !recording && !busy && (
                <div className="mt-1 max-w-[34ch] space-y-1 text-[13px] text-[var(--vera-rose-gray)]">
                  <p className="font-semibold text-[var(--vera-raspberry)]">{T("voiceHintTitle")}</p>
                  <p className="italic">{T("voiceHintEx1")}</p>
                  <p className="italic">{T("voiceHintEx2")}</p>
                </div>
              )}
              <Button full className="mt-6 max-w-[300px]" disabled={!recording || busy} onClick={stopAndTranscribe}>{T("finishRecording")}</Button>
              <button onClick={() => setStep("transcript")} className="mt-4 text-[13px] font-semibold text-[var(--vera-rose-gray)] underline">{T("typeInstead")}</button>
            </motion.div>
          )}

          {step === "transcript" && (
            <motion.div key="tra" {...fade} className="flex-1 flex flex-col pt-8">
              <div className="flex items-center gap-2 text-[var(--vera-raspberry)]"><Microphone size={18} /><span className="font-bold">{T("yourWords")}</span></div>
              <h2 className="mt-2 text-[24px]">{T("reviewTranscript")}</h2>
              <p className="mt-2 text-[14px] text-[var(--vera-brown-gray)]">{T("reviewTranscriptSub")}</p>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={6}
                placeholder={T("transcriptPh")}
                className="mt-5 w-full rounded-2xl border-[1.5px] border-[#e6ded7] bg-white px-4 py-3.5 outline-none focus:border-[var(--vera-strawberry)] text-[15px] leading-relaxed"
              />
              <p className="mt-3 flex items-start gap-1.5 text-[12.5px] text-[var(--vera-rose-gray)]"><PencilSimple size={14} className="mt-0.5 shrink-0" /> {T("transcriptHint")}</p>
              <div className="mt-auto pt-8"><Button full disabled={!transcript.trim() || busy} onClick={runExtraction}><Sparkle size={18} /> {busy ? T("structuring") : T("structureWithVera")}</Button></div>
            </motion.div>
          )}

          {step === "extract" && (
            <motion.div key="ext" {...fade} className="flex-1 flex flex-col pt-8 overflow-y-auto">
              <div className="flex items-center gap-2 text-[var(--vera-raspberry)]"><Sparkle size={18} /><span className="font-bold">{T("veraStructured")}</span>{ext && <span className="ml-auto text-[12px] font-semibold text-[var(--vera-rose-gray)]">{Math.round(ext.confidenceScore * 100)}% {T("confident")}</span>}</div>
              <h2 className="mt-2 text-[24px]">{T("checkDetails")}</h2>
              <div className="mt-6 divide-y divide-[#f0d8cf]">
                {reviewRows.map((f, i) => (
                  <motion.div key={f.k} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="flex items-center justify-between py-4">
                    <span className="text-[13px] font-bold uppercase tracking-wide text-[var(--vera-rose-gray)]">{f.label}</span>
                    <span className="font-semibold text-[var(--vera-cocoa)] text-right max-w-[60%]">{f.value}</span>
                  </motion.div>
                ))}
              </div>
              {(ext?.aiGeneratedComment || ext?.comment) && (
                <div className="mt-5">
                  <p className="text-[13px] font-bold uppercase tracking-wide text-[var(--vera-rose-gray)]">{T("cleanedComment")}</p>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--vera-cocoa)]">{ext?.aiGeneratedComment ?? ext?.comment}</p>
                </div>
              )}
              <div className="mt-auto pt-8"><Button full onClick={() => setStep(hasMissing ? "missing" : "photo")}><Check size={18} /> {hasMissing ? T("addMissingDetails") : T("looksCorrect")}</Button></div>
            </motion.div>
          )}

          {step === "missing" && (
            <motion.div key="mis" {...fade} className="flex-1 flex flex-col pt-8 overflow-y-auto">
              <h2 className="text-[24px] max-w-[16ch]">{T("fillMissing")}</h2>
              <p className="mt-2 text-[14px] text-[var(--vera-brown-gray)]">{T("fillMissingSub")}</p>
              {needs.product && (
                <div className="mt-7"><p className="text-[13px] font-bold uppercase tracking-wide text-[var(--vera-rose-gray)] mb-3">{T("fieldProduct")}</p><div className="flex flex-wrap gap-2.5">{store.products.map((p) => <Chip key={p.id} on={productId === p.id} onClick={() => { setProductId(p.id); setUnit(p.unit); }}>{p.name}</Chip>)}</div></div>
              )}
              {needs.point && (
                <div className="mt-7"><p className="text-[13px] font-bold uppercase tracking-wide text-[var(--vera-rose-gray)] mb-3">{T("fieldTradePoint")}</p><div className="flex flex-wrap gap-2.5">{store.tradePoints.map((t) => <Chip key={t.id} on={tradePointId === t.id} onClick={() => setTradePointId(t.id)}>{t.name}</Chip>)}</div></div>
              )}
              {needs.qty && (
                <div className="mt-7"><p className="text-[13px] font-bold uppercase tracking-wide text-[var(--vera-rose-gray)] mb-3">{T("fieldQuantity")}{unit ? ` (${unit})` : ""}</p>
                  <input type="number" inputMode="decimal" min={0} step="0.1" value={quantity ?? ""} onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : null)} placeholder="0" className="w-40 rounded-2xl border-[1.5px] border-[#e6ded7] bg-white px-4 py-3 outline-none focus:border-[var(--vera-strawberry)] text-[16px]" /></div>
              )}
              {needs.deduction && (
                <div className="mt-7"><p className="text-[13px] font-bold uppercase tracking-wide text-[var(--vera-rose-gray)] mb-3">{T("fieldDeduction")}</p><div className="flex flex-wrap gap-3"><Chip on={deductionType === "without_deduction"} onClick={() => setDeductionType("without_deduction")}>{T("withoutDeduction")}</Chip><Chip on={deductionType === "with_deduction"} onClick={() => setDeductionType("with_deduction")}>{T("withDeduction")}</Chip></div></div>
              )}
              <div className="mt-auto pt-8"><Button full disabled={hasMissing} onClick={() => setStep("photo")}>{T("continue")}</Button></div>
            </motion.div>
          )}

          {step === "photo" && (
            <motion.div key="pho" {...fade} className="flex-1 flex flex-col pt-8">
              <h2 className="text-[24px]">{T("attachPhoto")}</h2>
              <p className="mt-2 text-[14px] text-[var(--vera-brown-gray)] max-w-[34ch]">{T("attachPhotoSub")}</p>
              <label className="mt-6 relative grid place-items-center aspect-[4/3] overflow-hidden rounded-3xl border-[1.5px] border-dashed border-[#e0c8bf] bg-white/60 cursor-pointer">
                {photoPreview ? (
                  <img src={photoPreview} alt="proof" className="absolute inset-0 size-full object-cover" />
                ) : (
                  <span className="flex flex-col items-center gap-2 text-[var(--vera-rose-gray)]"><Camera size={32} /><span className="text-[14px] font-semibold">{T("tapTakeUpload")}</span></span>
                )}
                <input type="file" accept="image/*" capture="environment" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => { const f = e.target.files?.[0]; if (f) pickPhoto(f); }} />
              </label>
              <div className="mt-auto pt-8 flex items-center gap-3">{photoPreview && <Button variant="soft" onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}><Camera size={18} /> {T("retake")}</Button>}<Button full disabled={!photoFile} onClick={() => setStep("confirm")}>{T("continue")}</Button></div>
            </motion.div>
          )}

          {step === "confirm" && (
            <motion.div key="con" {...fade} className="flex-1 flex flex-col pt-8 overflow-y-auto">
              <h2 className="text-[24px]">{T("readyToSend")}</h2>
              {photoPreview && <div className="mt-5 overflow-hidden rounded-3xl"><img src={photoPreview} alt="proof" className="w-full h-44 object-cover" /></div>}
              <div className="mt-5 divide-y divide-[#f0d8cf]">
                {reviewRows.map((f) => (
                  <div key={f.k} className="flex items-center justify-between py-3"><span className="text-[13px] font-bold uppercase tracking-wide text-[var(--vera-rose-gray)]">{f.label}</span><span className="font-semibold text-[var(--vera-cocoa)] text-right max-w-[60%]">{f.value}</span></div>
                ))}
                <div className="flex items-center justify-between py-3"><span className="text-[13px] font-bold uppercase tracking-wide text-[var(--vera-rose-gray)]">{T("estLoss")}</span><span className="font-bold text-[var(--vera-berry)]">{tenge(estLoss)}</span></div>
              </div>
              <div className="mt-auto pt-8 flex items-center gap-3"><Button variant="soft" disabled={busy} onClick={() => setStep("extract")}>{T("editStep")}</Button><Button full disabled={busy} onClick={finish}>{busy ? T("sending") : T("submitForApproval")}</Button></div>
            </motion.div>
          )}

          {step === "done" && (
            <motion.div key="done" {...fade} className="flex-1 flex flex-col items-center justify-center text-center">
              <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14 }} className="grid place-items-center size-28 rounded-full bg-[var(--vera-mint)] text-white"><Check size={54} /></motion.div>
              <h1 className="mt-7 text-[28px]">{T("sentToManager")}</h1>
              <p className="mt-2 text-[15px] text-[var(--vera-brown-gray)] max-w-[30ch]">{T("sentToManagerSub")}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function Chip({ children, on, onClick }: { children: React.ReactNode; on: boolean; onClick: () => void }) {
  return <motion.button whileTap={{ scale: 0.95 }} onClick={onClick} className={`rounded-full px-5 py-3 font-semibold transition-colors ${on ? "bg-[var(--vera-strawberry)] text-[var(--vera-accent-cream)]" : "bg-white/70 text-[var(--vera-cocoa)] border border-[#f0d8cf]"}`}>{children}</motion.button>;
}

