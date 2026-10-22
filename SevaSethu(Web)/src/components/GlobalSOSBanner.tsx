import { useEffect, useState } from "react";
import {
  SOSAlertDoc,
  subscribeSOSAlerts,
  updateSOSAlertStatus,
} from "../services/firebase";
import {
  Siren,
  Phone,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  X,
  ChevronRight,
  Radio,
  ExternalLink,
} from "lucide-react";
import { ViewType } from "../types";

interface GlobalSOSBannerProps {
  onNavigate?: (view: ViewType) => void;
}

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

export default function GlobalSOSBanner({ onNavigate }: GlobalSOSBannerProps) {
  const [alerts, setAlerts] = useState<SOSAlertDoc[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try {
      const saved = sessionStorage.getItem("sevasetu_dismissed_sos_ids");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const dismissAlertId = (id: string) => {
    setDismissedIds((prev) => {
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

  // Filter for ACTIVE_DISPATCH alerts:
  // Exclude dismissed alerts, exclude default Sunita Devi mock, 15-min freshness, newest first
  const activeAlerts = alerts
    .filter((a) => {
      if (dismissedIds.has(a.alertId)) return false;
      if (isDefaultSunitaDeviSOS(a)) return false;
      if (a.status !== "ACTIVE_DISPATCH" && a.status !== "active") return false;
      const ts = typeof a.timestamp === "number"
        ? (a.timestamp < 10000000000 ? a.timestamp * 1000 : a.timestamp)
        : typeof a.timestamp === "object" && a.timestamp && "seconds" in (a.timestamp as any)
        ? (a.timestamp as any).seconds * 1000
        : Date.now();
      return Date.now() - ts < 15 * 60 * 1000;
    })
    .sort((a, b) => {
      const tsA = typeof a.timestamp === "number" ? a.timestamp : 0;
      const tsB = typeof b.timestamp === "number" ? b.timestamp : 0;
      return tsB - tsA;
    });

  if (activeAlerts.length === 0) return null;

  const currentAlert = activeAlerts[0];

  const handleAcknowledge = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUpdating(true);
    try {
      await updateSOSAlertStatus(
        currentAlert.alertId,
        "ACKNOWLEDGED",
        "Acknowledged by PHC Doctor on dashboard banner"
      );
      dismissAlertId(currentAlert.alertId);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResolve = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUpdating(true);
    try {
      await updateSOSAlertStatus(
        currentAlert.alertId,
        "RESOLVED",
        "Resolved by PHC Medical Officer"
      );
      dismissAlertId(currentAlert.alertId);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    dismissAlertId(currentAlert.alertId);
  };

  return (
    <div className="bg-gradient-to-r from-red-600 via-red-700 to-rose-700 text-white px-4 py-2.5 shadow-xl border-b-2 border-red-400 z-50 animate-in slide-in-from-top duration-200">
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Emergency Pulse & Description */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md text-white flex-shrink-0 shadow-inner">
            <span className="absolute -inset-1 rounded-xl bg-white/40 animate-ping opacity-75"></span>
            <Siren size={20} className="animate-bounce text-white" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="bg-white text-red-700 text-[10.5px] font-black font-display uppercase tracking-widest px-2 py-0.5 rounded-full shadow-xs">
                EMERGENCY SOS DISPATCH
              </span>
              <span className="font-mono text-xs text-red-100 font-bold">
                {currentAlert.alertId}
              </span>
              <span className="text-red-200 text-xs hidden md:inline">
                · Priority Score: {currentAlert.priorityScore}
              </span>
            </div>

            <div className="text-[13px] font-display font-bold text-white mt-0.5 truncate flex items-center gap-2">
              <span>{currentAlert.emergencyType.replace(/_/g, " ")}:</span>
              <span className="text-amber-200 font-semibold">{currentAlert.patientName}</span>
              <span className="text-red-200 font-normal text-[12px] hidden sm:inline">
                ({currentAlert.age ?? 40}{currentAlert.sex || "M"})
              </span>
              <span className="text-red-200 text-[12px] flex items-center gap-1">
                <MapPin size={11} /> {currentAlert.region}
              </span>
              <span className="text-red-200 text-[12px] hidden lg:inline">
                · ASHA: <b>{currentAlert.ashaName}</b>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleAcknowledge}
            disabled={isUpdating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-lg text-[12px] font-display font-bold transition-all shadow cursor-pointer"
          >
            <Radio size={13} className="animate-pulse" />
            Acknowledge Dispatch
          </button>

          <button
            onClick={handleResolve}
            disabled={isUpdating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-[12px] font-display font-bold transition-all shadow cursor-pointer"
          >
            <CheckCircle2 size={13} />
            Resolve
          </button>

          {onNavigate && (
            <button
              onClick={() => onNavigate("sos")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[12px] font-display font-semibold transition-all cursor-pointer backdrop-blur-sm"
            >
              Open SOS Console
              <ChevronRight size={13} />
            </button>
          )}

          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
            title="Dismiss from top banner"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
