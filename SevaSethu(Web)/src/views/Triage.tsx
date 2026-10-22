import { useState, useRef, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  Clock,
  Loader2,
  CheckCircle2,
  CornerUpRight,
  UserCheck,
  Plus,
  ChevronRight,
  Activity,
  Mic,
  MicOff,
  Send,
  Wifi,
  WifiOff,
  MessageSquare,
  Stethoscope,
  Brain,
  Tag,
  ArrowLeft,
  Zap,
  Volume2,
  ShieldCheck,
  ChevronDown,
  FileText,
  Heart,
  Thermometer,
  Wind,
  Search,
  Trash2,
  Image as ImageIcon,
  ZoomIn,
  X,
  AlertCircle,
} from "lucide-react";
import {
  TriageCaseDoc,
  CaseStreamMessageDoc,
  subscribeTriageCases,
  subscribeCaseStream,
  sendDoctorReply,
  deleteTriageCaseDoc,
} from "../services/firebase";

// ─── Types ────────────────────────────────────────────────────────────────────

type Acuity = "emergency" | "urgent" | "moderate" | "routine";
type TriageStatus = "waiting" | "assessing" | "treating" | "referred" | "done";
type Lang = "hi-IN" | "ta-IN" | "mr-IN" | "en-IN";

interface ExtractedEntity {
  type: "symptom" | "vital" | "drug" | "diagnosis" | "duration";
  value: string;
  code?: string;
  label: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LANG_META: Record<Lang, { label: string; native: string; flag: string }> = {
  "hi-IN": { label: "Hindi", native: "हिंदी", flag: "🇮🇳" },
  "ta-IN": { label: "Tamil", native: "தமிழ்", flag: "🌺" },
  "mr-IN": { label: "Marathi", native: "मराठी", flag: "🟠" },
  "en-IN": { label: "English", native: "English", flag: "🔤" },
};

// Feature 2: High-contrast, distinct risk band & acuity styling
const ACUITY_META: Record<Acuity, { label: string; color: string; bg: string; border: string; dot: string; badgeBg: string; scoreRange: string }> = {
  emergency: {
    label: "Emergency (RED)",
    color: "text-red-700",
    bg: "bg-red-50/80",
    border: "border-red-200",
    dot: "bg-red-500",
    badgeBg: "bg-red-100 text-red-700 border-red-200",
    scoreRange: "Score >80",
  },
  urgent: {
    label: "Urgent (YELLOW)",
    color: "text-amber-800",
    bg: "bg-amber-50/80",
    border: "border-amber-200",
    dot: "bg-amber-500",
    badgeBg: "bg-amber-100 text-amber-800 border-amber-200",
    scoreRange: "Score 50–80",
  },
  moderate: {
    label: "Moderate (YELLOW)",
    color: "text-yellow-800",
    bg: "bg-yellow-50/80",
    border: "border-yellow-200",
    dot: "bg-yellow-500",
    badgeBg: "bg-yellow-100 text-yellow-800 border-yellow-200",
    scoreRange: "Score 50–80",
  },
  routine: {
    label: "Routine (GREEN)",
    color: "text-emerald-700",
    bg: "bg-emerald-50/80",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200",
    scoreRange: "Score <50",
  },
};

const STATUS_META: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  waiting: { label: "Waiting", bg: "bg-amber-50", text: "text-amber-800", icon: <Clock size={11} /> },
  assessing: { label: "Assessing", bg: "bg-blue-50", text: "text-blue-700", icon: <Activity size={11} /> },
  treating: { label: "In Treatment", bg: "bg-blue-100", text: "text-blue-900", icon: <Loader2 size={11} className="animate-spin" /> },
  referred: { label: "Referred", bg: "bg-violet-50", text: "text-violet-800", icon: <CornerUpRight size={11} /> },
  done: { label: "Done", bg: "bg-slate-100", text: "text-slate-600", icon: <CheckCircle2 size={11} /> },
  reviewed: { label: "Assigned & Reviewed", bg: "bg-emerald-50", text: "text-emerald-800", icon: <CheckCircle2 size={11} /> },
  submitted: { label: "Submitted", bg: "bg-sky-50", text: "text-sky-800", icon: <Clock size={11} /> },
  active: { label: "Active", bg: "bg-blue-50", text: "text-blue-700", icon: <Activity size={11} /> },
  approved_connected: { label: "Approved & Connected", bg: "bg-emerald-50", text: "text-emerald-800", icon: <CheckCircle2 size={11} /> },
  pending_approval: { label: "Pending Approval", bg: "bg-amber-50", text: "text-amber-800", icon: <Clock size={11} /> },
};

function getStatusMeta(status?: string) {
  const key = (status || "waiting").toLowerCase();
  return STATUS_META[key] || STATUS_META[status || ""] || STATUS_META.waiting;
}

const ENTITY_COLORS: Record<ExtractedEntity["type"], string> = {
  symptom: "bg-red-50 text-red-700 border-red-200",
  vital: "bg-blue-50 text-blue-700 border-blue-200",
  drug: "bg-violet-50 text-violet-700 border-violet-200",
  diagnosis: "bg-orange-50 text-orange-700 border-orange-200",
  duration: "bg-slate-100 text-slate-600 border-slate-200",
};

// ─── NLP Entity Extraction ────────────────────────────────────────────────────

function extractEntities(text: string): ExtractedEntity[] {
  const t = text.toLowerCase();
  const entities: ExtractedEntity[] = [];

  const SYMPTOM_MAP: [RegExp, string, string][] = [
    [/chest pain|सीने में दर्द|மார்பு வலி|छाती दुखणे/, "Chest pain", "SNOMED:29857009"],
    [/fever|बुखार|காய்ச்சல்|ताप/, "Fever", "SNOMED:386661006"],
    [/headache|सिरदर्द|தலைவலி|डोकेदुखी/, "Headache", "SNOMED:25064002"],
    [/breathless|dyspnea|सांस|மூச்சுத்திணறல்|दम लागणे/, "Dyspnoea", "SNOMED:230145002"],
    [/vomit|nausea|उल्टी|வாந்தி|उलटी/, "Nausea/Vomiting", "SNOMED:422587007"],
    [/cough|खांसी|இருமல்|खोकला/, "Cough", "SNOMED:49727002"],
    [/swelling|edema|सूजन|வீக்கம்|सूज/, "Oedema", "SNOMED:267038008"],
    [/pain|दर्द|வலி|वेदना/, "Pain", "SNOMED:22253000"],
    [/diaphoresis|sweating|पसीना|வியர்வை/, "Diaphoresis", "SNOMED:415690000"],
  ];

  const VITAL_MAP: [RegExp, string][] = [
    [/bp|blood pressure|\d{2,3}\/\d{2,3}/, "BP"],
    [/spo2|oxygen|ऑक्सीजन|ஆக்சிஜன்/, "SpO₂"],
    [/pulse|heart rate|नाड़ी|நாடி/, "Pulse"],
    [/temperature|temp|बुखार|வெப்பநிலை/, "Temperature"],
  ];

  const DRUG_MAP: [RegExp, string][] = [
    [/aspirin|एस्पिरिन/, "Aspirin"],
    [/paracetamol|पैरासिटामोल|பாராசிட்டமால்/, "Paracetamol"],
    [/metformin|मेटफॉर्मिन/, "Metformin"],
    [/amlodipine|अम्लोडिपाइन/, "Amlodipine"],
    [/ecg|iv|ivf|heparin|nitro/, "Medication/Procedure"],
  ];

  const DUR_MAP: [RegExp, string][] = [
    [/(\d+)\s*(day|din|दिन|நாள்|दिवस)/, "$1 days"],
    [/(\d+)\s*(hour|ghanta|घंटे|மணி)/, "$1 hours"],
    [/(\d+)\s*(min|minute|मिनट)/, "$1 minutes"],
  ];

  SYMPTOM_MAP.forEach(([re, val, code]) => {
    if (re.test(t)) entities.push({ type: "symptom", value: val, code, label: val });
  });
  VITAL_MAP.forEach(([re, val]) => {
    if (re.test(t)) entities.push({ type: "vital", value: val, label: val });
  });
  DRUG_MAP.forEach(([re, val]) => {
    if (re.test(t)) entities.push({ type: "drug", value: val, label: val });
  });
  DUR_MAP.forEach(([re]) => {
    const m = t.match(re);
    if (m) entities.push({ type: "duration", value: m[0], label: m[0] });
  });

  return [...new Map(entities.map(e => [e.label, e])).values()];
}

// Map TriageCaseDoc to UI acuity: below 50 is GREEN, 50 to 80 is YELLOW, above 80 is RED
function getCaseAcuity(c: TriageCaseDoc): Acuity {
  const score = c.priorityScore;
  if (score !== undefined && score !== null && !isNaN(Number(score))) {
    const s = Number(score);
    if (s > 80) return "emergency";
    if (s >= 50) return "urgent";
    return "routine";
  }
  if (c.riskBand === "RED") return "emergency";
  if (c.riskBand === "YELLOW") return "urgent";
  return "routine";
}

export interface CaseVitals {
  systolicBP: number | null;
  diastolicBP: number | null;
  heartRate: number | null;
  tempCelsius: number | null;
  spo2: number | null;
  respRate: number | null;
  ashaName: string;
  source: string;
}

export function resolveCaseVitals(c: TriageCaseDoc): CaseVitals {
  const asha = c.ashaName || (c.ashaId ? `ASHA (${c.ashaId})` : "ASHA Worker");

  return {
    systolicBP: c.systolicBP ?? (c as any).bpSystolic ?? null,
    diastolicBP: c.diastolicBP ?? (c as any).bpDiastolic ?? null,
    heartRate: c.heartRate ?? (c as any).heartRateBpm ?? null,
    tempCelsius: c.tempCelsius ?? null,
    spo2: c.spo2 ?? (c as any).spo2Percent ?? null,
    respRate: c.respRate ?? (c as any).respRatePerMin ?? null,
    ashaName: asha,
    source: c.vitalsSource === "wearable" ? "ASHA Bluetooth Mobile Peripheral (Wearable BLE)" : "ASHA Field Diagnostic Kit (Synced via Mobile App)",
  };
}



// ─── Compact Vital Pill ───────────────────────────────────────────────────────

function CompactVital({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className={`px-2 py-1 rounded-md border text-center ${alert ? "bg-red-50 border-red-200 text-red-700" : "bg-slate-50 border-slate-200 text-slate-700"}`}>
      <div className="font-mono font-bold text-[11.5px] leading-tight">{value}</div>
      <div className="text-[9px] text-slate-400 mt-0.5 leading-none">{label}</div>
    </div>
  );
}

// ─── Feature 5: Chat Image Bubble with Loading Spinner & Lightbox ────────────

function ChatImage({ src }: { src: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (error || !src) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-[11.5px] mt-2">
        <ImageIcon size={14} className="text-slate-400" />
        <span>Image unavailable or download link expired</span>
      </div>
    );
  }

  return (
    <>
      <div className="relative mt-2 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-w-sm group cursor-pointer" onClick={() => setLightboxOpen(true)}>
        {loading && (
          <div className="flex items-center justify-center h-48 bg-slate-100 text-slate-400">
            <Loader2 size={24} className="animate-spin text-phc-blue" />
            <span className="ml-2 text-xs font-sans">Loading clinical image…</span>
          </div>
        )}
        <img
          src={src}
          alt="Clinical attachment from ASHA"
          className={`w-full max-h-56 object-cover transition-opacity duration-300 ${loading ? "opacity-0" : "opacity-100"}`}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
        {!loading && (
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-display font-semibold">
            <ZoomIn size={16} /> Click to expand
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setLightboxOpen(false)}>
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden p-2 shadow-2xl" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors cursor-pointer z-10"
            >
              <X size={20} />
            </button>
            <img src={src} alt="Full resolution view" className="max-w-full max-h-[85vh] object-contain rounded-xl mx-auto" />
            <div className="text-center text-slate-300 text-xs mt-2 font-mono">
              Source: Firebase Storage Secure URL
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Triage Card Component ────────────────────────────────────────────────────

function TriageCard({
  c,
  onClick,
  active,
  onDelete,
}: {
  c: TriageCaseDoc;
  onClick: () => void;
  active: boolean;
  onDelete?: (e: React.MouseEvent) => void;
}) {
  const acuityKey = getCaseAcuity(c);
  const acuity = ACUITY_META[acuityKey];
  const status = getStatusMeta(c.status);
  const hasVitals = !!(c.systolicBP || c.heartRate || c.tempCelsius || c.spo2);

  return (
    <div
      onClick={onClick}
      className={`flex-shrink-0 w-full rounded-xl border transition-all duration-150 cursor-pointer overflow-hidden group ${active
          ? "border-phc-blue shadow-md ring-2 ring-phc-blue/15 bg-white"
          : "border-slate-200 hover:border-phc-blue/50 hover:shadow-sm bg-white"
        }`}
    >
      {/* Acuity Top Strip */}
      <div className={`flex items-center justify-between px-3.5 py-1.5 border-b ${acuity.border} ${acuity.bg}`}>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${acuity.dot} ${acuityKey === "emergency" ? "animate-pulse" : ""}`} />
          <span className={`text-[11px] font-display font-bold uppercase tracking-wider ${acuity.color}`}>
            {acuity.label}
          </span>
          <span className="text-[9.5px] font-mono opacity-80 ml-1">({acuity.scoreRange})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11.5px] font-semibold text-phc-blue">
            {c.token || `#${c.id.slice(-4)}`}
          </span>
          {onDelete && (
            <button
              onClick={onDelete}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 text-red-600 transition-opacity"
              title="Delete Case from Firestore"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-3.5 space-y-2">
        {/* Name & Status */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-display font-bold text-slate-900 text-[14px] leading-tight">
              {c.patientName}
            </div>
            <div className="text-[11.5px] text-slate-500 font-sans mt-0.5">
              {c.age ?? 35} yrs · {c.sex === "F" ? "Female" : "Male"} · <span className="font-mono text-[10.5px]">{c.patientId}</span>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-display font-bold flex-shrink-0 ${status.bg} ${status.text}`}>
            {status.icon} {status.label}
          </span>
        </div>

        {/* Complaint */}
        <p className="text-[12px] text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5">
          {c.chiefComplaint || c.symptomsTranscript || "Field clinical assessment"}
        </p>

        {/* ASHA Info */}
        {(c.ashaName || c.ashaId) && (
          <div className="flex items-center justify-between text-[11px] text-phc-green">
            <span className="flex items-center gap-1">
              <UserCheck size={11} /> ASHA: {c.ashaName || c.ashaId}
            </span>
            <span className="text-[10px] font-mono text-slate-400">Score: {c.priorityScore ?? 15}</span>
          </div>
        )}

        {/* Vitals Summary from ASHA App */}
        {(() => {
          const v = resolveCaseVitals(c);
          return (
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              <CompactVital
                label="BP"
                value={v.systolicBP && v.diastolicBP ? `${v.systolicBP}/${v.diastolicBP}` : "--"}
                alert={Boolean(v.systolicBP && v.systolicBP > 140)}
              />
              <CompactVital
                label="Pulse"
                value={v.heartRate ? `${v.heartRate}` : "--"}
                alert={Boolean(v.heartRate && (v.heartRate > 100 || v.heartRate < 60))}
              />
              <CompactVital
                label="Temp"
                value={v.tempCelsius ? `${v.tempCelsius}°` : "--"}
                alert={Boolean(v.tempCelsius && v.tempCelsius > 37.8)}
              />
              <CompactVital
                label="SpO₂"
                value={v.spo2 ? `${v.spo2}%` : "--"}
                alert={Boolean(v.spo2 && v.spo2 < 95)}
              />
            </div>
          );
        })()}

        {/* Footer info */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10.5px] text-slate-400">
          <span className="font-mono">ID: {c.id}</span>
          <ChevronRight size={13} className="text-slate-300" />
        </div>
      </div>
    </div>
  );
}

// ─── Treatment Workspace Modal with Real-Time Two-Way Chat ────────────────────

interface TreatmentWorkspaceProps {
  c: TriageCaseDoc;
  onClose: () => void;
  onStatusChange: (status: TriageStatus) => void;
  isCaseDeleted?: boolean;
}

function TreatmentWorkspace({ c, onClose, onStatusChange, isCaseDeleted = false }: TreatmentWorkspaceProps) {
  const [lang, setLang] = useState<Lang>((c.symptomsLanguage as Lang) || "hi-IN");
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [inputText, setInputText] = useState("");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "clinical" | "asha">("all");
  const [streamMessages, setStreamMessages] = useState<CaseStreamMessageDoc[]>([]);
  const [isSending, setIsSending] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const streamEndRef = useRef<HTMLDivElement>(null);
  const acuity = ACUITY_META[getCaseAcuity(c)];

  // Feature 6: Listen in real time for messages on `triage_cases/{caseId}/stream`
  useEffect(() => {
    const unsub = subscribeCaseStream(c.id, (messages) => {
      setStreamMessages(messages);
    });
    return () => unsub();
  }, [c.id]);

  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streamMessages]);

  const stopRecording = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (recognitionRef.current as any)?.stop();
    recognitionRef.current = null;
    setIsRecording(false);
    setInterimText("");
  }, []);

  const startRecording = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Speech Recognition not supported in this browser. Use Chrome for the ASR module (IndicConformer in production).");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec: any = new SR();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) final += r[0].transcript + " ";
        else interim += r[0].transcript;
      }
      setInterimText(interim);
      if (final) setTranscript((prev: string) => prev + final);
    };

    rec.onerror = () => stopRecording();
    rec.onend = () => {
      if (isRecording) rec.start();
    };

    recognitionRef.current = rec;
    rec.start();
    setIsRecording(true);
  }, [lang, isRecording, stopRecording]);

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const commitVoiceNote = async () => {
    const full = (transcript + interimText).trim();
    if (!full || isCaseDeleted) return;
    const entities = extractEntities(full);
    const snomedCodes = entities.filter(e => e.code).map(e => e.code!);

    setIsSending(true);
    try {
      await sendDoctorReply(
        c.id,
        `[Voice Note ${LANG_META[lang].label}]: ${full}`,
        "Dr. Aravind Kumar",
        "voice_dictation",
        snomedCodes
      );
      setTranscript("");
      setInterimText("");
      stopRecording();
    } finally {
      setIsSending(false);
    }
  };

  const handleAddClinicalNote = async () => {
    if (!inputText.trim() || isCaseDeleted) return;
    const entities = extractEntities(inputText);
    const snomedCodes = entities.filter(e => e.code).map(e => e.code!);
    const textToSend = inputText.trim();
    setInputText("");

    setIsSending(true);
    try {
      // Feature 6: Send doctor clinical note with senderType: "DOCTOR"
      await sendDoctorReply(
        c.id,
        textToSend,
        "Dr. Aravind Kumar",
        "clinical_note",
        snomedCodes
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleSendToASHA = async () => {
    if (!inputText.trim() || isCaseDeleted) return;
    const textToSend = inputText.trim();
    setInputText("");

    setIsSending(true);
    try {
      // Feature 6: Send doctor direct reply with senderType: "DOCTOR"
      await sendDoctorReply(
        c.id,
        textToSend,
        "Dr. Aravind Kumar",
        "chat"
      );
    } finally {
      setIsSending(false);
    }
  };

  const allEntities = streamMessages.flatMap(n => extractEntities(n.content || n.text || ""));
  const uniqueEntities = [...new Map(allEntities.map(e => [e.label, e])).values()];

  const visibleStream = streamMessages.filter(item => {
    if (filterType === "clinical") return item.senderType === "DOCTOR" && item.type === "clinical_note";
    if (filterType === "asha") return item.senderType === "ASHA";
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-6xl h-[92vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150">

        {/* Feature 3: Case Deletion Notice if case was deleted while chat is open */}
        {isCaseDeleted && (
          <div className="bg-amber-500 text-slate-950 px-5 py-2.5 flex items-center justify-between font-display font-bold text-xs shadow-md">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span>NOTICE: This case ({c.id}) was removed or resolved from the field ASHA app. Inputs are disabled.</span>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs hover:bg-slate-800 transition-colors"
            >
              Close Workspace
            </button>
          </div>
        )}

        {/* Modal Header */}
        <div className={`flex items-center gap-4 px-6 py-3.5 border-b ${acuity.bg} ${acuity.border}`}>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-700 transition-colors cursor-pointer border border-slate-200">
            <ArrowLeft size={16} />
          </button>
          <div className={`w-2.5 h-2.5 rounded-full ${acuity.dot} ${acuity.label.includes("RED") ? "animate-pulse" : ""}`} />
          <span className={`font-display font-bold text-[13px] uppercase tracking-wide ${acuity.color}`}>
            {acuity.label} — {c.token || `#${c.id.slice(-4)}`}
          </span>
          <div className="w-px h-5 bg-slate-300 mx-1" />
          <span className="font-display font-bold text-slate-800 text-[16px]">
            {c.patientName || "Patient"}
          </span>
          <span className="text-slate-500 text-[13px]">
            {c.age ?? 30} yrs · {c.sex === "M" ? "Male" : "Female"} · {c.patientId || c.id}
          </span>

          <div className="flex items-center gap-1.5 ml-2 px-2.5 py-1 bg-white/70 border border-emerald-200 rounded-full text-[11.5px] text-phc-green">
            <UserCheck size={12} />
            <span>ASHA: {resolveCaseVitals(c).ashaName}</span>
            <span className="flex items-center gap-0.5 ml-1 text-[10px] font-bold text-emerald-600">
              <Wifi size={10} /> Live Channel
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[11px] font-display font-bold">
              <Loader2 size={11} className="animate-spin" /> Integrated Case Stream
            </div>
          </div>
        </div>

        {/* Modal 3-Column Layout */}
        <div className="flex flex-1 min-h-0">

          {/* Left Column: Patient Context & Vitals */}
          <div className="w-64 flex-shrink-0 border-r border-slate-200 bg-slate-50 overflow-y-auto p-4 space-y-4">
            <div>
              <div className="text-[10.5px] font-display font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Chief Complaint
              </div>
              <div className="text-[12.5px] text-slate-800 leading-relaxed bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                {c.chiefComplaint || c.symptomsTranscript || "Field Clinical Encounter"}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-[10.5px] font-display font-bold text-slate-500 uppercase tracking-widest">
                  Recorded Vitals on Arrival
                </div>
                <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[9px] font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  ASHA Sync
                </span>
              </div>
              {(() => {
                const v = resolveCaseVitals(c);
                return (
                  <>
                    <div className="space-y-1.5">
                      <div className={`flex justify-between items-center px-3 py-2 rounded-lg border ${v.systolicBP && v.systolicBP > 140 ? "bg-red-50 border-red-200" : "bg-white border-slate-200"}`}>
                        <span className="text-[11px] text-slate-500 font-medium">Blood Pressure</span>
                        <span className={`font-mono font-bold text-[13px] ${v.systolicBP && v.systolicBP > 140 ? "text-red-700" : v.systolicBP ? "text-slate-800" : "text-slate-400 font-normal italic text-[11px]"}`}>
                          {v.systolicBP && v.diastolicBP ? `${v.systolicBP}/${v.diastolicBP} mmHg` : "-- (Not captured)"}
                        </span>
                      </div>
                      <div className={`flex justify-between items-center px-3 py-2 rounded-lg border ${v.heartRate && (v.heartRate > 100 || v.heartRate < 60) ? "bg-orange-50 border-orange-200" : "bg-white border-slate-200"}`}>
                        <span className="text-[11px] text-slate-500 font-medium">Pulse (Heart Rate)</span>
                        <span className={`font-mono font-bold text-[13px] ${v.heartRate && (v.heartRate > 100 || v.heartRate < 60) ? "text-orange-700" : v.heartRate ? "text-slate-800" : "text-slate-400 font-normal italic text-[11px]"}`}>
                          {v.heartRate ? `${v.heartRate} bpm` : "-- (Not captured)"}
                        </span>
                      </div>
                      <div className={`flex justify-between items-center px-3 py-2 rounded-lg border ${v.tempCelsius && v.tempCelsius > 37.8 ? "bg-orange-50 border-orange-200" : "bg-white border-slate-200"}`}>
                        <span className="text-[11px] text-slate-500 font-medium">Temperature</span>
                        <span className={`font-mono font-bold text-[13px] ${v.tempCelsius && v.tempCelsius > 37.8 ? "text-orange-700" : v.tempCelsius ? "text-slate-800" : "text-slate-400 font-normal italic text-[11px]"}`}>
                          {v.tempCelsius ? `${v.tempCelsius} °C` : "-- (Not captured)"}
                        </span>
                      </div>
                      <div className={`flex justify-between items-center px-3 py-2 rounded-lg border ${v.spo2 && v.spo2 < 95 ? "bg-red-50 border-red-200" : "bg-white border-slate-200"}`}>
                        <span className="text-[11px] text-slate-500 font-medium">SpO₂ Oxygen Saturation</span>
                        <span className={`font-mono font-bold text-[13px] ${v.spo2 && v.spo2 < 95 ? "text-red-700" : v.spo2 ? "text-slate-800" : "text-slate-400 font-normal italic text-[11px]"}`}>
                          {v.spo2 ? `${v.spo2}%` : "-- (Not captured)"}
                        </span>
                      </div>
                      <div className={`flex justify-between items-center px-3 py-2 rounded-lg border ${v.respRate && v.respRate > 20 ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"}`}>
                        <span className="text-[11px] text-slate-500 font-medium">Respiratory Rate</span>
                        <span className={`font-mono font-bold text-[13px] ${v.respRate && v.respRate > 20 ? "text-amber-700" : v.respRate ? "text-slate-800" : "text-slate-400 font-normal italic text-[11px]"}`}>
                          {v.respRate ? `${v.respRate} /min` : "-- (Not captured)"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-[10.5px] text-emerald-900 space-y-0.5">
                      <div className="font-display font-semibold flex items-center gap-1.5 text-emerald-950">
                        <UserCheck size={12} className="text-emerald-700" />
                        <span>Captured by: {v.ashaName}</span>
                      </div>
                      <div className="text-[10px] text-emerald-700 font-mono">
                        {v.source}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {uniqueEntities.length > 0 && (
              <div>
                <div className="text-[10.5px] font-display font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <Brain size={11} className="text-phc-blue" /> NLP Extracted Codes
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {uniqueEntities.map(e => (
                    <span key={e.label} className={`px-2 py-0.5 rounded-full border text-[10.5px] font-display font-semibold ${ENTITY_COLORS[e.type]}`}>
                      {e.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Center Column: Unified Case Timeline & Coordination Stream */}
          <div className="flex-1 flex flex-col min-w-0 bg-white">

            {/* Voice Dictation Bar */}
            <div className={`p-3.5 border-b border-slate-200 transition-all ${isRecording ? "bg-red-50/70" : "bg-slate-50/70"}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-display font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <Volume2 size={12} className="text-phc-blue" /> Multilingual ASR Dictation
                  </span>
                  <span className="text-[10px] text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md font-mono">
                    IndicConformer
                  </span>
                </div>

                {/* Language Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowLangMenu(!showLangMenu)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-[12px] font-display font-semibold text-slate-700 hover:border-phc-blue transition-colors cursor-pointer shadow-xs"
                  >
                    <span>{LANG_META[lang].flag}</span>
                    <span>{LANG_META[lang].label} ({LANG_META[lang].native})</span>
                    <ChevronDown size={12} />
                  </button>
                  {showLangMenu && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden min-w-[160px]">
                      {(Object.entries(LANG_META) as [Lang, typeof LANG_META[Lang]][]).map(([code, meta]) => (
                        <button
                          key={code}
                          onClick={() => { setLang(code); setShowLangMenu(false); }}
                          className={`flex items-center gap-2 w-full px-3.5 py-2 text-[12.5px] font-display text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors ${lang === code ? "bg-blue-50 text-phc-blue font-bold" : ""}`}
                        >
                          <span>{meta.flag}</span>
                          <div className="text-left">
                            <div>{meta.label}</div>
                            <div className="text-[10px] text-slate-400">{meta.native}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={toggleRecording}
                  disabled={isCaseDeleted}
                  className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all cursor-pointer shadow-md ${isRecording ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-phc-blue hover:bg-phc-blue-dark"
                    }`}
                  title={isRecording ? "Stop Recording" : "Start Voice Dictation"}
                >
                  {isRecording ? <MicOff size={18} className="text-white" /> : <Mic size={18} className="text-white" />}
                </button>

                <div className="flex-1 min-h-[46px] bg-white border border-slate-200 rounded-xl p-2.5 text-[13px] text-slate-800 leading-relaxed relative flex items-center shadow-xs">
                  {isRecording && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-red-600 font-bold animate-pulse">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> REC
                    </div>
                  )}
                  {transcript || interimText ? (
                    <span>
                      {transcript}
                      <span className="text-slate-400 italic">{interimText}</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 italic text-[12px]">
                      {isRecording ? `Listening in ${LANG_META[lang].label} (${LANG_META[lang].native})… speak notes` : "Tap microphone to dictate clinical observation in Hindi, Tamil, Marathi, or English"}
                    </span>
                  )}
                </div>

                {(transcript || interimText) && (
                  <button
                    onClick={commitVoiceNote}
                    disabled={isSending || isCaseDeleted}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 text-white rounded-xl text-[12px] font-display font-semibold hover:bg-emerald-700 transition-colors cursor-pointer flex-shrink-0 shadow-xs"
                  >
                    <Zap size={13} /> Add to Stream
                  </button>
                )}
              </div>
            </div>

            {/* Stream Filter Header */}
            <div className="flex items-center justify-between px-5 py-2 border-b border-slate-100 bg-white">
              <div className="flex items-center gap-1.5 text-[11.5px] font-display text-slate-500">
                <span>Filter:</span>
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-2.5 py-0.5 rounded-md transition-colors ${filterType === "all" ? "bg-slate-200 text-slate-800 font-bold" : "hover:bg-slate-100"}`}
                >
                  All ({streamMessages.length})
                </button>
                <button
                  onClick={() => setFilterType("clinical")}
                  className={`px-2.5 py-0.5 rounded-md transition-colors ${filterType === "clinical" ? "bg-blue-100 text-blue-800 font-bold" : "hover:bg-slate-100"}`}
                >
                  Doctor Notes
                </button>
                <button
                  onClick={() => setFilterType("asha")}
                  className={`px-2.5 py-0.5 rounded-md transition-colors ${filterType === "asha" ? "bg-emerald-100 text-emerald-800 font-bold" : "hover:bg-slate-100"}`}
                >
                  ASHA Field Messages
                </button>
              </div>
              <span className="text-[10.5px] text-slate-400 font-mono flex items-center gap-1">
                <Clock size={11} /> Real-time Firestore Stream
              </span>
            </div>

            {/* Unified Chronological Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/30">
              {visibleStream.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-[13px]">
                  No stream messages yet. Type below or send an instruction to the ASHA worker.
                </div>
              ) : (
                visibleStream.map(item => {
                  const isAsha = item.senderType === "ASHA";
                  const isDoctor = item.senderType === "DOCTOR";
                  const timeFormatted = typeof item.timestamp === "number"
                    ? new Date(item.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                    : "Now";
                  const extracted = extractEntities(item.content || item.text || "");

                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border p-3.5 shadow-xs transition-all ${isAsha
                          ? "bg-emerald-50/80 border-emerald-200 ml-0 mr-12"
                          : "bg-blue-50/80 border-blue-200 ml-12 mr-0"
                        }`}
                    >
                      {/* Item Header */}
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 text-[10.5px] font-display font-bold px-2 py-0.5 rounded-full ${isAsha
                                ? "bg-emerald-200/70 text-emerald-800"
                                : "bg-blue-200/70 text-blue-800"
                              }`}
                          >
                            {isAsha ? <UserCheck size={10} /> : <Stethoscope size={10} />}
                            {isAsha ? `ASHA: ${item.senderName || c.ashaName || "ASHA Worker"}` : `Doctor: ${item.senderName || "Dr. Aravind Kumar"}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10.5px] text-slate-400 font-mono">
                          <span>{timeFormatted}</span>
                          <CheckCircle2 size={10} className="text-emerald-600" />
                        </div>
                      </div>

                      {/* Text Body */}
                      <p className="text-[13px] text-slate-800 leading-relaxed font-sans">
                        {item.content || item.text}
                      </p>

                      {/* Feature 5: Render Chat Image from Firebase Storage URL if present */}
                      {item.imageUri && <ChatImage src={item.imageUri} />}

                      {/* Extracted NLP Entities */}
                      {extracted.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-slate-200/80">
                          {extracted.map(e => (
                            <span key={e.label} className={`px-2 py-0.5 rounded-full border text-[10px] font-display font-semibold ${ENTITY_COLORS[e.type]}`}>
                              {e.label}
                              {e.code && <span className="ml-1 opacity-60 font-mono">{e.code}</span>}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={streamEndRef} />
            </div>

            {/* Feature 6: Unified Doctor Reply & Action Bar */}
            <div className="p-3.5 border-t border-slate-200 bg-white flex items-center gap-2.5">
              <input
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddClinicalNote()}
                disabled={isCaseDeleted || isSending}
                placeholder={isCaseDeleted ? "Case closed in field." : "Type doctor note, prescription, or instruction to ASHA…"}
                className="flex-1 px-3.5 py-2 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-phc-blue/20 focus:border-phc-blue shadow-xs disabled:bg-slate-100"
              />

              {/* Add Clinical Note Button */}
              <button
                onClick={handleAddClinicalNote}
                disabled={isCaseDeleted || isSending || !inputText.trim()}
                className="px-3.5 py-2 bg-phc-blue text-white rounded-xl text-[12px] font-display font-semibold hover:bg-phc-blue-dark transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                title="Add to medical record with auto SNOMED/ICD extraction"
              >
                <Stethoscope size={13} /> Add Clinical Note
              </button>

              {/* Message ASHA Button */}
              <button
                onClick={handleSendToASHA}
                disabled={isCaseDeleted || isSending || !inputText.trim()}
                className="px-3.5 py-2 bg-phc-green text-white rounded-xl text-[12px] font-display font-semibold hover:bg-phc-green-dark transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                title={`Send instruction directly to ${c.ashaName || "ASHA Worker"}`}
              >
                <Send size={13} /> Message ASHA
              </button>
            </div>
          </div>

          {/* Right Column: VitalPack Codes & Finalize Actions */}
          <div className="w-56 flex-shrink-0 border-l border-slate-200 bg-slate-50 p-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <div className="text-[10.5px] font-display font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <ShieldCheck size={12} className="text-phc-blue" /> VitalPack Summary
                </div>
                <div className="space-y-2">
                  {uniqueEntities.filter(e => e.type === "symptom").length > 0 && (
                    <div>
                      <div className="text-[10px] text-red-600 font-bold uppercase mb-1">Symptoms</div>
                      {uniqueEntities.filter(e => e.type === "symptom").map(e => (
                        <div key={e.label} className="text-[11.5px] text-slate-700 flex items-center gap-1.5 py-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          <span>{e.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {uniqueEntities.filter(e => e.type === "drug").length > 0 && (
                    <div>
                      <div className="text-[10px] text-violet-600 font-bold uppercase mb-1">Medications</div>
                      {uniqueEntities.filter(e => e.type === "drug").map(e => (
                        <div key={e.label} className="text-[11.5px] text-slate-700 flex items-center gap-1.5 py-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                          <span>{e.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <div className="text-[10.5px] font-display font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Encoding Standards
                </div>
                <div className="text-[11px] text-slate-500 space-y-1 font-mono">
                  <div>• SNOMED CT</div>
                  <div>• ICD-10 (ABDM)</div>
                  <div>• LOINC Vitals</div>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-200">
              <button
                onClick={() => { onStatusChange("done"); onClose(); }}
                disabled={isCaseDeleted}
                className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-[12.5px] font-display font-semibold hover:bg-emerald-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <CheckCircle2 size={14} /> Mark Case Done
              </button>
              <button
                onClick={() => { onStatusChange("referred"); onClose(); }}
                disabled={isCaseDeleted}
                className="w-full py-2 bg-white border border-violet-200 text-violet-700 rounded-xl text-[12px] font-display font-medium hover:bg-violet-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <CornerUpRight size={13} /> Refer to DH/Specialist
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Main Triage Component ────────────────────────────────────────────────────

export default function Triage() {
  const [cases, setCases] = useState<TriageCaseDoc[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [filterAcuity, setFilterAcuity] = useState<Acuity | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [treatmentOpen, setTreatmentOpen] = useState(false);
  const [deletedCaseWarning, setDeletedCaseWarning] = useState<string | null>(null);

  // Feature 3: Real-time listener on `triage_cases` with explicit `"removed"` handling
  useEffect(() => {
    const unsub = subscribeTriageCases((updatedCases, removedIds) => {
      setCases(updatedCases);

      // If currently selected case was removed by field ASHA app
      if (removedIds.length > 0) {
        removedIds.forEach((id) => {
          if (selectedCaseId === id) {
            setDeletedCaseWarning(`Case ${id} was removed or resolved from the ASHA field app.`);
            // Automatically close modal after notice or keep disabled
            setTimeout(() => {
              setTreatmentOpen(false);
              setDeletedCaseWarning(null);
            }, 3500);
          }
        });
      }

      // Auto-select first case if none selected
      if (updatedCases.length > 0) {
        setSelectedCaseId((prev) => (prev && updatedCases.some((c) => c.id === prev) ? prev : updatedCases[0].id));
      }
    });

    return () => unsub();
  }, [selectedCaseId]);

  const selectedCase = cases.find((c) => c.id === selectedCaseId) || cases[0];

  const handleStatusChange = (newStatus: TriageStatus) => {
    if (!selectedCase) return;
    setCases((prev) =>
      prev.map((c) => (c.id === selectedCase.id ? { ...c, status: newStatus } : c))
    );
  };

  const handleDeleteCase = async (e: React.MouseEvent, caseId: string) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete case ${caseId}? This will remove it in Firestore.`)) {
      await deleteTriageCaseDoc(caseId);
    }
  };

  // Feature 2: Filtering logic including GREEN / Low-Priority routine bucketing
  const filtered = cases
    .filter((c) => {
      if (filterAcuity === "all") return true;
      const acuity = getCaseAcuity(c);
      return acuity === filterAcuity;
    })
    .filter(
      (c) =>
        !searchQuery ||
        c.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.chiefComplaint || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.token || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

  const counts = {
    emergency: cases.filter((c) => getCaseAcuity(c) === "emergency" && c.status !== "done").length,
    urgent: cases.filter((c) => (getCaseAcuity(c) === "urgent" || getCaseAcuity(c) === "moderate") && c.status !== "done").length,
    routine: cases.filter((c) => getCaseAcuity(c) === "routine" && c.status !== "done").length,
    waiting: cases.filter((c) => c.status === "waiting").length,
    treating: cases.filter((c) => c.status === "treating" || c.status === "assessing").length,
  };

  const acuityCounts = {
    all: cases.length,
    emergency: cases.filter((c) => getCaseAcuity(c) === "emergency").length,
    urgent: cases.filter((c) => getCaseAcuity(c) === "urgent" || getCaseAcuity(c) === "moderate").length,
    moderate: cases.filter((c) => getCaseAcuity(c) === "moderate").length,
    routine: cases.filter((c) => getCaseAcuity(c) === "routine").length,
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-5">
      {/* Top Banner Warning if case was deleted */}
      {deletedCaseWarning && (
        <div className="bg-amber-100 border border-amber-300 text-amber-900 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-600" />
            <span className="font-display font-semibold text-sm">{deletedCaseWarning}</span>
          </div>
          <button onClick={() => setDeletedCaseWarning(null)} className="text-amber-800 hover:text-amber-950">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-slate-900 text-2xl tracking-tight">Triage &amp; Queue</h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Priority-sorted emergency response &amp; case management · Live Firestore queue (<code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-[11px]">triage_cases</code>)
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-phc-blue text-white text-[13px] font-display font-semibold hover:bg-phc-blue-dark transition-all cursor-pointer shadow-xs">
            <Plus size={15} /> New Triage Entry
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Emergency Cases (RED)", value: counts.emergency, sub: "Immediate attention required", color: "text-red-700", bg: "bg-red-50/80 border-red-200", dot: "bg-red-500" },
          { label: "Urgent Cases (YELLOW)", value: counts.urgent, sub: "Review within 15 mins", color: "text-amber-800", bg: "bg-amber-50/80 border-amber-200", dot: "bg-amber-500" },
          { label: "Routine (GREEN)", value: counts.routine, sub: "Routine / Normal Cadence", color: "text-emerald-700", bg: "bg-emerald-50/80 border-emerald-200", dot: "bg-emerald-500" },
          { label: "In Active Treatment", value: counts.treating, sub: "Doctor consultation active", color: "text-blue-800", bg: "bg-blue-50/80 border-blue-200", dot: "bg-blue-500" },
        ].map(s => (
          <div key={s.label} className={`border rounded-2xl p-4 ${s.bg} shadow-xs flex items-center justify-between`}>
            <div>
              <div className="text-[12px] font-display font-semibold text-slate-600 mb-1">{s.label}</div>
              <div className={`font-display font-bold text-3xl leading-none ${s.color}`}>{s.value}</div>
              <div className="text-[11px] text-slate-500 mt-1.5">{s.sub}</div>
            </div>
            <div className={`w-3.5 h-3.5 rounded-full ${s.dot} animate-pulse`} />
          </div>
        ))}
      </div>

      {/* Feature 2: Filter Tabs (including Routine / Green) & Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {(["all", "emergency", "urgent", "routine"] as const).map(a => (
            <button
              key={a}
              onClick={() => setFilterAcuity(a)}
              className={`px-3.5 py-1.5 rounded-xl text-[12.5px] font-display font-semibold transition-all cursor-pointer border ${filterAcuity === a
                  ? a === "emergency"
                    ? "bg-red-600 text-white border-red-600 shadow-xs"
                    : a === "urgent"
                      ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                      : a === "routine"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-phc-blue text-white border-phc-blue shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
            >
              {a === "all" ? "All Cases" : ACUITY_META[a].label}
              <span className={`ml-1.5 text-[11px] px-1.5 py-0.2 rounded-full ${filterAcuity === a ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                {acuityCounts[a]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient, complaint, token…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-[12.5px] bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-phc-blue/20 focus:border-phc-blue shadow-xs"
          />
        </div>
      </div>

      {/* Main Split Queue & Detail Layout */}
      <div className="grid grid-cols-[380px_1fr] gap-6 items-start">
        {/* Left: Scrollable Patient Queue List */}
        <div className="flex flex-col gap-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-[13px]">
              No patients match the current filter.
            </div>
          ) : (
            filtered.map(c => (
              <TriageCard
                key={c.id}
                c={c}
                onClick={() => setSelectedCaseId(c.id)}
                active={selectedCase?.id === c.id}
                onDelete={(e) => handleDeleteCase(e, c.id)}
              />
            ))
          )}
        </div>

        {/* Right: Selected Patient Detail Panel */}
        <div className="sticky top-6">
          {selectedCase && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              {/* Detail Header */}
              <div className={`px-6 py-4 border-b ${ACUITY_META[getCaseAcuity(selectedCase)].border} ${ACUITY_META[getCaseAcuity(selectedCase)].bg} flex items-center justify-between`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-3 h-3 rounded-full ${ACUITY_META[getCaseAcuity(selectedCase)].dot} ${getCaseAcuity(selectedCase) === "emergency" ? "animate-pulse" : ""}`} />
                  <span className={`font-display font-bold text-[14px] uppercase tracking-wide ${ACUITY_META[getCaseAcuity(selectedCase)].color}`}>
                    {ACUITY_META[getCaseAcuity(selectedCase)].label} — Priority Score: {selectedCase.priorityScore ?? 15}
                  </span>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-display font-bold ${getStatusMeta(selectedCase.status).bg
                  } ${getStatusMeta(selectedCase.status).text}`}>
                  {getStatusMeta(selectedCase.status).icon} {getStatusMeta(selectedCase.status).label}
                </span>
              </div>

              {/* Patient Core Info */}
              <div className="p-6 space-y-5">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-white text-[16px] font-display font-bold shadow-xs ${getCaseAcuity(selectedCase) === "emergency" ? "bg-red-500" : getCaseAcuity(selectedCase) === "urgent" ? "bg-amber-500" : "bg-emerald-600"
                    }`}>
                    {selectedCase.patientName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <div className="font-display font-bold text-slate-900 text-[18px] leading-tight">
                      {selectedCase.patientName}
                    </div>
                    <div className="text-[13px] text-slate-500 mt-1">
                      {selectedCase.age ?? 35} yrs · {selectedCase.sex === "F" ? "Female" : "Male"} · <span className="font-mono text-slate-600">{selectedCase.patientId}</span>
                    </div>
                    {(selectedCase.ashaName || selectedCase.ashaId) && (
                      <div className="flex items-center gap-1.5 mt-2 text-[12px] text-phc-green font-display font-semibold">
                        <UserCheck size={13} /> Referred by ASHA: {selectedCase.ashaName || selectedCase.ashaId}
                        <span className="text-[11px] font-mono text-slate-400">({selectedCase.ashaId})</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chief Complaint / Symptoms */}
                <div>
                  <div className="text-[11px] font-display font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Chief Complaint / Presentation
                  </div>
                  <div className="text-[14px] text-slate-800 leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    {selectedCase.chiefComplaint || selectedCase.symptomsTranscript || "Field Encounter"}
                  </div>
                </div>

                {/* Clinical Reasoning from Hybrid Engine */}
                {selectedCase.riskReason && (
                  <div>
                    <div className="text-[11px] font-display font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      On-Device Triage Reasoning
                    </div>
                    <div className="text-[13px] text-slate-700 leading-relaxed bg-blue-50/70 border border-blue-200 rounded-xl p-3">
                      {selectedCase.riskReason}
                    </div>
                  </div>
                )}

                {/* Vitals Grid from ASHA App */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[11px] font-display font-bold text-slate-400 uppercase tracking-wider">
                      Recorded Vitals from Field (ASHA App)
                    </div>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                      Live ASHA Mobile Kit
                    </span>
                  </div>
                  {(() => {
                    const v = resolveCaseVitals(selectedCase);
                    return (
                      <>
                        <div className="grid grid-cols-5 gap-2.5">
                          <div className={`rounded-xl border p-3 text-center ${v.systolicBP && v.systolicBP > 140 ? "bg-red-50 border-red-200 text-red-700" : "bg-slate-50 border-slate-200"}`}>
                            <div className="font-mono font-bold text-[16px] leading-none">{v.systolicBP && v.diastolicBP ? `${v.systolicBP}/${v.diastolicBP}` : "--"}</div>
                            <div className="text-[10px] text-slate-500 mt-1 font-display font-medium">BP (mmHg)</div>
                          </div>
                          <div className={`rounded-xl border p-3 text-center ${v.heartRate && (v.heartRate > 100 || v.heartRate < 60) ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-slate-50 border-slate-200"}`}>
                            <div className="font-mono font-bold text-[16px] leading-none">{v.heartRate ? `${v.heartRate}` : "--"}</div>
                            <div className="text-[10px] text-slate-500 mt-1 font-display font-medium">Pulse /min</div>
                          </div>
                          <div className={`rounded-xl border p-3 text-center ${v.tempCelsius && v.tempCelsius > 37.8 ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-slate-50 border-slate-200"}`}>
                            <div className="font-mono font-bold text-[16px] leading-none">{v.tempCelsius ? `${v.tempCelsius}°C` : "--"}</div>
                            <div className="text-[10px] text-slate-500 mt-1 font-display font-medium">Temp</div>
                          </div>
                          <div className={`rounded-xl border p-3 text-center ${v.spo2 && v.spo2 < 95 ? "bg-red-50 border-red-200 text-red-700" : "bg-slate-50 border-slate-200"}`}>
                            <div className="font-mono font-bold text-[16px] leading-none">{v.spo2 ? `${v.spo2}%` : "--"}</div>
                            <div className="text-[10px] text-slate-500 mt-1 font-display font-medium">SpO₂</div>
                          </div>
                          <div className={`rounded-xl border p-3 text-center ${v.respRate && v.respRate > 20 ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-slate-50 border-slate-200"}`}>
                            <div className="font-mono font-bold text-[16px] leading-none">{v.respRate ? `${v.respRate}` : "--"}</div>
                            <div className="text-[10px] text-slate-500 mt-1 font-display font-medium">RR /min</div>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
                          <span>Field Frontline Worker: <b className="text-slate-800">{v.ashaName}</b></span>
                          <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{v.source}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Action Row */}
                <div className="flex gap-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setTreatmentOpen(true)}
                    className="flex-1 py-3 bg-phc-blue text-white rounded-xl text-[13.5px] font-display font-semibold hover:bg-phc-blue-dark transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Stethoscope size={16} /> Open Case Stream &amp; Chat
                  </button>
                  <button
                    onClick={() => handleStatusChange("referred")}
                    className="flex items-center gap-1.5 px-5 py-3 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 text-[13px] font-display font-medium transition-colors cursor-pointer"
                  >
                    <CornerUpRight size={14} /> Refer
                  </button>
                  <button
                    onClick={() => handleStatusChange("done")}
                    className="flex items-center gap-1.5 px-5 py-3 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 text-[13px] font-display font-medium transition-colors cursor-pointer"
                  >
                    <CheckCircle2 size={14} /> Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Treatment Workspace Modal with Two-Way Chat & Image Display */}
      {treatmentOpen && selectedCase && (
        <TreatmentWorkspace
          c={selectedCase}
          onClose={() => setTreatmentOpen(false)}
          onStatusChange={handleStatusChange}
          isCaseDeleted={!cases.some((c) => c.id === selectedCase.id)}
        />
      )}
    </div>
  );
}
