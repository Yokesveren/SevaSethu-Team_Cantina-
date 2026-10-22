import { useEffect, useState } from "react";
import {
  Siren,
  Phone,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  UserCheck,
  ChevronRight,
  Plus,
  Radio,
  ExternalLink,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  SOSAlertDoc,
  subscribeSOSAlerts,
  updateSOSAlertStatus,
} from "../services/firebase";
import LiveMap from "../components/LiveMap";

const LEVEL_META: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
  RED: { label: "SOS CRITICAL", bg: "bg-red-600", text: "text-white", border: "border-red-700", dot: "bg-red-300" },
  YELLOW: { label: "URGENT", bg: "bg-amber-100", text: "text-amber-900", border: "border-amber-300", dot: "bg-amber-400" },
  GREEN: { label: "ROUTINE", bg: "bg-emerald-100", text: "text-emerald-900", border: "border-emerald-300", dot: "bg-emerald-400" },
};

const STATUS_META: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  ACTIVE_DISPATCH: { label: "Active Dispatch — Immediate Action", bg: "bg-red-600", text: "text-white", icon: <AlertTriangle size={11} className="animate-pulse" /> },
  active: { label: "Active Dispatch — Immediate Action", bg: "bg-red-600", text: "text-white", icon: <AlertTriangle size={11} className="animate-pulse" /> },
  ACKNOWLEDGED: { label: "Acknowledged by PHC", bg: "bg-amber-100", text: "text-amber-900", icon: <Radio size={11} /> },
  dispatched: { label: "Ambulance Dispatched", bg: "bg-blue-100", text: "text-blue-900", icon: <Radio size={11} /> },
  RESOLVED: { label: "Resolved", bg: "bg-emerald-50", text: "text-emerald-800", icon: <CheckCircle2 size={11} /> },
  resolved: { label: "Resolved", bg: "bg-emerald-50", text: "text-emerald-800", icon: <CheckCircle2 size={11} /> },
};

function AlertCard({
  alert,
  active,
  onClick,
}: {
  alert: SOSAlertDoc;
  active: boolean;
  onClick: () => void;
}) {
  const lm = LEVEL_META[alert.riskBand] || LEVEL_META.RED;
  const sm = STATUS_META[alert.status] || STATUS_META.ACTIVE_DISPATCH;
  const isCritical = alert.status === "ACTIVE_DISPATCH" || alert.status === "active";

  const timeFormatted = typeof alert.timestamp === "number"
    ? new Date(alert.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : "Recent";

  return (
    <div
      onClick={onClick}
      className={`border rounded-xl overflow-hidden cursor-pointer transition-all ${
        active ? "border-phc-blue shadow-lg ring-2 ring-phc-blue/20" : "border-phc-border hover:border-red-300"
      } ${isCritical ? "shadow-md shadow-red-100 border-red-300" : ""}`}
    >
      <div className={`flex items-center gap-2 px-4 py-2 ${isCritical ? "bg-red-600" : "bg-slate-50 border-b border-slate-200"}`}>
        <div className={`w-2 h-2 rounded-full ${lm.dot} ${isCritical ? "animate-pulse" : ""}`} />
        <span className={`text-[11px] font-display font-bold uppercase tracking-wide ${isCritical ? "text-white" : "text-red-700"}`}>
          {alert.emergencyType.replace(/_/g, " ")} · {alert.alertId}
        </span>
        <span className={`ml-auto text-[10.5px] font-mono ${isCritical ? "text-red-200" : "text-phc-subtle"}`}>
          {timeFormatted}
        </span>
      </div>
      <div className="px-4 py-3 bg-phc-surface space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <span className="font-display font-semibold text-phc-text text-[13.5px]">
            {alert.patientName}{" "}
            <span className="font-sans font-normal text-phc-muted text-[12px]">
              {alert.age ?? 40}{alert.sex || "M"}
            </span>
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-display font-bold flex-shrink-0 ${sm.bg} ${sm.text}`}>
            {sm.icon} {sm.label}
          </span>
        </div>
        <p className="text-[12px] text-phc-muted leading-snug">{alert.condition || alert.region}</p>
        <div className="flex items-center gap-2 mt-2">
          <MapPin size={10} className="text-phc-subtle flex-shrink-0" />
          <span className="text-[11px] text-phc-subtle">{alert.region}</span>
        </div>
        {alert.ashaName && (
          <div className="flex items-center gap-1 mt-1 text-[11px] text-phc-green">
            <UserCheck size={10} />
            ASHA: {alert.ashaName} ({alert.ashaId})
          </div>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-phc-border-light text-[10.5px] text-phc-subtle">
          <span>Priority Score: {alert.priorityScore}</span>
          <ChevronRight size={12} className="text-phc-subtle" />
        </div>
      </div>
    </div>
  );
}

function AlertDetail({
  alert,
  onAcknowledge,
  onResolve,
  isUpdating,
}: {
  alert: SOSAlertDoc;
  onAcknowledge: () => void;
  onResolve: () => void;
  isUpdating: boolean;
}) {
  const lm = LEVEL_META[alert.riskBand] || LEVEL_META.RED;
  const sm = STATUS_META[alert.status] || STATUS_META.ACTIVE_DISPATCH;
  const isCritical = alert.status === "ACTIVE_DISPATCH" || alert.status === "active";

  const timeFormatted = typeof alert.timestamp === "number"
    ? new Date(alert.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : "Recent";

  return (
    <div className="bg-phc-surface border border-phc-border rounded-xl overflow-hidden shadow-sm space-y-0">
      {/* Header strip */}
      <div className={`flex items-center gap-3 px-5 py-3.5 border-b ${isCritical ? "bg-red-600 border-red-700 text-white" : "bg-red-50 border-red-200"}`}>
        <Siren size={20} className={isCritical ? "text-white animate-bounce" : "text-red-600"} />
        <div>
          <div className={`font-display font-bold text-[16px] leading-none ${isCritical ? "text-white" : "text-red-800"}`}>
            {alert.emergencyType.replace(/_/g, " ")} — {alert.alertId}
          </div>
          <div className={`text-[11.5px] mt-1 font-mono ${isCritical ? "text-red-200" : "text-red-600"}`}>
            Logged at {timeFormatted} · Priority Score: {alert.priorityScore}
          </div>
        </div>
        <span className={`ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded text-[11.5px] font-display font-bold ${sm.bg} ${sm.text}`}>
          {sm.icon} {sm.label}
        </span>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Patient & Condition */}
        <div>
          <div className="text-[10.5px] font-display font-bold text-phc-muted uppercase tracking-widest mb-2">
            Emergency Patient Details
          </div>
          <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0 text-red-600">
              <AlertTriangle size={22} />
            </div>
            <div>
              <div className="font-display font-bold text-phc-text text-[16px]">
                {alert.patientName}{" "}
                <span className="text-[13px] font-sans font-normal text-phc-muted">
                  {alert.age ?? 40} yrs · {alert.sex === "F" ? "Female" : "Male"} · ID: {alert.patientId}
                </span>
              </div>
              <div className="text-[13.5px] text-slate-800 mt-1 font-medium leading-snug">
                {alert.condition || alert.emergencyType}
              </div>
              {alert.ashaName && (
                <div className="flex items-center gap-1.5 mt-2 text-[12px] text-phc-green font-display font-semibold">
                  <UserCheck size={13} /> Reported by ASHA: {alert.ashaName} ({alert.ashaId})
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Location & GPS Pin */}
        <div>
          <div className="text-[10.5px] font-display font-bold text-phc-muted uppercase tracking-widest mb-2">
            Exact GPS Emergency Coordinates
          </div>
          <div className="flex items-center justify-between gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-phc-blue flex-shrink-0" />
              <div>
                <div className="text-[13.5px] font-display font-semibold text-slate-900">{alert.region}</div>
                <div className="text-[11.5px] font-mono text-slate-600">
                  Latitude: {alert.latitude.toFixed(4)} | Longitude: {alert.longitude.toFixed(4)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Taken Log */}
        {alert.action && (
          <div>
            <div className="text-[10.5px] font-display font-bold text-phc-muted uppercase tracking-widest mb-2">
              Action Taken &amp; Audit Log
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] text-phc-text leading-relaxed font-sans">
              {alert.action}
            </div>
          </div>
        )}

        {/* Quick Emergency Contacts */}
        <div>
          <div className="text-[10.5px] font-display font-bold text-phc-muted uppercase tracking-widest mb-2">
            Immediate Response Contacts
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: "108 ALS Ambulance", number: "108" },
              { label: "AIIMS Patna Emergency", number: "0612-222-1080" },
              { label: "PMCH Patna Emergency", number: "0612-235-4000" },
              { label: "Danapur Sub-Divisional Hospital", number: "0612-226-5432" },
            ].map((c) => (
              <a
                key={c.label}
                href={`tel:${c.number}`}
                className="flex items-center gap-3 px-3 py-2.5 bg-white border border-phc-border rounded-xl hover:border-phc-blue hover:bg-blue-50/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 text-phc-blue">
                  <Phone size={13} />
                </div>
                <div>
                  <div className="text-[12px] font-display font-semibold text-phc-text leading-none">{c.label}</div>
                  <div className="text-[11px] font-mono text-phc-blue mt-1">{c.number}</div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Feature 4: Status Update Buttons writing back to Firestore */}
        <div className="flex gap-3 pt-3 border-t border-phc-border">
          {isCritical ? (
            <>
              <button
                onClick={onAcknowledge}
                disabled={isUpdating}
                className="flex-1 py-3 text-[13px] font-display font-bold bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Radio size={14} />}
                Acknowledge Alert
              </button>
              <button
                onClick={onResolve}
                disabled={isUpdating}
                className="flex-1 py-3 text-[13px] font-display font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Mark Resolved
              </button>
            </>
          ) : (
            <button
              onClick={onResolve}
              disabled={isUpdating || alert.status === "RESOLVED" || alert.status === "resolved"}
              className="flex-1 py-3 text-[13px] font-display font-semibold border border-phc-border hover:bg-slate-50 text-slate-700 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 size={14} className="text-emerald-600" />
              {alert.status === "RESOLVED" || alert.status === "resolved" ? "Case Marked Resolved" : "Mark Resolved"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SOS() {
  const [alerts, setAlerts] = useState<SOSAlertDoc[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Feature 4: Real-time listener on `sos_alerts` collection
  useEffect(() => {
    const unsub = subscribeSOSAlerts((updatedAlerts) => {
      setAlerts(updatedAlerts);
      if (!selectedAlertId && updatedAlerts.length > 0) {
        setSelectedAlertId(updatedAlerts[0].alertId);
      }
    });
    return () => unsub();
  }, [selectedAlertId]);

  const selectedAlert = alerts.find((a) => a.alertId === selectedAlertId) || alerts[0];
  const activeAlerts = alerts.filter((a) => a.status === "ACTIVE_DISPATCH" || a.status === "active");
  const activeCount = activeAlerts.length;

  const handleAcknowledge = async () => {
    if (!selectedAlert) return;
    setIsUpdating(true);
    try {
      await updateSOSAlertStatus(
        selectedAlert.alertId,
        "ACKNOWLEDGED",
        "Acknowledged by Dr. Aravind Kumar at PHC console"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedAlert) return;
    setIsUpdating(true);
    try {
      await updateSOSAlertStatus(
        selectedAlert.alertId,
        "RESOLVED",
        "Marked resolved by Dr. Aravind Kumar at PHC."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-phc-text text-2xl leading-none flex items-center gap-2.5">
            {activeCount > 0 && <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping inline-block" />}
            Emergency SOS Escalation Console
          </h1>
          <p className="text-[13px] text-phc-muted mt-1.5 font-sans">
            Real-time listener on <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-[11px]">sos_alerts</code> · Field panic button &amp; red-flag escalations
          </p>
        </div>
      </div>

      {/* Feature 4: High-Visibility Alert Banner for ACTIVE_DISPATCH */}
      {activeCount > 0 && activeAlerts[0] && (
        <div className="bg-gradient-to-r from-red-600 via-red-700 to-rose-700 text-white rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl border-2 border-red-400 animate-in fade-in">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
              <Siren size={26} className="animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-white text-red-700 text-[10.5px] font-black font-display uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-xs">
                  ACTIVE SOS DISPATCH
                </span>
                <span className="font-mono text-xs text-red-100 font-bold">
                  {activeAlerts[0].alertId}
                </span>
              </div>
              <div className="font-display font-bold text-[17px] mt-1">
                {activeAlerts[0].emergencyType.replace(/_/g, " ")} — {activeAlerts[0].patientName}
              </div>
              <div className="text-[12.5px] text-red-100 mt-0.5 flex items-center gap-2">
                <span>{activeAlerts[0].region}</span>
                <span>·</span>
                <span>Reported by ASHA: <b>{activeAlerts[0].ashaName}</b></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSelectedAlertId(activeAlerts[0].alertId)}
              className="px-4 py-2 bg-white text-red-700 rounded-xl text-[12.5px] font-display font-bold hover:bg-red-50 transition-colors shadow-sm cursor-pointer"
            >
              Focus Alert
            </button>
            <button
              onClick={handleAcknowledge}
              disabled={isUpdating}
              className="px-4 py-2 bg-amber-400 text-slate-900 rounded-xl text-[12.5px] font-display font-bold hover:bg-amber-300 transition-colors shadow-sm cursor-pointer"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}

      {/* GPS Map with SOS Pins */}
      <div className="space-y-2">
        <h2 className="font-display font-semibold text-phc-text text-[15px] flex items-center gap-2">
          <MapPin size={16} className="text-red-600" />
          Emergency GPS Pins &amp; ASHA Field Dispatch Map
        </h2>
        <LiveMap
          height="340px"
          showSosAlerts={true}
          onSelectSosAlert={(alert) => setSelectedAlertId(alert.alertId)}
        />
      </div>

      {/* Two-col: list + detail */}
      <div className="grid grid-cols-[380px_1fr] gap-6 items-start">
        <div className="flex flex-col gap-3">
          <div className="text-[11px] font-display font-bold text-phc-muted uppercase tracking-widest mb-1">
            {alerts.length} SOS Alerts in Firestore Queue
          </div>
          {alerts.map((a) => (
            <AlertCard
              key={a.alertId}
              alert={a}
              active={selectedAlert?.alertId === a.alertId}
              onClick={() => setSelectedAlertId(a.alertId)}
            />
          ))}
        </div>

        {selectedAlert && (
          <AlertDetail
            alert={selectedAlert}
            onAcknowledge={handleAcknowledge}
            onResolve={handleResolve}
            isUpdating={isUpdating}
          />
        )}
      </div>
    </div>
  );
}
