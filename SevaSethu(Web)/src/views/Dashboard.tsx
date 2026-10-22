import { useEffect, useState } from "react";
import {
  Users,
  Clock,
  ArrowRightLeft,
  Package,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  UserCheck,
  AlertTriangle,
  Circle,
  CheckCircle2,
  Loader2,
  CornerUpRight,
  Calendar,
  Plus,
  Radio,
  MapPin,
  ShieldCheck,
  Siren,
  Battery,
  Building2,
  Stethoscope,
  FileBadge,
  Check,
  XCircle,
  Activity,
  Sparkles,
  Award,
  Thermometer,
  HeartPulse,
} from "lucide-react";
import { ViewType } from "../types";
import LiveMap from "../components/LiveMap";
import { useAuth } from "../auth/AuthContext";
import {
  TriageCaseDoc,
  FrontlineWorkerDoc,
  SOSAlertDoc,
  subscribeTriageCases,
  subscribeFrontlineWorkers,
  subscribeSOSAlerts,
  isWorkerStale,
} from "../services/firebase";

interface DashboardProps {
  onNavigate: (view: ViewType) => void;
}

function StatusBadge({ status, riskBand }: { status: string; riskBand?: string }) {
  if (riskBand === "RED") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-display font-bold bg-red-100 text-red-700 border border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        Emergency (RED)
      </span>
    );
  }
  if (riskBand === "YELLOW") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-display font-bold bg-amber-100 text-amber-800 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Urgent (YELLOW)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-display font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      Routine (GREEN)
    </span>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  subColor,
  accent,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  subColor?: string;
  accent?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-phc-surface border border-phc-border rounded-xl p-5 flex flex-col gap-3 shadow-xs transition-all ${
        onClick ? "cursor-pointer hover:border-phc-blue/50 hover:shadow-sm" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            accent || "bg-phc-blue-light"
          }`}
        >
          {icon}
        </div>
      </div>
      <div>
        <div className="font-display font-bold text-phc-text text-3xl leading-none">
          {value}
        </div>
        <div className="text-[12.5px] text-phc-muted font-sans mt-1 font-semibold">{label}</div>
      </div>
      <div className={`text-[11.5px] font-sans ${subColor || "text-phc-subtle"}`}>{sub}</div>
    </div>
  );
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { user, doctors, doctorRegistrationRequests, approveDoctorRegistration } = useAuth();
  const [cases, setCases] = useState<TriageCaseDoc[]>([]);
  const [workers, setWorkers] = useState<FrontlineWorkerDoc[]>([]);
  const [sosAlerts, setSosAlerts] = useState<SOSAlertDoc[]>([]);
  const [approvedNotification, setApprovedNotification] = useState<string | null>(null);

  useEffect(() => {
    const unsubCases = subscribeTriageCases((updated) => setCases(updated));
    const unsubWorkers = subscribeFrontlineWorkers((updated) => setWorkers(updated));
    const unsubSos = subscribeSOSAlerts((updated) => setSosAlerts(updated));

    return () => {
      unsubCases();
      unsubWorkers();
      unsubSos();
    };
  }, []);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const criticalCases = cases.filter((c) => (c.priorityScore !== undefined && c.priorityScore !== null ? c.priorityScore > 80 : c.riskBand === "RED"));
  const activeSos = sosAlerts.filter((s) => s.status === "ACTIVE_DISPATCH" || s.status === "active");
  const activeWorkers = workers.filter((w) => !isWorkerStale(w.lastUpdated) && w.networkState !== "OFFLINE");
  const pendingRequests = doctorRegistrationRequests.filter((r) => r.status === "Pending");

  const isAdmin = user?.role === "ADMIN";

  const handleQuickApprove = (id: string, name: string) => {
    approveDoctorRegistration(id);
    setApprovedNotification(`Approved credentials for ${name}. Doctor account is now active.`);
    setTimeout(() => setApprovedNotification(null), 4000);
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // 1. ADMIN DASHBOARD VIEW (Governance, ASHA Workforce, Doctors & Inventory)
  // ══════════════════════════════════════════════════════════════════════════════
  if (isAdmin) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        {approvedNotification && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-emerald-800 text-xs font-semibold animate-fade-in shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>{approvedNotification}</span>
            </div>
            <button onClick={() => setApprovedNotification(null)} className="text-emerald-600 hover:text-emerald-800 cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Admin Page Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 bg-[#0A2540] text-amber-300 text-[10.5px] font-mono font-bold rounded">
                PHC ADMIN CONSOLE
              </span>
              <span className="text-xs text-slate-500 font-sans">
                Authority: <strong>{user?.name || "Shri Rajesh Verma"}</strong> (Administrative Officer)
              </span>
            </div>
            <h1 className="font-display font-bold text-phc-text text-2xl leading-tight mt-1">
              PHC Administrative &amp; Facility Command
            </h1>
            <p className="text-phc-muted text-[13px] mt-1 font-sans">
              {today} &nbsp;·&nbsp; Danapur Block Administration &nbsp;·&nbsp; National Health Mission Operations
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onNavigate("admin-doctors")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-phc-blue text-white text-[12.5px] font-display font-semibold hover:bg-phc-blue-dark transition-colors cursor-pointer shadow-xs"
            >
              <Plus size={14} />
              Register Doctor / Staff
            </button>
            <button
              onClick={() => onNavigate("asha")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 text-white text-[12.5px] font-display font-semibold hover:bg-emerald-800 transition-colors cursor-pointer shadow-xs"
            >
              <UserCheck size={14} />
              Manage ASHA Cadre
            </button>
            <button
              onClick={() => onNavigate("inventory")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 text-white text-[12.5px] font-display font-semibold hover:bg-amber-700 transition-colors cursor-pointer shadow-xs"
            >
              <Package size={14} />
              e-Aushadhi / Drug Stock
            </button>
          </div>
        </div>

        {/* Admin KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Radio size={20} className="text-emerald-600 animate-pulse" />}
            label="ASHA Field Workforce"
            value={`${activeWorkers.length} / ${workers.length || 1}`}
            sub="Live GPS telemetry broadcast active"
            subColor="text-emerald-700 font-semibold"
            accent="bg-emerald-50"
            onClick={() => onNavigate("asha")}
          />
          <StatCard
            icon={<Users size={20} className="text-phc-blue" />}
            label="Medical Staff & Doctors"
            value={`${doctors.length} Doctors`}
            sub={pendingRequests.length > 0 ? `${pendingRequests.length} Pending credential approvals` : "All doctor credentials verified"}
            subColor={pendingRequests.length > 0 ? "text-amber-700 font-bold" : "text-phc-green"}
            accent="bg-phc-blue-light"
            onClick={() => onNavigate("admin-doctors")}
          />
          <StatCard
            icon={<Package size={20} className="text-amber-600" />}
            label="Essential Medicine & Vaccines"
            value="3 Low · 2 Stockout"
            sub="e-Aushadhi buffer reorder alerts"
            subColor="text-amber-700"
            accent="bg-amber-50"
            onClick={() => onNavigate("inventory")}
          />
          <StatCard
            icon={<Award size={20} className="text-[#0A2540]" />}
            label="Facility Footfall & ABDM Sync"
            value="1,482 Patients"
            sub="98.4% ABHA Verified · Danapur PHC"
            subColor="text-slate-600 font-medium"
            accent="bg-slate-100"
            onClick={() => onNavigate("reports")}
          />
        </div>

        {/* Feature: Live GPS Field Map Section for Admin */}
        <div className="bg-phc-surface border border-phc-border rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio size={16} className="text-emerald-600 animate-pulse" />
              <h2 className="font-display font-bold text-phc-text text-[15px]">
                ASHA Frontline Deployment &amp; Live Telemetry Map
              </h2>
            </div>
            <button
              onClick={() => onNavigate("asha")}
              className="flex items-center gap-1 text-[12px] text-phc-blue font-display font-semibold hover:underline"
            >
              Inspect all workers <ChevronRight size={13} />
            </button>
          </div>

          <LiveMap height="360px" showSosAlerts={true} />
        </div>

        {/* Main Admin Grid: Supply Chain & Governance */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* Left Column: Essential Drug & Vaccine Health Monitor */}
          <div className="bg-phc-surface border border-phc-border rounded-2xl overflow-hidden shadow-xs">
            <div className="flex items-center justify-between px-5 py-4 border-b border-phc-border">
              <div>
                <h2 className="font-display font-semibold text-phc-text text-[15px] flex items-center gap-2">
                  <Package size={17} className="text-amber-600" />
                  Facility Essential Drug &amp; Vaccine Stock Monitor (e-Aushadhi)
                </h2>
                <p className="text-[11.5px] text-slate-500 font-sans mt-0.5">
                  Critical buffer thresholds and stockout alerts for Primary Health Centre Danapur
                </p>
              </div>
              <button
                onClick={() => onNavigate("inventory")}
                className="flex items-center gap-1 text-[12px] text-phc-blue font-display font-semibold hover:underline cursor-pointer"
              >
                Full Inventory <ChevronRight size={13} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="bg-phc-bg border-b border-phc-border">
                    {["Item Name", "Category", "Stock on Hand", "Reorder Level", "Status", "Action"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left font-display font-semibold text-phc-muted text-[11px] uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: "MED-001", name: "Paracetamol 500mg Tab", category: "Analgesic", stock: "45 Strips", reorder: "100 Strips", status: "Low Stock", badge: "bg-amber-100 text-amber-800" },
                    { id: "SUP-002", name: "Disposable Gloves (M)", category: "PPE", stock: "0 Pairs", reorder: "50 Pairs", status: "Out of Stock", badge: "bg-red-100 text-red-800" },
                    { id: "VAC-001", name: "BCG Vaccine (10 dose vial)", category: "Vaccine", stock: "6 Vials", reorder: "10 Vials", status: "Low Stock", badge: "bg-amber-100 text-amber-800" },
                    { id: "MED-007", name: "Cotrimoxazole 480mg Tab", category: "Antibiotic", stock: "8 Strips", reorder: "40 Strips", status: "Critical", badge: "bg-red-100 text-red-700" },
                    { id: "MED-005", name: "ORS Sachets", category: "Rehydration", stock: "23 Packets", reorder: "50 Packets", status: "Low Stock", badge: "bg-amber-100 text-amber-800" },
                    { id: "DIA-001", name: "Glucometer Strips", category: "Diagnostics", stock: "0 Strips", reorder: "100 Strips", status: "Out of Stock", badge: "bg-red-100 text-red-800" },
                    { id: "MED-002", name: "Amoxicillin 500mg Cap", category: "Antibiotic", stock: "180 Strips", reorder: "80 Strips", status: "Adequate", badge: "bg-emerald-100 text-emerald-800" },
                  ].map((item) => (
                    <tr key={item.id} className="border-b border-phc-border-light hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-display font-semibold text-phc-text whitespace-nowrap">
                        {item.name}
                        <span className="block text-[10.5px] font-mono text-slate-400 font-normal">{item.id}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{item.category}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-800 whitespace-nowrap">{item.stock}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11.5px] whitespace-nowrap">{item.reorder}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${item.badge}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => onNavigate("inventory")}
                          className="text-[11.5px] text-phc-blue hover:underline font-display font-semibold cursor-pointer"
                        >
                          Reorder →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Doctor Credentials & Governance */}
          <div className="flex flex-col gap-5">
            {/* Doctor Credentials & Registration Approvals Widget */}
            <div className="bg-phc-surface border border-phc-border rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-phc-border pb-2.5">
                <div className="flex items-center gap-2">
                  <Stethoscope size={16} className="text-phc-blue" />
                  <h3 className="font-display font-bold text-phc-text text-[13.5px]">
                    Doctor Roster &amp; Licensing
                  </h3>
                </div>
                <button
                  onClick={() => onNavigate("admin-doctors")}
                  className="text-[11px] font-display font-bold text-phc-blue hover:underline"
                >
                  Manage ({doctors.length})
                </button>
              </div>

              {pendingRequests.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                    Pending Credential Approvals ({pendingRequests.length})
                  </div>
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3 rounded-xl border border-amber-200 bg-amber-50/70 space-y-2 shadow-2xs"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-display font-bold text-[13px] text-slate-900 leading-tight">
                            {req.name}
                          </div>
                          <div className="text-[11px] text-amber-900 font-medium">
                            {req.specialization} · {req.mobile}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{req.email}</div>
                        </div>
                        <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded text-[9.5px] font-bold">
                          Pending
                        </span>
                      </div>
                      <button
                        onClick={() => handleQuickApprove(req.id, req.name)}
                        className="w-full py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-display font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Check size={13} />
                        Approve &amp; Issue ID
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Active doctors list */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Doctors on Duty
                </div>
                {doctors.slice(0, 3).map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{d.name}</span>
                      <span className="block text-[10px] text-slate-400 font-mono">{d.specialization || "General Medicine"}</span>
                    </div>
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                      {d.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* National Health Mission Compliance Audit Widget */}
            <div className="bg-phc-surface border border-phc-border rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-phc-border pb-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-700" />
                  <h3 className="font-display font-bold text-phc-text text-[13.5px]">
                    NHM &amp; Facility Compliance
                  </h3>
                </div>
                <span className="text-[10.5px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                  98.6%
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { title: "Daily HMIS Facility Upload", value: "100% Complete", ok: true },
                  { title: "ASHA DBT Incentive Clearance", value: "18 / 20 Cleared", ok: true },
                  { title: "Cold Chain Storage Unit", value: "3.8°C (Optimal)", ok: true },
                  { title: "24x7 Emergency Ready", value: "Certified NHM Bihar", ok: true },
                ].map((item) => (
                  <div key={item.title} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                    <span className="text-slate-600">{item.title}</span>
                    <span className="font-semibold text-slate-900 flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-600" />
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 2. DOCTOR DASHBOARD VIEW (Clinical Command, Live Triage & OPD Queue)
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Doctor Page Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 bg-[#1B4F8A] text-white text-[10.5px] font-mono font-bold rounded">
              CLINICAL WORKSTATION
            </span>
            <span className="text-xs text-slate-500 font-sans">
              Medical Officer: <strong>{user?.name || "Dr. Aravind Kumar"}</strong> (MOIC)
            </span>
          </div>
          <h1 className="font-display font-bold text-phc-text text-2xl leading-tight mt-1">
            Medical Officer Clinical Command
          </h1>
          <p className="text-phc-muted text-[13px] mt-1 font-sans">
            {today} &nbsp;·&nbsp; Morning Shift (OPD) &nbsp;·&nbsp; Live Clinical Telemetry &amp; ASHA Triage
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigate("sos")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-[12.5px] font-display font-bold hover:bg-red-700 transition-colors cursor-pointer shadow-xs"
          >
            <AlertTriangle size={14} />
            SOS Console ({activeSos.length})
          </button>
          <button
            onClick={() => onNavigate("triage")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-phc-blue text-white text-[12.5px] font-display font-semibold hover:bg-phc-blue-dark transition-colors cursor-pointer shadow-xs"
          >
            <Plus size={14} />
            Triage Workspace
          </button>
          <button
            onClick={() => onNavigate("appointments")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 text-white text-[12.5px] font-display font-semibold hover:bg-emerald-800 transition-colors cursor-pointer shadow-xs"
          >
            <Calendar size={14} />
            Start OPD Queue
          </button>
        </div>
      </div>

      {/* Doctor KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users size={20} className="text-phc-blue" />}
          label="Triage Cases Today"
          value={cases.length}
          sub={`${cases.filter((c) => c.riskBand === "GREEN").length} Routine · ${cases.filter((c) => c.riskBand === "YELLOW").length} Urgent`}
          subColor="text-phc-green font-medium"
          accent="bg-phc-blue-light"
          onClick={() => onNavigate("triage")}
        />
        <StatCard
          icon={<AlertTriangle size={20} className="text-red-600" />}
          label="Critical / RED Cases"
          value={criticalCases.length}
          sub={criticalCases.length > 0 ? "Requires immediate doctor attention" : "No critical cases"}
          subColor={criticalCases.length > 0 ? "text-red-600 font-bold" : "text-slate-500"}
          accent="bg-red-50"
          onClick={() => onNavigate("triage")}
        />
        <StatCard
          icon={<Calendar size={20} className="text-emerald-700" />}
          label="Today's OPD Queue"
          value="12 Patients"
          sub="1 In Consultation · 4 Done · 7 Scheduled"
          subColor="text-emerald-700 font-medium"
          accent="bg-emerald-50"
          onClick={() => onNavigate("appointments")}
        />
        <StatCard
          icon={<Siren size={20} className="text-rose-600" />}
          label="Active SOS Alerts"
          value={activeSos.length}
          sub={activeSos.length > 0 ? "Active field emergency dispatch" : "All alerts resolved"}
          subColor={activeSos.length > 0 ? "text-rose-600 font-bold" : "text-slate-500"}
          accent="bg-rose-50"
          onClick={() => onNavigate("sos")}
        />
      </div>

      {/* Main Clinical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Left Column: Live Triage Queue + OPD Consultations */}
        <div className="space-y-6">
          {/* Real-time Triage Queue Table */}
          <div className="bg-phc-surface border border-phc-border rounded-2xl overflow-hidden shadow-xs">
            <div className="flex items-center justify-between px-5 py-4 border-b border-phc-border">
              <div>
                <h2 className="font-display font-semibold text-phc-text text-[15px]">
                  Live Triage Queue (<code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-[11px]">triage_cases</code>)
                </h2>
                <p className="text-[11.5px] text-slate-500 font-sans mt-0.5">
                  Real-time clinical stream from ASHA mobile workers
                </p>
              </div>
              <button
                onClick={() => onNavigate("triage")}
                className="flex items-center gap-1 text-[12px] text-phc-blue font-display font-semibold hover:underline cursor-pointer"
              >
                Open Full Queue <ChevronRight size={13} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="bg-phc-bg border-b border-phc-border">
                    {["Token", "Patient", "Age/Sex", "Chief Complaint", "ASHA Worker", "Priority Category", ""].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left font-display font-semibold text-phc-muted text-[11px] uppercase tracking-wide whitespace-nowrap"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {cases.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        No active triage cases pending in queue.
                      </td>
                    </tr>
                  ) : (
                    cases.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => onNavigate("triage")}
                        className="border-b border-phc-border-light hover:bg-phc-blue-light/30 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-[11.5px] text-phc-blue font-bold">
                            {c.token || `#${c.id.slice(-4)}`}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-display font-bold text-phc-text whitespace-nowrap">
                          {c.patientName}
                        </td>
                        <td className="px-4 py-3 text-phc-muted whitespace-nowrap">
                          {c.age ?? 35}/{c.sex || "F"}
                        </td>
                        <td className="px-4 py-3 text-phc-text max-w-[220px] truncate" title={c.chiefComplaint || c.symptomsTranscript}>
                          {c.chiefComplaint || c.symptomsTranscript || "Field Assessment"}
                        </td>
                        <td className="px-4 py-3 text-phc-muted whitespace-nowrap">
                          {c.ashaName || c.ashaId || "—"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusBadge status={c.status} riskBand={c.riskBand} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-[11.5px] text-phc-blue font-display font-bold hover:underline">
                            Review &rarr;
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Today's OPD Patient Consultation Schedule */}
          <div className="bg-phc-surface border border-phc-border rounded-2xl overflow-hidden shadow-xs">
            <div className="flex items-center justify-between px-5 py-4 border-b border-phc-border">
              <div>
                <h2 className="font-display font-semibold text-phc-text text-[15px]">
                  Today's OPD Consultations &amp; Appointments
                </h2>
                <p className="text-[11.5px] text-slate-500 font-sans mt-0.5">
                  Dr. Aravind Kumar's daily primary health centre queue
                </p>
              </div>
              <button
                onClick={() => onNavigate("appointments")}
                className="flex items-center gap-1 text-[12px] text-phc-blue font-display font-semibold hover:underline cursor-pointer"
              >
                Manage Appointments <ChevronRight size={13} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="bg-phc-bg border-b border-phc-border">
                    {["Token", "Time", "Patient Name", "Age/Sex", "Type", "Clinical Reason", "Status", "Action"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left font-display font-semibold text-phc-muted text-[11px] uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { token: "#004", time: "09:30", name: "Baby Aarav Singh", age: "1/M", type: "Paediatric", reason: "Paediatric fever — review", status: "In Consultation", badge: "bg-blue-100 text-blue-800" },
                    { token: "#005", time: "10:00", name: "Asha Verma", age: "35/F", type: "Follow-up", reason: "Hypertension — monthly review", status: "Scheduled", badge: "bg-slate-100 text-slate-700" },
                    { token: "#007", time: "11:00", name: "Vikas Singh", age: "70/M", type: "Chronic", reason: "Diabetic foot — wound review", status: "Scheduled", badge: "bg-slate-100 text-slate-700" },
                    { token: "#009", time: "11:30", name: "Pooja Kumari", age: "32/F", type: "ANC", reason: "32 weeks, gestational diabetes review", status: "Scheduled", badge: "bg-slate-100 text-slate-700" },
                    { token: "#001", time: "08:30", name: "Kamla Devi", age: "45/F", type: "OPD", reason: "Viral fever — follow-up, day 3", status: "Completed", badge: "bg-emerald-100 text-emerald-800" },
                  ].map((apt) => (
                    <tr key={apt.token} className="border-b border-phc-border-light hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-phc-blue">{apt.token}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11.5px]">{apt.time}</td>
                      <td className="px-4 py-3 font-display font-semibold text-slate-900">{apt.name}</td>
                      <td className="px-4 py-3 text-slate-500">{apt.age}</td>
                      <td className="px-4 py-3 text-slate-600">{apt.type}</td>
                      <td className="px-4 py-3 text-slate-700 max-w-[200px] truncate">{apt.reason}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${apt.badge}`}>
                          {apt.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => onNavigate("appointments")}
                          className="text-[11.5px] text-phc-blue font-bold hover:underline cursor-pointer"
                        >
                          Consult &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column: Emergency Alerts & Field Map Preview */}
        <div className="flex flex-col gap-5">
          {/* Emergency SOS Quick Dispatch Widget */}
          <div className="bg-phc-surface border border-phc-border rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-phc-border pb-2.5">
              <div className="flex items-center gap-2">
                <Siren size={16} className="text-red-600" />
                <h3 className="font-display font-bold text-phc-text text-[13.5px]">
                  Emergency Field Escalations
                </h3>
              </div>
              <span className="text-[11px] font-mono text-red-600 font-bold">
                {activeSos.length} Active
              </span>
            </div>

            <div className="space-y-2">
              {sosAlerts.slice(0, 3).map((a) => (
                <div
                  key={a.alertId}
                  onClick={() => onNavigate("sos")}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:border-red-300 transition-colors cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-display font-bold text-red-700">
                      {a.emergencyType.replace(/_/g, " ")}
                    </span>
                    <span className="text-[9.5px] font-mono text-slate-400">{a.alertId}</span>
                  </div>
                  <div className="font-display font-semibold text-[13px] text-slate-800">
                    {a.patientName}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                    <MapPin size={10} /> {a.region}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* High-Risk Maternal & TB Adherence Watchlist */}
          <div className="bg-phc-surface border border-phc-border rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-phc-border pb-2.5">
              <div className="flex items-center gap-2">
                <HeartPulse size={16} className="text-rose-600" />
                <h3 className="font-display font-bold text-phc-text text-[13.5px]">
                  High-Risk Clinical Watchlist
                </h3>
              </div>
              <button
                onClick={() => onNavigate("followups")}
                className="text-[11px] text-phc-blue font-bold hover:underline"
              >
                Cadence &rarr;
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { name: "Ananya Singh", cohort: "ANC High Risk (28 wks)", note: "Severe anaemia Hb 7.2 g/dL · IV iron due" },
                { name: "Arvind Kumar", cohort: "TB DOTS (A16.2)", note: "Day 42/56 intensive phase · Sputum review" },
                { name: "Raghav Sharma", cohort: "Cardiovascular / NCD", note: "HbA1c 9.2% · BP 162/96 medication review" },
              ].map((pat) => (
                <div key={pat.name} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{pat.name}</span>
                    <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-700 text-[10px] font-semibold">
                      High Priority
                    </span>
                  </div>
                  <div className="text-[11px] text-phc-blue font-medium">{pat.cohort}</div>
                  <div className="text-[10.5px] text-slate-500">{pat.note}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Field Map Snapshot for Doctor */}
          <div className="bg-phc-surface border border-phc-border rounded-2xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Radio size={14} className="text-emerald-600 animate-pulse" />
                ASHA Responders in Field
              </span>
              <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                {activeWorkers.length} Active
              </span>
            </div>
            <LiveMap height="200px" showSosAlerts={true} />
          </div>
        </div>
      </div>
    </div>
  );
}
