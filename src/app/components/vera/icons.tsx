import type { CSSProperties, ReactNode, ReactElement } from "react";

/* ------------------------------------------------------------------ */
/* VERA icon set — self-contained, refined line icons.                 */
/* 24px grid · 1.75 stroke · round caps/joins · currentColor.          */
/* No external dependency (the environment prunes icon packages).      */
/* ------------------------------------------------------------------ */

export type IconProps = {
  size?: number;
  className?: string;
  style?: CSSProperties;
  weight?: "regular" | "fill" | "bold";
  color?: string;
};
export type IconType = (p: IconProps) => ReactElement;

function S({ size = 24, className, style, color, sw = 1.75, children }: IconProps & { sw?: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? "currentColor"}
      strokeWidth={sw}
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

export const House: IconType = (p) => (
  <S {...p}><path d="M3.5 10.5 12 4l8.5 6.5" /><path d="M5.5 9.5V19a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.5" /><path d="M9.5 20v-5.5h5V20" /></S>
);

export const Microphone: IconType = (p) => (
  <S {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M6 11a6 6 0 0 0 12 0" /><path d="M12 17v4" /><path d="M9 21h6" /></S>
);

export const ClipboardText: IconType = (p) => (
  <S {...p}><rect x="5" y="4.5" width="14" height="16" rx="2.5" /><path d="M9 4.5a3 3 0 0 1 6 0" /><path d="M8.5 11h7" /><path d="M8.5 14.5h7" /><path d="M8.5 18h4" /></S>
);

export const Package: IconType = (p) => (
  <S {...p}><path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" /><path d="m4 7 8 4 8-4" /><path d="M12 21V11" /><path d="m8 5 8 4" /></S>
);

export const User: IconType = (p) => (
  <S {...p}><circle cx="12" cy="8" r="4" /><path d="M4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" /></S>
);

export const UsersThree: IconType = (p) => (
  <S {...p}><circle cx="9" cy="9" r="3.2" /><path d="M3.5 19c.9-3 3-4.5 5.5-4.5S13.6 16 14.5 19" /><path d="M16 6.2A3 3 0 0 1 19 11" /><path d="M17 14.6c1.7.5 3 1.9 3.5 4.4" /></S>
);

export const CaretLeft: IconType = (p) => (<S {...p}><path d="M15 5 8 12l7 7" /></S>);
export const CaretRight: IconType = (p) => (<S {...p}><path d="M9 5l7 7-7 7" /></S>);
export const ArrowRight: IconType = (p) => (<S {...p}><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></S>);

export const Check: IconType = (p) => (<S {...p} sw={2}><path d="M5 12.5 10 17.5 19 7" /></S>);
export const X: IconType = (p) => (<S {...p} sw={2}><path d="M6 6l12 12" /><path d="M18 6 6 18" /></S>);
export const Plus: IconType = (p) => (<S {...p} sw={2}><path d="M12 5v14" /><path d="M5 12h14" /></S>);

export const Sparkle: IconType = (p) => {
  const fill = p.weight === "fill";
  return (
    <S {...p}>
      <path
        d="M12 3c.5 4.2 1.8 5.5 6 6-4.2.5-5.5 1.8-6 6-.5-4.2-1.8-5.5-6-6 4.2-.5 5.5-1.8 6-6Z"
        fill={fill ? (p.color ?? "currentColor") : "none"}
      />
    </S>
  );
};

export const Camera: IconType = (p) => (
  <S {...p}><path d="M4 8.5A2 2 0 0 1 6 6.5h1.5l1.2-1.8h6.6l1.2 1.8H18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8Z" /><circle cx="12" cy="12.5" r="3.2" /></S>
);

export const ArrowsClockwise: IconType = (p) => (
  <S {...p}><path d="M4.5 9a8 8 0 0 1 13.4-2.5L20 8" /><path d="M20 4v4h-4" /><path d="M19.5 15a8 8 0 0 1-13.4 2.5L4 16" /><path d="M4 20v-4h4" /></S>
);

export const MagnifyingGlass: IconType = (p) => (<S {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-3.6-3.6" /></S>);

export const PencilSimple: IconType = (p) => (
  <S {...p}><path d="M4 20h4L19 9a2 2 0 0 0-2.8-2.8L5 17.2 4 20Z" /><path d="m14.5 7.5 2.8 2.8" /></S>
);

export const ForkKnife: IconType = (p) => (
  <S {...p}><path d="M7 3v6.5a2.5 2.5 0 0 0 5 0V3" /><path d="M9.5 9.5V21" /><path d="M16 3c-1.5 0-2.5 1.8-2.5 4.5S14.5 12 16 12V3Z" /><path d="M16 12v9" /></S>
);

export const Clock: IconType = (p) => (<S {...p}><circle cx="12" cy="12" r="8" /><path d="M12 7.5V12l3 2" /></S>);

export const CheckCircle: IconType = (p) => {
  const fill = p.weight === "fill";
  return fill ? (
    <S {...p} sw={0}><circle cx="12" cy="12" r="9" fill={p.color ?? "currentColor"} /><path d="M8 12.3 11 15.3 16.2 9" stroke="#fff" strokeWidth={2} fill="none" /></S>
  ) : (
    <S {...p}><circle cx="12" cy="12" r="8.2" /><path d="M8.3 12.3 11 15 15.6 9.3" /></S>
  );
};

export const XCircle: IconType = (p) => (<S {...p}><circle cx="12" cy="12" r="8.2" /><path d="m9.5 9.5 5 5" /><path d="m14.5 9.5-5 5" /></S>);

export const Warning: IconType = (p) => (
  <S {...p}><path d="M10.3 4.3 2.7 17.5A2 2 0 0 0 4.4 20.5h15.2a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" /><path d="M12 9.5V14" /><path d="M12 17.2h.01" /></S>
);

export const Tray: IconType = (p) => (
  <S {...p}><rect x="4" y="4.5" width="16" height="15" rx="2.5" /><path d="M4 14h4l1.5 2.5h5L16 14h4" /></S>
);

export const SignOut: IconType = (p) => (
  <S {...p}><path d="M9 4.5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h3" /><path d="M15.5 8 19.5 12l-4 4" /><path d="M19 12H9.5" /></S>
);

export const Bell: IconType = (p) => (
  <S {...p}><path d="M6 10a6 6 0 0 1 12 0c0 4 1.2 5.5 2 6.5H4c.8-1 2-2.5 2-6.5Z" /><path d="M10 19.5a2 2 0 0 0 4 0" /></S>
);

export const ChartLineUp: IconType = (p) => (
  <S {...p}><path d="M4 4v16h16" /><path d="m7 15 3.5-4 3 2.5L18 8" /><path d="M14.5 8H18v3.5" /></S>
);

export const TrendUp: IconType = (p) => (<S {...p}><path d="m4 16 5-5 3.5 3.5L20 7" /><path d="M15 7h5v5" /></S>);

export const Table: IconType = (p) => (
  <S {...p}><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M4 10h16" /><path d="M10 10v9" /></S>
);

export const ShieldCheck: IconType = (p) => (
  <S {...p}><path d="M12 3.5 5.5 6v5c0 4.2 2.8 7.5 6.5 9 3.7-1.5 6.5-4.8 6.5-9V6L12 3.5Z" /><path d="m9 11.8 2.2 2.2L15.2 10" /></S>
);
