import { useState, useEffect } from "react";
import {
  Bell,
  ChevronDown,
  Globe,
  ZoomIn,
  X,
  Flame,
  Siren,
  UserCheck,
  Stethoscope,
  PlusCircle,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { ViewType } from "../types";
import {
  subscribeSOSAlerts,
  subscribeTeleconsultRequests,
  subscribeRealtimeNewPatients,
  SOSAlertDoc,
  TeleconsultRequestDoc,
  PatientDoc,
  createSimulatedTeleconsultRequest,
} from "../services/firebase";

const NOTIFICATIONS = [
  {
    id: 1,
    type: "sos",
    text: "SOS Alert: Emergency patient — Pulmonary distress, Ward 2",
    time: "2 min ago",
    unread: true,
  },
  {
    id: 2,
    type: "stock",
    text: "Low stock: Paracetamol 500mg (42 strips remaining)",
    time: "18 min ago",
    unread: true,
  },
  {
    id: 3,
    type: "referral",
    text: "New referral from ASHA Meena Kumari — Ward 5",
    time: "1 hr ago",
    unread: false,
  },
  {
    id: 4,
    type: "appointment",
    text: "Dr. Ananya Sharma ANC review due — Token #014",
    time: "2 hr ago",
    unread: false,
  },
];

import { NationalEmblem, TricolorRibbon } from "./GovEmblem";

const PHCLogo = () => (
  <div className="flex items-center gap-2.5">
    <NationalEmblem className="h-8 w-auto text-slate-700 flex-shrink-0" showMotto={false} />
    <div className="h-7 w-px bg-slate-300" />
    <img
      src="/sevasetu-logo.png"
      alt="SeVaSetu Logo"
      className="h-7 w-auto max-w-[130px] object-contain"
    />
  </div>
);

const dotColor: Record<string, string> = {
  sos: "bg-red-500",
  stock: "bg-amber-500",
  referral: "bg-phc-blue",
  appointment: "bg-phc-green",
};

interface HeaderProps {
  onNavigate: (view: ViewType) => void;
}

export default function Header({ onNavigate }: HeaderProps) {
  const { user, logout } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [lang, setLang] = useState<"en" | "hi" | "ta">("hi");
  const [fontScale, setFontScale] = useState(100);

  // Live Firebase Subscriptions for Doctor / Admin notifications
  const [sosAlerts, setSosAlerts] = useState<SOSAlertDoc[]>([]);
  const [teleconsultReqs, setTeleconsultReqs] = useState<TeleconsultRequestDoc[]>([]);
  const [realtimePatients, setRealtimePatients] = useState<Array<{ patient: PatientDoc; triage?: any }>>([]);

  useEffect(() => {
    const unsubSOS = subscribeSOSAlerts((alerts) => setSosAlerts(alerts));
    const unsubReqs = subscribeTeleconsultRequests((reqs) => setTeleconsultReqs(reqs));
    const unsubPatients = subscribeRealtimeNewPatients((patient, triage) => {
      setRealtimePatients((prev) => {
        if (prev.some((p) => p.patient.id === patient.id)) return prev;
        return [{ patient, triage }, ...prev];
      });
    });
    return () => {
      unsubSOS();
      unsubReqs();
      unsubPatients();
    };
  }, []);

  const isDefaultSunitaDeviSOS = (alert: SOSAlertDoc) => {
    const name = (alert.patientName || "").toLowerCase().trim();
    const id = (alert.patientId || "").toUpperCase().trim();
    const type = (alert.emergencyType || "").toLowerCase();
    return (
      name.includes("sunita devi") ||
      name.includes("sunitha devi") ||
      (id === "PAT-101" && (type.includes("maternal") || type.includes("collapse") || type.includes("trauma")))
    );
  };

  const activeSOS = sosAlerts.filter((a) => {
    if (isDefaultSunitaDeviSOS(a)) return false;
    if (a.status !== "ACTIVE_DISPATCH" && a.status !== "active") return false;
    const ts = typeof a.timestamp === "number"
      ? (a.timestamp < 10000000000 ? a.timestamp * 1000 : a.timestamp)
      : typeof a.timestamp === "object" && a.timestamp && "seconds" in (a.timestamp as any)
      ? (a.timestamp as any).seconds * 1000
      : Date.now();
    return Date.now() - ts < 15 * 60 * 1000;
  });
  const pendingASHA = teleconsultReqs.filter((r) => {
    const s = (r.status || "").toUpperCase();
    return s !== "APPROVED_CONNECTED" && s !== "APPROVED" && s !== "DECLINED" && s !== "RESOLVED";
  });

  const staticUnreadCount = NOTIFICATIONS.filter((n) => n.unread).length;
  const unreadCount = activeSOS.length + pendingASHA.length + realtimePatients.length + staticUnreadCount;

  const handleSimulateASHARequest = async () => {
    await createSimulatedTeleconsultRequest({
      patientName: "Kamla Devi",
      age: 45,
      sex: "F",
      village: "Danapur, Ward 3",
      symptoms: "High fever (103°F) for 3 days, chills, joint pain",
      vitals: "BP: 130/84 mmHg · HR: 104 bpm · SpO2: 97% · Temp: 39.4°C",
      cohort: "General OPD",
      primarySpecialty: "General Medicine / Infectious Disease",
      priorityScore: 78,
      riskBand: "YELLOW",
      ashaName: "Meena Kumari",
      ashaPhone: "+91 94312 45678",
    });
    // Trigger modal event so it immediately pops up for the doctor
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("open-asha-approval-modal"));
    }, 150);
    setShowNotifs(false);
  };

  const isAdmin = user?.role === "ADMIN";
  const displayName = user?.name || (isAdmin ? "Shri Rajesh Verma" : "Dr. Aravind Kumar");
  const displayRole = isAdmin
    ? "PHC Administrator"
    : (user?.specialization ? `Medical Officer (${user.specialization})` : "Medical Officer");

  const userInitials = displayName
    .split(" ")
    .filter((n) => !["Dr.", "Dr", "Shri", "Mr.", "Mrs."].includes(n))
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || (isAdmin ? "RV" : "AK");

  const avatarBg = isAdmin
    ? "bg-[#0A2540] text-amber-300 ring-1 ring-amber-400/40"
    : "bg-[#1B4F8A] text-white ring-1 ring-blue-300/40";

  const roleBadge = isAdmin
    ? `Administrative Authority · ${user?.id || "ADM-001"}`
    : `Medical Officer · ${user?.id || "DOC-PHC-0001"}`;

  const userEmail = user?.email || (isAdmin ? "admin@sevasetu.in" : "doctor@demo.sevasetu.in");

  const cycleFontSize = () => {
    setFontScale((s) => (s >= 120 ? 100 : s + 10));
    document.documentElement.style.fontSize = `${fontScale === 120 ? 100 : fontScale + 10}%`;
  };

  const cycleLang = () => {
    setLang((l) => (l === "hi" ? "en" : l === "en" ? "ta" : "hi"));
  };

  return (
    <div className="flex flex-col flex-shrink-0 z-40">
      <TricolorRibbon className="h-1 w-full" />
      <header className="bg-phc-surface border-b border-phc-border shadow-xs flex items-center px-5 h-16 z-40 flex-shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-2 w-64 flex-shrink-0">
          <PHCLogo />
        </div>

        {/* PHC identity — center */}
        <div className="flex-1 flex flex-col items-center gap-0.5">
          <div className="font-display font-semibold text-phc-text text-sm leading-none">
            Patna Rural Primary Health Centre (PHC)
          </div>
          <div className="text-[11px] text-phc-muted font-sans leading-none">
            Danapur Block &nbsp;·&nbsp; Patna District &nbsp;·&nbsp; Bihar
            &nbsp;&nbsp;
            <span className="font-mono text-phc-subtle text-[10px]">HMIS: BR-PAT-PHC-042</span>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Firebase Live Connection — always connected */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-display font-bold bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs select-none"
            title="Connected to Firebase Firestore: seva-sethu-1ae78"
          >
            <Flame size={13} className="text-emerald-600" />
            <span>seva-sethu-1ae78</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* Language toggle: Hindi / English / Tamil */}
          <button
            onClick={cycleLang}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-phc-border text-[11.5px] font-medium text-phc-muted hover:bg-phc-bg hover:text-phc-text transition-colors cursor-pointer"
            title="Switch language (हिन्दी / English / தமிழ்)"
          >
            <Globe size={12} className="text-phc-blue" />
            {lang === "hi" ? (
              <span className="font-semibold text-phc-blue">हिन्दी&nbsp;<span className="text-[10px] text-phc-muted font-normal">/ EN / தமிழ்</span></span>
            ) : lang === "en" ? (
              <span className="font-semibold text-phc-blue">EN&nbsp;<span className="text-[10px] text-phc-muted font-normal">/ हिन्दी / தமிழ்</span></span>
            ) : (
              <span className="font-semibold text-phc-blue font-tamil text-[11px]">தமிழ்&nbsp;<span className="text-[10px] text-phc-muted font-normal">/ हिन्दी / EN</span></span>
            )}
          </button>

          {/* Accessibility */}
          <button
            onClick={cycleFontSize}
            className="w-8 h-8 flex items-center justify-center rounded text-phc-muted hover:bg-phc-bg hover:text-phc-text transition-colors cursor-pointer"
            title={`Font size: ${fontScale}% — click to increase`}
          >
            <ZoomIn size={15} />
          </button>

          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifs((s) => !s);
                setShowProfile(false);
              }}
              className="relative w-8 h-8 flex items-center justify-center rounded text-phc-muted hover:bg-phc-bg hover:text-phc-text transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-[18px] h-[18px] rounded-full bg-red-500 border-2 border-white flex items-center justify-center text-white text-[9px] font-bold font-display leading-none">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-96 bg-phc-surface border border-phc-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-3 border-b border-phc-border bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-phc-text text-sm">
                      Notifications &amp; Field Alerts
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10.5px] font-display font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setShowNotifs(false)}
                      className="text-phc-subtle hover:text-phc-text p-1 rounded-md hover:bg-slate-200/50 transition cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto divide-y divide-phc-border-light">
                  {/* 1. Critical SOS Emergency Alerts */}
                  {activeSOS.length > 0 && (
                    <div className="bg-red-50/50 p-3">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-display font-bold text-red-700 uppercase tracking-wider mb-2">
                        <Siren size={13} className="text-red-600 animate-bounce" />
                        <span>Emergency SOS Dispatches ({activeSOS.length})</span>
                      </div>
                      <div className="space-y-2">
                        {activeSOS.map((alert) => (
                          <div
                            key={alert.alertId}
                            className="bg-white border border-red-200 rounded-xl p-3 shadow-xs hover:border-red-400 transition"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="font-display font-bold text-sm text-slate-900 block">
                                  {alert.emergencyType.replace(/_/g, " ")}
                                </span>
                                <div className="text-[11.5px] text-slate-600 font-medium">
                                  Patient: <b>{alert.patientName}</b> ({alert.age || 40} yrs)
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  ASHA: {alert.ashaName} · {alert.region}
                                </div>
                              </div>
                              <span className="px-2 py-0.5 rounded bg-red-600 text-white font-mono text-[10px] font-bold">
                                Score {alert.priorityScore}
                              </span>
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-red-100 flex items-center justify-between">
                              <span className="text-[10px] font-mono text-amber-700 font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                108 ALS Dispatched
                              </span>
                              <button
                                onClick={() => {
                                  window.dispatchEvent(
                                    new CustomEvent("open-emergency-sos-modal", {
                                      detail: { alertId: alert.alertId },
                                    })
                                  );
                                  setShowNotifs(false);
                                }}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-display font-bold rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1"
                              >
                                Open SOS Dispatch <ArrowRight size={11} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. Incoming ASHA Teleconsultation & Patient Connection Requests */}
                  {pendingASHA.length > 0 && (
                    <div className="bg-blue-50/50 p-3">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-display font-bold text-phc-blue uppercase tracking-wider mb-2">
                        <Stethoscope size={13} className="text-phc-blue animate-pulse" />
                        <span>ASHA Patient Connection Requests ({pendingASHA.length})</span>
                      </div>
                      <div className="space-y-2">
                        {pendingASHA.map((req) => (
                          <div
                            key={req.id}
                            className="bg-white border border-blue-200 rounded-xl p-3 shadow-xs hover:border-blue-400 transition"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="font-display font-bold text-sm text-slate-900 block">
                                  {req.patientName} ({req.age} yrs · {req.sex})
                                </span>
                                <div className="text-[11.5px] text-slate-600 mt-0.5">
                                  "{req.symptoms}"
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  ASHA: {req.ashaName} ({req.village})
                                </div>
                              </div>
                              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-display text-[10px] font-bold">
                                Approval Needed
                              </span>
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-blue-100 flex items-center justify-between">
                              <span className="text-[10.5px] font-mono text-slate-500 truncate max-w-[170px]">
                                {req.vitals}
                              </span>
                              <button
                                onClick={() => {
                                  window.dispatchEvent(
                                    new CustomEvent("open-asha-approval-modal", {
                                      detail: { reqId: req.id },
                                    })
                                  );
                                  setShowNotifs(false);
                                }}
                                className="px-3 py-1 bg-phc-blue hover:bg-phc-blue-dark text-white text-[11px] font-display font-bold rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1"
                              >
                                <Sparkles size={11} /> Approve &amp; Assign
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Real-Time ASHA New Patient Registrations */}
                  {realtimePatients.length > 0 && (
                    <div className="bg-emerald-50/50 p-3 border-b border-phc-border">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-display font-bold text-emerald-800 uppercase tracking-wider mb-2">
                        <UserCheck size={13} className="text-emerald-600 animate-pulse" />
                        <span>Real-Time ASHA Patient Registrations ({realtimePatients.length})</span>
                      </div>
                      <div className="space-y-2">
                        {realtimePatients.map(({ patient, triage }) => (
                          <div
                            key={patient.id}
                            className="bg-white border border-emerald-200 rounded-xl p-3 shadow-xs hover:border-emerald-400 transition"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="font-display font-bold text-sm text-slate-900 block">
                                  {patient.name} ({patient.age} yrs · {patient.sex === "M" ? "Male" : "Female"})
                                </span>
                                <div className="text-[11.5px] text-slate-600 mt-0.5">
                                  {triage?.symptomsCsv || (patient.conditions && patient.conditions[0]) || "Field Registration"}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  ASHA: {patient.ashaName || "Sunita Tai"} · {patient.village || "Colaba"}
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded font-display text-[10px] font-bold ${
                                patient.riskBand === "RED" || triage?.riskBand === "RED"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}>
                                {patient.riskBand === "RED" || triage?.riskBand === "RED" ? "RED RISK" : "ROUTINE"}
                              </span>
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-emerald-100 flex items-center justify-between">
                              <span className="text-[10.5px] font-mono text-slate-500">
                                ABHA: {patient.abhaId || patient.id}
                              </span>
                              <button
                                onClick={() => {
                                  window.dispatchEvent(
                                    new CustomEvent("open-realtime-patient-modal", {
                                      detail: { patientId: patient.id },
                                    })
                                  );
                                  setShowNotifs(false);
                                }}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-display font-bold rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1"
                              >
                                View Intake Alert <ArrowRight size={11} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. General static notifications */}
                  <div className="p-2 space-y-1">
                    <div className="px-2 py-1 text-[10px] font-display font-bold text-slate-400 uppercase tracking-wider">
                      General Notifications
                    </div>
                    {NOTIFICATIONS.map((n) => (
                      <div
                        key={n.id}
                        className={`px-3 py-2 rounded-xl flex gap-3 hover:bg-phc-bg cursor-pointer transition-colors ${
                          n.unread ? "bg-phc-blue-light/50" : ""
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotColor[n.type]}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] text-phc-text leading-snug">{n.text}</div>
                          <div className="text-[10.5px] text-phc-muted mt-0.5">{n.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="px-4 py-2.5 bg-phc-bg border-t border-phc-border flex items-center justify-between">
                  <button
                    onClick={handleSimulateASHARequest}
                    className="text-[11.5px] font-display font-semibold text-phc-blue hover:text-phc-blue-dark flex items-center gap-1 cursor-pointer"
                    title="Simulate incoming field teleconsult request from ASHA worker"
                  >
                    <PlusCircle size={13} />
                    <span>+ Test ASHA Request</span>
                  </button>

                  <button
                    onClick={() => {
                      onNavigate("triage");
                      setShowNotifs(false);
                    }}
                    className="text-[11.5px] text-slate-500 hover:text-phc-text cursor-pointer"
                  >
                    Open Triage Queue &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-phc-border mx-1" />

          {/* User profile */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfile((s) => !s);
                setShowNotifs(false);
              }}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-phc-bg transition-colors cursor-pointer"
            >
              <div className={`w-8 h-8 rounded-full ${avatarBg} flex items-center justify-center flex-shrink-0 font-display font-bold text-[11px]`}>
                <span>{userInitials}</span>
              </div>
              <div className="text-left">
                <div className="text-[12.5px] font-display font-semibold text-phc-text leading-none">
                  {displayName}
                </div>
                <div className="text-[10.5px] text-phc-muted font-sans leading-none mt-0.5">
                  {displayRole}
                </div>
              </div>
              <ChevronDown size={13} className="text-phc-subtle ml-0.5" />
            </button>

            {showProfile && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-60 bg-phc-surface border border-phc-border rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-phc-border bg-slate-50/60">
                  <div className="font-display font-semibold text-phc-text text-sm flex items-center justify-between">
                    <span>{displayName}</span>
                    <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded ${isAdmin ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>
                      {isAdmin ? "ADMIN" : "DOCTOR"}
                    </span>
                  </div>
                  <div className="text-[11px] text-phc-muted mt-0.5 font-mono truncate">{userEmail}</div>
                  <div className={`text-[11px] mt-1 font-semibold ${isAdmin ? "text-amber-700" : "text-phc-blue"}`}>
                    {roleBadge}
                  </div>
                </div>
                {(isAdmin
                  ? [
                      { label: "Administrative Profile", action: () => { onNavigate("settings"); setShowProfile(false); } },
                      { label: "Doctor Rosters & Staff", action: () => { onNavigate("admin-doctors"); setShowProfile(false); } },
                      { label: "Medicine & Vaccine Stock", action: () => { onNavigate("inventory"); setShowProfile(false); } },
                      { label: "ASHA Field Cadre", action: () => { onNavigate("asha"); setShowProfile(false); } },
                      { label: "System Settings", action: () => { onNavigate("settings"); setShowProfile(false); } },
                    ]
                  : [
                      { label: "Clinical Profile", action: () => { onNavigate("settings"); setShowProfile(false); } },
                      { label: "Triage & Emergency Queue", action: () => { onNavigate("triage"); setShowProfile(false); } },
                      { label: "Today's OPD Queue", action: () => { onNavigate("appointments"); setShowProfile(false); } },
                      { label: "Patient Health Records", action: () => { onNavigate("patients"); setShowProfile(false); } },
                      { label: "Clinical Settings", action: () => { onNavigate("settings"); setShowProfile(false); } },
                    ]
                ).map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full text-left px-4 py-2.5 text-[12.5px] text-phc-text hover:bg-phc-bg transition-colors border-b border-phc-border-light last:border-0 cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2.5 text-[12.5px] text-red-600 hover:bg-red-50 transition-colors cursor-pointer border-t border-phc-border font-semibold"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}
