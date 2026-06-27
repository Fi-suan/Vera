import {
  AreaChart, Area, ResponsiveContainer, XAxis, Tooltip,
  BarChart, Bar, Cell, PieChart, Pie,
} from "recharts";
import { tengeShort, CATEGORY_COLOR, type Category } from "./store";

const axisTick = { fontSize: 12, fill: "#9a747a", fontWeight: 600 };

function Box({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white/90 px-3 py-2 shadow-[0_10px_24px_-12px_rgba(184,50,66,0.4)] border border-[#f0d8cf]">
      <div className="text-[12px] text-[var(--vera-rose-gray)] font-semibold">{label}</div>
      <div className="font-bold text-[var(--vera-cocoa)]">{value}</div>
    </div>
  );
}

export function LossTrend({ data }: { data: { label: string; loss: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="lossFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f2555f" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#f2555f" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ stroke: "#f2555f", strokeDasharray: 4, strokeOpacity: 0.4 }} content={({ active, payload }) => (active && payload?.length ? <Box label="Loss" value={tengeShort(payload[0].value as number)} /> : null)} />
        <Area type="monotone" dataKey="loss" stroke="#f2555f" strokeWidth={3} fill="url(#lossFill)" dot={{ r: 3, fill: "#f2555f", strokeWidth: 0 }} activeDot={{ r: 5 }} animationDuration={900} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CategoryBars({ data }: { data: { cat: Category; loss: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(140, data.length * 42)}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16 }}>
        <XAxis type="number" hide />
        <Tooltip cursor={{ fill: "rgba(242,85,95,0.06)" }} content={({ active, payload }) => (active && payload?.length ? <Box label={payload[0].payload.cat} value={tengeShort(payload[0].value as number)} /> : null)} />
        <Bar dataKey="loss" radius={[8, 8, 8, 8]} barSize={18} animationDuration={900}>
          {data.map((d) => <Cell key={d.cat} fill={CATEGORY_COLOR[d.cat]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PointDonut({ data }: { data: { point: string; loss: number }[] }) {
  const palette = ["#f2555f", "#f6b95e", "#68c7a2", "#5fa8d9"];
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Tooltip content={({ active, payload }) => (active && payload?.length ? <Box label={payload[0].payload.point} value={tengeShort(payload[0].value as number)} /> : null)} />
        <Pie data={data} dataKey="loss" nameKey="point" innerRadius={56} outerRadius={84} paddingAngle={3} stroke="none" animationDuration={900}>
          {data.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
