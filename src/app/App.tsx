import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { StoreProvider, type Role } from "./components/vera/store";
import { Intro } from "./components/vera/Intro";
import { Auth } from "./components/vera/Auth";
import { Employee } from "./components/vera/Employee";
import { Manager } from "./components/vera/Manager";

type Phase = "intro" | "auth" | "employee" | "manager";

export default function App() {
  const [phase, setPhase] = useState<Phase>("intro");

  const pick = (r: Role) => setPhase(r);

  return (
    <StoreProvider>
      <div className="size-full min-h-[100dvh]">
        <AnimatePresence mode="wait">
          {phase === "intro" && <Intro key="intro" onDone={() => setPhase("auth")} />}
          {phase === "auth" && <Auth key="auth" onPick={pick} />}
          {phase === "employee" && (
            <Employee key="employee" onExit={() => setPhase("auth")} />
          )}
          {phase === "manager" && (
            <Manager key="manager" onExit={() => setPhase("auth")} />
          )}
        </AnimatePresence>
      </div>
    </StoreProvider>
  );
}
