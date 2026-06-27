import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
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
  useStore, timeAgo, tenge, PRODUCTS, CATEGORY_COLOR,
  type WriteOff, type Draft,
} from "./store";
import { ImageWithFallback } from "../figma/ImageWithFallback";

const NAV: NavItem[] = [
  { id: "home", label: "Home", Icon: House },
  { id: "new", label: "Capture", Icon: Microphone },
  { id: "requests", label: "Requests", Icon: ClipboardText },
  { id: "products", label: "Products", Icon: Package },
  { id: "profile", label: "Profile", Icon: User },
];

const PROOF = [
  "https://images.unsplash.com/photo-1466637574441-749b8f19452f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900",
  "https://images.unsplash.com/photo-1591189863430-ab87e120f312?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900",
  "https://images.unsplash.com/photo-1503810473512-f64b56827964?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900",
];

const fade = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
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
      <Shell nav={NAV} active={flow ? "new" : tab} onNav={nav} roleLabel="Employee" user={me.name} hue={me.hue} onExit={onExit}>
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

function Dashboard({ onCapture, onTab }: { onCapture: () => void; onTab: (t: string) => void }) {
  const { me, requests } = useStore();
  const mine = requests.filter((r) => r.employeeId === me.id);
  const pending = mine.filter((r) => r.status === "pending").length;
  const approved = mine.filter((r) => r.status === "approved").length;
  const avoided = mine.filter((r) => r.status === "approved").reduce((s, r) => s + r.loss, 0);

  return (
    <div className="px-6 md:px-9">
      <PageHead title={greeting() + ", " + me.name.split(" ")[0]} subtitle={`${me.role} · ${me.point} · morning shift`} />

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, ease: [0.16, 1, 0.3, 1] }} className="mt-6">
        <Sticker tone="coral" className="overflow-hidden">
          <Petals size={120} className="absolute -bottom-4 -left-2 opacity-25" />
          <div className="relative flex flex-col md:flex-row items-center gap-6 p-7 md:p-9 text-[var(--vera-accent-cream)]">
            <div className="flex-1 order-2 md:order-1 text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[12px] font-bold">Voice first</span>
              <h2 className="mt-3 text-[clamp(22px,5vw,30px)] leading-tight max-w-[18ch] text-[var(--vera-accent-cream)]">Something to write off? Just tell VERA.</h2>
              <p className="mt-2 text-[14px] text-[var(--vera-accent-cream)]/85 max-w-[40ch]">Speak naturally — product, quantity, reason. VERA structures it, you confirm, your manager reviews.</p>
              <div className="mt-5 flex items-center justify-center md:justify-start gap-3">
                <button onClick={onCapture} className="inline-flex items-center gap-2 rounded-full bg-[var(--vera-cream)] px-5 py-3 font-semibold text-[var(--vera-berry)] active:scale-[0.97] transition-transform"><Microphone size={18} /> Start capture</button>
                <button onClick={onCapture} className="inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-3 font-semibold text-[var(--vera-accent-cream)] active:scale-[0.97] transition-transform"><PencilSimple size={18} /> Manual</button>
              </div>
            </div>
            <div className="order-1 md:order-2 shrink-0"><MicOrb active={false} onClick={onCapture} size={132} /></div>
          </div>
        </Sticker>
      </motion.div>

      <div className="mt-8 grid grid-cols-3 border-t border-[#ecd5cc] pt-5">
        {[
          { n: pending, l: "Pending", Icon: Clock },
          { n: approved, l: "Approved", Icon: CheckCircle },
          { n: avoided, l: "Logged this week", money: true, Icon: ForkKnife },
        ].map((s, idx) => (
          <div key={s.l} className={idx > 0 ? "pl-4 md:pl-6 border-l border-[#ecd5cc]" : "pr-4"}>
            <s.Icon size={18} className="text-[var(--vera-rose-gray)]" />
            <div className="mt-2 text-[clamp(24px,5vw,32px)] font-bold text-[var(--vera-cocoa)] tracking-tight" style={{ fontFamily: "Fredoka" }}>
              {s.money ? <AnimatedNumber value={s.n} format={(v) => tenge(v)} /> : <AnimatedNumber value={s.n} />}
            </div>
            <div className="mt-0.5 text-[12px] font-semibold text-[var(--vera-rose-gray)]">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="mt-9 flex items-center justify-between">
        <h2 className="text-[20px]">Recent activity</h2>
        <button onClick={() => onTab("requests")} className="inline-flex items-center gap-1 text-[14px] font-semibold text-[var(--vera-strawberry)]">All requests <ArrowRight size={15} /></button>
      </div>
      <div className="mt-3 divide-y divide-[#f0d8cf]">
        {mine.slice(0, 4).map((r, i) => <RequestRow key={r.id} r={r} i={i} />)}
        {mine.length === 0 && <Empty label="No write-offs yet — capture your first one." onAction={onCapture} actionLabel="Capture" />}
      </div>
    </div>
  );
}

function MyRequests() {
  const { me, requests } = useStore();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const mine = requests.filter((r) => r.employeeId === me.id);
  const list = filter === "all" ? mine : mine.filter((r) => r.status === filter);
  const filters = ["all", "pending", "approved", "rejected"] as const;

  return (
    <div className="px-6 md:px-9">
      <PageHead title="My requests" subtitle="Every write-off you've sent, and where it stands." />
      <div className="mt-6 flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-2 text-[13px] font-bold capitalize transition-colors ${filter === f ? "bg-[var(--vera-cocoa)] text-[var(--vera-cream)]" : "bg-white/60 text-[var(--vera-brown-gray)] hover:bg-white"}`}>{f}</button>
        ))}
      </div>
      <div className="mt-4 divide-y divide-[#f0d8cf]">
        {list.map((r, i) => <RequestRow key={r.id} r={r} i={i} expandable />)}
        {list.length === 0 && <Empty label={`Nothing ${filter === "all" ? "" : filter} here.`} />}
      </div>
    </div>
  );
}

function RequestRow({ r, i, expandable }: { r: WriteOff; i: number; expandable?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
      <button onClick={() => expandable && setOpen((o) => !o)} className="w-full flex items-center gap-4 py-4 text-left">
        {r.photo ? (
          <div className="size-14 shrink-0 overflow-hidden rounded-2xl"><ImageWithFallback src={r.photo} alt={r.product} className="size-full object-cover" /></div>
        ) : (
          <div className="size-14 shrink-0 grid place-items-center rounded-2xl" style={{ background: `${CATEGORY_COLOR[r.category]}22`, color: CATEGORY_COLOR[r.category] }}><ForkKnife size={22} /></div>
        )}
        <div className="min-w-0 flex-1">
          <span className="font-bold text-[var(--vera-cocoa)]">{r.qty} · {r.product}</span>
          <div className="text-[13px] text-[var(--vera-brown-gray)] truncate">{r.reason}</div>
          <div className="mt-1.5 flex items-center gap-3">
            <StatusLabel tone={r.status} pulse={r.status === "pending"}>{r.status}</StatusLabel>
            {r.status === "approved" && <StatusLabel tone={r.sync} pulse={r.sync === "syncing"}>{r.sync === "syncing" ? "Syncing" : r.sync === "synced" ? "Synced" : r.sync === "failed" ? "Sync failed" : "—"}</StatusLabel>}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-[13px] font-bold text-[var(--vera-cocoa)]">{tenge(r.loss)}</div>
          <div className="text-[12px] text-[var(--vera-rose-gray)]">{timeAgo(r.createdAt)}</div>
        </div>
        {expandable && <CaretRight size={18} className={`text-[var(--vera-rose-gray)] transition-transform ${open ? "rotate-90" : ""}`} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="pb-5 pl-[72px] pr-2">
              <p className="text-[14px] text-[var(--vera-cocoa)] leading-relaxed">{r.comment}</p>
              <div className="mt-2 text-[13px] text-[var(--vera-rose-gray)]">{r.doc} · {r.point} · {r.deduction === "without" ? "Without" : "With"} deduction</div>
              {r.reviewerNote && <div className="mt-3 rounded-2xl bg-[#ffe6e6] px-4 py-3 text-[13px] text-[var(--vera-berry)]">{r.reviewerNote}</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Products() {
  const [q, setQ] = useState("");
  const list = PRODUCTS.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  const cats = Array.from(new Set(list.map((p) => p.category)));
  return (
    <div className="px-6 md:px-9">
      <PageHead title="Products" subtitle="Reference catalogue used when you capture a write-off." />
      <div className="relative mt-6 max-w-md">
        <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--vera-rose-gray)]" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="w-full rounded-full border border-[#f0d8cf] bg-white/70 py-3 pl-11 pr-4 outline-none focus:border-[var(--vera-strawberry)]" />
      </div>
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
                  <div className="text-[12px] text-[var(--vera-rose-gray)]">per {p.unit}</div>
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
  const { me, requests } = useStore();
  const mine = requests.filter((r) => r.employeeId === me.id);
  const total = mine.reduce((s, r) => s + r.loss, 0);
  const [opts, setOpts] = useState({ haptics: true, voiceHints: true, autoPhoto: false });

  return (
    <div className="px-6 md:px-9 max-w-2xl">
      <PageHead title="Profile" />
      <div className="mt-6 flex items-center gap-4">
        <Avatar name={me.name} hue={me.hue} size={72} />
        <div><h2 className="text-[22px]">{me.name}</h2><div className="text-[14px] text-[var(--vera-brown-gray)]">{me.role} · {me.point}</div></div>
      </div>
      <div className="mt-7 grid grid-cols-3 border-y border-[#ecd5cc] py-5">
        {[
          { n: mine.length, l: "Write-offs" },
          { n: mine.filter((r) => r.status === "approved").length, l: "Approved" },
          { n: total, l: "Total logged", money: true },
        ].map((s, idx) => (
          <div key={s.l} className={`text-center ${idx > 0 ? "border-l border-[#ecd5cc]" : ""}`}>
            <div className="text-[22px] font-bold text-[var(--vera-cocoa)]" style={{ fontFamily: "Fredoka" }}>{s.money ? <AnimatedNumber value={s.n} format={(v) => tenge(v)} /> : <AnimatedNumber value={s.n} />}</div>
            <div className="text-[12px] font-semibold text-[var(--vera-rose-gray)]">{s.l}</div>
          </div>
        ))}
      </div>
      <h3 className="mt-8 text-[16px]">Preferences</h3>
      <div className="mt-2 divide-y divide-[#f0d8cf]">
        {([
          ["haptics", "Haptic feedback", "Subtle buzz on capture and submit"],
          ["voiceHints", "Voice hints", "Show example phrasing while recording"],
          ["autoPhoto", "Auto-open camera", "Jump straight to photo after extraction"],
        ] as const).map(([k, t, d]) => (
          <div key={k} className="flex items-center justify-between py-4">
            <div><div className="font-semibold text-[var(--vera-cocoa)]">{t}</div><div className="text-[13px] text-[var(--vera-rose-gray)]">{d}</div></div>
            <Toggle on={opts[k]} onToggle={() => setOpts((o) => ({ ...o, [k]: !o[k] }))} />
          </div>
        ))}
      </div>
      <Button variant="soft" className="mt-8" onClick={onExit}><SignOut size={18} /> Switch role</Button>
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
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

/* =============================== Capture flow ============================= */
const SCENARIOS: { transcript: string; draft: Omit<Draft, "transcript">; missing?: ("qty" | "deduction")[] }[] = [
  { transcript: "Write off 3 cutlets, they fell on the floor during assembly, Aktau Mall, without deduction.", draft: { product: "Beef cutlets", category: "Meat", qty: "3 pcs", point: "Aktau Mall", reason: "Fell on the floor during order assembly", deduction: "without", comment: "3 beef cutlets fell on the floor during order assembly and cannot be reused per sanitary rules.", loss: 2130 } },
  { transcript: "Mozzarella went past its shelf life, found it at the morning check, about one point two kilos.", draft: { product: "Mozzarella", category: "Dairy", qty: "1.2 kg", point: "Aktau Mall", reason: "Expired shelf life found at morning check", deduction: "with", comment: "1.2 kg mozzarella past shelf life, removed during the morning stock check.", loss: 5376 }, missing: ["deduction"] },
  { transcript: "Some croissants burned in the oven this morning, they're not sellable.", draft: { product: "Croissants", category: "Bakery", qty: "6 pcs", point: "Aktau Mall", reason: "Over-baked and burned in the oven", deduction: "without", comment: "6 croissants over-baked and burned, not suitable for sale.", loss: 1890 }, missing: ["qty"] },
];

type Step = "record" | "extract" | "missing" | "photo" | "confirm" | "done";

function Flow({ onClose, onSubmitted }: { onClose: () => void; onSubmitted: () => void }) {
  const store = useStore();
  const scenario = useMemo(() => SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)], []);
  const [step, setStep] = useState<Step>("record");
  const [recording, setRecording] = useState(false);
  const [revealed, setRevealed] = useState(0);
  const [qty, setQty] = useState<string | null>(null);
  const [deduction, setDeduction] = useState<"without" | "with" | null>(null);
  const [photoIdx, setPhotoIdx] = useState<number | null>(null);

  useEffect(() => {
    if (step !== "extract") return;
    setRevealed(0);
    const id = window.setInterval(() => setRevealed((r) => (r >= 5 ? (window.clearInterval(id), r) : r + 1)), 420);
    return () => window.clearInterval(id);
  }, [step]);

  const missing = scenario.missing ?? [];
  const fields = [
    { k: "product", label: "Product", value: scenario.draft.product },
    { k: "qty", label: "Quantity", value: missing.includes("qty") ? qty ?? "—" : scenario.draft.qty },
    { k: "point", label: "Trade point", value: scenario.draft.point },
    { k: "reason", label: "Reason", value: scenario.draft.reason },
    { k: "deduction", label: "Deduction", value: missing.includes("deduction") ? (deduction ? (deduction === "without" ? "Without deduction" : "With deduction") : "—") : scenario.draft.deduction === "without" ? "Without deduction" : "With deduction" },
  ];

  function finish() {
    store.submit({
      ...scenario.draft,
      transcript: scenario.transcript,
      qty: missing.includes("qty") ? qty ?? scenario.draft.qty : scenario.draft.qty,
      deduction: missing.includes("deduction") ? deduction ?? scenario.draft.deduction : scenario.draft.deduction,
      photo: photoIdx != null ? PROOF[photoIdx] : undefined,
    });
    setStep("done");
    window.setTimeout(onSubmitted, 1800);
  }

  const progress = { record: 1, extract: 2, missing: 3, photo: 4, confirm: 5, done: 5 }[step];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-[var(--vera-cream)]">
      <div className="relative mx-auto max-w-[560px] h-[100dvh] px-6 pt-7 pb-10 flex flex-col">
        {step !== "done" && (
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="grid place-items-center size-10 rounded-full bg-white/70 text-[var(--vera-cocoa)]"><CaretLeft size={20} /></button>
            <div className="flex-1 flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="h-1.5 flex-1 rounded-full bg-[var(--vera-rose-surface)] overflow-hidden">
                  <motion.div className="h-full bg-[var(--vera-strawberry)]" animate={{ width: progress >= n ? "100%" : "0%" }} transition={{ duration: 0.4 }} />
                </div>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === "record" && (
            <motion.div key="rec" {...fade} className="flex-1 flex flex-col items-center justify-center text-center">
              <h2 className="text-[22px]">{recording ? "Listening…" : "Tell VERA what happened"}</h2>
              <p className="mt-2 text-[14px] text-[var(--vera-brown-gray)] max-w-[30ch]">Product, quantity, trade point, and deduction type.</p>
              <div className="my-8"><MicOrb active={recording} onClick={() => setRecording((r) => !r)} size={140} /></div>
              <Waveform active={recording} />
              <p className="mt-8 text-[16px] leading-relaxed min-h-[60px] max-w-[34ch]">{recording ? <TypeLine text={scenario.transcript} /> : <span className="text-[var(--vera-rose-gray)]">Your words appear here as you speak.</span>}</p>
              <Button full className="mt-6 max-w-[300px]" disabled={!recording} onClick={() => setStep("extract")}>Finish recording</Button>
            </motion.div>
          )}

          {step === "extract" && (
            <motion.div key="ext" {...fade} className="flex-1 flex flex-col pt-8 overflow-y-auto">
              <div className="flex items-center gap-2 text-[var(--vera-raspberry)]"><Sparkle size={18} /><span className="font-bold">VERA structured your request</span></div>
              <h2 className="mt-2 text-[24px]">Check the details</h2>
              <div className="mt-6 divide-y divide-[#f0d8cf]">
                {fields.map((f, i) => (
                  <div key={f.k} className="flex items-center justify-between py-4">
                    <span className="text-[13px] font-bold uppercase tracking-wide text-[var(--vera-rose-gray)]">{f.label}</span>
                    {revealed > i ? (
                      <motion.span initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="font-semibold text-[var(--vera-cocoa)] text-right max-w-[60%]">{f.value}</motion.span>
                    ) : (
                      <motion.span className="h-4 w-28 rounded-full bg-[var(--vera-rose-surface)]" animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 1.1, repeat: Infinity }} />
                    )}
                  </div>
                ))}
              </div>
              <motion.div animate={{ opacity: revealed >= 5 ? 1 : 0 }} className="mt-5">
                <p className="text-[13px] font-bold uppercase tracking-wide text-[var(--vera-rose-gray)]">Cleaned comment</p>
                <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--vera-cocoa)]">{scenario.draft.comment}</p>
              </motion.div>
              <div className="mt-auto pt-8"><Button full disabled={revealed < 5} onClick={() => setStep(missing.length ? "missing" : "photo")}><Check size={18} /> {missing.length ? "Add missing details" : "Looks correct"}</Button></div>
            </motion.div>
          )}

          {step === "missing" && (
            <motion.div key="mis" {...fade} className="flex-1 flex flex-col pt-8">
              <h2 className="text-[24px] max-w-[16ch]">{missing.length === 1 ? "One detail is missing" : "Two details are missing"}</h2>
              <p className="mt-2 text-[14px] text-[var(--vera-brown-gray)]">Tap to fill — faster than typing.</p>
              {missing.includes("qty") && (
                <div className="mt-7"><p className="text-[13px] font-bold uppercase tracking-wide text-[var(--vera-rose-gray)] mb-3">Quantity</p><div className="flex flex-wrap gap-3">{["1 pc", "2 pcs", "6 pcs", "Custom"].map((x) => <Chip key={x} on={qty === x} onClick={() => setQty(x)}>{x}</Chip>)}</div></div>
              )}
              {missing.includes("deduction") && (
                <div className="mt-7"><p className="text-[13px] font-bold uppercase tracking-wide text-[var(--vera-rose-gray)] mb-3">Deduction</p><div className="flex flex-wrap gap-3"><Chip on={deduction === "without"} onClick={() => setDeduction("without")}>Without deduction</Chip><Chip on={deduction === "with"} onClick={() => setDeduction("with")}>With deduction</Chip></div></div>
              )}
              <div className="mt-auto pt-8"><Button full disabled={(missing.includes("qty") && !qty) || (missing.includes("deduction") && !deduction)} onClick={() => setStep("photo")}>Continue</Button></div>
            </motion.div>
          )}

          {step === "photo" && (
            <motion.div key="pho" {...fade} className="flex-1 flex flex-col pt-8">
              <h2 className="text-[24px]">Attach photo proof</h2>
              <p className="mt-2 text-[14px] text-[var(--vera-brown-gray)] max-w-[34ch]">Pick the shot that clearly shows the product and damage.</p>
              <div className="mt-6 grid grid-cols-3 gap-3">
                {PROOF.map((p, i) => (
                  <motion.button key={p} whileTap={{ scale: 0.95 }} onClick={() => setPhotoIdx(i)} className={`relative aspect-square overflow-hidden rounded-2xl ring-2 transition-all ${photoIdx === i ? "ring-[var(--vera-strawberry)] scale-[1.02]" : "ring-transparent"}`}>
                    <ImageWithFallback src={p} alt="proof" className="size-full object-cover" />
                    {photoIdx === i && <span className="absolute inset-0 grid place-items-center bg-[rgba(242,85,95,0.35)]"><span className="grid place-items-center size-8 rounded-full bg-white text-[var(--vera-strawberry)]"><Check size={18} /></span></span>}
                  </motion.button>
                ))}
              </div>
              <div className="mt-6 space-y-3">
                {["Product visible", "Damage visible", "Request matches photo"].map((c) => (
                  <div key={c} className="flex items-center gap-3 text-[15px]"><span className={`grid place-items-center size-6 rounded-full transition-colors ${photoIdx != null ? "bg-[var(--vera-mint)] text-white" : "bg-[var(--vera-rose-surface)] text-white/70"}`}><Check size={14} /></span><span className="font-semibold text-[var(--vera-cocoa)]">{c}</span></div>
                ))}
              </div>
              <div className="mt-auto pt-8 flex items-center gap-3"><Button variant="soft" onClick={() => setPhotoIdx(null)}><Camera size={18} /> Retake</Button><Button full disabled={photoIdx == null} onClick={() => setStep("confirm")}>Continue</Button></div>
            </motion.div>
          )}

          {step === "confirm" && (
            <motion.div key="con" {...fade} className="flex-1 flex flex-col pt-8 overflow-y-auto">
              <h2 className="text-[24px]">Ready to send</h2>
              {photoIdx != null && <div className="mt-5 overflow-hidden rounded-3xl"><ImageWithFallback src={PROOF[photoIdx]} alt="proof" className="w-full h-44 object-cover" /></div>}
              <div className="mt-5 divide-y divide-[#f0d8cf]">
                {fields.map((f) => (
                  <div key={f.k} className="flex items-center justify-between py-3"><span className="text-[13px] font-bold uppercase tracking-wide text-[var(--vera-rose-gray)]">{f.label}</span><span className="font-semibold text-[var(--vera-cocoa)] text-right max-w-[60%]">{f.value}</span></div>
                ))}
                <div className="flex items-center justify-between py-3"><span className="text-[13px] font-bold uppercase tracking-wide text-[var(--vera-rose-gray)]">Est. loss</span><span className="font-bold text-[var(--vera-berry)]">{tenge(scenario.draft.loss)}</span></div>
              </div>
              <div className="mt-auto pt-8 flex items-center gap-3"><Button variant="soft" onClick={() => setStep("extract")}>Edit</Button><Button full onClick={finish}>Submit for approval</Button></div>
            </motion.div>
          )}

          {step === "done" && (
            <motion.div key="done" {...fade} className="flex-1 flex flex-col items-center justify-center text-center">
              <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14 }} className="grid place-items-center size-28 rounded-full bg-[var(--vera-mint)] text-white"><Check size={54} /></motion.div>
              <h1 className="mt-7 text-[28px]">Sent to manager</h1>
              <p className="mt-2 text-[15px] text-[var(--vera-brown-gray)] max-w-[30ch]">It's in the review queue. You'll see the decision in your requests.</p>
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

function TypeLine({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const id = window.setInterval(() => setN((v) => (v >= text.length ? (window.clearInterval(id), v) : v + 1)), 28);
    return () => window.clearInterval(id);
  }, [text]);
  return <span className="text-[var(--vera-cocoa)]">{text.slice(0, n)}<span className="inline-block w-[2px] h-[1.1em] align-middle bg-[var(--vera-strawberry)] ml-0.5 animate-pulse" /></span>;
}
