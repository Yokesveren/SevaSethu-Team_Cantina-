import { useState, useEffect, useRef } from "react";
import {
  UserCheck,
  Phone,
  MapPin,
  X,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  Activity,
  FileText,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Radio,
  PhoneCall,
  Volume2,
} from "lucide-react";
import {
  PatientDoc,
  subscribeRealtimeNewPatients,
} from "../services/firebase";
import { ViewType } from "../types";
import { NationalEmblem, TricolorRibbon } from "./GovEmblem";

// ─── Web Audio API Notification Chime ─────────────────────────────────────────

function playNewPatientChime() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // Harmonious dual chime (E5 -> A5)
    [
      { freq: 659.25, time: 0, dur: 0.18 },
      { freq: 880.00, time: 0.15, dur: 0.35 },
    ].forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + time);
      gain.gain.setValueAtTime(0.12, now + time);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + time);
      osc.stop(now + time + dur);
    });
  } catch {
    // Autoplay restrictions before user interaction
  }
}

interface RealtimePatientModalProps {
  onNavigate?: (view: ViewType) => void;
}

interface IncomingItem {
  patient: PatientDoc;
  triage?: any;
  receivedAt: number;
}

export default function RealtimePatientModal({ onNavigate }: RealtimePatientModalProps) {
  const [queue, setQueue] = useState<IncomingItem[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try {
      const saved = sessionStorage.getItem("sevasetu_dismissed_realtime_patients");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [acknowledgedSuccess, setAcknowledgedSuccess] = useState(false);
  const audioPlayedForRef = useRef<Set<string>>(new Set());

  // Subscribe to real-time newly registered patients
  useEffect(() => {
    const unsub = subscribeRealtimeNewPatients((newPatient, triageCase) => {
      setQueue((prev) => {
        // Prevent duplicate entries
        if (prev.some((item) => item.patient.id === newPatient.id)) {
          return prev;
        }
        return [{ patient: newPatient, triage: triageCase, receivedAt: Date.now() }, ...prev];
      });
    });

    return () => unsub();
  }, []);

  // Listen for manual open trigger (e.g. from Header notification click)
  useEffect(() => {
    const handleManualOpen = (e: any) => {
      const targetId = e.detail?.patientId;
      if (targetId) {
        setDismissedIds((prev) => {
          const next = new Set(prev);
          next.delete(targetId);
          try {
            sessionStorage.setItem("sevasetu_dismissed_realtime_patients", JSON.stringify(Array.from(next)));
          } catch {}
          return next;
        });
      }
    };
    window.addEventListener("open-realtime-patient-modal", handleManualOpen);
    return () => window.removeEventListener("open-realtime-patient-modal", handleManualOpen);
  }, []);

  // Filter out any dismissed patients
  const activeItems = queue.filter((item) => !dismissedIds.has(item.patient.id));
  const currentItem = activeItems[0];

  // Play audio chime when a new patient appears
  useEffect(() => {
    if (currentItem && !audioPlayedForRef.current.has(currentItem.patient.id)) {
      audioPlayedForRef.current.add(currentItem.patient.id);
      playNewPatientChime();
    }
  }, [currentItem?.patient.id]);

  if (!currentItem) return null;

  const { patient, triage } = currentItem;

  const dismissPatient = (patientId: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev).add(patientId);
      try {
        sessionStorage.setItem("sevasetu_dismissed_realtime_patients", JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  const handleAcknowledge = () => {
    setAcknowledgedSuccess(true);
    setTimeout(() => {
      setAcknowledgedSuccess(false);
      dismissPatient(patient.id);
    }, 1200);
  };

  const handleOpenPatientEHR = () => {
    dismissPatient(patient.id);
    if (onNavigate) {
      onNavigate("patients");
    }
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("open-patient-details", {
          detail: { patientId: patient.id },
        })
      );
    }, 150);
  };

  const handleOpenTriage = () => {
    dismissPatient(patient.id);
    if (onNavigate) {
      onNavigate("triage");
    }
    if (triage?.id || triage?.caseId) {
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("open-case-chat", {
            detail: {
              caseId: triage.id || triage.caseId,
              patientId: patient.id,
              patientName: patient.name,
            },
          })
        );
      }, 150);
    }
  };

  const isCritical =
    patient.riskBand === "RED" ||
    triage?.riskBand === "RED" ||
    (triage?.priorityScore && Number(triage.priorityScore) > 80);

  return (
    <div className="fixed inset-0 z-[65] bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white rounded-3xl overflow-hidden shadow-2xl border-2 border-phc-blue/30 animate-in zoom-in-95 duration-200 flex flex-col">
        <TricolorRibbon className="h-1.5 w-full flex-shrink-0" />

        {/* Top Header Banner */}
        <div
          className={`p-5 text-white flex items-start justify-between relative overflow-hidden ${
            isCritical
              ? "bg-gradient-to-r from-red-700 via-rose-700 to-amber-700"
              : "bg-gradient-to-r from-[#0A2540] via-[#123860] to-[#1E4E79]"
          }`}
        >
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-13 h-13 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white flex-shrink-0 shadow-inner">
              {isCritical ? (
                <AlertTriangle size={26} className="text-amber-300 animate-bounce" />
              ) : (
                <UserCheck size={26} className="text-emerald-300" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-400 text-slate-900 text-[10px] font-black font-display uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-950 animate-ping"></span>
                  REAL-TIME FIELD REGISTRATION
                </span>
                {activeItems.length > 1 && (
                  <span className="text-[11px] font-mono bg-white/20 px-2 py-0.5 rounded-full text-white">
                    +{activeItems.length - 1} more
                  </span>
                )}
              </div>
              <h3 className="font-display font-bold text-xl text-white mt-1">
                New Patient Added via ASHA Worker App
              </h3>
              <p className="text-[12px] text-blue-100 font-sans">
                Live telemetry synchronized from ASHA Setu mobile terminal to PHC Command
              </p>
            </div>
          </div>

          <button
            onClick={() => dismissPatient(patient.id)}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer relative z-10"
            title="Dismiss notification"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Patient Profile Card */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200 rounded-2xl p-4 flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10.5px] font-display font-bold text-phc-blue uppercase tracking-wider block">
                Field Intake Identity
              </span>
              <div className="font-display font-bold text-2xl text-slate-900">
                {patient.name}
              </div>
              <div className="text-[12.5px] text-slate-600 font-medium">
                {patient.age} yrs · {patient.sex === "M" || patient.gender === "Male" ? "Male" : "Female"} · Cohort:{" "}
                <span className="font-semibold text-slate-800">{patient.cohort || "General OPD"}</span>
              </div>
              {patient.abhaId && (
                <div className="text-[11.5px] font-mono text-emerald-700 flex items-center gap-1 mt-1 font-bold">
                  <ShieldCheck size={13} className="text-emerald-600" /> ABHA: {patient.abhaId}
                </div>
              )}
            </div>

            <div className="text-right space-y-1.5">
              <span
                className={`px-3 py-1 rounded-full text-[11px] font-display font-bold inline-block ${
                  isCritical
                    ? "bg-red-100 text-red-700 border border-red-200"
                    : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                }`}
              >
                {isCritical ? "CRITICAL RISK (RED)" : "ROUTINE (GREEN)"}
              </span>
              <div className="text-[11px] font-mono text-slate-500 flex items-center justify-end gap-1">
                <Clock size={12} className="text-slate-400" /> Just Now
              </div>
              <div className="text-[10px] font-mono text-phc-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-100 inline-block">
                ID: {patient.id}
              </div>
            </div>
          </div>

          {/* Clinical Symptoms & Triage Section (if available) */}
          {(triage || (patient.conditions && patient.conditions.length > 0)) && (
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-display font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity size={13} className="text-amber-700" />
                  Clinical Triage Findings
                </span>
                {triage?.priorityScore && (
                  <span className="text-[11px] font-mono font-bold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded">
                    Priority Score: {triage.priorityScore}/100
                  </span>
                )}
              </div>

              {triage?.symptomsCsv && (
                <div>
                  <div className="text-[12px] font-semibold text-slate-800">
                    Conditions / Symptoms: <span className="font-normal">{triage.symptomsCsv}</span>
                  </div>
                </div>
              )}

              {triage?.rawVoiceText && (
                <div className="text-[11.5px] text-slate-700 bg-white/80 p-2.5 rounded-xl border border-amber-200 font-sans italic flex items-start gap-2">
                  <Volume2 size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>"{triage.rawVoiceText}"</span>
                </div>
              )}

              {triage?.actionAdvice && (
                <div className="text-[11px] font-medium text-red-800 bg-red-50 p-2 rounded-lg border border-red-200 flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-red-600 flex-shrink-0" />
                  <span>{triage.actionAdvice}</span>
                </div>
              )}

              {/* Vitals summary if present */}
              {(triage?.spo2Percent || triage?.heartRateBpm || triage?.bpSystolic) && (
                <div className="pt-2 border-t border-amber-200/60 flex flex-wrap gap-3 text-[11px] font-mono text-slate-700">
                  {triage.spo2Percent && <span>SpO2: <b className="text-slate-900">{triage.spo2Percent}%</b></span>}
                  {triage.heartRateBpm && <span>HR: <b className="text-slate-900">{triage.heartRateBpm} bpm</b></span>}
                  {triage.bpSystolic && <span>BP: <b className="text-slate-900">{triage.bpSystolic}/{triage.bpDiastolic || "--"}</b></span>}
                  {triage.tempCelsius && <span>Temp: <b className="text-slate-900">{triage.tempCelsius}°C</b></span>}
                </div>
              )}
            </div>
          )}

          {/* Location & Frontline ASHA Telemetry */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[10.5px] font-display font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Village / Sub-Centre
              </span>
              <div className="text-[12.5px] font-semibold text-slate-800 flex items-center gap-1.5">
                <MapPin size={13} className="text-phc-blue flex-shrink-0" />
                <span className="truncate">{patient.village || "Colaba / Palghar"}</span>
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                PHC: BR-PAT-PHC-042
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[10.5px] font-display font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Frontline ASHA Worker
              </span>
              <div className="text-[12.5px] font-semibold text-slate-800 flex items-center gap-1.5">
                <UserCheck size={13} className="text-emerald-600 flex-shrink-0" />
                <span className="truncate">{patient.ashaName || "Sunita Tai"}</span>
              </div>
              <div className="text-[11px] font-mono text-slate-600 mt-0.5 flex items-center gap-1">
                <Phone size={11} /> {patient.phone || patient.mobile || "+91 94446 78402"}
              </div>
            </div>
          </div>

          {/* Sync Connection Info */}
          <div className="text-[11.5px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Radio size={14} className="text-emerald-600 animate-pulse" />
              <span>Registered live via ASHA Setu Android App</span>
            </div>
            {patient.phone && (
              <a
                href={`tel:${patient.phone}`}
                className="flex items-center gap-1 text-[11px] text-phc-blue font-bold hover:underline"
              >
                <PhoneCall size={11} /> Call Patient
              </a>
            )}
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between gap-3">
          <button
            onClick={() => dismissPatient(patient.id)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-[12.5px] font-display font-semibold hover:bg-white transition cursor-pointer"
          >
            Dismiss
          </button>

          <div className="flex items-center gap-2.5">
            {onNavigate && (
              <button
                onClick={handleOpenPatientEHR}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[12.5px] font-display font-semibold transition cursor-pointer shadow-xs"
              >
                <FileText size={14} /> Open Patient 360 EHR
              </button>
            )}

            {onNavigate && (triage || isCritical) && (
              <button
                onClick={handleOpenTriage}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-phc-blue hover:bg-phc-blue-dark text-white text-[12.5px] font-display font-semibold transition cursor-pointer shadow-xs"
              >
                <Stethoscope size={14} /> Triage Queue
              </button>
            )}

            <button
              onClick={handleAcknowledge}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-[12.5px] font-display font-bold transition shadow-md cursor-pointer ${
                acknowledgedSuccess
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {acknowledgedSuccess ? (
                <>
                  <CheckCircle2 size={16} /> Acknowledged!
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} /> Acknowledge Intake
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
