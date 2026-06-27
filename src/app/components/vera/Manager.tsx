import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ChartLineUp, Tray, Table as TableIcon, UsersThree, ArrowsClockwise,
  MagnifyingGlass, Check, X, Sparkle, CaretRight, TrendUp, Clock,
  CheckCircle, Warning, ForkKnife,
} from "./icons";
import { Shell, PageHead, type NavItem } from "./Shell";
import { Button, StatusLabel, AnimatedNumber, Avatar, Tag } from "./ui";
import { LossTrend, CategoryBars, PointDonut } from "./charts";
import {
  useStore, useAnalytics, tenge, tengeShort, timeAgo, empById, EMPLOYEES,
  CATEGORY_COLOR, type WriteOff,
} from "./store";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { translate as T } from "./i18n";

const NAV: NavItem[] = [
  { id: "overview", label: "Overview", Icon: ChartLineUp },
  { id: "queue", label: "Queue", Icon: Tray },
  { id: "records", label: "Records", Icon: TableIcon },
  { id: "employees", label: "Team", Icon: UsersThree },
  { id: "sync", label: "Iiko", Icon: ArrowsClockwise },
];

const fade = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
};

export function Manager({ onExit }: { onExit: () => void }) {
  const [tab, setTab] = useState("overview");
  const [openId, setOpenId] = useState<string | null>(null);
  const { requests, approve, reject } = useStore();
  const open = requests.find((r) => r.id === openId) ?? null;

  return (
    <>
      <Shell nav={NAV} active={tab} onNav={setTab} roleLabel="Manager" user="Zarina Omarova" hue={324} onExit={onExit}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} {...fade}>
            {tab === "overview" && <Overview onQueue={() => setTab("queue")} />}
            {tab === "queue" && <Queue onOpen={setOpenId} />}
            {tab === "records" && <Records onOpen={setOpenId} />}
            {tab === "employees" && <Team />}
            {tab === "sync" && <SyncCenter />}
          </motion.div>
        </AnimatePresence>
      </Shell>

      <AnimatePresence>
        {open && (
          <Drawer r={open} onClose={() => setOpenId(null)} onApprove={() => { approve(open.id); setOpenId(null); }} onReject={(note) => { reject(open.id, note); setOpenId(null); }} />
        )}
      </AnimatePresence>
    </>
  );
}

function Overview({ onQueue }: { onQueue: () => void }) {
  const a = useAnalytics();
  const kpis = [
    { l: T("pendingReview"), v: a.pending.length, Icon: Clock },
    { l: T("lossWeek"), v: a.weekLoss, Icon: TrendUp, money: true },
    { l: T("approvalRate"), v: a.approvalRate, Icon: CheckCircle, suffix: "%" },
    { l: T("syncIssues"), v: a.syncIssues, Icon: Warning },
  ];
  const attention = a.pending.slice().sort((x, y) => y.loss - x.loss);
  return (
    <div className="px-5">
      <PageHead title={T("overview")} subtitle={T("overviewSub")} action={a.pending.length > 0 ? <Button onClick={onQueue}><Tray size={18} /> {T("review")} {a.pending.length}</Button> : undefined} />

      <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-6 border-t border-[#ecd5cc] pt-6">
        {kpis.map((k) => (
          <div key={k.l} className="px-4">
            <div className="flex items-center justify-between"><span className="text-[13px] font-semibold text-[var(--vera-rose-gray)]">{k.l}</span><k.Icon size={18} className="text-[var(--vera-rose-gray)]" /></div>
            <div className="mt-2 text-[clamp(24px,3vw,32px)] font-bold text-[var(--vera-cocoa)]" style={{ fontFamily: "Montserrat" }}>
              {k.money ? <AnimatedNumber value={k.v} format={(n) => tenge(n)} /> : <><AnimatedNumber value={k.v} />{k.suffix ?? ""}</>}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-7 grid gap-5">
        <div className="border-t border-[#ecd5cc] pt-6">
          <div className="flex items-center justify-between mb-2"><h3 className="text-[17px]">{T("lossTrend")}</h3><Tag color="#f2555f">{tengeShort(a.weekLoss)}</Tag></div>
          <LossTrend data={a.days} />
        </div>
        <div className="border-t border-[#ecd5cc] pt-6">
          <h3 className="text-[17px] mb-3">{T("byPoint")}</h3>
          <PointDonut data={a.byPoint} />
          <div className="mt-3 space-y-1.5">
            {a.byPoint.map((p, i) => (
              <div key={p.point} className="flex items-center justify-between text-[13px]">
                <span className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: ["#f2555f", "#f6b95e", "#68c7a2", "#5fa8d9"][i % 4] }} />{p.point}</span>
                <span className="font-mono font-bold text-[var(--vera-cocoa)]">{tengeShort(p.loss)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-5">
        <div className="border-t border-[#ecd5cc] pt-6">
          <h3 className="text-[17px] mb-2">{T("byCategory")}</h3>
          <CategoryBars data={a.byCategory} />
          <div className="mt-2 flex flex-wrap gap-2">{a.byCategory.map((c) => <Tag key={c.cat} color={CATEGORY_COLOR[c.cat]}>{c.cat}</Tag>)}</div>
        </div>
        <div className="border-t border-[#ecd5cc] pt-6">
          <h3 className="text-[17px] mb-3">{T("needsAttention")}</h3>
          <div className="divide-y divide-[#f0d8cf]">
            {attention.slice(0, 4).map((r) => {
              const e = empById(r.employeeId);
              return (
                <div key={r.id} className="flex items-center gap-3 py-3">
                  <Avatar name={e.name} hue={e.hue} size={36} />
                  <div className="min-w-0 flex-1"><div className="font-semibold text-[var(--vera-cocoa)] truncate">{r.qty} · {r.product}</div><div className="text-[13px] text-[var(--vera-rose-gray)] truncate">{e.name} · {r.point}</div></div>
                  <span className="font-mono font-bold text-[var(--vera-berry)]">{tengeShort(r.loss)}</span>
                </div>
              );
            })}
            {attention.length === 0 && <p className="py-6 text-[14px] text-[var(--vera-rose-gray)]">{T("queueClearShort")}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Queue({ onOpen }: { onOpen: (id: string) => void }) {
  const { requests } = useStore();
  const pending = requests.filter((r) => r.status === "pending");
  return (
    <div className="px-5">
      <PageHead title={T("reviewQueueTitle")} subtitle={T("reviewQueueSub")} action={pending.length > 0 ? <StatusLabel tone="pending" pulse>{pending.length} {T("waiting")}</StatusLabel> : undefined} />
      {pending.length === 0 ? (
        <EmptyBlock label={T("queueEmpty")} />
      ) : (
        <div className="mt-6 grid gap-4">
          {pending.map((r, i) => {
            const e = empById(r.employeeId);
            return (
              <motion.button key={r.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, type: "spring", stiffness: 140, damping: 20 }} whileHover={{ y: -4 }} onClick={() => onOpen(r.id)} className="group relative overflow-hidden rounded-[28px] bg-white/70 text-left border border-white/70 shadow-[0_24px_50px_-32px_rgba(184,50,66,0.4)]">
                {r.photo && <div className="h-36 overflow-hidden"><ImageWithFallback src={r.photo} alt={r.product} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" /></div>}
                <div className="p-5">
                  <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Avatar name={e.name} hue={e.hue} size={30} /><span className="text-[13px] font-semibold">{e.name}</span></div>{r.loss >= 5000 && <Tag color="#b83242">attention</Tag>}</div>
                  <div className="mt-3 text-[18px] font-bold text-[var(--vera-cocoa)]">{r.qty} · {r.product}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-[13px] text-[var(--vera-raspberry)]"><Sparkle size={13} /> {r.reason}</div>
                  <div className="mt-4 flex items-center justify-between"><span className="text-[13px] text-[var(--vera-rose-gray)]">{r.point} · {timeAgo(r.createdAt)}</span><span className="font-mono font-bold text-[var(--vera-berry)]">{tenge(r.loss)}</span></div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Records({ onOpen }: { onOpen: (id: string) => void }) {
  const { requests } = useStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const rows = requests.filter((r) => {
    const e = empById(r.employeeId);
    return (r.product + r.point + e.name).toLowerCase().includes(q.toLowerCase()) && (status === "all" || r.status === status);
  });

  return (
    <div className="px-5">
      <PageHead title={T("recordsTitle")} subtitle={`${requests.length} write-offs across every point.`} />
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--vera-rose-gray)]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search product, employee, point…" className="w-full rounded-full border border-[#f0d8cf] bg-white/70 py-3 pl-11 pr-4 outline-none focus:border-[var(--vera-strawberry)]" />
        </div>
        <div className="flex gap-2">
          {(["all", "pending", "approved", "rejected"] as const).map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={`rounded-full px-4 py-2 text-[13px] font-bold capitalize transition-colors ${status === s ? "bg-[var(--vera-cocoa)] text-[var(--vera-cream)]" : "bg-white/60 text-[var(--vera-brown-gray)] hover:bg-white"}`}>{s}</button>
          ))}
        </div>
      </div>

      <div className="hidden">
        <div className="grid grid-cols-[1.4fr_1fr_1.1fr_0.8fr_1fr_0.9fr_36px] gap-3 px-4 pb-2 text-[12px] font-bold uppercase tracking-wide text-[var(--vera-rose-gray)]">
          <span>Product</span><span>Employee</span><span>Point</span><span>Status</span><span>Iiko</span><span className="text-right">Loss</span><span />
        </div>
        <div className="divide-y divide-[#f0d8cf]">
          {rows.map((r, i) => {
            const e = empById(r.employeeId);
            return (
              <motion.button key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} onClick={() => onOpen(r.id)} className="grid w-full grid-cols-[1.4fr_1fr_1.1fr_0.8fr_1fr_0.9fr_36px] items-center gap-3 px-4 py-3 text-left rounded-2xl hover:bg-white/70 transition-colors">
                <span className="flex items-center gap-2.5 min-w-0"><span className="size-8 rounded-xl grid place-items-center shrink-0" style={{ background: `${CATEGORY_COLOR[r.category]}22`, color: CATEGORY_COLOR[r.category] }}><ForkKnife size={16} /></span><span className="truncate"><span className="font-semibold">{r.product}</span> <span className="text-[var(--vera-rose-gray)]">· {r.qty}</span></span></span>
                <span className="flex items-center gap-2 min-w-0"><Avatar name={e.name} hue={e.hue} size={26} /><span className="text-[13px] truncate">{e.name.split(" ")[0]}</span></span>
                <span className="text-[14px]">{r.point}</span>
                <span><StatusLabel tone={r.status} pulse={r.status === "pending"}>{r.status}</StatusLabel></span>
                <span><StatusLabel tone={r.sync} pulse={r.sync === "syncing"}>{r.sync === "idle" ? "—" : r.sync}</StatusLabel></span>
                <span className="text-right font-mono font-bold text-[var(--vera-cocoa)] text-[14px]">{tenge(r.loss)}</span>
                <CaretRight size={16} className="text-[var(--vera-rose-gray)]" />
              </motion.button>
            );
          })}
        </div>
      </div>
      <div className="mt-5 divide-y divide-[#f0d8cf]">
        {rows.map((r) => {
          const e = empById(r.employeeId);
          return (
            <button key={r.id} onClick={() => onOpen(r.id)} className="w-full flex items-center gap-3 py-3.5 text-left">
              <span className="size-10 rounded-xl grid place-items-center shrink-0" style={{ background: `${CATEGORY_COLOR[r.category]}22`, color: CATEGORY_COLOR[r.category] }}><ForkKnife size={18} /></span>
              <div className="min-w-0 flex-1"><div className="font-semibold truncate">{r.qty} · {r.product}</div><div className="text-[13px] text-[var(--vera-rose-gray)] truncate">{e.name.split(" ")[0]} · {r.point}</div><div className="mt-1"><StatusLabel tone={r.status} pulse={r.status === "pending"}>{r.status}</StatusLabel></div></div>
              <span className="font-mono font-bold text-[14px]">{tenge(r.loss)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Team() {
  const { requests } = useStore();
  const team = Object.values(
    requests.reduce((acc, r) => {
      const e = empById(r.employeeId);
      acc[e.id] ??= { id: e.id, name: e.name, hue: e.hue, total: 0, pending: 0, loss: 0 };
      acc[e.id].total += 1;
      if (r.status === "pending") acc[e.id].pending += 1;
      if (r.status !== "rejected") acc[e.id].loss += r.loss;
      return acc;
    }, {} as Record<string, { id: string; name: string; hue: number; total: number; pending: number; loss: number }>)
  ).sort((a, b) => b.loss - a.loss);
  return (
    <div className="px-5">
      <PageHead title={T("teamTitle")} subtitle="Who's reporting what, and how much loss it represents." />
      {team.length === 0 ? (
        <EmptyBlock label="No team activity yet. People appear here once they submit write-offs." />
      ) : (
        <div className="mt-6 grid gap-4">
          {team.map((e, i) => (
            <motion.div key={e.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-[26px] bg-white/65 p-5">
              <div className="flex items-center gap-3"><Avatar name={e.name} hue={e.hue} size={48} /><div className="min-w-0"><div className="font-bold text-[var(--vera-cocoa)] truncate">{e.name}</div><div className="text-[13px] text-[var(--vera-rose-gray)]">{e.total} write-off{e.total === 1 ? "" : "s"}</div></div></div>
              <div className="mt-4 grid grid-cols-3 divide-x divide-[#f0d8cf] text-center">
                <div className="px-1"><div className="font-bold text-[var(--vera-cocoa)]" style={{ fontFamily: "Montserrat" }}>{e.total}</div><div className="text-[12px] text-[var(--vera-rose-gray)]">Total</div></div>
                <div className="px-1"><div className="font-bold text-[var(--vera-cocoa)]" style={{ fontFamily: "Montserrat" }}>{e.pending}</div><div className="text-[12px] text-[var(--vera-rose-gray)]">Pending</div></div>
                <div className="px-1"><div className="font-bold text-[var(--vera-cocoa)] text-[14px]">{tengeShort(e.loss)}</div><div className="text-[12px] text-[var(--vera-rose-gray)]">Loss</div></div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function SyncCenter() {
  const { requests, retrySync } = useStore();
  const approved = requests.filter((r) => r.status === "approved");
  const groups = [
    { key: "failed", label: "Needs attention", tone: "failed" },
    { key: "syncing", label: "In progress", tone: "syncing" },
    { key: "synced", label: "Synced", tone: "synced" },
  ] as const;
  return (
    <div className="px-5">
      <PageHead title={T("iikoTitle")} subtitle="Approved write-offs flow into Iiko automatically." />
      {groups.map((g) => {
        const items = approved.filter((r) => r.sync === g.key);
        if (!items.length) return null;
        return (
          <div key={g.key} className="mt-7">
            <div className="flex items-center gap-2 mb-2"><StatusLabel tone={g.tone} pulse={g.key === "syncing"}>{g.label}</StatusLabel><span className="text-[13px] text-[var(--vera-rose-gray)]">· {items.length}</span></div>
            <div className="divide-y divide-[#f0d8cf]">
              {items.map((r) => (
                <div key={r.id} className="flex items-center gap-4 py-3.5">
                  <span className="size-10 rounded-xl grid place-items-center shrink-0" style={{ background: `${CATEGORY_COLOR[r.category]}22`, color: CATEGORY_COLOR[r.category] }}><ForkKnife size={18} /></span>
                  <div className="min-w-0 flex-1"><div className="font-semibold text-[var(--vera-cocoa)] truncate">{r.doc} · {r.qty} {r.product}</div><div className="text-[13px] text-[var(--vera-rose-gray)] truncate">{r.point} · {tenge(r.loss)}</div></div>
                  {r.sync === "failed" ? (
                    <Button size="sm" variant="soft" onClick={() => retrySync(r.id)}><ArrowsClockwise size={16} /> Retry</Button>
                  ) : r.sync === "syncing" ? (
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} className="text-[var(--vera-amber)]"><ArrowsClockwise size={18} /></motion.span>
                  ) : (
                    <CheckCircle size={20} className="text-[var(--vera-mint)]" />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {approved.length === 0 && <EmptyBlock label="Nothing approved yet — approvals will appear here to sync." />}
    </div>
  );
}

function EmptyBlock({ label }: { label: string }) {
  return (
    <div className="mt-10 flex flex-col items-center text-center">
      <motion.div animate={{ y: [0, -7, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="grid place-items-center size-16 rounded-3xl bg-white/70 text-[var(--vera-strawberry)]"><Tray size={30} /></motion.div>
      <p className="mt-4 text-[14px] text-[var(--vera-brown-gray)] max-w-[34ch]">{label}</p>
    </div>
  );
}

function Drawer({ r, onClose, onApprove, onReject }: { r: WriteOff; onClose: () => void; onApprove: () => void; onReject: (note: string) => void }) {
  const e = empById(r.employeeId);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const reasons = ["Photo unclear", "Wrong product", "Missing information", "Other"];
  const fields: [string, string][] = [
    ["Quantity", r.qty],
    ["Trade point", r.point],
    ["Reason", r.reason],
    ["Deduction", r.deduction === "without" ? "Without deduction" : "With deduction"],
    ["Employee", e.name],
    ["Document", r.doc],
  ];

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-40 bg-[rgba(43,32,35,0.45)] backdrop-blur-sm" />
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 240, damping: 30 }} className="fixed right-0 top-0 z-50 h-[100dvh] w-full max-w-[480px] bg-[var(--vera-white-cream)] shadow-[-30px_0_60px_-30px_rgba(43,32,35,0.5)] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between"><StatusLabel tone={r.status} pulse={r.status === "pending"}>{r.status}</StatusLabel><button onClick={onClose} className="grid place-items-center size-9 rounded-full bg-[var(--vera-blush)] text-[var(--vera-cocoa)]"><X size={18} /></button></div>

          {r.photo && <div className="mt-5 overflow-hidden rounded-3xl"><ImageWithFallback src={r.photo} alt={r.product} className="w-full h-56 object-cover" /></div>}

          <h2 className="mt-5 text-[26px]">{r.qty} · {r.product}</h2>
          <div className="mt-1 flex items-center gap-2 text-[14px] text-[var(--vera-brown-gray)]"><Avatar name={e.name} hue={e.hue} size={22} /> {e.name} · {timeAgo(r.createdAt)}</div>

          <div className="mt-5 divide-y divide-[#f0d8cf]">
            {fields.map(([k, v]) => (
              <div key={k} className="flex items-start justify-between gap-6 py-3"><span className="text-[13px] font-bold uppercase tracking-wide text-[var(--vera-rose-gray)] shrink-0">{k}</span><span className="font-semibold text-[var(--vera-cocoa)] text-right">{v}</span></div>
            ))}
          </div>

          <div className="mt-5">
            <div className="flex items-center gap-2 text-[var(--vera-raspberry)]"><Sparkle size={16} /><span className="text-[13px] font-bold uppercase tracking-wide">AI comment</span></div>
            <p className="mt-2 text-[15px] leading-relaxed text-[var(--vera-cocoa)]">{r.comment}</p>
          </div>

          {r.transcript && <div className="mt-4"><span className="text-[13px] font-bold uppercase tracking-wide text-[var(--vera-rose-gray)]">Original transcript</span><p className="mt-1.5 text-[13px] italic text-[var(--vera-brown-gray)]">“{r.transcript}”</p></div>}

          <div className="mt-5 flex items-center justify-between"><span className="text-[13px] font-bold uppercase tracking-wide text-[var(--vera-rose-gray)]">Est. loss</span><span className="font-bold text-[var(--vera-berry)] text-[18px]">{tenge(r.loss)}</span></div>

          {r.status === "pending" && !rejecting && (
            <div className="mt-8 flex items-center gap-3"><Button variant="danger" onClick={() => setRejecting(true)}><X size={18} /> Reject</Button><Button full onClick={onApprove}><Check size={18} /> Approve & sync</Button></div>
          )}

          <AnimatePresence>
            {rejecting && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-8 overflow-hidden">
                <h3 className="text-[18px]">Reason for rejection</h3>
                <div className="mt-3 flex flex-wrap gap-2.5">{reasons.map((x) => <button key={x} onClick={() => setReason(x)} className={`rounded-full px-4 py-2.5 text-[14px] font-semibold transition-colors ${reason === x ? "bg-[var(--vera-strawberry)] text-[var(--vera-accent-cream)]" : "bg-[var(--vera-cream)] text-[var(--vera-cocoa)] border border-[#f0d8cf]"}`}>{x}</button>)}</div>
                <textarea value={note} onChange={(ev) => setNote(ev.target.value)} rows={3} placeholder="Add a short note for the employee…" className="mt-3 w-full rounded-2xl border border-[#f0d8cf] bg-[var(--vera-cream)] px-4 py-3 outline-none focus:border-[var(--vera-strawberry)] resize-none" />
                <div className="mt-3 flex items-center gap-3"><Button variant="soft" onClick={() => setRejecting(false)}>Cancel</Button><Button full variant="danger" disabled={!reason} onClick={() => onReject(note.trim() ? `${reason}: ${note.trim()}` : (reason as string))}>Send rejection</Button></div>
              </motion.div>
            )}
          </AnimatePresence>

          {r.status === "approved" && (
            <div className="mt-8 rounded-2xl bg-[var(--vera-blush)] p-4"><StatusLabel tone={r.sync} pulse={r.sync === "syncing"}>{r.sync === "syncing" ? "Syncing to Iiko…" : r.sync === "synced" ? "Synced to Iiko" : r.sync === "failed" ? "Sync failed — retry in Iiko center" : "Approved"}</StatusLabel></div>
          )}
        </div>
      </motion.div>
    </>
  );
}
