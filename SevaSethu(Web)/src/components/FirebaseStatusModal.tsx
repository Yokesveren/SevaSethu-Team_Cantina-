import { useState, useEffect } from "react";
import {
  getStoredFirebaseConfig,
  saveFirebaseConfigToStorage,
  resetFirebaseConfigStorage,
  isRealFirebaseConfigured,
  testFirebaseConnection,
  FirebaseConfigObject,
} from "../services/firebase";
import {
  Flame,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  ExternalLink,
  ShieldCheck,
  Server,
  Layers,
  Database,
  Info,
} from "lucide-react";

interface FirebaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FirebaseStatusModal({ isOpen, onClose }: FirebaseStatusModalProps) {
  const [config, setConfig] = useState<FirebaseConfigObject>(getStoredFirebaseConfig());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    projectId: string;
    message: string;
    collections?: Record<string, number>;
  } | null>(null);

  const isConfigured = isRealFirebaseConfigured();

  useEffect(() => {
    if (isOpen) {
      handleTest();
    }
  }, [isOpen]);

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await testFirebaseConnection();
      setTestResult(res);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveFirebaseConfigToStorage(config);
  };

  const handleReset = () => {
    if (confirm("Reset Firebase credentials to defaults?")) {
      resetFirebaseConfigStorage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isConfigured ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-700"}`}>
              <Flame size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-900 text-base">
                Firebase Firestore &amp; Storage Live Connection
              </h3>
              <p className="text-xs text-slate-500 font-sans">
                Real-time synchronization with ASHA Android Mobile App
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {/* Live Status Banner */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3.5 ${
              testResult?.success
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : isConfigured
                ? "bg-amber-50 border-amber-200 text-amber-900"
                : "bg-blue-50 border-blue-200 text-blue-900"
            }`}
          >
            {testResult?.success ? (
              <CheckCircle2 size={22} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={22} className="text-amber-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs space-y-1">
              <div className="font-display font-bold text-sm">
                {testResult?.success
                  ? `🟢 Connected to Project: ${testResult.projectId}`
                  : isConfigured
                  ? "⚠️ Firebase Configured — Verifying Live Connection…"
                  : "ℹ️ Firebase Keys Not Configured Yet"}
              </div>
              <p className="leading-relaxed opacity-90">
                {testResult?.message || "Please verify your Firebase API Key & Project ID to sync live data with your mobile device."}
              </p>

              {testResult?.collections && (
                <div className="pt-2 mt-2 border-t border-emerald-200/60 grid grid-cols-3 gap-2 text-[11px] font-mono">
                  {Object.entries(testResult.collections).map(([col, count]) => (
                    <div key={col} className="bg-white/80 px-2 py-1 rounded border border-emerald-200">
                      <b>{col}:</b> {count >= 0 ? `${count} docs` : "Accessible"}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleTest}
              disabled={testing}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-display font-semibold hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer flex-shrink-0"
            >
              <RefreshCw size={12} className={testing ? "animate-spin" : ""} />
              {testing ? "Testing…" : "Test Live"}
            </button>
          </div>

          {/* Quick Explanation for Mobile App Sync */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 space-y-2">
            <div className="font-display font-bold text-slate-900 flex items-center gap-1.5">
              <Info size={14} className="text-phc-blue" />
              Where Mobile App Data Appears on this Website:
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11.5px]">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="font-bold text-phc-blue">📱 Add Patient in App</span>
                <p className="text-slate-500 mt-0.5">Writes to <code className="font-mono text-slate-700">patients</code> collection &rarr; Appears under <b>"Patients EHR"</b></p>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="font-bold text-red-600">📱 Panic / SOS Button</span>
                <p className="text-slate-500 mt-0.5">Writes to <code className="font-mono text-slate-700">sos_alerts</code> &rarr; Triggers <b>Global Emergency Banner</b></p>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="font-bold text-amber-600">📱 Triage Encounter</span>
                <p className="text-slate-500 mt-0.5">Writes to <code className="font-mono text-slate-700">triage_cases</code> &rarr; Appears in <b>"Triage &amp; Queue"</b></p>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="font-bold text-emerald-600">📱 Live GPS / Battery</span>
                <p className="text-slate-500 mt-0.5">Writes to <code className="font-mono text-slate-700">frontline_workers</code> &rarr; Moves markers on <b>Live GPS Map</b></p>
              </div>
            </div>
          </div>

          {/* Configuration Form */}
          <form onSubmit={handleSave} className="space-y-3.5">
            <div className="font-display font-bold text-slate-900 text-xs uppercase tracking-wider">
              Firebase Web App Credentials
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-display font-semibold text-slate-700 block mb-1">
                  API Key (<code className="font-mono">apiKey</code>)
                </label>
                <input
                  type="text"
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value.trim() })}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-phc-blue outline-none font-mono text-xs"
                  required
                />
              </div>

              <div>
                <label className="font-display font-semibold text-slate-700 block mb-1">
                  Project ID (<code className="font-mono">projectId</code>)
                </label>
                <input
                  type="text"
                  value={config.projectId}
                  onChange={(e) => setConfig({ ...config, projectId: e.target.value.trim() })}
                  placeholder="sevasetu-2026"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-phc-blue outline-none font-mono text-xs"
                  required
                />
              </div>

              <div>
                <label className="font-display font-semibold text-slate-700 block mb-1">
                  Auth Domain (<code className="font-mono">authDomain</code>)
                </label>
                <input
                  type="text"
                  value={config.authDomain}
                  onChange={(e) => setConfig({ ...config, authDomain: e.target.value.trim() })}
                  placeholder="project-id.firebaseapp.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-phc-blue outline-none font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-display font-semibold text-slate-700 block mb-1">
                  Storage Bucket (<code className="font-mono">storageBucket</code>)
                </label>
                <input
                  type="text"
                  value={config.storageBucket}
                  onChange={(e) => setConfig({ ...config, storageBucket: e.target.value.trim() })}
                  placeholder="project-id.firebasestorage.app"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-phc-blue outline-none font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-display font-semibold text-slate-700 block mb-1">
                  Messaging Sender ID (<code className="font-mono">messagingSenderId</code>)
                </label>
                <input
                  type="text"
                  value={config.messagingSenderId}
                  onChange={(e) => setConfig({ ...config, messagingSenderId: e.target.value.trim() })}
                  placeholder="1029384756"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-phc-blue outline-none font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-display font-semibold text-slate-700 block mb-1">
                  App ID (<code className="font-mono">appId</code>)
                </label>
                <input
                  type="text"
                  value={config.appId}
                  onChange={(e) => setConfig({ ...config, appId: e.target.value.trim() })}
                  placeholder="1:1029384756:web:abcdef"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-phc-blue outline-none font-mono text-xs"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-500 hover:text-red-600 font-display underline cursor-pointer"
              >
                Reset to default
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-display border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-phc-blue text-white rounded-xl text-xs font-display font-bold hover:bg-phc-blue-dark shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck size={14} />
                  Save &amp; Connect Live
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
