import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import {
  FrontlineWorkerDoc,
  SOSAlertDoc,
  isWorkerStale,
  subscribeFrontlineWorkers,
  subscribeSOSAlerts,
} from "../services/firebase";
import {
  Battery,
  BatteryCharging,
  BatteryWarning,
  Wifi,
  WifiOff,
  Radio,
  MapPin,
  Clock,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  AlertTriangle,
  UserCheck,
  Shield,
  Phone,
} from "lucide-react";

interface LiveMapProps {
  height?: string;
  selectedWorkerId?: string | null;
  onSelectWorker?: (worker: FrontlineWorkerDoc) => void;
  showSosAlerts?: boolean;
  onSelectSosAlert?: (alert: SOSAlertDoc) => void;
  className?: string;
}

export default function LiveMap({
  height = "420px",
  selectedWorkerId = null,
  onSelectWorker,
  showSosAlerts = true,
  onSelectSosAlert,
  className = "",
}: LiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const sosMarkersRef = useRef<Record<string, L.Marker>>({});

  const [workers, setWorkers] = useState<FrontlineWorkerDoc[]>([]);
  const [sosAlerts, setSosAlerts] = useState<SOSAlertDoc[]>([]);
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "sos">("all");
  const [selectedWorker, setSelectedWorker] = useState<FrontlineWorkerDoc | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(true);

  // Subscribe to frontline_workers in real time via Firestore
  useEffect(() => {
    const unsub = subscribeFrontlineWorkers((updatedWorkers) => {
      setWorkers(updatedWorkers);
      setIsLiveConnected(true);
    });
    return () => unsub();
  }, []);

  // Subscribe to sos_alerts in real time via Firestore
  useEffect(() => {
    if (!showSosAlerts) return;
    const unsub = subscribeSOSAlerts((updatedAlerts) => {
      setSosAlerts(updatedAlerts);
    });
    return () => unsub();
  }, [showSosAlerts]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default center: Danapur / Patna PHC region (25.6294, 85.0442)
      const map = L.map(mapContainerRef.current, {
        center: [25.6294, 85.0442],
        zoom: 13,
        zoomControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | SeVaSetu Telemetry',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = {};
        sosMarkersRef.current = {};
      }
    };
  }, []);

  // Update ASHA worker markers when workers state changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentMarkerIds = new Set<string>();

    workers.forEach((worker) => {
      if (worker.latitude == null || worker.longitude == null) return;
      currentMarkerIds.add(worker.ashaId);

      const stale = isWorkerStale(worker.lastUpdated);
      const isSelected = selectedWorkerId === worker.ashaId || selectedWorker?.ashaId === worker.ashaId;

      // Battery color
      const batteryBg =
        worker.batteryLevel >= 50
          ? "bg-emerald-500"
          : worker.batteryLevel >= 20
          ? "bg-amber-500"
          : "bg-red-500";

      // Network badge
      const isOnline = !stale && worker.networkState !== "OFFLINE";
      const networkBadge = isOnline ? worker.networkState : "OFFLINE";

      // Custom HTML Marker using L.divIcon
      const iconHtml = `
        <div class="relative group cursor-pointer" style="transform: translate(-50%, -100%);">
          <!-- Outer Pulsing Ring for Active Workers -->
          ${
            isOnline
              ? '<div class="absolute -inset-1 bg-phc-blue/30 rounded-full animate-ping pointer-events-none"></div>'
              : ""
          }
          
          <!-- Marker Body -->
          <div class="relative flex items-center justify-center w-10 h-10 rounded-2xl shadow-lg border-2 ${
            isSelected
              ? "border-blue-500 bg-phc-blue ring-4 ring-blue-300 scale-110"
              : isOnline
              ? "border-white bg-phc-blue"
              : "border-slate-300 bg-slate-500 opacity-80"
          } text-white transition-all">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            
            <!-- Battery Badge -->
            <div class="absolute -top-1.5 -right-1.5 px-1 py-0.2 rounded-full text-[8.5px] font-mono font-bold text-white shadow ${batteryBg}">
              ${worker.batteryLevel}%
            </div>
            
            <!-- Network Badge -->
            <div class="absolute -bottom-2 -left-1 px-1 py-0.2 rounded text-[8px] font-bold ${
              isOnline ? "bg-emerald-700 text-white" : "bg-slate-700 text-slate-200"
            }">
              ${networkBadge}
            </div>
          </div>

          <!-- Pin Pointer -->
          <div class="w-2.5 h-2.5 mx-auto bg-phc-blue rotate-45 -mt-1 shadow-sm ${
            isSelected ? "bg-blue-600" : isOnline ? "bg-phc-blue" : "bg-slate-500"
          }"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: "custom-asha-marker",
        html: iconHtml,
        iconSize: [40, 48],
        iconAnchor: [20, 48],
      });

      const popupContent = `
        <div style="font-family: 'Work Sans', sans-serif; min-width: 220px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
            <div>
              <div style="font-weight: 700; font-size: 14px; color: #1e293b;">${worker.ashaName}</div>
              <div style="font-size: 11px; color: #64748b; font-family: monospace;">${worker.ashaId}</div>
            </div>
            <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 9999px; ${
              isOnline ? "background-color: #dcfce7; color: #166534;" : "background-color: #f1f5f9; color: #475569;"
            }">
              ${isOnline ? "LIVE ACTIVE" : "STALE / OFFLINE"}
            </span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px; margin-bottom: 8px;">
            <div style="background-color: #f8fafc; padding: 4px 6px; border-radius: 6px;">
              <span style="color: #64748b;">Battery:</span> <b>${worker.batteryLevel}%</b>
            </div>
            <div style="background-color: #f8fafc; padding: 4px 6px; border-radius: 6px;">
              <span style="color: #64748b;">Network:</span> <b>${worker.networkState}</b>
            </div>
            <div style="background-color: #f8fafc; padding: 4px 6px; border-radius: 6px;">
              <span style="color: #64748b;">Sync Queue:</span> <b>${worker.pendingSyncQueueSize} items</b>
            </div>
            <div style="background-color: #f8fafc; padding: 4px 6px; border-radius: 6px;">
              <span style="color: #64748b;">Ward:</span> <b>${worker.ward || "Ward 1"}</b>
            </div>
          </div>

          <div style="font-size: 10px; color: #94a3b8; margin-bottom: 6px;">
            GPS: ${worker.latitude.toFixed(4)}, ${worker.longitude.toFixed(4)}
          </div>
        </div>
      `;

      if (markersRef.current[worker.ashaId]) {
        // Smoothly update existing marker position
        const existingMarker = markersRef.current[worker.ashaId];
        existingMarker.setLatLng([worker.latitude, worker.longitude]);
        existingMarker.setIcon(customIcon);
        existingMarker.setPopupContent(popupContent);
      } else {
        // Create new marker
        const marker = L.marker([worker.latitude, worker.longitude], { icon: customIcon })
          .addTo(map)
          .bindPopup(popupContent);

        marker.on("click", () => {
          setSelectedWorker(worker);
          onSelectWorker?.(worker);
        });

        markersRef.current[worker.ashaId] = marker;
      }
    });

    // Remove obsolete markers
    Object.keys(markersRef.current).forEach((id) => {
      if (!currentMarkerIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });
  }, [workers, selectedWorkerId, selectedWorker, onSelectWorker]);

  // Update SOS emergency markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !showSosAlerts) return;

    const currentSosIds = new Set<string>();

    sosAlerts.forEach((alert) => {
      if (alert.latitude == null || alert.longitude == null) return;
      currentSosIds.add(alert.alertId);

      const isDispatched = alert.status === "ACTIVE_DISPATCH" || alert.status === "active";

      const sosIconHtml = `
        <div class="relative cursor-pointer" style="transform: translate(-50%, -100%);">
          <!-- SOS Pulsing Beacon -->
          <div class="absolute -inset-2 bg-red-600/40 rounded-full animate-ping pointer-events-none"></div>
          
          <div class="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-red-600 text-white shadow-xl border-2 border-white">
            <svg class="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div class="absolute -top-2 -right-1 px-1.5 py-0.2 bg-white text-red-700 text-[8.5px] font-black font-display rounded-full shadow">
              SOS
            </div>
          </div>
          <div class="w-3 h-3 mx-auto bg-red-600 rotate-45 -mt-1 shadow-sm"></div>
        </div>
      `;

      const sosIcon = L.divIcon({
        className: "custom-sos-marker",
        html: sosIconHtml,
        iconSize: [44, 52],
        iconAnchor: [22, 52],
      });

      const popupContent = `
        <div style="font-family: 'Work Sans', sans-serif; min-width: 240px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #fecaca; padding-bottom: 6px; margin-bottom: 8px;">
            <div style="font-weight: 800; font-size: 14px; color: #dc2626;">🚨 ${alert.emergencyType.replace(/_/g, " ")}</div>
            <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 9999px; background-color: #fee2e2; color: #b91c1c;">
              ${alert.status}
            </span>
          </div>

          <div style="font-size: 13px; font-weight: 600; color: #1e293b; margin-bottom: 4px;">
            Patient: ${alert.patientName} (${alert.age ?? 40}${alert.sex || "M"})
          </div>
          <div style="font-size: 11.5px; color: #475569; margin-bottom: 6px;">
            Reported by ASHA: <b>${alert.ashaName}</b>
          </div>
          <div style="font-size: 11px; color: #64748b; background-color: #fff1f2; padding: 6px; border-radius: 6px; margin-bottom: 8px; border: 1px solid #ffe4e6;">
            ${alert.condition || alert.region}
          </div>
        </div>
      `;

      if (sosMarkersRef.current[alert.alertId]) {
        const existing = sosMarkersRef.current[alert.alertId];
        existing.setLatLng([alert.latitude, alert.longitude]);
        existing.setIcon(sosIcon);
        existing.setPopupContent(popupContent);
      } else {
        const marker = L.marker([alert.latitude, alert.longitude], { icon: sosIcon })
          .addTo(map)
          .bindPopup(popupContent);

        marker.on("click", () => {
          onSelectSosAlert?.(alert);
        });

        sosMarkersRef.current[alert.alertId] = marker;
      }
    });

    // Cleanup resolved / removed SOS pins
    Object.keys(sosMarkersRef.current).forEach((id) => {
      if (!currentSosIds.has(id)) {
        sosMarkersRef.current[id].remove();
        delete sosMarkersRef.current[id];
      }
    });
  }, [sosAlerts, showSosAlerts, onSelectSosAlert]);

  // Fit bounds to show all workers and SOS alerts
  const handleFitBounds = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const points: [number, number][] = [];
    workers.forEach((w) => {
      if (w.latitude && w.longitude) points.push([w.latitude, w.longitude]);
    });
    sosAlerts.forEach((s) => {
      if (s.latitude && s.longitude) points.push([s.latitude, s.longitude]);
    });

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  };

  // Zoom to a specific worker
  const handleFlyToWorker = (worker: FrontlineWorkerDoc) => {
    const map = mapInstanceRef.current;
    if (!map || !worker.latitude || !worker.longitude) return;

    setSelectedWorker(worker);
    map.flyTo([worker.latitude, worker.longitude], 15, { duration: 1.2 });

    const marker = markersRef.current[worker.ashaId];
    if (marker) {
      setTimeout(() => marker.openPopup(), 1200);
    }
    onSelectWorker?.(worker);
  };

  const activeWorkersCount = workers.filter((w) => !isWorkerStale(w.lastUpdated) && w.networkState !== "OFFLINE").length;
  const staleWorkersCount = workers.length - activeWorkersCount;
  const activeSosCount = sosAlerts.filter((s) => s.status === "ACTIVE_DISPATCH" || s.status === "active").length;

  return (
    <div className={`relative bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col ${className}`}>
      {/* Top Map Control Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-phc-blue-light text-phc-blue rounded-lg text-[12px] font-display font-bold">
            <Radio size={13} className="animate-pulse text-phc-blue" />
            Live Field GPS Map
          </div>
          <span className="text-[12px] text-slate-500 font-sans hidden sm:inline">
            Listening to <code className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">frontline_workers</code>
          </span>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-display font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {activeWorkersCount} Active in Field
          </div>

          {staleWorkersCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-display font-medium">
              <Clock size={11} />
              {staleWorkersCount} Stale / Offline
            </div>
          )}

          {activeSosCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 border border-red-300 text-red-700 text-[11px] font-display font-bold animate-pulse">
              <AlertTriangle size={11} />
              {activeSosCount} SOS Emergency
            </div>
          )}

          <button
            onClick={handleFitBounds}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Recenter and Fit All Workers"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      {/* Map Element Container */}
      <div className="relative flex-1 w-full" style={{ minHeight: height }}>
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Quick Worker Carousel Overlay at Bottom */}
        <div className="absolute bottom-3 left-3 right-3 z-10 flex gap-2 overflow-x-auto pb-1 pointer-events-auto">
          {workers.map((worker) => {
            const stale = isWorkerStale(worker.lastUpdated);
            const isSelected = selectedWorker?.ashaId === worker.ashaId;

            return (
              <button
                key={worker.ashaId}
                onClick={() => handleFlyToWorker(worker)}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-md transition-all cursor-pointer shadow-md text-left ${
                  isSelected
                    ? "bg-phc-blue text-white ring-2 ring-blue-300 scale-102"
                    : "bg-white/95 text-slate-800 border border-slate-200 hover:bg-white"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-display font-bold flex-shrink-0 ${
                    isSelected ? "bg-white/20 text-white" : "bg-blue-100 text-phc-blue"
                  }`}
                >
                  {worker.ashaName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <div className="text-[12px] font-display font-bold leading-tight truncate max-w-[110px]">
                    {worker.ashaName}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] mt-0.5 opacity-90">
                    <span className="font-mono">{worker.batteryLevel}%</span>
                    <span>·</span>
                    <span className={stale ? "text-amber-500 font-bold" : "text-emerald-500 font-bold"}>
                      {stale ? "Stale" : worker.networkState}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
