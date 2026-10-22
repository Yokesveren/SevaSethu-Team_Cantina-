import { useState } from "react";
import {
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  ChevronDown,
  Eye,
  EyeOff,
  Plus,
  Download,
  ArrowUpRight,
  UserCheck,
  CornerUpRight,
  Loader2,
  Clock,
} from "lucide-react";

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({ id, title, sub, children }: { id: string; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-12">
      <div className="mb-5 pb-3 border-b border-phc-border">
        <h2 className="font-display font-bold text-phc-text text-xl">{title}</h2>
        {sub && <p className="text-[13px] text-phc-muted mt-1">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="font-display font-semibold text-phc-muted text-[11px] uppercase tracking-widest mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function DemoBox({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`p-5 rounded-lg border border-phc-border bg-phc-bg ${className}`}>
      {children}
    </div>
  );
}

// ─── Typography ───────────────────────────────────────────────────────────────

function TypographySection() {
  return (
    <Section id="typography" title="Typography" sub="Work Sans for headings and UI labels · Source Sans 3 for body text · JetBrains Mono for codes and data">
      <SubSection title="Display & Headings — font-display (Work Sans)">
        <div className="bg-phc-surface border border-phc-border rounded-lg p-6 space-y-4">
          <div className="flex items-baseline gap-4">
            <span className="text-[11px] font-mono text-phc-subtle w-16 flex-shrink-0">36px / 800</span>
            <span className="font-display font-extrabold text-phc-text text-4xl">Patna Rural PHC Dashboard</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-[11px] font-mono text-phc-subtle w-16 flex-shrink-0">28px / 700</span>
            <span className="font-display font-bold text-phc-text text-3xl">Patient Triage & Case Management</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-[11px] font-mono text-phc-subtle w-16 flex-shrink-0">22px / 600</span>
            <span className="font-display font-semibold text-phc-text text-2xl">ASHA Worker Reports — Q3 2024</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-[11px] font-mono text-phc-subtle w-16 flex-shrink-0">18px / 600</span>
            <span className="font-display font-semibold text-phc-text text-lg">Referral to AIIMS Patna — Urgent</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-[11px] font-mono text-phc-subtle w-16 flex-shrink-0">15px / 500</span>
            <span className="font-display font-medium text-phc-text text-base">Section heading · Card title · Table column</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-[11px] font-mono text-phc-subtle w-16 flex-shrink-0">12px / 600</span>
            <span className="font-display font-semibold text-phc-muted text-xs uppercase tracking-widest">Label · Status · Category</span>
          </div>
        </div>
      </SubSection>

      <SubSection title="Body Text — font-sans (Source Sans 3)">
        <div className="bg-phc-surface border border-phc-border rounded-lg p-6 space-y-4">
          <div className="flex gap-4">
            <span className="text-[11px] font-mono text-phc-subtle w-16 flex-shrink-0 mt-0.5">16px / 400</span>
            <p className="text-phc-text text-base leading-relaxed max-w-xl">
              The Primary Health Centre (PHC) is the cornerstone of rural health delivery under the National Health Mission. Each PHC serves a population of 20,000 to 30,000, providing preventive, promotive, and curative care.
            </p>
          </div>
          <div className="flex gap-4">
            <span className="text-[11px] font-mono text-phc-subtle w-16 flex-shrink-0 mt-0.5">14px / 400</span>
            <p className="text-phc-muted text-sm leading-relaxed max-w-xl">
              Patient was referred by ASHA Worker Meena Kumari from Ward 3 on 01 Sep 2024 at 10:03 AM with chief complaint of chest pain radiating to left arm and jaw. Vitals on arrival: BP 152/96, Pulse 98 bpm, SpO₂ 94%.
            </p>
          </div>
          <div className="flex gap-4">
            <span className="text-[11px] font-mono text-phc-subtle w-16 flex-shrink-0 mt-0.5">12px / 400</span>
            <p className="text-phc-subtle text-xs leading-relaxed max-w-xl">
              Last updated 01 Sep 2024 · Source: ASHA App sync via NHM dashboard · HMIS record BR-PAT-PHC-042-P0892
            </p>
          </div>
        </div>
      </SubSection>

      <SubSection title="Monospace — font-mono (JetBrains Mono)">
        <div className="bg-phc-surface border border-phc-border rounded-lg p-5 space-y-3">
          {[
            ["Patient ID", "BR-PAT-PHC-042-P0892"],
            ["HMIS Code", "BR-PAT-PHC-042"],
            ["Token", "#007"],
            ["ASHA ID", "BR-PAT-ASHA-031"],
            ["Referral", "REF-2024-089"],
          ].map(([label, val]) => (
            <div key={label} className="flex items-center gap-4">
              <span className="text-[11px] text-phc-muted w-24 flex-shrink-0">{label}</span>
              <span className="font-mono text-[13px] text-phc-blue">{val}</span>
            </div>
          ))}
        </div>
      </SubSection>
    </Section>
  );
}

// ─── Colour Palette ────────────────────────────────────────────────────────────

const PALETTE = [
  { group: "Brand Blue", swatches: [
    { name: "Blue Dark", hex: "#143D6E", cls: "bg-phc-blue-dark", text: "text-white" },
    { name: "Blue", hex: "#1B4F8A", cls: "bg-phc-blue", text: "text-white" },
    { name: "Blue Mid", hex: "#2B62A5", cls: "bg-phc-blue-mid", text: "text-white" },
    { name: "Blue Light", hex: "#E8F1FA", cls: "bg-phc-blue-light", text: "text-phc-blue" },
  ]},
  { group: "Health Green", swatches: [
    { name: "Green Dark", hex: "#165C46", cls: "bg-phc-green-dark", text: "text-white" },
    { name: "Green", hex: "#1E7C5E", cls: "bg-phc-green", text: "text-white" },
    { name: "Green Light", hex: "#E6F4EF", cls: "bg-phc-green-light", text: "text-phc-green" },
  ]},
  { group: "Neutral", swatches: [
    { name: "Text", hex: "#1A2332", cls: "bg-phc-text", text: "text-white" },
    { name: "Muted", hex: "#5C6878", cls: "bg-phc-muted", text: "text-white" },
    { name: "Subtle", hex: "#8E9BAA", cls: "bg-phc-subtle", text: "text-white" },
    { name: "Border", hex: "#D1D9E3", cls: "bg-phc-border", text: "text-phc-muted" },
    { name: "Surface", hex: "#FFFFFF", cls: "bg-phc-surface border border-phc-border", text: "text-phc-muted" },
    { name: "Background", hex: "#F4F6F9", cls: "bg-phc-bg border border-phc-border", text: "text-phc-muted" },
  ]},
  { group: "Sidebar", swatches: [
    { name: "Sidebar", hex: "#162A45", cls: "", style: { backgroundColor: "#162A45" }, text: "text-white" },
    { name: "Hover", hex: "#1E3A5F", cls: "", style: { backgroundColor: "#1E3A5F" }, text: "text-white" },
    { name: "Active", hex: "#1E4E8C", cls: "", style: { backgroundColor: "#1E4E8C" }, text: "text-white" },
  ]},
  { group: "Status", swatches: [
    { name: "Waiting", hex: "#FEF3C7 / #92400E", cls: "bg-amber-50", text: "text-amber-800" },
    { name: "Treating", hex: "#DBEAFE / #1E40AF", cls: "bg-blue-50", text: "text-blue-800" },
    { name: "Done", hex: "#F3F4F6 / #374151", cls: "bg-gray-100", text: "text-gray-700" },
    { name: "Referred", hex: "#EDE9FE / #5B21B6", cls: "bg-violet-50", text: "text-violet-800" },
    { name: "Critical", hex: "#FEE2E2 / #B91C1C", cls: "bg-red-50", text: "text-red-700" },
    { name: "Stable", hex: "#DCFCE7 / #15803D", cls: "bg-green-50", text: "text-green-800" },
  ]},
];

function ColourSection() {
  return (
    <Section id="colours" title="Colour Palette" sub="Restrained institutional palette — deep blue authority, health green, light neutral surfaces">
      {PALETTE.map((group) => (
        <div key={group.group} className="mb-5">
          <h3 className="text-[11px] font-display font-semibold text-phc-muted uppercase tracking-widest mb-2.5">{group.group}</h3>
          <div className="flex gap-3 flex-wrap">
            {group.swatches.map((s) => (
              <div key={s.name} className="flex-shrink-0">
                <div
                  className={`w-24 h-14 rounded-lg mb-1.5 ${s.cls}`}
                  style={(s as any).style}
                />
                <div className="text-[11.5px] font-display font-medium text-phc-text">{s.name}</div>
                <div className="text-[10.5px] font-mono text-phc-subtle">{s.hex}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </Section>
  );
}

// ─── Buttons ──────────────────────────────────────────────────────────────────

function ButtonsSection() {
  const [loading, setLoading] = useState(false);
  const triggerLoad = () => { setLoading(true); setTimeout(() => setLoading(false), 2000); };

  return (
    <Section id="buttons" title="Buttons" sub="Consistent scale: sm, md (default), lg. Variants: primary, secondary, outline, ghost, danger">
      <div className="space-y-4">
        {/* Sizes */}
        <SubSection title="Size variants">
          <DemoBox className="flex flex-wrap items-center gap-3">
            <button className="px-2.5 py-1 text-[11.5px] font-display font-semibold rounded bg-phc-blue text-white hover:bg-phc-blue-dark transition-colors cursor-pointer">
              Small
            </button>
            <button className="px-4 py-2 text-[13px] font-display font-semibold rounded-lg bg-phc-blue text-white hover:bg-phc-blue-dark transition-colors cursor-pointer">
              Medium (default)
            </button>
            <button className="px-6 py-2.5 text-[14.5px] font-display font-semibold rounded-lg bg-phc-blue text-white hover:bg-phc-blue-dark transition-colors cursor-pointer">
              Large
            </button>
          </DemoBox>
        </SubSection>

        {/* Primary variants */}
        <SubSection title="Colour variants">
          <DemoBox className="flex flex-wrap items-center gap-3">
            <button className="px-4 py-2 text-[13px] font-display font-semibold rounded-lg bg-phc-blue text-white hover:bg-phc-blue-dark transition-colors cursor-pointer">
              Primary
            </button>
            <button className="px-4 py-2 text-[13px] font-display font-semibold rounded-lg bg-phc-green text-white hover:bg-phc-green-dark transition-colors cursor-pointer">
              Health Green
            </button>
            <button className="px-4 py-2 text-[13px] font-display font-semibold rounded-lg border border-phc-border text-phc-text bg-phc-surface hover:bg-phc-bg transition-colors cursor-pointer">
              Secondary
            </button>
            <button className="px-4 py-2 text-[13px] font-display font-semibold rounded-lg border border-phc-blue text-phc-blue hover:bg-phc-blue-light transition-colors cursor-pointer">
              Outline
            </button>
            <button className="px-4 py-2 text-[13px] font-display font-semibold rounded-lg text-phc-muted hover:bg-phc-bg hover:text-phc-text transition-colors cursor-pointer">
              Ghost
            </button>
            <button className="px-4 py-2 text-[13px] font-display font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer">
              Danger
            </button>
            <button
              className="px-4 py-2 text-[13px] font-display font-semibold rounded-lg bg-phc-blue text-white opacity-50 cursor-not-allowed"
              disabled
            >
              Disabled
            </button>
          </DemoBox>
        </SubSection>

        {/* With icons */}
        <SubSection title="With icons and loading state">
          <DemoBox className="flex flex-wrap items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-[13px] font-display font-semibold rounded-lg bg-phc-blue text-white hover:bg-phc-blue-dark transition-colors cursor-pointer">
              <Plus size={14} />
              New Referral
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-[13px] font-display font-semibold rounded-lg border border-phc-border text-phc-text hover:bg-phc-bg transition-colors cursor-pointer">
              <Download size={14} />
              Export Report
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-[13px] font-display font-semibold rounded-lg border border-phc-border text-phc-text hover:bg-phc-bg transition-colors cursor-pointer">
              View Patient
              <ArrowUpRight size={14} />
            </button>
            <button
              onClick={triggerLoad}
              className="flex items-center gap-2 px-4 py-2 text-[13px] font-display font-semibold rounded-lg bg-phc-green text-white hover:bg-phc-green-dark transition-colors cursor-pointer"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              {loading ? "Saving…" : "Save & Close"}
            </button>
          </DemoBox>
        </SubSection>
      </div>
    </Section>
  );
}

// ─── Form Inputs ──────────────────────────────────────────────────────────────

function InputsSection() {
  const [showPwd, setShowPwd] = useState(false);
  const [checked, setChecked] = useState(true);
  const [radio, setRadio] = useState("male");

  const inputCls = "w-full px-3 py-2 text-[13px] font-sans border border-phc-border rounded-lg bg-phc-surface text-phc-text placeholder-phc-subtle focus:outline-none focus:ring-2 focus:ring-phc-blue/30 focus:border-phc-blue transition-colors";
  const labelCls = "block text-[12px] font-display font-semibold text-phc-muted uppercase tracking-wide mb-1.5";

  return (
    <Section id="inputs" title="Form Inputs" sub="All form controls share border-radius, font, and focus-ring treatment for visual consistency">
      <div className="grid grid-cols-2 gap-5">
        {/* Text inputs */}
        <div className="bg-phc-surface border border-phc-border rounded-lg p-5 space-y-4">
          <div>
            <label className={labelCls}>Patient Name</label>
            <input className={inputCls} placeholder="e.g. Kamala Devi R." defaultValue="" />
          </div>
          <div>
            <label className={labelCls}>Search patients</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-phc-subtle pointer-events-none" />
              <input className={`${inputCls} pl-8`} placeholder="Name, ID, or token…" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Password</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                className={`${inputCls} pr-9`}
                defaultValue="NHM2024secure"
              />
              <button
                onClick={() => setShowPwd((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-phc-subtle hover:text-phc-muted cursor-pointer"
              >
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelCls}>Diagnosis (Error state)</label>
            <input className={`${inputCls} border-red-400 focus:border-red-500 focus:ring-red-200`} defaultValue="Felver" />
            <p className="text-[11.5px] text-red-600 mt-1 flex items-center gap-1">
              <XCircle size={11} /> Check spelling — "Felver" may be incorrect
            </p>
          </div>
        </div>

        {/* Select, textarea, checkboxes, radios */}
        <div className="bg-phc-surface border border-phc-border rounded-lg p-5 space-y-4">
          <div>
            <label className={labelCls}>Referral Priority</label>
            <div className="relative">
              <select className={`${inputCls} appearance-none pr-8`}>
                <option>Normal</option>
                <option>Urgent</option>
                <option>Emergency</option>
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-phc-subtle pointer-events-none" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Clinical Notes</label>
            <textarea
              className={`${inputCls} min-h-[80px] resize-y`}
              placeholder="Chief complaint, vitals, observations…"
            />
          </div>
          <div>
            <span className={labelCls}>Sex</span>
            <div className="flex gap-4 mt-0.5">
              {["Male", "Female", "Other"].map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sex"
                    value={opt.toLowerCase()}
                    checked={radio === opt.toLowerCase()}
                    onChange={() => setRadio(opt.toLowerCase())}
                    className="accent-phc-blue"
                  />
                  <span className="text-[13px] font-sans text-phc-text">{opt}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <span className={labelCls}>Options</span>
            <div className="space-y-2 mt-0.5">
              {["Referred by ASHA", "ANC Visit", "Under TB treatment (DOT)"].map((opt, i) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={i === 0 ? checked : i === 2}
                    onChange={i === 0 ? () => setChecked((s) => !s) : undefined}
                    readOnly={i !== 0}
                    className="accent-phc-blue w-3.5 h-3.5"
                  />
                  <span className="text-[13px] font-sans text-phc-text">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

// ─── Cards ────────────────────────────────────────────────────────────────────

function CardsSection() {
  return (
    <Section id="cards" title="Cards" sub="Surface containers: basic card, stat card, patient summary, data metric">
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Basic card */}
        <div className="bg-phc-surface border border-phc-border rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-phc-border">
            <span className="font-display font-semibold text-phc-text text-[14px]">Patient Summary</span>
          </div>
          <div className="px-5 py-4 space-y-2.5">
            {[
              ["Name", "Kamala Devi R."],
              ["Age / Sex", "45 years · Female"],
              ["Token", "#001"],
              ["ASHA Ref.", "Meena Kumari"],
              ["Arrived", "08:42 AM"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <span className="text-[12px] text-phc-muted font-display font-medium">{k}</span>
                <span className="text-[12.5px] text-phc-text font-sans text-right">{v}</span>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 bg-phc-bg border-t border-phc-border">
            <button className="text-[12px] text-phc-blue font-display font-medium hover:underline cursor-pointer">
              View full record →
            </button>
          </div>
        </div>

        {/* Stat card */}
        <div className="bg-phc-surface border border-phc-border rounded-lg p-5 flex flex-col">
          <div className="w-10 h-10 rounded-lg bg-phc-blue-light flex items-center justify-center mb-4">
            <UserCheck size={20} className="text-phc-blue" />
          </div>
          <div className="font-display font-bold text-phc-text text-4xl leading-none mb-1">127</div>
          <div className="text-[12.5px] text-phc-muted mb-3">Households covered</div>
          <div className="mt-auto text-[11.5px] text-phc-green font-sans">
            ↑ 8 new this month
          </div>
          <div className="text-[11px] text-phc-subtle font-sans mt-0.5">ASHA: Meena Kumari · Ward 3</div>
        </div>

        {/* Alert card */}
        <div className="flex flex-col gap-3">
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={15} className="text-red-600" />
            </div>
            <div>
              <div className="font-display font-semibold text-red-800 text-[13px]">Low Stock Alert</div>
              <div className="text-[12px] text-red-700 mt-0.5">Paracetamol 500mg — 45 strips remaining. Reorder level: 100.</div>
            </div>
          </div>
          <div className="bg-phc-blue-light border border-blue-200 rounded-lg px-4 py-3 flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Info size={15} className="text-phc-blue" />
            </div>
            <div>
              <div className="font-display font-semibold text-phc-blue text-[13px]">Sync Complete</div>
              <div className="text-[12px] text-blue-700 mt-0.5">3 new ASHA referrals synced from the NHM dashboard at 10:30 AM.</div>
            </div>
          </div>
          <div className="bg-phc-green-light border border-green-200 rounded-lg px-4 py-3 flex gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={15} className="text-phc-green" />
            </div>
            <div>
              <div className="font-display font-semibold text-phc-green text-[13px]">Referral Acknowledged</div>
              <div className="text-[12px] text-green-800 mt-0.5">AIIMS Patna accepted REF-2024-089 at 10:22 AM.</div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

// ─── Tables ───────────────────────────────────────────────────────────────────

const TABLE_ROWS = [
  { id: "P-0891", name: "Arvind Kumar", age: "34M", condition: "Pulmonary TB (suspected)", asha: "Sunita D.", visit: "30 Aug 2024", status: "referred" },
  { id: "P-0892", name: "Kamla Devi", age: "45F", condition: "Viral fever", asha: "Meena K.", visit: "01 Sep 2024", status: "treating" },
  { id: "P-0893", name: "Mohan Singh", age: "62M", condition: "Type 2 diabetes monitoring", asha: undefined, visit: "01 Sep 2024", status: "waiting" },
  { id: "P-0894", name: "Ananya Singh", age: "28F", condition: "ANC — 28 weeks gestation", asha: "Sunita D.", visit: "01 Sep 2024", status: "waiting" },
  { id: "P-0895", name: "Subhash Tiwari", age: "55M", condition: "TB — DOT follow-up (Day 42)", asha: undefined, visit: "01 Sep 2024", status: "done" },
];

const ROW_STATUS_META: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  waiting: { label: "Waiting", bg: "bg-amber-50", text: "text-amber-800", icon: <Clock size={10} /> },
  treating: { label: "In Treatment", bg: "bg-blue-50", text: "text-blue-800", icon: <Loader2 size={10} className="animate-spin" /> },
  done: { label: "Done", bg: "bg-gray-100", text: "text-gray-700", icon: <CheckCircle2 size={10} /> },
  referred: { label: "Referred", bg: "bg-violet-50", text: "text-violet-800", icon: <CornerUpRight size={10} /> },
};

function TablesSection() {
  return (
    <Section id="tables" title="Data Tables" sub="Used for queues, referrals, inventories, and reports. Compact headers, alternating rows, inline status badges">
      <div className="bg-phc-surface border border-phc-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-phc-border">
          <div>
            <span className="font-display font-semibold text-phc-text text-[14px]">Patient Register — Today</span>
            <span className="ml-3 text-[11px] text-phc-muted">5 records shown</span>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-phc-subtle pointer-events-none" />
              <input placeholder="Search…" className="pl-7 pr-3 py-1.5 text-[12px] border border-phc-border rounded-lg focus:outline-none focus:ring-1 focus:ring-phc-blue/30 focus:border-phc-blue" />
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-display font-medium border border-phc-border rounded-lg text-phc-text hover:bg-phc-bg transition-colors cursor-pointer">
              <Download size={12} />
              Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-phc-bg border-b border-phc-border">
                {["Patient ID", "Name", "Age/Sex", "Condition", "ASHA Referral", "Last Visit", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-display font-semibold text-phc-muted uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TABLE_ROWS.map((row, i) => {
                const sm = ROW_STATUS_META[row.status];
                return (
                  <tr key={row.id} className={`border-b border-phc-border-light hover:bg-phc-blue-light/20 transition-colors ${i % 2 === 1 ? "bg-phc-bg/50" : ""}`}>
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-[11.5px] text-phc-blue">{row.id}</span>
                    </td>
                    <td className="px-4 py-2.5 font-display font-medium text-phc-text text-[13px] whitespace-nowrap">{row.name}</td>
                    <td className="px-4 py-2.5 text-[12.5px] text-phc-muted">{row.age}</td>
                    <td className="px-4 py-2.5 text-[12.5px] text-phc-text max-w-[200px] truncate" title={row.condition}>{row.condition}</td>
                    <td className="px-4 py-2.5 text-[12.5px]">
                      {row.asha ? (
                        <span className="flex items-center gap-1 text-phc-green">
                          <UserCheck size={11} />
                          {row.asha}
                        </span>
                      ) : (
                        <span className="text-phc-subtle">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-phc-muted whitespace-nowrap">{row.visit}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-display font-semibold ${sm.bg} ${sm.text}`}>
                        {sm.icon}
                        {sm.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-3">
                        <button className="text-[12px] text-phc-blue hover:underline font-display cursor-pointer">View</button>
                        <button className="text-[12px] text-phc-muted hover:text-phc-text hover:underline font-display cursor-pointer">Edit</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-phc-border bg-phc-bg text-[11.5px] text-phc-muted">
          <span>Showing 1–5 of 87 patients</span>
          <div className="flex gap-2">
            <button className="px-2.5 py-1 rounded border border-phc-border text-phc-muted hover:bg-phc-surface cursor-pointer transition-colors" disabled>
              Prev
            </button>
            <button className="px-2.5 py-1 rounded bg-phc-blue text-white font-display font-medium cursor-pointer">1</button>
            <button className="px-2.5 py-1 rounded border border-phc-border text-phc-muted hover:bg-phc-surface cursor-pointer transition-colors">2</button>
            <button className="px-2.5 py-1 rounded border border-phc-border text-phc-muted hover:bg-phc-surface cursor-pointer transition-colors">3</button>
            <button className="px-2.5 py-1 rounded border border-phc-border text-phc-muted hover:bg-phc-surface cursor-pointer transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </Section>
  );
}

// ─── Status Badges ────────────────────────────────────────────────────────────

const ALL_BADGES = [
  { label: "Waiting", bg: "bg-amber-50", text: "text-amber-800", icon: <Clock size={11} />, use: "Patient in queue, not yet seen" },
  { label: "In Treatment", bg: "bg-blue-50", text: "text-blue-800", icon: <Loader2 size={11} className="animate-spin" />, use: "Currently with clinician" },
  { label: "Done", bg: "bg-gray-100", text: "text-gray-700", icon: <CheckCircle2 size={11} />, use: "Consultation complete" },
  { label: "Referred", bg: "bg-violet-50", text: "text-violet-800", icon: <CornerUpRight size={11} />, use: "Sent to CHC / hospital" },
  { label: "Critical", bg: "bg-red-100", text: "text-red-700", icon: <AlertTriangle size={11} />, use: "Requires immediate attention" },
  { label: "Stable", bg: "bg-green-50", text: "text-green-800", icon: <CheckCircle2 size={11} />, use: "Condition stable, monitoring" },
  { label: "SOS", bg: "bg-red-600", text: "text-white", icon: <AlertTriangle size={11} />, use: "Emergency SOS alert" },
  { label: "Synced", bg: "bg-phc-green-light", text: "text-phc-green", icon: <CheckCircle2 size={11} />, use: "ASHA data synced from app" },
  { label: "Pending", bg: "bg-amber-100", text: "text-amber-900", icon: <Clock size={11} />, use: "Awaiting action / approval" },
  { label: "Urgent", bg: "bg-orange-100", text: "text-orange-800", icon: <AlertTriangle size={11} />, use: "Referral priority: urgent" },
  { label: "Emergency", bg: "bg-red-100", text: "text-red-800", icon: <AlertTriangle size={11} />, use: "Referral priority: emergency" },
  { label: "In Stock", bg: "bg-green-50", text: "text-green-800", icon: <CheckCircle2 size={11} />, use: "Inventory level adequate" },
  { label: "Low Stock", bg: "bg-amber-50", text: "text-amber-800", icon: <AlertTriangle size={11} />, use: "Below reorder threshold" },
  { label: "Out of Stock", bg: "bg-red-50", text: "text-red-700", icon: <XCircle size={11} />, use: "Inventory exhausted" },
];

function BadgesSection() {
  return (
    <Section id="badges" title="Status Badges" sub="Compact pill with icon + label. Used inline in tables, cards, and lists">
      <div className="bg-phc-surface border border-phc-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-phc-bg border-b border-phc-border">
              {["Badge", "Use case"].map((h) => (
                <th key={h} className="px-5 py-2.5 text-left text-[11px] font-display font-semibold text-phc-muted uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_BADGES.map((b, i) => (
              <tr key={b.label} className={`border-b border-phc-border-light ${i % 2 === 1 ? "bg-phc-bg/40" : ""}`}>
                <td className="px-5 py-2.5">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11.5px] font-display font-semibold ${b.bg} ${b.text}`}>
                    {b.icon}
                    {b.label}
                  </span>
                </td>
                <td className="px-5 py-2.5 text-[12.5px] text-phc-muted">{b.use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

// ─── Alerts & Banners ─────────────────────────────────────────────────────────

const ALERTS = [
  {
    type: "error",
    icon: <XCircle size={17} className="text-red-600 flex-shrink-0" />,
    title: "SOS Alert — Immediate Action Required",
    body: "Patient Saurabh Verma (Token #007) presented with acute chest pain. Vitals: BP 158/102, Pulse 108, SpO₂ 92%. Refer to higher centre immediately.",
    action: "Open Case",
    bg: "bg-red-50",
    border: "border-red-300",
    titleCls: "text-red-800",
    bodyCls: "text-red-700",
    actionCls: "bg-red-600 text-white hover:bg-red-700",
  },
  {
    type: "warning",
    icon: <AlertTriangle size={17} className="text-amber-600 flex-shrink-0" />,
    title: "Low Medication Stock",
    body: "Paracetamol 500mg has 45 strips remaining (reorder level: 100). ORS packets: 23 units. Place indent order through PHC store requisition.",
    action: "View Inventory",
    bg: "bg-amber-50",
    border: "border-amber-300",
    titleCls: "text-amber-900",
    bodyCls: "text-amber-800",
    actionCls: "bg-amber-600 text-white hover:bg-amber-700",
  },
  {
    type: "info",
    icon: <Info size={17} className="text-phc-blue flex-shrink-0" />,
    title: "3 New ASHA Referrals Synced",
    body: "NHM sync completed at 10:30 AM. Referrals from Meena Kumari (Ward 3), Sunita Devi (Ward 1), and Anita Yadav (Ward 2) are ready for review.",
    action: "View Referrals",
    bg: "bg-phc-blue-light",
    border: "border-blue-200",
    titleCls: "text-phc-blue-dark",
    bodyCls: "text-blue-700",
    actionCls: "bg-phc-blue text-white hover:bg-phc-blue-dark",
  },
  {
    type: "success",
    icon: <CheckCircle2 size={17} className="text-phc-green flex-shrink-0" />,
    title: "Referral Acknowledged",
    body: "AIIMS Patna has acknowledged referral REF-2024-089 for patient Saurabh Verma. Transfer confirmed. Patient's family has been notified.",
    action: "View Record",
    bg: "bg-phc-green-light",
    border: "border-green-200",
    titleCls: "text-phc-green-dark",
    bodyCls: "text-green-800",
    actionCls: "bg-phc-green text-white hover:bg-phc-green-dark",
  },
];

function AlertsSection() {
  const [dismissed, setDismissed] = useState<string[]>([]);
  return (
    <Section id="alerts" title="Alerts & Banners" sub="Four severity levels: error (SOS), warning, info, success. Dismissible with action button">
      <div className="space-y-3">
        {ALERTS.filter((a) => !dismissed.includes(a.type)).map((a) => (
          <div key={a.type} className={`flex gap-3 px-4 py-4 rounded-lg border ${a.bg} ${a.border}`}>
            <div className="mt-0.5">{a.icon}</div>
            <div className="flex-1 min-w-0">
              <div className={`font-display font-semibold text-[13.5px] leading-none mb-1 ${a.titleCls}`}>
                {a.title}
              </div>
              <div className={`text-[12.5px] leading-snug ${a.bodyCls}`}>{a.body}</div>
            </div>
            <div className="flex items-start gap-2 flex-shrink-0">
              <button className={`px-3 py-1.5 rounded text-[12px] font-display font-semibold transition-colors cursor-pointer ${a.actionCls}`}>
                {a.action}
              </button>
              <button
                onClick={() => setDismissed((d) => [...d, a.type])}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
        {dismissed.length > 0 && (
          <button
            onClick={() => setDismissed([])}
            className="text-[12px] text-phc-blue hover:underline cursor-pointer"
          >
            Restore {dismissed.length} dismissed alert{dismissed.length > 1 ? "s" : ""}
          </button>
        )}
      </div>
    </Section>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function ModalSection() {
  const [open, setOpen] = useState(false);
  return (
    <Section id="modals" title="Modals" sub="Overlay dialogs for confirmations, forms, and detail views. Always include a clear close action">
      <DemoBox>
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 text-[13px] font-display font-semibold rounded-lg bg-phc-blue text-white hover:bg-phc-blue-dark transition-colors cursor-pointer"
        >
          Open Referral Modal
        </button>
        <span className="ml-3 text-[12.5px] text-phc-muted">↑ Click to preview modal overlay</span>
      </DemoBox>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-phc-surface rounded-xl border border-phc-border shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-phc-border">
              <div>
                <h3 className="font-display font-bold text-phc-text text-[16px]">
                  Create Referral
                </h3>
                <p className="text-[11.5px] text-phc-muted mt-0.5">Patna Rural PHC → CHC / Hospital</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded hover:bg-phc-bg text-phc-muted hover:text-phc-text transition-colors cursor-pointer">
                <X size={16} />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-[11.5px] font-display font-semibold text-phc-muted uppercase tracking-wide mb-1.5">Patient</label>
                <div className="px-3 py-2 border border-phc-border rounded-lg bg-phc-bg text-[13px] text-phc-text font-display font-medium">
                  Saurabh Verma · 42M · Token #007
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-display font-semibold text-phc-muted uppercase tracking-wide mb-1.5">Referred To</label>
                  <div className="relative">
                    <select className="w-full px-3 py-2 text-[13px] border border-phc-border rounded-lg bg-phc-surface appearance-none pr-7">
                      <option>AIIMS Patna</option>
                      <option>PMCH Patna</option>
                      <option>DOTS Centre</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-phc-subtle pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11.5px] font-display font-semibold text-phc-muted uppercase tracking-wide mb-1.5">Priority</label>
                  <div className="relative">
                    <select className="w-full px-3 py-2 text-[13px] border border-red-400 rounded-lg bg-phc-surface appearance-none pr-7 text-red-700">
                      <option>Emergency</option>
                      <option>Urgent</option>
                      <option>Normal</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-phc-subtle pointer-events-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[11.5px] font-display font-semibold text-phc-muted uppercase tracking-wide mb-1.5">Reason for Referral</label>
                <textarea
                  defaultValue="Acute chest pain with left-arm radiation. ECG: ST elevation V2–V5. BP 158/102. Suspected STEMI. Immediate cardiology evaluation required."
                  className="w-full px-3 py-2 text-[13px] border border-phc-border rounded-lg bg-phc-surface resize-none h-20 font-sans text-phc-text"
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-phc-border bg-phc-bg">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-[13px] font-display font-medium border border-phc-border rounded-lg text-phc-muted hover:bg-phc-surface transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-5 py-2 text-[13px] font-display font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
              >
                <CornerUpRight size={14} />
                Send Referral
              </button>
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}

// ─── Navigation ───────────────────────────────────────────────────────────────

function NavigationSection() {
  const [activeTab, setActiveTab] = useState("overview");
  const tabs = ["Overview", "History", "Medications", "Lab Results", "Notes"];

  return (
    <Section id="navigation" title="Navigation" sub="Tab bars for within-page context switching. Sidebar pattern shown in the application shell">
      <SubSection title="Tabs">
        <div className="bg-phc-surface border border-phc-border rounded-lg overflow-hidden">
          <div className="flex border-b border-phc-border bg-phc-bg px-1 pt-1">
            {tabs.map((tab) => {
              const id = tab.toLowerCase().replace(" ", "-");
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(id)}
                  className={`px-4 py-2.5 text-[13px] font-display font-medium rounded-t-lg mr-0.5 transition-colors cursor-pointer border-b-2 ${
                    activeTab === id
                      ? "bg-phc-surface border-phc-blue text-phc-blue"
                      : "border-transparent text-phc-muted hover:text-phc-text hover:bg-phc-surface/60"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
          <div className="px-5 py-4 text-[13px] text-phc-muted">
            {activeTab === "overview" && "Patient overview: demographics, chief complaint, current status, assigned ASHA worker, last visit summary."}
            {activeTab === "history" && "Complete visit history with dates, diagnoses, and treatment outcomes."}
            {activeTab === "medications" && "Active prescriptions, dosage, frequency, and dispensing records."}
            {activeTab === "lab-results" && "Pending and completed laboratory tests — blood count, urine, sputum, etc."}
            {activeTab === "notes" && "Clinical notes and observations from consulting doctor and nursing staff."}
          </div>
        </div>
      </SubSection>

      <SubSection title="Breadcrumb">
        <DemoBox>
          <nav className="flex items-center gap-1.5 text-[12.5px]">
            {["Dashboard", "Patients", "P-0892", "Referral"].map((crumb, i, arr) => (
              <span key={crumb} className="flex items-center gap-1.5">
                <span className={i === arr.length - 1 ? "font-display font-semibold text-phc-text" : "text-phc-blue hover:underline cursor-pointer"}>
                  {crumb}
                </span>
                {i < arr.length - 1 && <span className="text-phc-subtle">/</span>}
              </span>
            ))}
          </nav>
        </DemoBox>
      </SubSection>
    </Section>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

const TOC = [
  { id: "typography", label: "Typography" },
  { id: "colours", label: "Colours" },
  { id: "buttons", label: "Buttons" },
  { id: "inputs", label: "Inputs" },
  { id: "cards", label: "Cards" },
  { id: "tables", label: "Tables" },
  { id: "badges", label: "Badges" },
  { id: "alerts", label: "Alerts" },
  { id: "modals", label: "Modals" },
  { id: "navigation", label: "Navigation" },
];

export default function DesignSystem() {
  return (
    <div className="flex">
      {/* TOC sidebar */}
      <aside className="w-48 flex-shrink-0 py-6 px-4 sticky top-0 h-screen overflow-y-auto border-r border-phc-border bg-phc-surface/70">
        <div className="text-[10px] font-display font-bold text-phc-muted uppercase tracking-widest mb-3">
          On this page
        </div>
        <nav className="flex flex-col gap-0.5">
          {TOC.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className="text-[12.5px] text-phc-muted hover:text-phc-blue font-display font-medium px-2 py-1.5 rounded hover:bg-phc-blue-light transition-colors"
            >
              {t.label}
            </a>
          ))}
        </nav>
        <div className="mt-8 pt-4 border-t border-phc-border">
          <div className="text-[10px] font-mono text-phc-subtle">SeVaSetu v2.4.1</div>
          <div className="text-[10px] text-phc-subtle mt-0.5">Design System</div>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0 px-8 py-6">
        {/* Page header */}
        <div className="mb-8 pb-5 border-b border-phc-border">
          <h1 className="font-display font-bold text-phc-text text-2xl leading-none">
            Design System
          </h1>
          <p className="text-phc-muted text-[13.5px] mt-2 max-w-2xl leading-relaxed">
            Component library and visual language for the SeVaSetu PHC Management Portal.
            Institutional clarity, accessible colour ratios, readable typography across all breakpoints.
          </p>
          <div className="flex gap-3 mt-4">
            {["Work Sans", "Source Sans 3", "JetBrains Mono", "Noto Sans Tamil"].map((f) => (
              <span key={f} className="text-[11.5px] font-mono text-phc-blue bg-phc-blue-light px-2 py-0.5 rounded border border-blue-200">
                {f}
              </span>
            ))}
          </div>
        </div>

        <TypographySection />
        <ColourSection />
        <ButtonsSection />
        <InputsSection />
        <CardsSection />
        <TablesSection />
        <BadgesSection />
        <AlertsSection />
        <ModalSection />
        <NavigationSection />
      </div>
    </div>
  );
}
