/* ------------------------------------------------------------------ */
/* Employee preferences (haptics / voice hints / auto-camera).         */
/* Persisted in localStorage so the Profile toggles actually affect    */
/* the capture flow, which lives in a separate component tree.         */
/* ------------------------------------------------------------------ */

export type Prefs = { haptics: boolean; voiceHints: boolean; autoPhoto: boolean };

const KEY = "vera.prefs";
const DEFAULTS: Prefs = { haptics: true, voiceHints: true, autoPhoto: false };

export function getPrefs(): Prefs {
  try {
    return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY) || "{}") as Partial<Prefs>) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function setPref<K extends keyof Prefs>(key: K, value: Prefs[K]): Prefs {
  const next = { ...getPrefs(), [key]: value };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — preference stays for this render only */
  }
  return next;
}

/** Vibrate, but only when the user has haptics enabled and the device supports it. */
export function haptic(pattern: number | number[] = 8) {
  if (getPrefs().haptics && typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(pattern);
  }
}
