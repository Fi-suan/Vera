import { Suspense, lazy, useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import { StoreProvider, useStore, type Role } from "./components/vera/store";
import { Intro } from "./components/vera/Intro";
import { Auth } from "./components/vera/Auth";

/* Role UIs are the heaviest part of the bundle — load them on demand so the
   intro/auth shell ships in a small initial chunk. */
const Employee = lazy(() => import("./components/vera/Employee").then((m) => ({ default: m.Employee })));
const Manager = lazy(() => import("./components/vera/Manager").then((m) => ({ default: m.Manager })));

type Phase = "intro" | "auth" | "employee" | "manager";

const Loading = () => <div className="size-full min-h-[100dvh] bg-[var(--vera-cream)]" />;

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}

function AppContent() {
  const { authReady, restoreSession, logout } = useStore();
  const [phase, setPhase] = useState<Phase>("intro");

  const pick = (r: Role) => setPhase(r);
  const exit = () => { logout(); setPhase("auth"); };

  useEffect(() => {
    let active = true;
    restoreSession().then((role) => {
      if (active && role) setPhase(role);
    });
    return () => {
      active = false;
    };
  }, [restoreSession]);

  if (!authReady) {
    return <Loading />;
  }

  return (
    <div className="size-full min-h-[100dvh]">
      <AnimatePresence mode="wait">
        {phase === "intro" && <Intro key="intro" onDone={() => setPhase("auth")} />}
        {phase === "auth" && <Auth key="auth" onPick={pick} />}
        {phase === "employee" && (
          <Suspense key="employee" fallback={<Loading />}>
            <Employee onExit={exit} />
          </Suspense>
        )}
        {phase === "manager" && (
          <Suspense key="manager" fallback={<Loading />}>
            <Manager onExit={exit} />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  );
}
