import { useState, useMemo, useEffect } from "react";
import { subscribeReferrals, ReferralDoc } from "../services/firebase";
import {
  Search,
  Plus,
  Download,
  CornerUpRight,
  UserCheck,
  ChevronDown,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Building2,
  AlertTriangle,
  X,
  Check,
  Send,
  ShieldCheck,
  Activity,
  Phone,
  Calendar,
  FileText,
  SlidersHorizontal,
  Navigation,
  Car,
  Stethoscope,
  Sparkles,
} from "lucide-react";

// ─── Types & PRD Schema ───────────────────────────────────────────────────────

type ReferralPriority = "emergency" | "urgent" | "routine";
type ReferralStage = "dispatched" | "in_transit" | "reached" | "seen" | "outcome";

interface FacilityMatch {
  id: string;
  name: string;
  type: string;
  specialty: string;
  distanceKm: number;
  availableBeds: number;
  icuBedsAvailable: number;
  stockStatus: "In Stock" | "Low Stock" | "Out of Stock";
  matchScore: number;
  reason: string;
}

interface ReferralRecord {
  id: string;
  patientId: string;
  patientName: string;
  patientAgeSex: string;
  patientVillage: string;
  abhaId: string;
  asha?: string;
  diagnosis: string;
  icdCode: string;
  specialty: string;
  facility: string;
  facilityType: string;
  distanceKm: number;
  matchScore: number;
  priority: ReferralPriority;
  stage: ReferralStage;
  transport: string;
  ambulanceContact?: string;
  createdAt: string;
  reason: string;
  counterReferralNotes?: string;
}

// ─── Mock Data Aligned with PRD §7.3 ──────────────────────────────────────────

const INITIAL_REFERRALS: ReferralRecord[] = [
  {
    id: "REF-2024-089",
    patientId: "BR-PAT-P-0896",
    patientName: "Saurabh Verma",
    patientAgeSex: "42M",
    patientVillage: "Danapur (Ward 3)",
    abhaId: "14-3301-8847-0023",
    asha: "Meena K.",
    diagnosis: "Acute Anterior STEMI — cardiogenic shock risk",
    icdCode: "I21.0",
    specialty: "Interventional Cardiology",
    facility: "AIIMS Patna (Cath Lab / CCU)",
    facilityType: "Tertiary Autonomous",
    distanceKm: 16,
    matchScore: 98,
    priority: "emergency",
    stage: "in_transit",
    transport: "108 Advanced Life Support (ALS) Ambulance",
    ambulanceContact: "+91 94310 99881 (Driver: Rajesh)",
    createdAt: "01 Sep 2024 10:15",
    reason: "ST elevations in V1-V4 on 12-lead ECG, severe chest pain radiating to left arm. Dual antiplatelets loaded.",
    counterReferralNotes: "Primary PCI planned upon arrival at AIIMS CCU. Cath lab pre-notified via SeVaSetu alert.",
  },
  {
    id: "REF-2024-088",
    patientId: "BR-PAT-P-0897",
    patientName: "Geeta Yadav",
    patientAgeSex: "24F",
    patientVillage: "Paliganj (Ward 4)",
    abhaId: "14-6699-2215-1187",
    asha: "Neelam S.",
    diagnosis: "Severe Pre-eclampsia at 34 weeks, Proteinuria 3+",
    icdCode: "O14.13",
    specialty: "Emergency Obstetrics & Neonatology",
    facility: "Danapur Sub-divisional Hospital (SNCU)",
    facilityType: "Sub-divisional Hospital",
    distanceKm: 6,
    matchScore: 96,
    priority: "emergency",
    stage: "seen",
    transport: "102 Janani Shishu Express",
    createdAt: "31 Aug 2024 14:20",
    reason: "BP 164/110 mmHg, severe frontal headache, hyperreflexia. MgSO4 loading completed at PHC.",
    counterReferralNotes: "Admitted to HDU. MgSO4 infusion completed. BP stabilized to 136/84 on Labetalol. Fetal NST reassuring.",
  },
  {
    id: "REF-2024-087",
    patientId: "BR-PAT-P-0891",
    patientName: "Arvind Kumar",
    patientAgeSex: "34M",
    patientVillage: "Saraiya (Ward 2)",
    abhaId: "14-2384-7612-9034",
    asha: "Sunita D.",
    diagnosis: "Drug-Sensitive Pulmonary TB (Sputum AFB 2+)",
    icdCode: "A15.0",
    specialty: "Pulmonology & Line Probe Assay",
    facility: "Patna Medical College Hospital (PMCH)",
    facilityType: "Government Medical College",
    distanceKm: 12,
    matchScore: 94,
    priority: "urgent",
    stage: "outcome",
    transport: "Patient Public Transport",
    createdAt: "30 Aug 2024 11:30",
    reason: "Persistent cough >3 weeks, night sweats, sputum smear positive. Line probe assay for rifampicin resistance required.",
    counterReferralNotes: "LPA confirmed drug-sensitive TB. Initiated standard 4-FDC (2HRZE). Patient referred back to PHC Danapur for DOTS supervision under ASHA Sunita D.",
  },
  {
    id: "REF-2024-086",
    patientId: "BR-PAT-P-0899",
    patientName: "Manohar Singh",
    patientAgeSex: "66M",
    patientVillage: "Mokama (Ward 1)",
    abhaId: "14-4558-9930-7712",
    diagnosis: "Chronic Kidney Disease Stage 3 with Refractory HTN",
    icdCode: "N18.3",
    specialty: "Nephrology OPD",
    facility: "Nalanda Medical College Hospital (NMCH)",
    facilityType: "Government Medical College",
    distanceKm: 22,
    matchScore: 90,
    priority: "urgent",
    stage: "dispatched",
    transport: "Private Transport",
    createdAt: "28 Aug 2024 14:02",
    reason: "Serum Creatinine 2.1 mg/dL, eGFR 48 mL/min, BP persistently 160/98 on dual antihypertensives.",
  },
  {
    id: "REF-2024-085",
    patientId: "BR-PAT-P-0900",
    patientName: "Baby Aaradhya",
    patientAgeSex: "2F",
    patientVillage: "Saraiya (Ward 2)",
    abhaId: "14-9900-3311-2244",
    asha: "Sunita D.",
    diagnosis: "Severe Acute Malnutrition (SAM) with Recurrent Diarrhoea",
    icdCode: "E43",
    specialty: "Nutrition Rehabilitation Centre (NRC)",
    facility: "Danapur Sub-divisional Hospital (NRC Ward)",
    facilityType: "Sub-divisional Hospital",
    distanceKm: 6,
    matchScore: 95,
    priority: "urgent",
    stage: "reached",
    transport: "ASHA Accompanied",
    createdAt: "29 Aug 2024 11:30",
    reason: "MUAC 11.2 cm (<11.5 cm red zone), weight-for-height <-3SD. Enrolled in inpatient NRC protocol.",
  },
  {
    id: "REF-2024-084",
    patientId: "BR-PAT-P-0893",
    patientName: "Raghav Sharma",
    patientAgeSex: "62M",
    patientVillage: "Maner (Ward 1)",
    abhaId: "14-5512-0034-2267",
    diagnosis: "Type 2 Diabetes with Diabetic Nephropathy Screening",
    icdCode: "E11.2",
    specialty: "Diabetology & Endocrinology",
    facility: "Patna Medical College Hospital (PMCH)",
    facilityType: "Government Medical College",
    distanceKm: 18,
    matchScore: 89,
    priority: "routine",
    stage: "outcome",
    transport: "Self",
    createdAt: "27 Aug 2024 10:20",
    reason: "HbA1c 9.2%, microalbuminuria flagged. Specialist consultation for insulin initiation.",
    counterReferralNotes: "Initiated premix insulin 12 units morning. Advised weekly fasting glucose monitoring via ASHA worker.",
  },
];

const FACILITIES_DIRECTORY: FacilityMatch[] = [
  {
    id: "FAC-01",
    name: "AIIMS Patna (Cath Lab & Emergency)",
    type: "Autonomous Apex Institute",
    specialty: "Interventional Cardiology / Trauma / Critical Care",
    distanceKm: 16,
    availableBeds: 14,
    icuBedsAvailable: 4,
    stockStatus: "In Stock",
    matchScore: 98,
    reason: "Cath Lab operational 24/7, 4 ICU beds vacant, primary PCI team on active duty.",
  },
  {
    id: "FAC-02",
    name: "Patna Medical College Hospital (PMCH)",
    type: "Tertiary Teaching Hospital",
    specialty: "Pulmonology / High-Risk OBG / General Surgery",
    distanceKm: 12,
    availableBeds: 28,
    icuBedsAvailable: 6,
    stockStatus: "In Stock",
    matchScore: 94,
    reason: "Line probe assay lab available, multi-specialty HDU capacity open.",
  },
  {
    id: "FAC-03",
    name: "Danapur Sub-divisional Hospital",
    type: "First Referral Unit (FRU)",
    specialty: "Emergency OBG (LSCS) / SNCU / Nutrition NRC",
    distanceKm: 6,
    availableBeds: 18,
    icuBedsAvailable: 2,
    stockStatus: "In Stock",
    matchScore: 96,
    reason: "Closest FRU, obstetrician & pediatrician on duty, blood storage unit active.",
  },
  {
    id: "FAC-04",
    name: "Nalanda Medical College Hospital (NMCH)",
    type: "Tertiary Teaching Hospital",
    specialty: "Nephrology / Dialysis / Internal Medicine",
    distanceKm: 22,
    availableBeds: 19,
    icuBedsAvailable: 3,
    stockStatus: "In Stock",
    matchScore: 90,
    reason: "Renal profile lab open, 3 hemodialysis units operational.",
  },
];

const STAGE_CONFIG: Record<ReferralStage, { label: string; index: number }> = {
  dispatched: { label: "Dispatched", index: 0 },
  in_transit: { label: "In Transit", index: 1 },
  reached:    { label: "Reached Facility", index: 2 },
  seen:       { label: "Seen by Specialist", index: 3 },
  outcome:    { label: "Counter-Referral Done", index: 4 },
};

const PRIORITY_META: Record<ReferralPriority, { label: string; bg: string; text: string; border: string }> = {
  emergency: { label: "Emergency", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  urgent:    { label: "Urgent",    bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  routine:   { label: "Routine",   bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
};

// ─── Modal 1: Create Capacity-Aware Referral (PRD §7.3) ───────────────────────

interface CreateReferralModalProps {
  onClose: () => void;
  onCreate: (referral: ReferralRecord) => void;
}

function CreateReferralModal({ onClose, onCreate }: CreateReferralModalProps) {
  const [patientName, setPatientName] = useState("");
  const [patientAgeSex, setPatientAgeSex] = useState("35M");
  const [abhaId, setAbhaId] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [priority, setPriority] = useState<ReferralPriority>("emergency");
  const [selectedFacility, setSelectedFacility] = useState<FacilityMatch>(FACILITIES_DIRECTORY[0]);
  const [transport, setTransport] = useState("108 Advanced Life Support (ALS) Ambulance");
  const [clinicalReason, setClinicalReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !diagnosis.trim()) return;

    const newRef: ReferralRecord = {
      id: `REF-2024-${String(Math.floor(100 + Math.random() * 900))}`,
      patientId: `BR-PAT-P-${String(Math.floor(1000 + Math.random() * 9000))}`,
      patientName,
      patientAgeSex,
      patientVillage: "Danapur Rural",
      abhaId: abhaId || `14-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      asha: "Meena K.",
      diagnosis,
      icdCode: "R69",
      specialty: selectedFacility.specialty.split("/")[0].trim(),
      facility: selectedFacility.name,
      facilityType: selectedFacility.type,
      distanceKm: selectedFacility.distanceKm,
      matchScore: selectedFacility.matchScore,
      priority,
      stage: "dispatched",
      transport,
      createdAt: "Today 11:00 AM",
      reason: clinicalReason || diagnosis,
    };

    onCreate(newRef);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-lg">Create Care Pathway Referral</h3>
              <span className="px-2 py-0.5 bg-violet-500/20 text-violet-300 border border-violet-400/30 rounded-full text-[10.5px] font-display font-semibold flex items-center gap-1">
                <Sparkles size={11} /> PRD §7.3 Capacity-Aware Engine
              </span>
            </div>
            <p className="text-[12px] text-slate-400 mt-0.5">Automated facility load &amp; specialty matching</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Patient Details */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-[11px] font-display font-bold text-slate-500 uppercase block mb-1">Patient Name</label>
              <input
                value={patientName}
                onChange={e => setPatientName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-xl focus:border-phc-blue outline-none"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-display font-bold text-slate-500 uppercase block mb-1">Age / Sex</label>
              <input
                value={patientAgeSex}
                onChange={e => setPatientAgeSex(e.target.value)}
                placeholder="e.g. 45M"
                className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-xl focus:border-phc-blue outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-display font-bold text-slate-500 uppercase block mb-1">Clinical Diagnosis / Indication</label>
              <input
                value={diagnosis}
                onChange={e => setDiagnosis(e.target.value)}
                placeholder="e.g. Obstructed Labour / Acute Chest Pain"
                className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-xl focus:border-phc-blue outline-none"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-display font-bold text-slate-500 uppercase block mb-1">Urgency Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as ReferralPriority)}
                className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-xl focus:border-phc-blue outline-none bg-white font-semibold"
              >
                <option value="emergency">🔴 Emergency (Immediate Transfer)</option>
                <option value="urgent">🟡 Urgent (Within 24 Hours)</option>
                <option value="routine">🟢 Routine Specialist Evaluation</option>
              </select>
            </div>
          </div>

          {/* PRD §7.3 Capacity-Aware Facility Matcher */}
          <div>
            <label className="text-[11px] font-display font-bold text-slate-500 uppercase block mb-1.5 flex items-center justify-between">
              <span>Recommended Receiving Facilities (Ranked by Match Score)</span>
              <span className="text-[10px] text-emerald-600 font-mono">Live Bed &amp; Stock Sync</span>
            </label>

            <div className="space-y-2">
              {FACILITIES_DIRECTORY.map(fac => {
                const isSelected = selectedFacility.id === fac.id;
                return (
                  <div
                    key={fac.id}
                    onClick={() => setSelectedFacility(fac)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "border-violet-600 bg-violet-50/60 ring-2 ring-violet-200 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-slate-800 text-[13.5px]">{fac.name}</span>
                          <span className="text-[11px] text-slate-400 font-sans">({fac.type})</span>
                        </div>
                        <div className="text-[12px] text-violet-700 font-medium mt-0.5">{fac.specialty}</div>
                      </div>

                      <div className="text-right flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-500">{fac.distanceKm} km</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-display font-bold text-[11px]">
                          {fac.matchScore}% Match
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      <span>{fac.reason}</span>
                      <span className="font-medium text-slate-700">ICU Beds: <strong className="text-emerald-700">{fac.icuBedsAvailable} free</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transport Mode */}
          <div>
            <label className="text-[11px] font-display font-bold text-slate-500 uppercase block mb-1">Ambulance &amp; Transport Mode</label>
            <select
              value={transport}
              onChange={e => setTransport(e.target.value)}
              className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-xl focus:border-phc-blue outline-none bg-white"
            >
              <option>108 Advanced Life Support (ALS) Ambulance</option>
              <option>102 Janani Shishu Express (Maternal / Infant)</option>
              <option>PHC Dedicated Patient Vehicle</option>
              <option>Patient Self Transport / Private</option>
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="text-[11px] font-display font-bold text-slate-500 uppercase block mb-1">Clinical Justification &amp; Notes</label>
            <textarea
              value={clinicalReason}
              onChange={e => setClinicalReason(e.target.value)}
              rows={2}
              placeholder="Clinical findings, vital signs at transfer, pre-referral medication given (e.g. loading dose)..."
              className="w-full px-3 py-2 text-[12.5px] border border-slate-200 rounded-xl focus:border-phc-blue outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[12.5px] font-display border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-phc-blue text-white rounded-xl text-[12.5px] font-display font-semibold hover:bg-phc-blue-dark shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Send size={13} /> Dispatch Referral
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal 2: Track & Counter-Referral Drawer (PRD §7.3) ───────────────────────

interface TrackReferralModalProps {
  referral: ReferralRecord;
  onClose: () => void;
  onUpdateStage: (refId: string, stage: ReferralStage, counterNotes?: string) => void;
}

function TrackReferralModal({ referral, onClose, onUpdateStage }: TrackReferralModalProps) {
  const [stage, setStage] = useState<ReferralStage>(referral.stage);
  const [counterNotes, setCounterNotes] = useState(referral.counterReferralNotes || "");
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    onUpdateStage(referral.id, stage, counterNotes);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  const currentIdx = STAGE_CONFIG[stage].index;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="font-display font-bold text-lg">{referral.patientName}</h3>
              <span className="text-[12px] text-slate-400 font-sans">{referral.patientAgeSex} · {referral.patientVillage}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-display font-bold ${PRIORITY_META[referral.priority].bg} ${PRIORITY_META[referral.priority].text}`}>
                {PRIORITY_META[referral.priority].label}
              </span>
            </div>
            <div className="text-[12px] text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
              <ShieldCheck size={12} /> ABHA: {referral.abhaId} · Ref ID: {referral.id}
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Destination & Reason */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10.5px] font-display font-bold text-slate-400 uppercase tracking-wider">Destination Facility</span>
                <h4 className="font-display font-bold text-slate-900 text-[15px] mt-0.5">{referral.facility}</h4>
                <div className="text-[12px] text-violet-700 font-medium">{referral.specialty}</div>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-mono text-slate-400">Created: {referral.createdAt}</span>
                <div className="text-[11.5px] text-emerald-700 font-semibold mt-0.5">{referral.matchScore}% Weighted Match</div>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-[12.5px] text-slate-700">
              <span className="font-bold text-slate-900">Indication: </span>
              {referral.reason}
            </div>
          </div>

          {/* 5-Step Pipeline (PRD §7.3) */}
          <div>
            <div className="text-[11px] font-display font-bold text-slate-500 uppercase tracking-wider mb-3">
              Referral Pipeline Progress (PRD §7.3)
            </div>
            <div className="grid grid-cols-5 gap-2">
              {(["dispatched", "in_transit", "reached", "seen", "outcome"] as ReferralStage[]).map((st, idx) => {
                const isPassed = idx <= currentIdx;
                const isCurrent = idx === currentIdx;

                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStage(st)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isCurrent
                        ? "border-violet-600 bg-violet-50 text-violet-900 font-bold ring-2 ring-violet-200"
                        : isPassed
                        ? "border-emerald-200 bg-emerald-50/70 text-emerald-900 font-medium"
                        : "border-slate-200 text-slate-400 hover:border-slate-300"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mx-auto mb-1 ${
                      isPassed ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                    }`}>
                      {isPassed ? <Check size={11} /> : idx + 1}
                    </div>
                    <div className="text-[10.5px] leading-tight">{STAGE_CONFIG[st].label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Transport Info */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between text-[12.5px]">
            <div className="flex items-center gap-2 text-slate-700">
              <Car size={16} className="text-phc-blue" />
              <span><strong>Transport:</strong> {referral.transport}</span>
            </div>
            {referral.ambulanceContact && (
              <span className="text-[11.5px] font-mono text-slate-500">{referral.ambulanceContact}</span>
            )}
          </div>

          {/* Counter-Referral Feedback Loop (PRD §7.3) */}
          <div>
            <label className="text-[11px] font-display font-bold text-slate-500 uppercase block mb-1">
              Specialist Counter-Referral Notes &amp; Return Care Plan
            </label>
            <textarea
              value={counterNotes}
              onChange={e => setCounterNotes(e.target.value)}
              rows={3}
              placeholder="Enter specialist discharge findings, medication changes, and post-discharge instructions for PHC & ASHA worker..."
              className="w-full px-3 py-2 text-[12.5px] border border-slate-200 rounded-xl focus:border-phc-blue outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Closing the referral loop automatically sends care instructions to the assigned ASHA app.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[12.5px] font-display border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-phc-blue text-white rounded-xl text-[12.5px] font-display font-semibold hover:bg-phc-blue-dark shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              {isSaved ? <Check size={14} /> : <CheckCircle2 size={14} />}
              {isSaved ? "Updated!" : "Save & Sync Status"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Referrals Component ─────────────────────────────────────────────────

export default function Referrals() {
  const [referrals, setReferrals] = useState<ReferralRecord[]>(INITIAL_REFERRALS);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStage, setFilterStage] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedForTracking, setSelectedForTracking] = useState<ReferralRecord | null>(null);

  // Live Firestore subscription on `referrals` collection
  useEffect(() => {
    const unsub = subscribeReferrals((liveDocs) => {
      if (liveDocs.length > 0) {
        const mappedLive: ReferralRecord[] = liveDocs.map((d) => ({
          id: d.id,
          patientId: d.patientId,
          patientName: d.patientName,
          patientAgeSex: "35F",
          patientVillage: "Danapur (Ward 1)",
          abhaId: d.abhaId || "14-XXXX-XXXX-XXXX",
          asha: d.ashaId || "ASHA Worker",
          diagnosis: d.diagnosis || "Emergency Field Referral",
          icdCode: "ICD-10",
          specialty: d.specialty || "Emergency Medicine",
          facility: d.facilityName || "PMCH Patna",
          facilityType: "Tertiary Center",
          distanceKm: 12,
          matchScore: 96,
          priority: (d.priority as any) || "urgent",
          stage: (d.stage as any) || "dispatched",
          transport: d.transportMode || "108 ALS Ambulance",
          createdAt: typeof d.createdAt === "number" ? new Date(d.createdAt).toLocaleDateString("en-IN") : "Today",
          reason: d.diagnosis || "Specialist clinical escalation from field encounter",
          counterReferralNotes: d.counterReferralNotes || undefined,
        }));

        setReferrals((prev) => {
          const liveIds = new Set(mappedLive.map((m) => m.id));
          const retainedOld = prev.filter((p) => !liveIds.has(p.id));
          return [...mappedLive, ...retainedOld];
        });
      }
    });

    return () => unsub();
  }, []);

  const handleCreateReferral = (newRef: ReferralRecord) => {
    setReferrals(prev => [newRef, ...prev]);
  };

  const handleUpdateStage = (refId: string, stage: ReferralStage, counterNotes?: string) => {
    setReferrals(prev => prev.map(r => {
      if (r.id === refId) {
        return {
          ...r,
          stage,
          counterReferralNotes: counterNotes || r.counterReferralNotes,
        };
      }
      return r;
    }));
  };

  const filtered = useMemo(() => referrals.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      r.patientName.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q) ||
      r.abhaId.includes(q) ||
      r.facility.toLowerCase().includes(q) ||
      r.diagnosis.toLowerCase().includes(q);

    const matchPriority = filterPriority === "all" || r.priority === filterPriority;
    const matchStage = filterStage === "all" || r.stage === filterStage;

    return matchSearch && matchPriority && matchStage;
  }), [referrals, search, filterPriority, filterStage]);

  const metrics = useMemo(() => ({
    total:      referrals.length,
    emergency:  referrals.filter(r => r.priority === "emergency").length,
    inTransit:  referrals.filter(r => r.stage === "in_transit" || r.stage === "dispatched").length,
    completed:  referrals.filter(r => r.stage === "outcome").length,
  }), [referrals]);

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-slate-900 text-2xl tracking-tight">Referrals &amp; Care Pathway</h1>
          <p className="text-[13px] text-slate-500 mt-1">
            ASHA Field Triage → PHC First Contact → Capacity-Aware Facility Referral Chain (PRD §7.3)
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(referrals, null, 2));
              const a = document.createElement("a");
              a.href = dataStr;
              a.download = "SeVaSetu_Referrals_List.json";
              a.click();
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-[13px] font-display font-semibold hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
          >
            <Download size={14} /> Export List
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-phc-blue text-white text-[13px] font-display font-semibold hover:bg-phc-blue-dark transition-all cursor-pointer shadow-xs"
          >
            <Plus size={15} /> Create Referral
          </button>
        </div>
      </div>

      {/* 4 Essential Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Active Referrals", value: metrics.total,     color: "text-slate-900",  bg: "bg-white border-slate-200", action: () => { setFilterPriority("all"); setFilterStage("all"); } },
          { label: "Emergency Transfers",    value: metrics.emergency, color: "text-red-700",    bg: "bg-red-50/70 border-red-200", action: () => setFilterPriority("emergency") },
          { label: "Dispatched / In Transit",value: metrics.inTransit, color: "text-amber-700",  bg: "bg-amber-50/70 border-amber-200", action: () => setFilterStage("in_transit") },
          { label: "Counter-Referrals Done", value: metrics.completed, color: "text-emerald-700",bg: "bg-emerald-50/70 border-emerald-200", action: () => setFilterStage("outcome") },
        ].map(s => (
          <button
            key={s.label}
            onClick={s.action}
            className={`border rounded-2xl p-4 text-left ${s.bg} transition-all cursor-pointer hover:shadow-xs hover:scale-[1.01]`}
          >
            <div className={`font-display font-bold text-2xl leading-none ${s.color}`}>{s.value}</div>
            <div className="text-[12px] text-slate-600 mt-1.5 font-display font-semibold">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Toolbar: Search & Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by patient name, Ref ID, ABHA, facility, or diagnosis..."
              className="w-full pl-9 pr-8 py-2 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-phc-blue/20 focus:border-phc-blue bg-slate-50/50"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Priority filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-[12px] font-display">
            {["all", "emergency", "urgent", "routine"].map(p => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`px-3 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                  filterPriority === p ? "bg-white text-slate-900 font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {p === "all" ? "All Priorities" : p}
              </button>
            ))}
          </div>

          {/* Stage filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-[12px] font-display">
            {["all", "in_transit", "reached", "outcome"].map(st => (
              <button
                key={st}
                onClick={() => setFilterStage(st)}
                className={`px-3 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                  filterStage === st ? "bg-white text-slate-900 font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {st === "all" ? "All Stages" : st === "in_transit" ? "In Transit" : st === "reached" ? "Reached" : "Completed"}
              </button>
            ))}
          </div>

          {(filterPriority !== "all" || filterStage !== "all" || search) && (
            <button
              onClick={() => { setFilterPriority("all"); setFilterStage("all"); setSearch(""); }}
              className="text-[12px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Referrals List Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[10.5px] font-display font-bold text-slate-400 uppercase tracking-wider">
              <th className="px-5 py-3.5">Ref. ID / ABHA</th>
              <th className="px-5 py-3.5">Patient Details</th>
              <th className="px-5 py-3.5">Clinical Indication</th>
              <th className="px-5 py-3.5">Destination Facility (PRD Match)</th>
              <th className="px-5 py-3.5">Priority</th>
              <th className="px-5 py-3.5">Pipeline Stage</th>
              <th className="px-5 py-3.5 text-right">Track</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[13px]">
            {filtered.map(r => {
              const pm = PRIORITY_META[r.priority];
              const st = STAGE_CONFIG[r.stage];

              return (
                <tr
                  key={r.id}
                  onClick={() => setSelectedForTracking(r)}
                  className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="font-mono font-bold text-phc-blue text-[12.5px]">{r.id}</div>
                    <div className="font-mono text-[10.5px] text-emerald-600 flex items-center gap-1 mt-0.5">
                      <ShieldCheck size={10} /> {r.abhaId}
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="font-display font-bold text-slate-900">{r.patientName}</div>
                    <div className="text-[11.5px] text-slate-500">
                      {r.patientAgeSex} · {r.patientVillage}
                    </div>
                    {r.asha && (
                      <div className="text-[10.5px] text-phc-green font-medium flex items-center gap-1 mt-0.5">
                        <UserCheck size={10} /> ASHA: {r.asha}
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-3.5 max-w-xs">
                    <div className="text-slate-800 font-medium line-clamp-1">{r.diagnosis}</div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">ICD-10: {r.icdCode}</div>
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="font-display font-semibold text-slate-900 flex items-center gap-1">
                      <CornerUpRight size={12} className="text-violet-600 flex-shrink-0" />
                      {r.facility}
                    </div>
                    <div className="text-[11.5px] text-violet-700 mt-0.5 flex items-center gap-2">
                      <span>{r.specialty}</span>
                      <span className="text-[10px] font-mono bg-violet-50 text-violet-800 px-1.5 py-0.2 rounded border border-violet-200">
                        {r.matchScore}% Match · {r.distanceKm}km
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-display font-bold border ${pm.bg} ${pm.text} ${pm.border}`}>
                      {r.priority === "emergency" ? "🔴" : r.priority === "urgent" ? "🟡" : "🟢"} {pm.label}
                    </span>
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        r.stage === "outcome" ? "bg-emerald-500" : r.stage === "dispatched" ? "bg-slate-400" : "bg-violet-500 animate-pulse"
                      }`} />
                      <span className="font-display font-semibold text-slate-800 text-[12px]">{st.label}</span>
                    </div>
                    <div className="text-[10.5px] text-slate-400 font-mono mt-0.5">{r.createdAt}</div>
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedForTracking(r); }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-phc-blue hover:text-white text-slate-700 rounded-lg text-[12px] font-display font-semibold transition-all cursor-pointer"
                    >
                      Track &amp; Update →
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal: Create Referral */}
      {showCreateModal && (
        <CreateReferralModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateReferral}
        />
      )}

      {/* Modal: Track & Update Stage */}
      {selectedForTracking && (
        <TrackReferralModal
          referral={selectedForTracking}
          onClose={() => setSelectedForTracking(null)}
          onUpdateStage={handleUpdateStage}
        />
      )}
    </div>
  );
}
