import { Download, Calendar, BarChart2, TrendingUp, TrendingDown, FileText, ChevronRight } from "lucide-react";

const MONTHLY_DATA = [
  { month: "Mar", patients: 2140, referrals: 38, anc: 94, immunisation: 112, dot: 28 },
  { month: "Apr", patients: 2280, referrals: 41, anc: 102, immunisation: 128, dot: 31 },
  { month: "May", patients: 2190, referrals: 35, anc: 88, immunisation: 119, dot: 29 },
  { month: "Jun", patients: 2310, referrals: 44, anc: 110, immunisation: 134, dot: 33 },
  { month: "Jul", patients: 2450, referrals: 52, anc: 118, immunisation: 141, dot: 35 },
  { month: "Aug", patients: 2388, referrals: 49, anc: 107, immunisation: 138, dot: 36 },
];

const CURRENT = MONTHLY_DATA[MONTHLY_DATA.length - 1];
const PREV = MONTHLY_DATA[MONTHLY_DATA.length - 2];

function pctChange(curr: number, prev: number) {
  const d = ((curr - prev) / prev * 100).toFixed(1);
  const up = curr >= prev;
  return { value: `${up ? "+" : ""}${d}%`, up };
}

const maxPatients = Math.max(...MONTHLY_DATA.map((d) => d.patients));

function BarChartSimple({ data, dataKey, color }: { data: typeof MONTHLY_DATA; dataKey: string; color: string }) {
  const vals = data.map((d) => (d as any)[dataKey] as number);
  const max = Math.max(...vals);
  return (
    <div className="flex items-end gap-1.5 h-20">
      {data.map((d, i) => {
        const val = (d as any)[dataKey] as number;
        const pct = (val / max) * 100;
        const isLast = i === data.length - 1;
        return (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-t" style={{ height: `${pct}%`, backgroundColor: isLast ? color : color + "66", minHeight: 4 }} />
            <span className="text-[9px] font-mono text-phc-subtle">{d.month}</span>
          </div>
        );
      })}
    </div>
  );
}

const REPORTS = [
  { name: "Monthly HMIS Report — August 2024", date: "01 Sep 2024", type: "HMIS", size: "842 KB" },
  { name: "ASHA Performance Report — Q2 2024", date: "01 Jul 2024", type: "ASHA", size: "1.2 MB" },
  { name: "ANC & Delivery Summary — Aug 2024", date: "01 Sep 2024", type: "MCH", size: "528 KB" },
  { name: "Immunisation Coverage — Aug 2024", date: "01 Sep 2024", type: "UIP", size: "391 KB" },
  { name: "Disease Surveillance Report — Week 35", date: "02 Sep 2024", type: "IDSP", size: "214 KB" },
  { name: "TB/RNTCP Monthly — Aug 2024", date: "01 Sep 2024", type: "RNTCP", size: "305 KB" },
  { name: "Drug Inventory Report — Aug 2024", date: "01 Sep 2024", type: "Store", size: "178 KB" },
];

const TYPE_COLORS: Record<string, string> = {
  HMIS: "bg-phc-blue-light text-phc-blue",
  ASHA: "bg-phc-green-light text-phc-green",
  MCH: "bg-pink-100 text-pink-800",
  UIP: "bg-teal-100 text-teal-800",
  IDSP: "bg-amber-100 text-amber-800",
  RNTCP: "bg-orange-100 text-orange-800",
  Store: "bg-slate-100 text-slate-700",
};

function MetricCard({
  label, current, prev, unit,
}: { label: string; current: number; prev: number; unit?: string }) {
  const ch = pctChange(current, prev);
  return (
    <div className="bg-phc-surface border border-phc-border rounded-lg p-4">
      <div className="font-display font-bold text-phc-text text-2xl leading-none">{current.toLocaleString()}<span className="text-[14px] font-normal text-phc-muted ml-1">{unit}</span></div>
      <div className="text-[12px] text-phc-muted mt-1">{label}</div>
      <div className={`flex items-center gap-1 mt-2 text-[11.5px] font-display font-semibold ${ch.up ? "text-phc-green" : "text-red-600"}`}>
        {ch.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {ch.value} vs Jul
      </div>
    </div>
  );
}

export default function Reports() {
  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-phc-text text-2xl leading-none">Reports</h1>
          <p className="text-[13px] text-phc-muted mt-1.5">HMIS · NHM · RNTCP · UIP · IDSP reporting — Patna Rural PHC</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-phc-blue-light border border-blue-200 rounded-lg text-[12px] text-phc-blue font-display font-medium">
            <Calendar size={13} />
            August 2024
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-phc-blue text-white text-[12.5px] font-display font-semibold hover:bg-phc-blue-dark transition-colors cursor-pointer">
            <Download size={14} />
            Generate Report
          </button>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <MetricCard label="Total Patient Visits" current={CURRENT.patients} prev={PREV.patients} />
        <MetricCard label="Referrals Made" current={CURRENT.referrals} prev={PREV.referrals} />
        <MetricCard label="ANC Visits" current={CURRENT.anc} prev={PREV.anc} />
        <MetricCard label="Immunisations" current={CURRENT.immunisation} prev={PREV.immunisation} />
        <MetricCard label="TB DOT Sessions" current={CURRENT.dot} prev={PREV.dot} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { title: "Patient Visits (6 months)", key: "patients", color: "#1B4F8A" },
          { title: "Referrals", key: "referrals", color: "#5B21B6" },
          { title: "ANC Visits", key: "anc", color: "#BE185D" },
        ].map((c) => (
          <div key={c.key} className="bg-phc-surface border border-phc-border rounded-lg p-4">
            <div className="font-display font-semibold text-phc-text text-[13px] mb-4">{c.title}</div>
            <BarChartSimple data={MONTHLY_DATA} dataKey={c.key} color={c.color} />
            <div className="mt-2 flex items-center justify-between text-[11px] text-phc-muted">
              <span>{MONTHLY_DATA[0].month} 2024</span>
              <span className="font-display font-semibold text-phc-blue">{(MONTHLY_DATA[MONTHLY_DATA.length - 1] as any)[c.key].toLocaleString()} this month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Report archive */}
      <div className="bg-phc-surface border border-phc-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-phc-border">
          <h2 className="font-display font-semibold text-phc-text text-[14px]">Report Archive</h2>
          <button className="text-[12px] text-phc-blue hover:underline font-display cursor-pointer">View all</button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-phc-bg border-b border-phc-border">
              {["Report Name", "Category", "Generated", "Size", ""].map((h) => (
                <th key={h} className="px-5 py-2.5 text-left text-[10.5px] font-display font-semibold text-phc-muted uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {REPORTS.map((r, i) => (
              <tr key={r.name} className={`border-b border-phc-border-light hover:bg-phc-blue-light/20 transition-colors ${i % 2 === 1 ? "bg-phc-bg/40" : ""}`}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-phc-subtle flex-shrink-0" />
                    <span className="font-display font-medium text-phc-text text-[13px]">{r.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-display font-bold ${TYPE_COLORS[r.type] || "bg-gray-100 text-gray-700"}`}>
                    {r.type}
                  </span>
                </td>
                <td className="px-5 py-3 text-[12.5px] text-phc-muted">{r.date}</td>
                <td className="px-5 py-3 text-[12px] font-mono text-phc-subtle">{r.size}</td>
                <td className="px-5 py-3">
                  <button className="flex items-center gap-1 text-[12px] text-phc-blue hover:underline font-display cursor-pointer">
                    <Download size={12} />
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Submission status */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-phc-surface border border-phc-border rounded-lg p-4">
          <div className="font-display font-semibold text-phc-text text-[13.5px] mb-3">Pending Submissions — August 2024</div>
          <div className="space-y-2">
            {[
              { name: "HMIS Monthly Report", due: "5 Sep", done: true },
              { name: "Vehicle Utilisation", due: "5 Sep", done: false },
              { name: "ASHA Incentive Statement", due: "7 Sep", done: false },
              { name: "Disease Surveillance (IDSP)", due: "10 Sep", done: true },
            ].map((s) => (
              <div key={s.name} className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${s.done ? "bg-phc-green" : "border-2 border-phc-border"}`}>
                  {s.done && <span className="text-white text-[8px]">✓</span>}
                </div>
                <span className={`text-[12.5px] flex-1 ${s.done ? "text-phc-muted line-through" : "text-phc-text"}`}>{s.name}</span>
                <span className={`text-[11.5px] font-mono ${s.done ? "text-phc-subtle" : "text-amber-700"}`}>Due {s.due}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-phc-surface border border-phc-border rounded-lg p-4">
          <div className="font-display font-semibold text-phc-text text-[13.5px] mb-3">Quick Stats — Aug 2024</div>
          <div className="space-y-2">
            {[
              { label: "New registrations", value: "34" },
              { label: "Institutional deliveries", value: "12" },
              { label: "High-risk pregnancies identified", value: "4" },
              { label: "Full immunisation (0–1 yr)", value: "28 / 31 (90.3%)" },
              { label: "TB cure rate (cohort)", value: "88%" },
              { label: "ASHA performance score", value: "87 / 100" },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between py-0.5 border-b border-phc-border-light last:border-0">
                <span className="text-[12.5px] text-phc-muted">{s.label}</span>
                <span className="font-display font-semibold text-phc-text text-[13px]">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
