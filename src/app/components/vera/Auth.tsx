import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Microphone, ShieldCheck, ArrowRight } from "./icons";
import { VeraLogo } from "./brand";
import type { Role } from "./store";
import { useStore } from "./store";
import { ApiError } from "./api";
import { LANGS, translate, type Lang } from "./i18n";

const ease = [0.16, 1, 0.3, 1] as const;
type Mode = "signin" | "signup";

function authErrorKey(error: unknown, mode: Mode) {
  if (error instanceof ApiError) {
    if (error.status === 401) return "authInvalidCredentials";
    if (error.status === 409) return "authAccountExists";
    if (error.status === 400 || error.status === 422) return "authInvalidInput";
  }
  return mode === "signin" ? "signinError" : "signupError";
}

export function Auth({ onPick }: { onPick: (r: Role) => void }) {
  const { login, register } = useStore();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("employee");
  const [focus, setFocus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLangLocal] = useState<Lang>(() => {
    try { return (localStorage.getItem("vera.lang") as Lang) || "ru"; } catch { return "ru"; }
  });
  const t = (k: string) => translate(k, lang);
  const setLang = (l: Lang) => { try { localStorage.setItem("vera.lang", l); } catch {} setLangLocal(l); };

  const emailOk = /\S+@\S+\.\S+/.test(email.trim());
  const valid = !busy && emailOk && (
    mode === "signin"
      ? password.length >= 1
      : password.length >= 8 && name.trim().length >= 2
  );

  const switchMode = (next: Mode) => { setMode(next); setError(null); };

  const go = async () => {
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      const r = mode === "signin"
        ? await login(email.trim().toLowerCase(), password)
        : await register({ name: name.trim(), email: email.trim().toLowerCase(), password, role });
      onPick(r);
    } catch (e) {
      setError(t(authErrorKey(e, mode)));
    } finally {
      setBusy(false);
    }
  };

  const fields = mode === "signup"
    ? [{ id: "name", label: t("fullName"), val: name, set: setName, ph: t("namePh"), type: "text" }]
    : [];
  fields.push(
    { id: "email", label: t("emailLabel"), val: email, set: setEmail, ph: t("emailPh"), type: "email" },
    { id: "password", label: t("passwordLabel"), val: password, set: setPassword, ph: t("passwordPh"), type: "password" },
  );

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

        <motion.div key={mode} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ease }} className="relative mt-7">
          <h1 className="text-[clamp(26px,7vw,34px)] leading-[1.06] tracking-tight text-[var(--vera-accent-cream)]">
            {mode === "signin" ? t("welcome") : t("signupTitle")}
          </h1>
          <p className="mt-1.5 text-[14px] text-[var(--vera-accent-cream)]/85">
            {mode === "signin" ? t("signinSub") : t("signupSub")}
          </p>
        </motion.div>
      </div>

      <div className="relative flex-1 -mt-6 rounded-t-[28px] bg-[var(--vera-cream)] text-[var(--vera-cocoa)] px-6 pt-7 pb-8 flex flex-col">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={mode} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.35, ease }} className="flex-1 flex flex-col">
            <div className="flex flex-col gap-4">
              {fields.map((f) => (
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
                      autoComplete={f.id === "email" ? "username" : f.id === "password" ? (mode === "signup" ? "new-password" : "current-password") : "name"}
                      inputMode={f.id === "email" ? "email" : undefined}
                      className="w-full bg-transparent px-4 py-3.5 outline-none text-[15px]"
                    />
                  </motion.div>
                  {f.id === "password" && mode === "signup" && (
                    <span className="text-[11.5px] text-[var(--vera-rose-gray)]">{t("passwordHint")}</span>
                  )}
                </label>
              ))}

              {mode === "signup" && (
                <div className="flex flex-col gap-2">
                  <span className="text-[12px] font-medium text-[var(--vera-brown-gray)]">{t("roleSection")}</span>
                  <div className="grid grid-cols-2 gap-2.5">
                    {([
                      { id: "employee" as Role, title: t("onFloor"), Icon: Microphone },
                      { id: "manager" as Role, title: t("runningPoint"), Icon: ShieldCheck },
                    ]).map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setRole(r.id)}
                        className={`flex items-center gap-2.5 rounded-2xl border-[1.5px] bg-white p-3.5 text-left transition-colors ${role === r.id ? "border-[var(--vera-strawberry)]" : "border-[#ece4dd]"}`}
                      >
                        <span className={`grid place-items-center size-9 rounded-xl transition-colors ${role === r.id ? "bg-[var(--vera-strawberry)] text-[var(--vera-accent-cream)]" : "bg-[var(--vera-blush)] text-[var(--vera-strawberry)]"}`}>
                          <r.Icon size={18} />
                        </span>
                        <span className="text-[13.5px] font-semibold text-[var(--vera-cocoa)] leading-tight">{r.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <p className="mt-3 rounded-xl bg-[var(--vera-blush)] px-3.5 py-2.5 text-[12.5px] font-medium text-[var(--vera-strawberry)]">
                {error}
              </p>
            )}

            <div className="mt-auto pt-7">
              <motion.button
                whileTap={{ scale: valid ? 0.98 : 1 }}
                disabled={!valid}
                onClick={go}
                className="relative w-full overflow-hidden rounded-2xl px-6 py-4 font-medium text-[var(--vera-accent-cream)] disabled:opacity-40 transition-opacity"
                style={{ background: "linear-gradient(135deg, #ec5158, var(--vera-strawberry) 55%, var(--vera-berry))", boxShadow: "0 16px 30px -14px rgba(168,44,57,0.7)" }}
              >
                <span className="relative z-10 inline-flex items-center justify-center gap-2">{mode === "signin" ? t("continue") : t("createAccount")} <ArrowRight size={18} /></span>
                {valid && <motion.span className="absolute inset-y-0 w-1/3 -skew-x-12 bg-white/25" initial={{ x: "-160%" }} animate={{ x: "360%" }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" }} />}
              </motion.button>

              <p className="mt-4 text-center text-[13px] text-[var(--vera-brown-gray)]">
                {mode === "signin" ? t("noAccountQ") : t("haveAccountQ")}{" "}
                <button onClick={() => switchMode(mode === "signin" ? "signup" : "signin")} className="font-bold text-[var(--vera-strawberry)]">
                  {mode === "signin" ? t("signUpLink") : t("signInLink")}
                </button>
              </p>

              <p className="mt-3 flex items-center justify-center gap-1.5 text-[11.5px] text-[var(--vera-rose-gray)]">
                <ShieldCheck size={13} /> {t("protected")}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
