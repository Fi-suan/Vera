import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Microphone, ShieldCheck, ArrowRight } from "./icons";
import { VeraLogo } from "./brand";
import type { Role } from "./store";
import { LANGS, translate, type Lang } from "./i18n";
import "./seed";

const ease = [0.16, 1, 0.3, 1] as const;

export function Auth({ onPick }: { onPick: (r: Role) => void }) {
  const [step, setStep] = useState<"signin" | "role">("signin");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [focus, setFocus] = useState<string | null>(null);
  const [lang, setLangLocal] = useState<Lang>(() => {
    try { return (localStorage.getItem("vera.lang") as Lang) || "ru"; } catch { return "ru"; }
  });
  const t = (k: string) => translate(k, lang);
  const setLang = (l: Lang) => { try { localStorage.setItem("vera.lang", l); } catch {} setLangLocal(l); };
  const valid = name.trim().length >= 2 && code.trim().length >= 4;

  const go = () => { try { localStorage.setItem("vera.user", name.trim()); } catch {} setStep("role"); };

  return (
    <div className="relative w-full min-h-[100dvh] overflow-hidden flex flex-col bg-[var(--vera-cocoa)] text-[var(--vera-accent-cream)]">
      <div className="relative shrink-0 overflow-hidden px-6 pt-12 pb-12" style={{ background: "linear-gradient(160deg, #ec5158, var(--vera-strawberry) 50%, var(--vera-berry))" }}>
        <motion.div className="absolute -top-24 -right-16 size-72 rounded-full blur-[60px]" style={{ background: "rgba(255,255,255,0.25)" }} animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />

        {/* language switcher */}
        <div className="relative flex items-center justify-between">
          <div className="rounded-2xl bg-white/95 px-3 py-2 shadow-lg"><VeraLogo width={84} /></div>
          <div className="flex items-center gap-1 rounded-full bg-white/15 p-1">
            {LANGS.map((l) => (
              <button key={l.id} onClick={() => setLang(l.id)} className="relative rounded-full px-2.5 py-1 text-[11px] font-medium">
                {lang === l.id && <motion.span layoutId="langPill" transition={{ type: "spring", stiffness: 400, damping: 32 }} className="absolute inset-0 rounded-full bg-white" />}
                <span className="relative" style={{ color: lang === l.id ? "var(--vera-berry)" : "rgba(251,243,238,0.85)" }}>{l.label}</span>
              </button>
            ))}
          </div>
        </div>

        <motion.div key={step} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ease }} className="relative mt-7">
          <h1 className="text-[clamp(26px,7vw,34px)] leading-[1.06] tracking-tight text-[var(--vera-accent-cream)]">
            {step === "signin" ? t("welcome") : `${t("chooseRole")}`}
          </h1>
          <p className="mt-1.5 text-[14px] text-[var(--vera-accent-cream)]/85">
            {step === "signin" ? t("signinSub") : (name.trim().split(" ")[0] || "")}
          </p>
        </motion.div>
      </div>

      <div className="relative flex-1 -mt-6 rounded-t-[28px] bg-[var(--vera-cream)] text-[var(--vera-cocoa)] px-6 pt-7 pb-8 flex flex-col">
        <AnimatePresence mode="wait" initial={false}>
          {step === "signin" ? (
            <motion.div key="signin" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.35, ease }} className="flex-1 flex flex-col">
              <div className="flex flex-col gap-4">
                {[
                  { id: "name", label: t("fullName"), val: name, set: setName, ph: t("namePh"), type: "text" },
                  { id: "code", label: t("accessCode"), val: code, set: setCode, ph: t("codePh"), type: "password" },
                ].map((f) => (
                  <label key={f.id} className="flex flex-col gap-1.5">
                    <span className="text-[12px] font-medium text-[var(--vera-brown-gray)]">{f.label}</span>
                    <motion.div
                      animate={{ boxShadow: focus === f.id ? "0 0 0 4px rgba(224,70,77,0.15)" : "0 0 0 0 rgba(224,70,77,0)", borderColor: focus === f.id ? "var(--vera-strawberry)" : "#e6ded7" }}
                      transition={{ duration: 0.2 }}
                      className="rounded-2xl border-[1.5px] bg-white"
                    >
                      <input
                        value={f.val}
                        onChange={(e) => f.set(e.target.value)}
                        onFocus={() => setFocus(f.id)}
                        onBlur={() => setFocus(null)}
                        placeholder={f.ph}
                        type={f.type}
                        inputMode={f.id === "code" ? "numeric" : undefined}
                        className="w-full bg-transparent px-4 py-3.5 outline-none text-[15px]"
                      />
                    </motion.div>
                  </label>
                ))}
              </div>

              <div className="mt-auto pt-7">
                <motion.button
                  whileTap={{ scale: valid ? 0.98 : 1 }}
                  disabled={!valid}
                  onClick={go}
                  className="relative w-full overflow-hidden rounded-2xl px-6 py-4 font-medium text-[var(--vera-accent-cream)] disabled:opacity-40 transition-opacity"
                  style={{ background: "linear-gradient(135deg, #ec5158, var(--vera-strawberry) 55%, var(--vera-berry))", boxShadow: "0 16px 30px -14px rgba(168,44,57,0.7)" }}
                >
                  <span className="relative z-10 inline-flex items-center justify-center gap-2">{t("continue")} <ArrowRight size={18} /></span>
                  {valid && <motion.span className="absolute inset-y-0 w-1/3 -skew-x-12 bg-white/25" initial={{ x: "-160%" }} animate={{ x: "360%" }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" }} />}
                </motion.button>
                <p className="mt-4 flex items-center justify-center gap-1.5 text-[11.5px] text-[var(--vera-rose-gray)]">
                  <ShieldCheck size={13} /> {t("protected")}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="role" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.35, ease }} className="flex-1 flex flex-col">
              <button onClick={() => setStep("signin")} className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--vera-rose-gray)]">
                <ArrowRight size={14} className="rotate-180" /> {t("back")}
              </button>
              <div className="flex flex-col gap-3">
                {[
                  { id: "employee" as Role, title: t("onFloor"), line: t("onFloorSub"), Icon: Microphone },
                  { id: "manager" as Role, title: t("runningPoint"), line: t("runningPointSub"), Icon: ShieldCheck },
                ].map((r, i) => (
                  <motion.button
                    key={r.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 + i * 0.08, ease }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onPick(r.id)}
                    className="group flex items-center gap-4 rounded-2xl border-[1.5px] border-[#ece4dd] bg-white p-4 text-left transition-colors hover:border-[var(--vera-strawberry)]"
                  >
                    <span className="grid place-items-center size-12 rounded-xl bg-[var(--vera-blush)] text-[var(--vera-strawberry)] transition-colors group-hover:bg-[var(--vera-strawberry)] group-hover:text-[var(--vera-accent-cream)]">
                      <r.Icon size={24} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[16px] font-medium text-[var(--vera-cocoa)]">{r.title}</div>
                      <div className="text-[13px] text-[var(--vera-rose-gray)]">{r.line}</div>
                    </div>
                    <ArrowRight size={18} className="text-[var(--vera-rose-gray)] transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[var(--vera-strawberry)]" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
