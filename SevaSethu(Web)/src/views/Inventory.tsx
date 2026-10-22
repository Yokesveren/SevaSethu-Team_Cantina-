import { useState } from "react";
import { Package, AlertTriangle, CheckCircle2, XCircle, Plus, Download, Search, ChevronDown, TrendingDown } from "lucide-react";

type StockStatus = "adequate" | "low" | "critical" | "out";

interface Item {
  id: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  reorder: number;
  max: number;
  lastIssued: string;
  expiryDate: string;
  supplier: string;
  status: StockStatus;
  pendingIndent: boolean;
}

const ITEMS: Item[] = [
  { id: "MED-001", name: "Paracetamol 500mg Tab", category: "Analgesic", unit: "Strips", stock: 45, reorder: 100, max: 500, lastIssued: "01 Sep 2024", expiryDate: "Mar 2026", supplier: "Bihar Medical Stores", status: "low", pendingIndent: true },
  { id: "MED-002", name: "Amoxicillin 500mg Cap", category: "Antibiotic", unit: "Strips", stock: 180, reorder: 80, max: 400, lastIssued: "31 Aug 2024", expiryDate: "Jun 2025", supplier: "Bihar Medical Stores", status: "adequate", pendingIndent: false },
  { id: "MED-003", name: "Metformin 500mg Tab", category: "Antidiabetic", unit: "Strips", stock: 220, reorder: 100, max: 600, lastIssued: "01 Sep 2024", expiryDate: "Sep 2025", supplier: "Bihar Medical Stores", status: "adequate", pendingIndent: false },
  { id: "MED-004", name: "Amlodipine 5mg Tab", category: "Antihypertensive", unit: "Strips", stock: 60, reorder: 80, max: 400, lastIssued: "01 Sep 2024", expiryDate: "Dec 2025", supplier: "Bihar Medical Stores", status: "low", pendingIndent: false },
  { id: "MED-005", name: "ORS Sachets", category: "Rehydration", unit: "Packets", stock: 23, reorder: 50, max: 200, lastIssued: "01 Sep 2024", expiryDate: "Jan 2026", supplier: "UNICEF Supply", status: "low", pendingIndent: true },
  { id: "MED-006", name: "Iron + Folic Acid Tab", category: "Nutritional", unit: "Strips", stock: 310, reorder: 100, max: 600, lastIssued: "01 Sep 2024", expiryDate: "Apr 2026", supplier: "NHM Supply", status: "adequate", pendingIndent: false },
  { id: "MED-007", name: "Cotrimoxazole 480mg Tab", category: "Antibiotic", unit: "Strips", stock: 8, reorder: 40, max: 200, lastIssued: "30 Aug 2024", expiryDate: "Aug 2025", supplier: "Bihar Medical Stores", status: "critical", pendingIndent: true },
  { id: "MED-008", name: "Isoniazid 300mg Tab (TB)", category: "Antitubercular", unit: "Strips", stock: 95, reorder: 60, max: 300, lastIssued: "01 Sep 2024", expiryDate: "Mar 2026", supplier: "RNTCP Stores", status: "adequate", pendingIndent: false },
  { id: "SUP-001", name: "Surgical Bandage (5cm)", category: "Surgical Supply", unit: "Rolls", stock: 12, reorder: 30, max: 100, lastIssued: "01 Sep 2024", expiryDate: "Dec 2027", supplier: "State Medical Stores", status: "low", pendingIndent: false },
  { id: "SUP-002", name: "Disposable Gloves (M)", category: "PPE", unit: "Pairs", stock: 0, reorder: 50, max: 200, lastIssued: "31 Aug 2024", expiryDate: "Dec 2026", supplier: "State Medical Stores", status: "out", pendingIndent: true },
  { id: "SUP-003", name: "Syringes 5ml", category: "Surgical Supply", unit: "Pieces", stock: 340, reorder: 100, max: 500, lastIssued: "01 Sep 2024", expiryDate: "Jan 2028", supplier: "State Medical Stores", status: "adequate", pendingIndent: false },
  { id: "VAC-001", name: "BCG Vaccine (10 dose vial)", category: "Vaccine", unit: "Vials", stock: 6, reorder: 10, max: 40, lastIssued: "01 Sep 2024", expiryDate: "15 Sep 2024", supplier: "Cold Chain Depot, TTK", status: "low", pendingIndent: false },
  { id: "VAC-002", name: "OPV Drops (10 dose vial)", category: "Vaccine", unit: "Vials", stock: 14, reorder: 10, max: 40, lastIssued: "01 Sep 2024", expiryDate: "10 Sep 2024", supplier: "Cold Chain Depot, TTK", status: "adequate", pendingIndent: false },
  { id: "DIA-001", name: "Glucometer Strips", category: "Diagnostics", unit: "Strips", stock: 0, reorder: 100, max: 300, lastIssued: "28 Aug 2024", expiryDate: "Nov 2024", supplier: "Diagnostics Dept.", status: "out", pendingIndent: true },
];

const STATUS_META: Record<StockStatus, { label: string; bg: string; text: string; icon: React.ReactNode; barColor: string }> = {
  adequate: { label: "Adequate", bg: "bg-green-50", text: "text-green-800", icon: <CheckCircle2 size={10} />, barColor: "bg-phc-green" },
  low: { label: "Low Stock", bg: "bg-amber-50", text: "text-amber-800", icon: <TrendingDown size={10} />, barColor: "bg-amber-400" },
  critical: { label: "Critical", bg: "bg-red-50", text: "text-red-700", icon: <AlertTriangle size={10} />, barColor: "bg-red-500" },
  out: { label: "Out of Stock", bg: "bg-red-100", text: "text-red-800", icon: <XCircle size={10} />, barColor: "bg-red-600" },
};

const CATEGORIES = ["All categories", "Analgesic", "Antibiotic", "Antidiabetic", "Antihypertensive", "Rehydration", "Nutritional", "Antitubercular", "Surgical Supply", "PPE", "Vaccine", "Diagnostics"];

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [statusFilter, setStatusFilter] = useState("all");

  const counts = {
    adequate: ITEMS.filter((i) => i.status === "adequate").length,
    low: ITEMS.filter((i) => i.status === "low").length,
    critical: ITEMS.filter((i) => i.status === "critical").length,
    out: ITEMS.filter((i) => i.status === "out").length,
    pendingIndent: ITEMS.filter((i) => i.pendingIndent).length,
  };

  const filtered = ITEMS.filter((item) => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.id.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All categories" || item.category === category;
    const matchStatus = statusFilter === "all" || item.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-phc-text text-2xl leading-none">Inventory</h1>
          <p className="text-[13px] text-phc-muted mt-1.5">
            Patna Rural PHC Store · {ITEMS.length} items · Last updated 01 Sep 2024
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-phc-border text-phc-text text-[12.5px] font-display font-medium hover:bg-phc-bg transition-colors cursor-pointer">
            <Download size={13} />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-phc-blue text-white text-[12.5px] font-display font-semibold hover:bg-phc-blue-dark transition-colors cursor-pointer">
            <Plus size={14} />
            Indent Request
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        {[
          { label: "Adequate", value: counts.adequate, color: "text-phc-green", bg: "bg-green-50 border-green-200", filter: "adequate" },
          { label: "Low Stock", value: counts.low, color: "text-amber-700", bg: "bg-amber-50 border-amber-200", filter: "low" },
          { label: "Critical", value: counts.critical, color: "text-red-700", bg: "bg-red-50 border-red-200", filter: "critical" },
          { label: "Out of Stock", value: counts.out, color: "text-red-800", bg: "bg-red-100 border-red-300", filter: "out" },
          { label: "Pending Indent", value: counts.pendingIndent, color: "text-phc-blue", bg: "bg-phc-blue-light border-blue-200", filter: "all" },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => setStatusFilter(statusFilter === s.filter ? "all" : s.filter)}
            className={`border rounded-lg px-4 py-3.5 text-left transition-colors cursor-pointer hover:shadow-sm ${s.bg}`}
          >
            <div className={`font-display font-bold text-2xl leading-none ${s.color}`}>{s.value}</div>
            <div className="text-[11.5px] text-phc-muted mt-1">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-phc-subtle pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search medicine or item ID…"
            className="w-full pl-8 pr-3 py-2 text-[12.5px] border border-phc-border rounded-lg focus:outline-none focus:ring-1 focus:ring-phc-blue/30 focus:border-phc-blue bg-phc-surface"
          />
        </div>
        <div className="relative">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="pl-3 pr-7 py-2 text-[12.5px] border border-phc-border rounded-lg appearance-none cursor-pointer focus:outline-none focus:border-phc-blue bg-phc-surface"
          >
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-phc-subtle pointer-events-none" />
        </div>
        <div className="text-[11.5px] text-phc-muted ml-auto">{filtered.length} items</div>
      </div>

      {/* Table */}
      <div className="bg-phc-surface border border-phc-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-phc-bg border-b border-phc-border">
                {["Item ID", "Name", "Category", "Stock Level", "Unit", "Reorder Level", "Expiry", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10.5px] font-display font-semibold text-phc-muted uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => {
                const sm = STATUS_META[item.status];
                const pct = Math.min((item.stock / item.max) * 100, 100);
                const nearExpiry = new Date(item.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                return (
                  <tr key={item.id} className={`border-b border-phc-border-light hover:bg-phc-blue-light/20 transition-colors ${i % 2 === 1 ? "bg-phc-bg/40" : ""}`}>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[11px] text-phc-blue">{item.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-display font-medium text-phc-text text-[13px] whitespace-nowrap">{item.name}</div>
                      {item.pendingIndent && (
                        <div className="text-[10.5px] text-phc-blue mt-0.5">↑ Indent pending</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-phc-muted whitespace-nowrap">{item.category}</td>
                    <td className="px-4 py-3 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-phc-bg rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${sm.barColor}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className={`font-mono text-[12px] font-semibold w-8 text-right flex-shrink-0 ${item.status === "out" ? "text-red-700" : item.status === "critical" ? "text-red-600" : item.status === "low" ? "text-amber-700" : "text-phc-text"}`}>
                          {item.stock}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-phc-muted">{item.unit}</td>
                    <td className="px-4 py-3 text-[12.5px] font-mono text-phc-muted">{item.reorder}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[12px] ${nearExpiry ? "text-red-600 font-semibold" : "text-phc-muted"}`}>
                        {item.expiryDate}
                        {nearExpiry && <span className="ml-1 text-[10px] text-red-500">⚠ Soon</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-display font-semibold ${sm.bg} ${sm.text}`}>
                        {sm.icon}
                        {sm.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="text-[12px] text-phc-blue hover:underline font-display cursor-pointer whitespace-nowrap">Issue</button>
                        <button className="text-[12px] text-phc-muted hover:text-phc-text hover:underline font-display cursor-pointer">Receive</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-phc-border bg-phc-bg text-[11.5px] text-phc-muted">
          Showing {filtered.length} of {ITEMS.length} items · Last stock audit: 25 Aug 2024
        </div>
      </div>

      {/* Near-expiry alert */}
      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
        <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-display font-semibold text-amber-900 text-[13px]">Near-Expiry Items</div>
          <div className="text-[12.5px] text-amber-800 mt-0.5">
            BCG Vaccine vials expire 15 Sep 2024 — plan session use. OPV Drops expire 10 Sep 2024. Glucometer Strips expire Nov 2024 (out of stock).
          </div>
        </div>
      </div>
    </div>
  );
}
