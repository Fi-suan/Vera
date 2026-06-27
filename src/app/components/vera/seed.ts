/* ------------------------------------------------------------------ */
/* NO MOCK DATA. This module purges any demo/seed records and any       */
/* records tied to the built-in placeholder employee directory          */
/* (employeeId e1..e6) from localStorage, keeping only real user data.  */
/* ------------------------------------------------------------------ */

const KEY = "vera.writeoffs.v1";

try {
  if (typeof localStorage !== "undefined") {
    const raw = localStorage.getItem(KEY);
    if (raw && raw !== "[]") {
      const rows = JSON.parse(raw);
      if (Array.isArray(rows)) {
        const real = rows.filter((r: { id?: string; employeeId?: string }) => {
          const isSeedId = typeof r?.id === "string" && /^s\d+$/.test(r.id);
          const isPlaceholderAuthor = typeof r?.employeeId === "string" && /^e\d+$/.test(r.employeeId);
          return !isSeedId && !isPlaceholderAuthor;
        });
        localStorage.setItem(KEY, JSON.stringify(real));
      }
    } else if (!raw) {
      localStorage.setItem(KEY, "[]");
    }
  }
} catch {
  /* ignore */
}

export {};
