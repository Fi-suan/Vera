import type { CSSProperties, ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* VERA custom icon set — hand-built strokes, no external icon dep.    */
/* Avoids Vite dep-optimization failures and keeps a unique look.      */
/* ------------------------------------------------------------------ */

export type IconProps = {
  size?: number;
  className?: string;
  style?: CSSProperties;
  weight?: "regular" | "fill" | "bold"; // accepted for API parity; visual is stroke
  strokeWidth?: number;
};

function Ic({ size = 24, className, style, strokeWidth = 1.8, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export type IconType = (p: IconProps) => JSX.Element;

export const House: IconType = (p) => <Ic {...p}><path d="M4 11.5 12 4l8 7.5" /><path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" /><path d="M10 20v-5h4v5" /></Ic>;
export const Microphone: IconType = (p) => <Ic {...p}><rect x="9" y="2.5" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6" /></Ic>;
export const ClipboardText: IconType = (p) => <Ic {...p}><rect x="5" y="4" width="14" height="17" rx="2.5" /><path d="M9 4a3 3 0 0 1 6 0M8.5 11h7M8.5 15h4.5" /></Ic>;
export const Package: IconType = (p) => <Ic {...p}><path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" /><path d="m4 7 8 4 8-4M12 11v10" /></Ic>;
export const User: IconType = (p) => <Ic {...p}><circle cx="12" cy="8" r="3.6" /><path d="M5 20c.7-3.6 3.4-5.5 7-5.5s6.3 1.9 7 5.5" /></Ic>;
export const ChartLineUp: IconType = (p) => <Ic {...p}><path d="M4 4v16h16" /><path d="m7 14 3.5-3.5 3 3L20 7" /><path d="M20 11V7h-4" /></Ic>;
export const Tray: IconType = (p) => <Ic {...p}><path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" /><path d="M4 14 6 5h12l2 9M4 14h4l1.5 2.5h5L16 14h4" /></Ic>;
export const Table: IconType = (p) => <Ic {...p}><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M4 10h16M10 10v9M4 14.5h16" /></Ic>;
export const UsersThree: IconType = (p) => <Ic {...p}><circle cx="9" cy="9" r="3" /><path d="M3.5 18c.6-2.7 2.6-4.2 5.5-4.2S13.9 15.3 14.5 18" /><path d="M16 7.2a3 3 0 0 1 0 5.6M17.5 13.8c2 .5 3.3 1.9 3.8 4.2" /></Ic>;
export const ArrowsClockwise: IconType = (p) => <Ic {...p}><path d="M20 8a8 8 0 0 0-14-3L4 7" /><path d="M4 4v3h3" /><path d="M4 16a8 8 0 0 0 14 3l2-2" /><path d="M20 20v-3h-3" /></Ic>;
export const SignOut: IconType = (p) => <Ic {...p}><path d="M14 4h-7a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h7" /><path d="M11 12h9m0 0-3-3m3 3-3 3" /></Ic>;
export const Bell: IconType = (p) => <Ic {...p}><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10 20a2 2 0 0 0 4 0" /></Ic>;
export const ShieldCheck: IconType = (p) => <Ic {...p}><path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></Ic>;
export const ArrowRight: IconType = (p) => <Ic {...p}><path d="M4 12h15m0 0-5-5m5 5-5 5" /></Ic>;
export const CaretLeft: IconType = (p) => <Ic {...p}><path d="m15 5-7 7 7 7" /></Ic>;
export const CaretRight: IconType = (p) => <Ic {...p}><path d="m9 5 7 7-7 7" /></Ic>;
export const Check: IconType = (p) => <Ic {...p} strokeWidth={p.strokeWidth ?? 2.4}><path d="m5 12.5 4.5 4.5L19 6.5" /></Ic>;
export const X: IconType = (p) => <Ic {...p}><path d="M6 6l12 12M18 6 6 18" /></Ic>;
export const Sparkle: IconType = (p) => <Ic {...p}><path d="M12 3c.6 4.4 2.6 6.4 7 7-4.4.6-6.4 2.6-7 7-.6-4.4-2.6-6.4-7-7 4.4-.6 6.4-2.6 7-7Z" /></Ic>;
export const Camera: IconType = (p) => <Ic {...p}><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" /><circle cx="12" cy="13" r="3.2" /></Ic>;
export const MagnifyingGlass: IconType = (p) => <Ic {...p}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></Ic>;
export const PencilSimple: IconType = (p) => <Ic {...p}><path d="M14.5 5.5 18.5 9.5 8 20H4v-4L14.5 5.5Z" /><path d="m13 7 4 4" /></Ic>;
export const ForkKnife: IconType = (p) => <Ic {...p}><path d="M7 3v7m-2.5-7v4a2.5 2.5 0 0 0 5 0V3M7 10v11" /><path d="M16 3c-1.5 1-2.5 2.8-2.5 5s1 3.5 2.5 4v9" /></Ic>;
export const Clock: IconType = (p) => <Ic {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Ic>;
export const CheckCircle: IconType = (p) => <Ic {...p}><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12 2.4 2.4L16 9.5" /></Ic>;
export const XCircle: IconType = (p) => <Ic {...p}><circle cx="12" cy="12" r="8.5" /><path d="m9 9 6 6m0-6-6 6" /></Ic>;
export const Warning: IconType = (p) => <Ic {...p}><path d="M12 4 2.5 20h19L12 4Z" /><path d="M12 10v4.5M12 17.5v.5" /></Ic>;
export const TrendUp: IconType = (p) => <Ic {...p}><path d="m4 16 5-5 3 3 8-8" /><path d="M20 6v5h-5" /></Ic>;
export const Plus: IconType = (p) => <Ic {...p} strokeWidth={p.strokeWidth ?? 2.2}><path d="M12 5v14M5 12h14" /></Ic>;
