import { useState, useEffect } from "react";
import {
  Siren,
  Phone,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  X,
  ChevronRight,
  Radio,
  UserCheck,
  Stethoscope,
  ShieldCheck,
  Heart,
  Activity,
  PhoneCall,
  Sparkles,
  MessageSquare,
  FileText,
  Clock,
  ExternalLink,
} from "lucide-react";
import {
  SOSAlertDoc,
  TeleconsultRequestDoc,
  subscribeSOSAlerts,
  subscribeTeleconsultRequests,
  updateSOSAlertStatus,
  approveTeleconsultConnection,
  declineTeleconsultConnection,
  createSimulatedTeleconsultRequest,
} from "../services/firebase";
import { useAuth } from "../auth/AuthContext";
import { ViewType } from "../types";

// ─── Web Audio API Sound Chimes ───────────────────────────────────────────────

function playEmergencySirenSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    // Audio autoplay might be restricted before interaction
  }
}

function playApprovalChimeSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5
    osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.3); // G5

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    // audio fallback
  }
}

// ─── 1. Emergency SOS Dispatch Notification Pop-up ────────────────────────────

// Helper: Identify legacy/default mock Sunita Devi emergency alerts
function isDefaultSunitaDeviSOS(alert: SOSAlertDoc): boolean {
  const name = (alert.patientName || "").toLowerCase().trim();
  const id = (alert.patientId || "").toUpperCase().trim();
  const type = (alert.emergencyType || "").toLowerCase();
  return (
    name.includes("sunita devi") ||
    name.includes("sunitha devi") ||
    (id === "PAT-101" && (type.includes("maternal") || type.includes("collapse") || type.includes("trauma")))
  );
}

interface EmergencySOSModalProps {
  onNavigate?: (view: ViewType) => void;
}

export function EmergencySOSModal({ onNavigate }: EmergencySOSModalProps) {
  const [alerts, setAlerts] = useState<SOSAlertDoc[]>([]);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(() => {
    try {
      const saved = sessionStorage.getItem("sevasetu_dismissed_sos_ids");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [acknowledgedSuccess, setAcknowledgedSuccess] = useState(false);

  const dismissAlertId = (id: string) => {
    setDismissedAlertIds((prev) => {
      const next = new Set(prev).add(id);
      try {
        sessionStorage.setItem("sevasetu_dismissed_sos_ids", JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    const unsub = subscribeSOSAlerts((updatedAlerts) => {
      setAlerts(updatedAlerts);
    });
    return () => unsub();
  }, []);

  // Listen for open event from Header or other notification triggers
  useEffect(() => {
    const handleOpen = (e: any) => {
      const alertId = e.detail?.alertId;
      if (alertId) {
        setDismissedAlertIds((prev) => {
          const next = new Set(prev);
          next.delete(alertId);
          try {
            sessionStorage.setItem("sevasetu_dismissed_sos_ids", JSON.stringify(Array.from(next)));
          } catch {}
          return next;
        });
      } else {
        setDismissedAlertIds(new Set());
        try {
          sessionStorage.removeItem("sevasetu_dismissed_sos_ids");
        } catch {}
      }
    };
    window.addEventListener("open-emergency-sos-modal", handleOpen);
    return () => window.removeEventListener("open-emergency-sos-modal", handleOpen);
  }, []);

  // Filter for ACTIVE_DISPATCH alerts:
  // 1. Exclude dismissed alerts in this session
  // 2. Exclude default Sunita Devi demo mock alerts
  // 3. Must have ACTIVE_DISPATCH status and be within 15 mins
  // 4. Sort newest first so any real patient triggered from field app shows immediately
  const activeAlerts = alerts
    .filter((a) => {
      if (dismissedAlertIds.has(a.alertId)) return false;
      if (isDefaultSunitaDeviSOS(a)) return false;
      const isDispatch = a.status === "ACTIVE_DISPATCH" || a.status === "active";
      if (!isDispatch) return false;

      // Freshness check: only show alerts created in the last 15 minutes
      const ts = typeof a.timestamp === "number"
        ? (a.timestamp < 10000000000 ? a.timestamp * 1000 : a.timestamp)
        : typeof a.timestamp === "object" && a.timestamp && "seconds" in a.timestamp
        ? a.timestamp.seconds * 1000
        : Date.now();
      return Date.now() - ts < 15 * 60 * 1000;
    })
    .sort((a, b) => {
      const tsA = typeof a.timestamp === "number" ? a.timestamp : 0;
      const tsB = typeof b.timestamp === "number" ? b.timestamp : 0;
      return tsB - tsA;
    });

  const currentAlert = activeAlerts[0];

  // Play subtle audio siren alert on first appearance
  useEffect(() => {
    if (currentAlert) {
      playEmergencySirenSound();
    }
  }, [currentAlert?.alertId]);

  if (!currentAlert) return null;

  const handleAcknowledge = async () => {
    setIsUpdating(true);
    try {
      await updateSOSAlertStatus(
        currentAlert.alertId,
        "ACKNOWLEDGED",
        "Acknowledged by Doctor on Emergency SOS Pop-up"
      );
      setAcknowledgedSuccess(true);
      setTimeout(() => {
        setAcknowledgedSuccess(false);
        dismissAlertId(currentAlert.alertId);
      }, 1800);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResolve = async () => {
    setIsUpdating(true);
    try {
      await updateSOSAlertStatus(
        currentAlert.alertId,
        "RESOLVED",
        "Resolved by PHC Doctor"
      );
      dismissAlertId(currentAlert.alertId);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    dismissAlertId(currentAlert.alertId);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-red-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white rounded-3xl overflow-hidden shadow-2xl border-2 border-red-500 animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Top Siren Banner */}
        <div className="bg-gradient-to-r from-red-600 via-red-700 to-rose-700 text-white p-5 flex items-start justify-between relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-4 relative z-10">
            <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md text-white flex-shrink-0 shadow-inner">
              <span className="absolute -inset-1.5 rounded-2xl bg-white/40 animate-ping opacity-75"></span>
              <Siren size={30} className="animate-bounce text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-white text-red-700 text-[10.5px] font-black font-display uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-xs">
                  CRITICAL EMERGENCY SOS
                </span>
                <span className="text-[11px] font-mono text-red-100 bg-red-900/50 px-2 py-0.5 rounded">
                  Score: {currentAlert.priorityScore}/100
                </span>
              </div>
              <h3 className="font-display font-bold text-xl text-white mt-1">
                {currentAlert.emergencyType.replace(/_/g, " ")}
              </h3>
              <p className="text-[12px] text-red-100 font-sans">
                Real-time field broadcast from ASHA worker to PHC Command
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer relative z-10"
            title="Minimize pop-up"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Patient Card */}
          <div className="bg-red-50/70 border border-red-200 rounded-2xl p-4 flex items-start justify-between">
            <div>
              <span className="text-[10.5px] font-display font-bold text-red-600 uppercase tracking-wider block mb-0.5">
                Emergency Patient
              </span>
              <div className="font-display font-bold text-lg text-slate-900">
                {currentAlert.patientName}
              </div>
              <div className="text-[12.5px] text-slate-600 mt-0.5">
                {currentAlert.age ?? 40} yrs · {currentAlert.sex === "F" ? "Female" : "Male"} · ID: {currentAlert.patientId}
              </div>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-display font-bold bg-red-600 text-white inline-block">
                RED HIGH RISK
              </span>
              <div className="text-[11px] font-mono text-slate-500 mt-1 flex items-center justify-end gap-1">
                <Clock size={12} /> Just Now
              </div>
            </div>
          </div>

          {/* Location & ASHA Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[10.5px] font-display font-bold text-slate-400 uppercase tracking-wider block mb-1">
                GPS Location / Region
              </span>
              <div className="text-[12px] font-semibold text-slate-800 flex items-center gap-1.5">
                <MapPin size={13} className="text-red-500 flex-shrink-0" />
                <span className="truncate">{currentAlert.region}</span>
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                Coords: {currentAlert.latitude?.toFixed(4)}, {currentAlert.longitude?.toFixed(4)}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[10.5px] font-display font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Field ASHA Worker
              </span>
              <div className="text-[12px] font-semibold text-slate-800 flex items-center gap-1.5">
                <UserCheck size={13} className="text-emerald-600 flex-shrink-0" />
                <span>{currentAlert.ashaName}</span>
              </div>
              <div className="text-[11px] font-mono text-slate-600 mt-0.5 flex items-center gap-1">
                <Phone size={11} /> {currentAlert.contactPhone || "+91 98230 11234"}
              </div>
            </div>
          </div>

          {/* 108 Ambulance Dispatch State */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio size={16} className="text-amber-600 animate-pulse" />
              <div>
                <div className="text-[12px] font-display font-bold text-amber-900">
                  108 Emergency Ambulance Dispatched
                </div>
                <div className="text-[11px] text-amber-700">
                  Emergency Medical Technician (EMT) en-route with oxygen &amp; maternal trauma kit
                </div>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
              ALS-108
            </span>
          </div>
        </div>

        {/* Action Controls Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between gap-3">
          <button
            onClick={handleDismiss}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-[12.5px] font-display font-semibold hover:bg-white transition cursor-pointer"
          >
            Minimize Alert
          </button>

          <div className="flex items-center gap-2.5">
            {onNavigate && (
              <button
                onClick={() => {
                  onNavigate("sos");
                  handleDismiss();
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[12.5px] font-display font-semibold transition cursor-pointer"
              >
                Open SOS Console
                <ExternalLink size={13} />
              </button>
            )}

            <button
              onClick={handleAcknowledge}
              disabled={isUpdating}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-[12.5px] font-display font-bold transition shadow-md cursor-pointer ${acknowledgedSuccess
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-red-600 hover:bg-red-700"
                }`}
            >
              {acknowledgedSuccess ? (
                <>
                  <CheckCircle2 size={16} /> Acknowledged!
                </>
              ) : (
                <>
                  <Radio size={15} className="animate-pulse" /> Acknowledge Dispatch
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 2. ASHA Teleconsultation Connection Approval Notification Modal ──────────

interface AshaConnectionApprovalModalProps {
  onNavigate?: (view: ViewType) => void;
}

export function AshaConnectionApprovalModal({ onNavigate }: AshaConnectionApprovalModalProps) {
  const { user } = useAuth();
  const currentDoctorName = user?.name || "Dr. Aravind Kumar";
  const currentDoctorId = user?.id || "DOC-PHC-0001";

  const [requests, setRequests] = useState<TeleconsultRequestDoc[]>([]);
  const [dismissedReqIds, setDismissedReqIds] = useState<Set<string>>(new Set());
  const [approvedState, setApprovedState] = useState<{ reqId: string; patientName: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const unsub = subscribeTeleconsultRequests((incoming) => {
      setRequests(incoming);
    });
    return () => unsub();
  }, []);

  // Listen for open event from Header or other triggers
  useEffect(() => {
    const handleOpen = (e: any) => {
      const reqId = e.detail?.reqId;
      if (reqId) {
        setDismissedReqIds((prev) => {
          const next = new Set(prev);
          next.delete(reqId);
          return next;
        });
      } else {
        setDismissedReqIds(new Set());
      }
      setApprovedState(null);
    };
    window.addEventListener("open-asha-approval-modal", handleOpen);
    return () => window.removeEventListener("open-asha-approval-modal", handleOpen);
  }, []);

  // Filter for pending connection requests that require doctor approval
  const pendingRequests = requests.filter((r) => {
    if (dismissedReqIds.has(r.id)) return false;
    const s = (r.status || "").toUpperCase();
    const isHandled = s === "APPROVED_CONNECTED" || s === "APPROVED" || s === "DECLINED" || s === "RESOLVED";
    if (isHandled) return false;

    // Check doctor assignment match: either unassigned, or directed to this doctor
    if (r.assignedDoctorName) {
      const doc = r.assignedDoctorName.toLowerCase();
      const me = currentDoctorName.toLowerCase();
      if (!doc.includes("aravind") && !me.includes(doc) && !doc.includes(me)) {
        return false;
      }
    }
    return true;
  });

  const activeRequest = pendingRequests[0];

  // Play gentle chime on new incoming teleconsult request
  useEffect(() => {
    if (activeRequest && !approvedState) {
      playApprovalChimeSound();
    }
  }, [activeRequest?.id]);

  if (!activeRequest && !approvedState) return null;

  const handleApprove = async () => {
    if (!activeRequest) return;
    setIsProcessing(true);
    try {
      const targetCaseId =
        activeRequest.caseId ||
        activeRequest.triageRecordId ||
        activeRequest.id.replace("REQ-", "");

      await approveTeleconsultConnection(
        activeRequest.id,
        currentDoctorName,
        currentDoctorId,
        activeRequest.patientId,
        targetCaseId,
        activeRequest
      );

      playApprovalChimeSound();

      // Dismiss this request so modal closes immediately
      setDismissedReqIds((prev) => new Set(prev).add(activeRequest.id));
      setApprovedState(null);

      // Immediately navigate to the chat section (Triage) as requested by the user
      if (onNavigate) {
        onNavigate("triage");
      }

      // Open the chat workspace for this case
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("open-case-chat", {
            detail: {
              caseId: targetCaseId,
              patientId: activeRequest.patientId,
              patientName: activeRequest.patientName,
            },
          })
        );
      }, 150);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!activeRequest) return;
    setIsProcessing(true);
    try {
      await declineTeleconsultConnection(activeRequest.id);
      setDismissedReqIds((prev) => new Set(prev).add(activeRequest.id));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismiss = () => {
    if (activeRequest) {
      setDismissedReqIds((prev) => new Set(prev).add(activeRequest.id));
    }
    setApprovedState(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-blue-200 animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Approved Success Screen */}
        {approvedState ? (
          <div className="p-8 text-center space-y-5 bg-gradient-to-b from-blue-50/50 to-white">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center border-4 border-emerald-200 shadow-sm animate-bounce">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-display font-bold uppercase tracking-wider">
                Connection Approved &amp; Patient Assigned
              </span>
              <h3 className="font-display font-bold text-2xl text-slate-900 mt-2">
                Patient Assigned to {currentDoctorName}
              </h3>
              <p className="text-[13px] text-slate-600 mt-1 max-w-md mx-auto">
                The teleconsultation connection with ASHA worker is established. Patient <b>{approvedState.patientName}</b> has been admitted to your active clinical care queue.
              </p>
            </div>

            <div className="bg-white border border-emerald-200 rounded-2xl p-4 text-left space-y-2 max-w-md mx-auto shadow-xs">
              <div className="text-[12.5px] text-slate-700 flex items-center justify-between">
                <span>Attending Medical Officer:</span>
                <span className="font-bold text-phc-blue">{currentDoctorName}</span>
              </div>
              <div className="text-[12.5px] text-slate-700 flex items-center justify-between border-t pt-2">
                <span>Two-Way Chat Stream:</span>
                <span className="font-mono text-emerald-700 font-bold">UNLOCKED / ACTIVE</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              {onNavigate && (
                <button
                  onClick={() => {
                    onNavigate("triage");
                    setApprovedState(null);
                  }}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-phc-blue text-white font-display font-bold text-xs hover:bg-phc-blue-dark transition cursor-pointer shadow-sm"
                >
                  <MessageSquare size={14} /> Open Live Case Stream
                </button>
              )}

              {onNavigate && (
                <button
                  onClick={() => {
                    onNavigate("patients");
                    setApprovedState(null);
                  }}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-800 text-white font-display font-bold text-xs hover:bg-slate-700 transition cursor-pointer shadow-sm"
                >
                  <FileText size={14} /> Open Patient 360 EHR
                </button>
              )}

              <button
                onClick={() => setApprovedState(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-display font-semibold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Incoming Request Approval Form */
          <>
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white p-5 flex items-start justify-between relative overflow-hidden">
              <div className="flex items-center gap-3.5 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white flex-shrink-0 shadow-inner">
                  <Stethoscope size={24} className="text-white animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-400 text-slate-900 text-[10px] font-black font-display uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-xs">
                      DOCTOR APPROVAL REQUIRED
                    </span>
                    <span className="text-[11px] font-mono text-blue-100">
                      {activeRequest.id}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-white mt-1">
                    Incoming ASHA Patient Connection Request
                  </h3>
                  <p className="text-[11.5px] text-blue-100 font-sans">
                    ASHA worker is seeking teleconsultation intake and patient assignment
                  </p>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer relative z-10"
                title="Dismiss"
              >
                <X size={17} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Patient Card */}
              <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-display font-bold text-phc-blue uppercase tracking-wider block mb-0.5">
                    Referred Patient Intake
                  </span>
                  <div className="font-display font-bold text-xl text-slate-900">
                    {activeRequest.patientName}
                  </div>
                  <div className="text-[12.5px] text-slate-600 mt-0.5">
                    {activeRequest.age} yrs · {activeRequest.sex === "F" ? "Female" : "Male"} · {activeRequest.cohort || "Maternal ANC"}
                  </div>
                  {activeRequest.abhaId && (
                    <div className="text-[11px] font-mono text-emerald-700 flex items-center gap-1 mt-1 font-semibold">
                      <ShieldCheck size={12} /> ABHA: {activeRequest.abhaId}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-display font-bold ${activeRequest.riskBand === "RED"
                      ? "bg-red-100 text-red-700 border border-red-200"
                      : "bg-amber-100 text-amber-700 border border-amber-200"
                    }`}>
                    Priority Score: {activeRequest.priorityScore}/100
                  </span>
                  <div className="text-[11px] font-display font-bold text-slate-600 mt-1">
                    {activeRequest.primarySpecialty}
                  </div>
                </div>
              </div>

              {/* Symptoms & Vitals Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div>
                  <span className="text-[10.5px] font-display font-bold text-slate-400 uppercase tracking-wider block">
                    Chief Complaint &amp; Symptoms Transcript
                  </span>
                  <p className="text-[13px] font-medium text-slate-800 mt-0.5">
                    "{activeRequest.symptoms}"
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11.5px]">
                  <span className="text-slate-500 font-display font-semibold flex items-center gap-1">
                    <Activity size={12} className="text-phc-blue" /> Field Vitals:
                  </span>
                  <span className="font-mono text-slate-800 font-bold">
                    {activeRequest.vitals}
                  </span>
                </div>
              </div>

              {/* ASHA Worker Information */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    <UserCheck size={16} />
                  </div>
                  <div>
                    <div className="text-[12.5px] font-display font-bold text-slate-900">
                      ASHA: {activeRequest.ashaName} ({activeRequest.ashaId})
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin size={11} className="text-slate-400" /> {activeRequest.village}
                    </div>
                  </div>
                </div>

                <a
                  href={`tel:${activeRequest.ashaPhone}`}
                  className="flex items-center gap-1 px-3 py-1 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-[11.5px] font-display font-semibold hover:bg-emerald-100 transition shadow-xs"
                >
                  <PhoneCall size={12} /> Call ASHA
                </a>
              </div>

              {/* Assignment Notice */}
              <div className="text-[11.5px] text-slate-500 bg-slate-100/80 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2">
                <ShieldCheck size={15} className="text-phc-blue flex-shrink-0" />
                <span>
                  By approving, patient <b>{activeRequest.patientName}</b> will be officially assigned to <b>{currentDoctorName}</b> and synchronized to the ASHA worker's active teleconsultation channel.
                </span>
              </div>
            </div>

            {/* Action Buttons Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between gap-3">
              <button
                onClick={handleDecline}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-[12.5px] font-display font-semibold hover:bg-white hover:text-red-600 transition cursor-pointer"
              >
                Decline / Reassign
              </button>

              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-phc-blue hover:bg-phc-blue-dark text-white text-[13px] font-display font-bold transition shadow-md cursor-pointer"
              >
                <Sparkles size={15} /> Approve Connection &amp; Assign to Me
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
