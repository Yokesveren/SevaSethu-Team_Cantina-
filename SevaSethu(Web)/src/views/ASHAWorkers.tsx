import { useEffect, useState } from "react";
import {
  Phone,
  Users,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  Battery,
  BatteryCharging,
  Wifi,
  WifiOff,
  Radio,
  MapPin,
  RefreshCw,
} from "lucide-react";
import LiveMap from "../components/LiveMap";
import {
  FrontlineWorkerDoc,
  isWorkerStale,
  subscribeFrontlineWorkers,
} from "../services/firebase";

export default function ASHAWorkers() {
  const [workers, setWorkers] = useState<FrontlineWorkerDoc[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);

  // Feature 1: Live onSnapshot listener on `frontline_workers` collection
  useEffect(() => {
    const unsub = subscribeFrontlineWorkers((updatedWorkers) => {
      setWorkers(updatedWorkers);
      if (!selectedWorkerId && updatedWorkers.length > 0) {
        setSelectedWorkerId(updatedWorkers[0].ashaId);
      }
    });
    return () => unsub();
  }, [selectedWorkerId]);

  const activeCount = workers.filter(
    (w) => !isWorkerStale(w.lastUpdated) && w.networkState !== "OFFLINE"
  ).length;

  const totalHouseholds = workers.reduce((s, w) => s + (w.households ?? 0), 0);
  const totalHomeVisits = workers.reduce((s, w) => s + (w.homeVisits ?? 0), 0);
  const totalPendingSync = workers.reduce((s, w) => s + (w.pendingSyncQueueSize ?? 0), 0);

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-phc-text text-2xl leading-none">
            ASHA Frontline Workers &amp; Field Telemetry
          </h1>
          <p className="text-[13px] text-phc-muted mt-1.5 font-sans">
            Danapur Block · {workers.length} registered field workers · Real-time Firestore sync (<code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-[11px]">frontline_workers</code>)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 font-display font-semibold">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Firestore Sync Active
          </div>
        </div>
      </div>

      {/* Summary KPI stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Active in Field", value: `${activeCount} / ${workers.length}`, color: "text-emerald-700", sub: "Broadcasting GPS coordinates" },
          { label: "Total Households Covered", value: totalHouseholds.toString(), color: "text-phc-blue", sub: "Across 5 Panchayat wards" },
          { label: "Home Visits Logged", value: totalHomeVisits.toString(), color: "text-phc-text", sub: "Maternal ANC & child checks" },
          { label: "Pending Sync Items", value: totalPendingSync.toString(), color: totalPendingSync > 0 ? "text-amber-700" : "text-emerald-700", sub: "Offline sync queue in field" },
        ].map((s) => (
          <div key={s.label} className="bg-phc-surface border border-phc-border rounded-xl px-4 py-4 shadow-xs">
            <div className={`font-display font-bold text-2xl leading-none ${s.color || "text-phc-text"}`}>{s.value}</div>
            <div className="text-[12px] text-phc-muted mt-1 font-semibold">{s.label}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Feature 1: Live GPS Location Map */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-phc-text text-[15px] flex items-center gap-2">
            <Radio size={16} className="text-phc-blue animate-pulse" />
            Live GPS Tracking Map (<code className="font-mono text-[12px] bg-slate-100 px-1 py-0.5 rounded">frontline_workers</code>)
          </h2>
          <span className="text-[12px] text-slate-500 font-mono">
            Plots live coordinates, battery level &amp; network connectivity
          </span>
        </div>
        <LiveMap
          height="380px"
          selectedWorkerId={selectedWorkerId}
          onSelectWorker={(w) => setSelectedWorkerId(w.ashaId)}
        />
      </div>

      {/* Workers Cards List */}
      <div className="space-y-3">
        <h2 className="font-display font-semibold text-phc-text text-[15px]">
          Field Worker Telemetry &amp; Coverage List
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {workers.map((w) => {
            const isStale = isWorkerStale(w.lastUpdated);
            const isOnline = !isStale && w.networkState !== "OFFLINE";
            const isSelected = selectedWorkerId === w.ashaId;

            const timeAgoFormatted = typeof w.lastUpdated === "number"
              ? `${Math.max(1, Math.round((Date.now() - w.lastUpdated) / 60000))} min ago`
              : "Just now";

            return (
              <div
                key={w.ashaId}
                onClick={() => setSelectedWorkerId(w.ashaId)}
                className={`bg-phc-surface border rounded-xl overflow-hidden transition-all cursor-pointer ${
                  isSelected
                    ? "border-phc-blue ring-2 ring-phc-blue/20 shadow-md"
                    : "border-phc-border hover:border-phc-blue/40"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                  {/* Avatar & Identity */}
                  <div className="flex items-center gap-4 min-w-[240px]">
                    <div className="w-12 h-12 rounded-full bg-phc-blue flex items-center justify-center flex-shrink-0 text-white font-display font-bold text-[15px] shadow-xs">
                      {w.ashaName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-phc-text text-[15px]">
                          {w.ashaName}
                        </span>
                        <span
                          className={`text-[10px] font-display font-bold px-2 py-0.5 rounded-full ${
                            isOnline
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {isOnline ? "LIVE ACTIVE" : "STALE / OFFLINE"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[12px] text-phc-muted">
                        <span>{w.ward || "Danapur Block"}</span>
                        <span className="text-phc-border">·</span>
                        <span className="font-mono text-[11px] text-phc-blue">{w.ashaId}</span>
                        {w.mobile && (
                          <>
                            <span className="text-phc-border">·</span>
                            <span className="flex items-center gap-1 text-[11px] text-phc-muted">
                              <Phone size={10} />
                              {w.mobile}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Feature 1: Telemetry Badges (Battery, Network, Sync Queue) */}
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Battery Badge */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                      <Battery
                        size={14}
                        className={
                          w.batteryLevel >= 50
                            ? "text-emerald-600"
                            : w.batteryLevel >= 20
                            ? "text-amber-600"
                            : "text-red-600"
                        }
                      />
                      <div className="text-left">
                        <div className="text-[9px] text-slate-400 font-sans leading-none">Battery</div>
                        <div className="font-mono font-bold text-[12px] text-slate-800 leading-tight">
                          {w.batteryLevel}%
                        </div>
                      </div>
                    </div>

                    {/* Network Badge */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                      {isOnline ? (
                        <Wifi size={14} className="text-emerald-600" />
                      ) : (
                        <WifiOff size={14} className="text-slate-400" />
                      )}
                      <div className="text-left">
                        <div className="text-[9px] text-slate-400 font-sans leading-none">Network</div>
                        <div className="font-display font-bold text-[12px] text-slate-800 leading-tight">
                          {isOnline ? w.networkState : "OFFLINE"}
                        </div>
                      </div>
                    </div>

                    {/* Pending Sync Queue Badge */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                      <RefreshCw size={13} className={w.pendingSyncQueueSize > 0 ? "text-amber-600 animate-spin" : "text-emerald-600"} />
                      <div className="text-left">
                        <div className="text-[9px] text-slate-400 font-sans leading-none">Sync Queue</div>
                        <div className="font-mono font-bold text-[12px] text-slate-800 leading-tight">
                          {w.pendingSyncQueueSize} items
                        </div>
                      </div>
                    </div>

                    {/* GPS Coordinates */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                      <MapPin size={13} className="text-phc-blue" />
                      <div className="text-left">
                        <div className="text-[9px] text-slate-400 font-sans leading-none">Live GPS</div>
                        <div className="font-mono text-[11px] text-slate-700 leading-tight">
                          {w.latitude.toFixed(3)}, {w.longitude.toFixed(3)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sync Timestamp & Action */}
                  <div className="flex items-center gap-3">
                    <div className="text-right text-[11px] text-phc-muted">
                      <div className="flex items-center justify-end gap-1">
                        <Clock size={11} className={isOnline ? "text-emerald-600" : "text-amber-500"} />
                        <span>Last ping: {timeAgoFormatted}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedWorkerId(w.ashaId)}
                      className="px-3 py-1.5 text-[12px] font-display font-semibold text-phc-blue border border-phc-blue/30 rounded-lg hover:bg-phc-blue-light transition-colors"
                    >
                      Focus on Map
                    </button>
                  </div>
                </div>

                {/* Progress bar for home visits */}
                {w.households && w.homeVisits && (
                  <div className="px-5 pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10.5px] text-phc-muted">
                        Home visits completed ({w.homeVisits} / {w.households} households)
                      </span>
                      <span className="text-[10.5px] font-mono text-phc-muted">
                        {Math.round((w.homeVisits / w.households) * 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-phc-blue rounded-full transition-all"
                        style={{ width: `${Math.min((w.homeVisits / w.households) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
