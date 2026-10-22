import { useState, useMemo, useEffect } from "react";
import {
  subscribePatients,
  PatientDoc,
  savePatientClinicalRecord,
  saveReferralRecord,
  pushLongitudinalEncounter,
  pushPrescriptionSegment,
  pushLabReportSegment,
  pushReferralSegment,
  pushFHIRBundle,
} from "../services/firebase";
import { useAuth } from "../auth/AuthContext";
import {
  Search,
  Plus,
  Download,
  UserCheck,
  ChevronDown,
  X,
  CheckCircle2,
  Clock,
  CornerUpRight,
  ChevronRight,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Activity,
  AlertTriangle,
  Heart,
  Wifi,
  WifiOff,
  Stethoscope,
  Baby,
  Pill,
  User,
  SlidersHorizontal,
  ChevronLeft,
  Zap,
  ArrowUpRight,
  RefreshCcw,
  ShieldCheck,
  Thermometer,
  Eye,
  LayoutGrid,
  List,
  Info,
  QrCode,
  Share2,
  FileSpreadsheet,
  Check,
  Send,
  Building2,
  TrendingUp,
  FlaskConical,
  ClipboardCheck,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type PatientStatus = "active" | "referred" | "discharged" | "critical";
type SexType = "M" | "F";
type RiskBand = "RED" | "YELLOW" | "GREEN";
type SyncStatus = "synced" | "pending" | "offline";
type ReferralStatus = "dispatched" | "in_transit" | "reached" | "seen" | "outcome";
type Cohort = "ANC" | "TB" | "CHRONIC" | "CHILD" | "GENERAL";

interface VitalReading {
  type: "HR" | "SpO2" | "BP" | "Temp" | "RR" | "Weight";
  value: string;
  unit: string;
  source: "asha_app" | "manual";
  timestamp: string;
  flagged?: boolean;
}

interface ReferralInfo {
  id: string;
  facility: string;
  specialty: string;
  status: ReferralStatus;
  createdAt: string;
  reason: string;
  counterReferralNotes?: string;
}

interface TimelineEntry {
  date: string;
  type: "visit" | "triage" | "referral" | "followup" | "sos" | "sync";
  summary: string;
  riskBand?: RiskBand;
  doctor?: string;
  details?: string;
}

interface PrescriptionItem {
  id: string;
  drug: string;
  dosage: string;
  frequency: string;
  duration: string;
  status: "Active" | "Completed" | "Discontinued";
  prescribedBy: string;
  prescribedOn: string;
}

interface LabReportItem {
  id: string;
  testName: string;
  loincCode: string;
  result: string;
  referenceRange: string;
  status: "Normal" | "Abnormal" | "Pending";
  date: string;
}

interface Patient {
  id: string;
  abhaId?: string;
  name: string;
  age: number;
  sex: SexType;
  dob: string;
  village: string;
  ward: string;
  block: string;
  mobile?: string;
  asha?: string;
  ashaId?: string;
  cohort: Cohort;
  conditions: string[];
  icdCodes?: string[];
  lastVisit: string;
  nextVisit?: string;
  visits: number;
  status: PatientStatus;
  riskBand: RiskBand;
  riskReason?: string;
  flags: string[];
  syncStatus: SyncStatus;
  abhaLinked?: boolean;
  vitals?: VitalReading[];
  referral?: ReferralInfo;
  prescriptions?: PrescriptionItem[];
  labReports?: LabReportItem[];
  followUpOverdue?: boolean;
  registeredAt: string;
  timeline?: TimelineEntry[];
}

// ─── Initial Dataset ──────────────────────────────────────────────────────────

const INITIAL_PATIENTS: Patient[] = [
  {
    id: "PAT-101",
    abhaId: "14-3456-7890-1234",
    name: "Sunita Devi",
    age: 26,
    sex: "F",
    dob: "12 Aug 1998",
    village: "Palghar",
    ward: "Ward 1",
    block: "Danapur",
    mobile: "+91 98230 11234",
    asha: "Sunita Tai",
    ashaId: "ASHA-MH-7892",
    cohort: "ANC",
    conditions: ["High Risk Pregnancy (Trimester 2)", "Preeclampsia Risk", "Severe Abdominal Pain"],
    lastVisit: "Today",
    visits: 1,
    status: "active",
    riskBand: "RED",
    riskReason: "Maternal High Risk: Severe Abdominal Pain & Vaginal Bleeding, BP 165/112 (ASHA field triage score: 89/100)",
    flags: ["ANC", "RED", "High Risk"],
    syncStatus: "synced",
    abhaLinked: true,
    vitals: [
      { type: "BP", value: "165/112", unit: "mmHg", source: "asha_app", timestamp: "Today 10:05", flagged: true },
      { type: "HR", value: "98", unit: "bpm", source: "asha_app", timestamp: "Today 10:05" },
      { type: "SpO2", value: "96", unit: "%", source: "asha_app", timestamp: "Today 10:05" },
      { type: "Temp", value: "37.0", unit: "°C", source: "asha_app", timestamp: "Today 10:05" },
    ],
    registeredAt: "Today",
    timeline: [
      { date: "Today", type: "visit", summary: "Registered via ASHA Mobile App by Sunita Tai", riskBand: "RED" },
    ],
    prescriptions: [
      { id: "RX-101", drug: "Iron + Folic Acid (IFA)", dosage: "1 Tab", frequency: "Once daily after food", duration: "100 Days", status: "Active", prescribedBy: "Dr. Rajesh Sharma", prescribedOn: "Today" },
    ],
    labReports: [],
  },
  {
    id: "BR-PAT-P-0891",
    abhaId: "14-2384-7612-9034",
    name: "Arvind Kumar",
    age: 34,
    sex: "M",
    dob: "14 Mar 1990",
    village: "Saraiya",
    ward: "Ward 2",
    block: "Danapur",
    mobile: "+91 98760 12345",
    asha: "Sunita D.",
    ashaId: "ASHA-018",
    cohort: "TB",
    conditions: ["Pulmonary TB (suspected)"],
    icdCodes: ["A16.2"],
    lastVisit: "30 Aug 2024",
    nextVisit: "06 Sep 2024",
    visits: 3,
    status: "referred",
    riskBand: "YELLOW",
    riskReason: "Persistent cough >3 weeks, night sweats, weight loss flagged as moderate risk",
    flags: ["TB", "DOTS"],
    syncStatus: "synced",
    abhaLinked: false,
    vitals: [
      { type: "BP", value: "122/78", unit: "mmHg", source: "manual", timestamp: "30 Aug 2024 10:15" },
      { type: "HR", value: "84", unit: "bpm", source: "manual", timestamp: "30 Aug 2024 10:15" },
      { type: "Temp", value: "37.8", unit: "°C", source: "manual", timestamp: "30 Aug 2024 10:15", flagged: true },
      { type: "SpO2", value: "96", unit: "%", source: "manual", timestamp: "30 Aug 2024 10:15" },
    ],
    referral: {
      id: "REF-00482",
      facility: "Patna Medical College Hospital (PMCH)",
      specialty: "Pulmonology",
      status: "reached",
      createdAt: "30 Aug 2024",
      reason: "Sputum AFB positive — specialist confirmation & line probe assay required",
      counterReferralNotes: "Confirmed Drug-Sensitive Pulmonary TB. Initiated 2HRZE. Referred back to PHC for DOTS administration.",
    },
    prescriptions: [
      { id: "RX-101", drug: "Isoniazid (H)", dosage: "300 mg", frequency: "Once daily (Morning)", duration: "6 Months", status: "Active", prescribedBy: "Dr. Aravind Kumar", prescribedOn: "30 Aug 2024" },
      { id: "RX-102", drug: "Rifampicin (R)", dosage: "450 mg", frequency: "Once daily (Morning)", duration: "6 Months", status: "Active", prescribedBy: "Dr. Aravind Kumar", prescribedOn: "30 Aug 2024" },
      { id: "RX-103", drug: "Pyrazinamide (Z)", dosage: "1500 mg", frequency: "Once daily", duration: "2 Months", status: "Active", prescribedBy: "Dr. Aravind Kumar", prescribedOn: "30 Aug 2024" },
      { id: "RX-104", drug: "Ethambutol (E)", dosage: "800 mg", frequency: "Once daily", duration: "2 Months", status: "Active", prescribedBy: "Dr. Aravind Kumar", prescribedOn: "30 Aug 2024" },
    ],
    labReports: [
      { id: "LAB-801", testName: "Sputum AFB Smear", loincCode: "11477-7", result: "2+ Positive", referenceRange: "Negative", status: "Abnormal", date: "30 Aug 2024" },
      { id: "LAB-802", testName: "Chest X-Ray PA View", loincCode: "36572-6", result: "Upper lobe infiltrates", referenceRange: "Clear lung fields", status: "Abnormal", date: "28 Aug 2024" },
      { id: "LAB-803", testName: "Hemoglobin (CBC)", loincCode: "718-7", result: "11.2 g/dL", referenceRange: "13.0 - 17.0 g/dL", status: "Abnormal", date: "28 Aug 2024" },
    ],
    followUpOverdue: false,
    registeredAt: "12 Aug 2024",
    timeline: [
      { date: "30 Aug 2024", type: "referral", summary: "Referred to PMCH Pulmonology — sputum AFB 2+", riskBand: "YELLOW", doctor: "Dr. Aravind Kumar" },
      { date: "25 Aug 2024", type: "triage", summary: "ASHA triage: cough >3wk, night sweats. ML score: YELLOW", riskBand: "YELLOW" },
      { date: "12 Aug 2024", type: "visit", summary: "Registered at PHC. Chest X-Ray ordered.", doctor: "Dr. Aravind Kumar" },
    ],
  },
  {
    id: "BR-PAT-P-0892",
    abhaId: "14-9021-3345-8801",
    name: "Kamla Devi",
    age: 45,
    sex: "F",
    dob: "02 Jun 1979",
    village: "Rampur",
    ward: "Ward 3",
    block: "Danapur",
    mobile: "+91 99321 44556",
    asha: "Meena K.",
    ashaId: "ASHA-031",
    cohort: "CHRONIC",
    conditions: ["Hypertension — Stage 2", "Viral Fever"],
    icdCodes: ["I10", "J06.9"],
    lastVisit: "01 Sep 2024",
    nextVisit: "15 Sep 2024",
    visits: 8,
    status: "active",
    riskBand: "GREEN",
    flags: ["HTN", "Chronic"],
    syncStatus: "synced",
    abhaLinked: true,
    vitals: [
      { type: "BP", value: "148/92", unit: "mmHg", source: "manual", timestamp: "01 Sep 2024 09:30", flagged: true },
      { type: "HR", value: "82", unit: "bpm", source: "asha_app", timestamp: "01 Sep 2024 09:00" },
      { type: "Temp", value: "38.4", unit: "°C", source: "manual", timestamp: "01 Sep 2024 09:30", flagged: true },
      { type: "SpO2", value: "98", unit: "%", source: "asha_app", timestamp: "01 Sep 2024 09:00" },
    ],
    prescriptions: [
      { id: "RX-201", drug: "Amlodipine", dosage: "5 mg", frequency: "Once daily (Morning)", duration: "30 Days", status: "Active", prescribedBy: "Dr. Aravind Kumar", prescribedOn: "01 Sep 2024" },
      { id: "RX-202", drug: "Paracetamol", dosage: "650 mg", frequency: "Thrice daily after food", duration: "5 Days", status: "Active", prescribedBy: "Dr. Aravind Kumar", prescribedOn: "01 Sep 2024" },
      { id: "RX-203", drug: "Telmisartan", dosage: "40 mg", frequency: "Once daily (Bedtime)", duration: "30 Days", status: "Active", prescribedBy: "Dr. Aravind Kumar", prescribedOn: "01 Sep 2024" },
    ],
    labReports: [
      { id: "LAB-811", testName: "Serum Creatinine", loincCode: "2160-0", result: "0.9 mg/dL", referenceRange: "0.6 - 1.2 mg/dL", status: "Normal", date: "01 Sep 2024" },
      { id: "LAB-812", testName: "Rapid Malaria Antigen", loincCode: "49605-9", result: "Negative", referenceRange: "Negative", status: "Normal", date: "01 Sep 2024" },
      { id: "LAB-813", testName: "Lipid Profile (Total Cholesterol)", loincCode: "2093-3", result: "192 mg/dL", referenceRange: "< 200 mg/dL", status: "Normal", date: "15 Aug 2024" },
    ],
    followUpOverdue: false,
    registeredAt: "10 Jan 2024",
    timeline: [
      { date: "01 Sep 2024", type: "visit", summary: "BP 148/92 — medication adjusted. Paracetamol prescribed for acute fever.", riskBand: "GREEN", doctor: "Dr. Aravind Kumar" },
      { date: "15 Aug 2024", type: "followup", summary: "Routine HTN follow-up. BP 142/88 — stable." },
      { date: "10 Jan 2024", type: "visit", summary: "Initial diagnosis of Essential Hypertension. ASHA field protocol initiated.", doctor: "Dr. Aravind Kumar" },
    ],
  },
  {
    id: "BR-PAT-P-0893",
    abhaId: "14-5512-0034-2267",
    name: "Raghav Sharma",
    age: 62,
    sex: "M",
    dob: "19 Nov 1961",
    village: "Maner",
    ward: "Ward 1",
    block: "Maner",
    mobile: "+91 94312 88990",
    cohort: "CHRONIC",
    conditions: ["Type 2 Diabetes Mellitus", "Hypertension"],
    icdCodes: ["E11", "I10"],
    lastVisit: "01 Sep 2024",
    nextVisit: "15 Sep 2024",
    visits: 24,
    status: "active",
    riskBand: "YELLOW",
    riskReason: "HbA1c 9.2% — uncontrolled. BP 162/96 at last visit",
    flags: ["DM", "HTN", "Chronic"],
    syncStatus: "synced",
    abhaLinked: true,
    vitals: [
      { type: "BP", value: "162/96", unit: "mmHg", source: "asha_app", timestamp: "01 Sep 2024 08:45", flagged: true },
      { type: "HR", value: "76", unit: "bpm", source: "asha_app", timestamp: "01 Sep 2024 08:45" },
      { type: "SpO2", value: "97", unit: "%", source: "asha_app", timestamp: "01 Sep 2024 08:45" },
    ],
    prescriptions: [
      { id: "RX-301", drug: "Metformin", dosage: "1000 mg", frequency: "Twice daily with meals", duration: "30 Days", status: "Active", prescribedBy: "Dr. Aravind Kumar", prescribedOn: "01 Sep 2024" },
      { id: "RX-302", drug: "Glimepiride", dosage: "2 mg", frequency: "Once daily before breakfast", duration: "30 Days", status: "Active", prescribedBy: "Dr. Aravind Kumar", prescribedOn: "01 Sep 2024" },
      { id: "RX-303", drug: "Telmisartan", dosage: "80 mg", frequency: "Once daily (Morning)", duration: "30 Days", status: "Active", prescribedBy: "Dr. Aravind Kumar", prescribedOn: "01 Sep 2024" },
    ],
    labReports: [
      { id: "LAB-821", testName: "HbA1c Glycated Hemoglobin", loincCode: "4548-4", result: "9.2%", referenceRange: "< 6.5%", status: "Abnormal", date: "01 Sep 2024" },
      { id: "LAB-822", testName: "Fasting Blood Glucose", loincCode: "1558-6", result: "184 mg/dL", referenceRange: "70 - 100 mg/dL", status: "Abnormal", date: "01 Sep 2024" },
      { id: "LAB-823", testName: "Urine Microalbumin", loincCode: "14957-5", result: "45 mg/L", referenceRange: "< 20 mg/L", status: "Abnormal", date: "01 Sep 2024" },
    ],
    followUpOverdue: false,
    registeredAt: "03 Mar 2022",
    timeline: [
      { date: "01 Sep 2024", type: "visit", summary: "HbA1c 9.2% — insulin therapy discussed. BP 162/96 — antihypertensive stepped up.", riskBand: "YELLOW", doctor: "Dr. Aravind Kumar" },
      { date: "15 Aug 2024", type: "followup", summary: "Follow-up Intelligence: flagged ASHA field BP spike >160 on 12 Aug." },
    ],
  },
  {
    id: "BR-PAT-P-0894",
    abhaId: "14-8834-1190-5542",
    name: "Ananya Singh",
    age: 28,
    sex: "F",
    dob: "07 Apr 1996",
    village: "Danapur",
    ward: "Ward 3",
    block: "Danapur",
    mobile: "+91 82200 99881",
    asha: "Sunita D.",
    ashaId: "ASHA-018",
    cohort: "ANC",
    conditions: ["ANC — 28 weeks (G2P1)", "Mild anaemia (Hb 9.4 g/dL)"],
    icdCodes: ["Z34.2", "D50.9"],
    lastVisit: "01 Sep 2024",
    nextVisit: "15 Sep 2024",
    visits: 5,
    status: "active",
    riskBand: "YELLOW",
    riskReason: "Low Hb 9.4 g/dL in second trimester — iron supplementation initiated; monitoring required",
    flags: ["ANC", "Anaemia"],
    syncStatus: "synced",
    abhaLinked: true,
    vitals: [
      { type: "BP", value: "110/70", unit: "mmHg", source: "manual", timestamp: "01 Sep 2024 10:00" },
      { type: "HR", value: "88", unit: "bpm", source: "asha_app", timestamp: "01 Sep 2024 09:55" },
      { type: "Weight", value: "58.2", unit: "kg", source: "manual", timestamp: "01 Sep 2024 10:00" },
      { type: "SpO2", value: "99", unit: "%", source: "asha_app", timestamp: "01 Sep 2024 09:55" },
    ],
    prescriptions: [
      { id: "RX-401", drug: "Iron & Folic Acid (IFA)", dosage: "100 mg elemental iron + 500 mcg FA", frequency: "Once daily after meals", duration: "100 Days", status: "Active", prescribedBy: "Dr. Meena Devi", prescribedOn: "01 Sep 2024" },
      { id: "RX-402", drug: "Calcium & Vitamin D3", dosage: "500 mg Ca + 250 IU Vit D3", frequency: "Twice daily after food", duration: "100 Days", status: "Active", prescribedBy: "Dr. Meena Devi", prescribedOn: "01 Sep 2024" },
      { id: "RX-403", drug: "Tetanus Toxoid (TT-2)", dosage: "0.5 mL IM", frequency: "Completed (2nd dose)", duration: "Static", status: "Completed", prescribedBy: "Dr. Meena Devi", prescribedOn: "15 Aug 2024" },
    ],
    labReports: [
      { id: "LAB-831", testName: "Hemoglobin (Hb)", loincCode: "718-7", result: "9.4 g/dL", referenceRange: "11.0 - 14.0 g/dL", status: "Abnormal", date: "01 Sep 2024" },
      { id: "LAB-832", testName: "Obstetric Ultrasound (USG)", loincCode: "11525-3", result: "Single live fetus, cephalic, adequate liquor, GA 28w1d", referenceRange: "Normal development", status: "Normal", date: "20 Aug 2024" },
      { id: "LAB-833", testName: "Blood Group & Rh Type", loincCode: "883-9", result: "B Positive (Rh+)", referenceRange: "Static", status: "Normal", date: "15 Jun 2024" },
    ],
    followUpOverdue: false,
    registeredAt: "15 Jun 2024",
    timeline: [
      { date: "01 Sep 2024", type: "visit", summary: "ANC 28wk check. Hb 9.4 — IFA tablets doubled. Fetal heart sounds normal (142 bpm).", riskBand: "YELLOW", doctor: "Dr. Meena Devi" },
      { date: "15 Aug 2024", type: "followup", summary: "ANC 24wk visit. TT-2 dose administered by ASHA Sunita D." },
    ],
  },
  {
    id: "BR-PAT-P-0895",
    abhaId: "14-7723-4412-6609",
    name: "Shivam Tiwari",
    age: 55,
    sex: "M",
    dob: "23 Jan 1969",
    village: "Bikramganj",
    ward: "Ward 5",
    block: "Bikramganj",
    cohort: "TB",
    conditions: ["Pulmonary TB (confirmed) — DOTS Day 42"],
    icdCodes: ["A15.0"],
    lastVisit: "01 Sep 2024",
    nextVisit: "02 Sep 2024",
    visits: 42,
    status: "active",
    riskBand: "GREEN",
    flags: ["TB", "DOTS"],
    syncStatus: "pending",
    abhaLinked: false,
    vitals: [
      { type: "BP", value: "126/80", unit: "mmHg", source: "manual", timestamp: "01 Sep 2024 09:50" },
      { type: "HR", value: "72", unit: "bpm", source: "manual", timestamp: "01 Sep 2024 09:50" },
      { type: "Weight", value: "62.4", unit: "kg", source: "manual", timestamp: "01 Sep 2024 09:50" },
      { type: "SpO2", value: "98", unit: "%", source: "manual", timestamp: "01 Sep 2024 09:50" },
    ],
    prescriptions: [
      { id: "RX-501", drug: "4-FDC (HRZE) Adult Blister Pack", dosage: "4 Tablets", frequency: "Daily under Direct Observation", duration: "Day 42/56 (Intensive Phase)", status: "Active", prescribedBy: "Dr. Aravind Kumar", prescribedOn: "22 Jul 2024" },
    ],
    labReports: [
      { id: "LAB-841", testName: "Follow-up Sputum Smear (End Month 1)", loincCode: "11477-7", result: "Negative (0/3)", referenceRange: "Negative", status: "Normal", date: "25 Aug 2024" },
    ],
    followUpOverdue: false,
    registeredAt: "22 Jul 2024",
    timeline: [
      { date: "01 Sep 2024", type: "followup", summary: "DOTS Day 42 — medication taken. Cough fully resolved. Weight +1.2kg gain.", riskBand: "GREEN" },
      { date: "25 Aug 2024", type: "followup", summary: "DOTS Day 35 — compliant. Sputum smear negative." },
    ],
  },
  {
    id: "BR-PAT-P-0896",
    abhaId: "14-3301-8847-0023",
    name: "Saurabh Verma",
    age: 42,
    sex: "M",
    dob: "11 Sep 1981",
    village: "Danapur",
    ward: "Ward 3",
    block: "Danapur",
    mobile: "+91 94890 11223",
    asha: "Meena K.",
    ashaId: "ASHA-031",
    cohort: "GENERAL",
    conditions: ["Acute Coronary Syndrome (Suspected STEMI)", "Hypertensive Emergency"],
    icdCodes: ["I21.9", "I16.9"],
    lastVisit: "01 Sep 2024",
    visits: 1,
    status: "critical",
    riskBand: "RED",
    riskReason: "Chest pain radiating to left arm, SpO2 92%, BP 158/102, diaphoresis — immediate emergency care & tertiary transfer required",
    flags: ["CARDIAC", "URGENT", "EMERGENCY"],
    syncStatus: "synced",
    abhaLinked: true,
    vitals: [
      { type: "BP", value: "158/102", unit: "mmHg", source: "manual", timestamp: "01 Sep 2024 10:03", flagged: true },
      { type: "HR", value: "108", unit: "bpm", source: "asha_app", timestamp: "01 Sep 2024 10:03", flagged: true },
      { type: "Temp", value: "37.2", unit: "°C", source: "manual", timestamp: "01 Sep 2024 10:03" },
      { type: "SpO2", value: "92", unit: "%", source: "asha_app", timestamp: "01 Sep 2024 10:03", flagged: true },
      { type: "RR", value: "22", unit: "/min", source: "manual", timestamp: "01 Sep 2024 10:03", flagged: true },
    ],
    referral: {
      id: "REF-00499",
      facility: "AIIMS Patna (Cardiology Cath Lab)",
      specialty: "Interventional Cardiology",
      status: "dispatched",
      createdAt: "01 Sep 2024",
      reason: "Suspected STEMI with ST elevation on 12-lead ECG. Dual antiplatelet loading given. 108 Ambulance dispatched.",
    },
    prescriptions: [
      { id: "RX-601", drug: "Aspirin (Dispersible)", dosage: "325 mg", frequency: "Stat dose (Chewed)", duration: "Immediate", status: "Completed", prescribedBy: "Dr. Aravind Kumar", prescribedOn: "01 Sep 2024" },
      { id: "RX-602", drug: "Clopidogrel", dosage: "300 mg", frequency: "Stat loading dose", duration: "Immediate", status: "Completed", prescribedBy: "Dr. Aravind Kumar", prescribedOn: "01 Sep 2024" },
      { id: "RX-603", drug: "Atorvastatin", dosage: "80 mg", frequency: "Stat dose", duration: "Immediate", status: "Completed", prescribedBy: "Dr. Aravind Kumar", prescribedOn: "01 Sep 2024" },
    ],
    labReports: [
      { id: "LAB-851", testName: "12-Lead ECG", loincCode: "11524-6", result: "ST elevation in V1-V4 with reciprocal depression in II, III, aVF", referenceRange: "Normal sinus rhythm", status: "Abnormal", date: "01 Sep 2024" },
      { id: "LAB-852", testName: "Troponin-T Rapid Card", loincCode: "6598-7", result: "Positive (+)", referenceRange: "Negative", status: "Abnormal", date: "01 Sep 2024" },
    ],
    followUpOverdue: false,
    registeredAt: "01 Sep 2024",
    timeline: [
      { date: "01 Sep 2024 10:03", type: "sos", summary: "Arrived in acute distress. Triage score RED. ECG confirmed anterior STEMI.", riskBand: "RED", doctor: "Dr. Aravind Kumar" },
      { date: "01 Sep 2024 10:15", type: "referral", summary: "Emergency referral dispatched to AIIMS Patna Cath Lab with ALS ambulance.", riskBand: "RED", doctor: "Dr. Aravind Kumar" },
    ],
  },
  {
    id: "BR-PAT-P-0897",
    abhaId: "14-6699-2215-1187",
    name: "Geeta Yadav",
    age: 24,
    sex: "F",
    dob: "30 Oct 1999",
    village: "Paliganj",
    ward: "Ward 4",
    block: "Paliganj",
    asha: "Neelam S.",
    ashaId: "ASHA-009",
    cohort: "ANC",
    conditions: ["Severe Pre-eclampsia (34 weeks)", "Proteinuria 3+"],
    icdCodes: ["O14.13"],
    lastVisit: "31 Aug 2024",
    visits: 6,
    status: "referred",
    riskBand: "RED",
    riskReason: "BP 164/110 mmHg, severe headache, hyperreflexia, urine protein 3+ at 34 weeks — high maternal risk",
    flags: ["OBSTETRIC", "HIGH RISK", "ANC"],
    syncStatus: "synced",
    abhaLinked: true,
    vitals: [
      { type: "BP", value: "164/110", unit: "mmHg", source: "manual", timestamp: "31 Aug 2024 14:20", flagged: true },
      { type: "HR", value: "94", unit: "bpm", source: "asha_app", timestamp: "31 Aug 2024 14:15" },
      { type: "SpO2", value: "97", unit: "%", source: "asha_app", timestamp: "31 Aug 2024 14:15" },
    ],
    referral: {
      id: "REF-00478",
      facility: "Danapur Sub-divisional Hospital (SNCU/OBG)",
      specialty: "Obstetrics & Gynaecology (Emergency)",
      status: "seen",
      createdAt: "31 Aug 2024",
      reason: "Imminent eclampsia at 34 weeks. MgSO4 loading protocol initiated. Admission for emergency stabilization.",
      counterReferralNotes: "Admitted to HDU. MgSO4 infusion completed. BP stabilized to 138/88 on Labetalol. Fetal monitoring reassuring.",
    },
    followUpOverdue: false,
    registeredAt: "05 Apr 2024",
    timeline: [
      { date: "31 Aug 2024", type: "referral", summary: "Referred for severe pre-eclampsia. MgSO4 loading given.", riskBand: "RED", doctor: "Dr. Meena Devi" },
      { date: "15 Aug 2024", type: "visit", summary: "ANC 32wk review. BP was 134/86 — advised weekly check.", doctor: "Dr. Meena Devi" },
    ],
  },
  {
    id: "BR-PAT-P-0898",
    abhaId: "14-1122-7789-3340",
    name: "Lakshmi Devi",
    age: 67,
    sex: "F",
    dob: "05 May 1957",
    village: "Patna Rural",
    ward: "Ward 2",
    block: "Danapur",
    cohort: "CHRONIC",
    conditions: ["Osteoarthritis — Bilateral Knee", "Hypertension"],
    icdCodes: ["M17.0", "I10"],
    lastVisit: "28 Aug 2024",
    nextVisit: "28 Sep 2024",
    visits: 14,
    status: "active",
    riskBand: "GREEN",
    flags: ["HTN", "Chronic", "Elderly"],
    syncStatus: "synced",
    abhaLinked: false,
    vitals: [
      { type: "BP", value: "132/84", unit: "mmHg", source: "manual", timestamp: "28 Aug 2024 11:00" },
      { type: "HR", value: "70", unit: "bpm", source: "manual", timestamp: "28 Aug 2024 11:00" },
    ],
    prescriptions: [
      { id: "RX-701", drug: "Paracetamol", dosage: "500 mg", frequency: "SOS for joint pain", duration: "15 Days", status: "Active", prescribedBy: "Dr. Aravind Kumar", prescribedOn: "28 Aug 2024" },
      { id: "RX-702", drug: "Telmisartan", dosage: "40 mg", frequency: "Once daily (Morning)", duration: "30 Days", status: "Active", prescribedBy: "Dr. Aravind Kumar", prescribedOn: "28 Aug 2024" },
    ],
    followUpOverdue: false,
    registeredAt: "14 Nov 2022",
    timeline: [
      { date: "28 Aug 2024", type: "visit", summary: "Knee pain review. Physiotherapy exercises demonstrated. BP well controlled.", riskBand: "GREEN", doctor: "Dr. Aravind Kumar" },
    ],
  },
  {
    id: "BR-PAT-P-0899",
    abhaId: "14-4558-9930-7712",
    name: "Manohar Singh",
    age: 66,
    sex: "M",
    dob: "18 Aug 1958",
    village: "Mokama",
    ward: "Ward 1",
    block: "Mokama",
    cohort: "CHRONIC",
    conditions: ["Chronic Kidney Disease (Stage 3)", "Hypertension"],
    icdCodes: ["N18.3", "I10"],
    lastVisit: "20 Aug 2024",
    nextVisit: "03 Sep 2024",
    visits: 19,
    status: "active",
    riskBand: "YELLOW",
    riskReason: "eGFR 48 mL/min/1.73m2, Serum Creatinine 2.1 mg/dL — requires strict nephrology cadence",
    flags: ["HTN", "CKD", "Chronic"],
    syncStatus: "synced",
    abhaLinked: true,
    vitals: [
      { type: "BP", value: "142/88", unit: "mmHg", source: "asha_app", timestamp: "20 Aug 2024 10:00" },
      { type: "HR", value: "74", unit: "bpm", source: "asha_app", timestamp: "20 Aug 2024 10:00" },
    ],
    followUpOverdue: true,
    registeredAt: "08 Feb 2023",
    timeline: [
      { date: "20 Aug 2024", type: "visit", summary: "Renal profile review. Dietary protein restriction reinforced.", riskBand: "YELLOW", doctor: "Dr. Aravind Kumar" },
    ],
  },
  {
    id: "BR-PAT-P-0900",
    abhaId: "14-9900-3311-2244",
    name: "Baby Aaradhya",
    age: 2,
    sex: "F",
    dob: "12 Aug 2022",
    village: "Saraiya",
    ward: "Ward 2",
    block: "Danapur",
    asha: "Sunita D.",
    ashaId: "ASHA-018",
    cohort: "CHILD",
    conditions: ["Severe Acute Malnutrition (SAM)", "Recurrent Diarrhoea"],
    icdCodes: ["E43", "A09"],
    lastVisit: "29 Aug 2024",
    nextVisit: "05 Sep 2024",
    visits: 7,
    status: "active",
    riskBand: "YELLOW",
    riskReason: "MUAC 11.2 cm (Red zone), weight-for-height <-3SD — enrolled in Nutrition Rehabilitation Centre (NRC) protocol",
    flags: ["SAM", "PAEDIATRIC", "NUTRITION"],
    syncStatus: "synced",
    abhaLinked: false,
    vitals: [
      { type: "Weight", value: "8.1", unit: "kg", source: "manual", timestamp: "29 Aug 2024 11:30", flagged: true },
      { type: "Temp", value: "37.0", unit: "°C", source: "manual", timestamp: "29 Aug 2024 11:30" },
    ],
    prescriptions: [
      { id: "RX-801", drug: "Ready-to-Use Therapeutic Food (RUTF)", dosage: "2 Packets/day", frequency: "Daily feeds", duration: "14 Days", status: "Active", prescribedBy: "Dr. Priya Rani", prescribedOn: "29 Aug 2024" },
      { id: "RX-802", drug: "Zinc Sulfate", dosage: "20 mg", frequency: "Once daily", duration: "14 Days", status: "Active", prescribedBy: "Dr. Priya Rani", prescribedOn: "29 Aug 2024" },
      { id: "RX-803", drug: "Oral Rehydration Salts (ORS)", dosage: "1 Sachet in 1L water", frequency: "After each loose stool", duration: "5 Days", status: "Active", prescribedBy: "Dr. Priya Rani", prescribedOn: "29 Aug 2024" },
    ],
    followUpOverdue: false,
    registeredAt: "10 Jul 2024",
    timeline: [
      { date: "29 Aug 2024", type: "visit", summary: "NRC follow-up. Weight gained +200g. RUTF supply replenished.", riskBand: "YELLOW", doctor: "Dr. Priya Rani" },
      { date: "15 Aug 2024", type: "triage", summary: "ASHA home visit flagged MUAC 11.0 cm. Initiated urgent PHC referral." },
    ],
  },
];

// ─── Visual Tokens & Meta ─────────────────────────────────────────────────────

const STATUS_META: Record<PatientStatus, { label: string; bg: string; text: string; dot: string }> = {
  active:     { label: "Active",     bg: "bg-emerald-50 border border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  referred:   { label: "Referred",   bg: "bg-violet-50 border border-violet-200",   text: "text-violet-700",  dot: "bg-violet-500" },
  discharged: { label: "Discharged", bg: "bg-slate-50 border border-slate-200",     text: "text-slate-600",   dot: "bg-slate-400" },
  critical:   { label: "Critical",   bg: "bg-red-50 border border-red-200",         text: "text-red-700",     dot: "bg-red-500" },
};

const RISK_META: Record<RiskBand, { label: string; bg: string; text: string; border: string; icon: string }> = {
  RED:    { label: "High Risk",     bg: "bg-red-50",    text: "text-red-700",    border: "border-red-300",    icon: "🔴" },
  YELLOW: { label: "Moderate Risk", bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-300",  icon: "🟡" },
  GREEN:  { label: "Normal / Low",  bg: "bg-emerald-50",text: "text-emerald-700",border: "border-emerald-300",icon: "🟢" },
};

const COHORT_META: Record<Cohort, { label: string; color: string; icon: React.ReactNode }> = {
  ANC:     { label: "ANC / Maternity", color: "text-pink-600",   icon: <Baby size={12} /> },
  TB:      { label: "TB / DOTS",       color: "text-amber-600",  icon: <Pill size={12} /> },
  CHRONIC: { label: "Chronic Disease", color: "text-blue-600",   icon: <Heart size={12} /> },
  CHILD:   { label: "Child Health",    color: "text-purple-600", icon: <Baby size={12} /> },
  GENERAL: { label: "General Primary", color: "text-slate-600",  icon: <Stethoscope size={12} /> },
};

export function normalizeRiskBand(risk?: string): RiskBand {
  if (!risk) return "GREEN";
  const r = String(risk).toUpperCase();
  if (r.includes("RED") || r.includes("HIGH") || r.includes("CRITICAL") || r.includes("EMERGENCY")) return "RED";
  if (r.includes("YELLOW") || r.includes("MODERATE") || r.includes("URGENT") || r.includes("MEDIUM")) return "YELLOW";
  return "GREEN";
}

export function normalizeStatus(status?: string, hasReferral?: boolean): PatientStatus {
  if (!status) return hasReferral ? "referred" : "active";
  const s = String(status).toLowerCase();
  if (s.includes("refer")) return "referred";
  if (s.includes("discharg")) return "discharged";
  if (s.includes("critic")) return "critical";
  return "active";
}

export function normalizeCohort(cohort?: string): Cohort {
  if (!cohort) return "GENERAL";
  const c = String(cohort).toUpperCase();
  if (c.includes("ANC") || c.includes("MATERN") || c.includes("PREGNAN")) return "ANC";
  if (c.includes("TB") || c.includes("DOTS") || c.includes("PULMON")) return "TB";
  if (c.includes("CHRONIC") || c.includes("NCD") || c.includes("HTN") || c.includes("DIABET")) return "CHRONIC";
  if (c.includes("CHILD") || c.includes("PED") || c.includes("INFANT") || c.includes("SAM")) return "CHILD";
  return "GENERAL";
}

export function normalizeSex(genderOrSex?: string, name?: string, cohort?: string): SexType {
  const combined = genderOrSex || "";
  if (combined) {
    const s = String(combined).trim().toUpperCase();
    if (s.startsWith("M")) return "M";
    if (s.startsWith("F")) return "F";
  }
  if (cohort && String(cohort).toUpperCase().includes("ANC")) return "F";
  if (name) {
    const n = String(name).toLowerCase();
    if (/\b(devi|kumari|sita|sunita|rekha|lakshmi|ananya|gayathri|ranjitha|savitha|aarthi|pooja|anita|priya|kamla|meena)\b/i.test(n)) {
      return "F";
    }
    if (/\b(kumar|singh|shinde|patil|george|kutty|praveen|sujith|vishwa|deepak|shakthi|arvind|raghav|ramesh|anil)\b/i.test(n)) {
      return "M";
    }
  }
  return "M";
}

export const getStatusMeta = (status?: string, hasReferral?: boolean) => {
  const norm = normalizeStatus(status, hasReferral);
  return STATUS_META[norm] || STATUS_META.active;
};

export const getRiskMeta = (risk?: string) => {
  const norm = normalizeRiskBand(risk);
  return RISK_META[norm] || RISK_META.GREEN;
};

export const getCohortMeta = (cohort?: string) => {
  const norm = normalizeCohort(cohort);
  return COHORT_META[norm] || COHORT_META.GENERAL;
};

const FLAG_STYLES: Record<string, string> = {
  TB:          "bg-amber-100 text-amber-800 border-amber-200",
  DOTS:        "bg-amber-50 text-amber-700 border-amber-200",
  HTN:         "bg-red-50 text-red-700 border-red-200",
  DM:          "bg-blue-50 text-blue-700 border-blue-200",
  ANC:         "bg-pink-100 text-pink-800 border-pink-200",
  Anaemia:     "bg-rose-50 text-rose-700 border-rose-200",
  CARDIAC:     "bg-red-100 text-red-800 border-red-300",
  URGENT:      "bg-red-600 text-white border-red-700 font-bold",
  EMERGENCY:   "bg-red-700 text-white border-red-800 font-bold",
  OBSTETRIC:   "bg-purple-100 text-purple-800 border-purple-200",
  "HIGH RISK": "bg-red-50 text-red-700 border-red-200",
  CKD:         "bg-indigo-50 text-indigo-700 border-indigo-200",
  SAM:         "bg-orange-100 text-orange-800 border-orange-200",
  PAEDIATRIC:  "bg-purple-50 text-purple-700 border-purple-200",
};

const REFERRAL_STATUS_LABELS: Record<ReferralStatus, string> = {
  dispatched: "Ambulance Dispatched",
  in_transit: "In Transit",
  reached:    "Reached Facility",
  seen:       "Seen by Specialist",
  outcome:    "Counter-Referral Done",
};

// ─── Modal 1: Full Longitudinal EHR Chart (Patient 360) ───────────────────────

interface FullRecordModalProps {
  patient: Patient;
  onClose: () => void;
  onAddPrescription: (rx: PrescriptionItem) => void;
  onAddVisit: (entry: TimelineEntry, newVitals?: VitalReading[]) => void;
  onAddLabReport: (report: LabReportItem) => void;
  onAddReferral: (referral: ReferralInfo) => void;
  onUpdateReferralStatus: (status: ReferralStatus, notes?: string) => void;
  currentDoctorName?: string;
}

/**
 * ABDM & FHIR R4 Bundle Generator
 * Generates an HL7/ABDM compliant collection bundle containing:
 * - Patient resource (with ABHA ID & Local ID)
 * - Active Condition resources (ICD-10 coded)
 * - MedicationRequest resources (from prescriptions)
 * - Observation resources (from lab reports, LOINC coded)
 * - ServiceRequest resource (if referred to higher center)
 */
function buildFHIRBundle(patient: Patient): Record<string, any> {
  return {
    resourceType: "Bundle",
    type: "collection",
    timestamp: new Date().toISOString(),
    entry: [
      {
        resource: {
          resourceType: "Patient",
          id: patient.id,
          identifier: [
            ...(patient.abhaId ? [{ system: "https://healthid.ndhm.gov.in", value: patient.abhaId }] : []),
            { system: "https://sevasetu.gov.in/patient-id", value: patient.id },
          ],
          name: [{ text: patient.name }],
          gender: patient.sex === "M" ? "male" : "female",
          birthDate: patient.dob || undefined,
          address: [{ text: `${patient.village || ""}, ${patient.ward || ""}, ${patient.block || ""}, Bihar` }],
        },
      },
      ...(patient.conditions || []).map((c, i) => ({
        resource: {
          resourceType: "Condition",
          id: `cond-${i + 1}`,
          clinicalStatus: { coding: [{ code: "active" }] },
          code: {
            coding: [{ system: "http://hl7.org/fhir/sid/icd-10", code: patient.icdCodes?.[i] || "R69" }],
            text: c,
          },
          subject: { reference: `Patient/${patient.id}` },
        },
      })),
      ...(patient.prescriptions || []).map((rx, idx) => ({
        resource: {
          resourceType: "MedicationRequest",
          id: `medrx-${idx + 1}`,
          status: (rx.status || "active").toLowerCase(),
          intent: "order",
          medicationCodeableConcept: { text: rx.drug },
          subject: { reference: `Patient/${patient.id}` },
          dosageInstruction: [{ text: `${rx.dosage} · ${rx.frequency} for ${rx.duration}` }],
        },
      })),
      ...(patient.labReports || []).map((lab, idx) => ({
        resource: {
          resourceType: "Observation",
          id: `obs-${idx + 1}`,
          status: "final",
          code: {
            coding: [{ system: "http://loinc.org", code: lab.loincCode }],
            text: lab.testName,
          },
          subject: { reference: `Patient/${patient.id}` },
          valueString: lab.result,
        },
      })),
      ...(patient.referral ? [{
        resource: {
          resourceType: "ServiceRequest",
          id: `ref-${patient.referral.id}`,
          status: patient.referral.status === "outcome" ? "completed" : "active",
          intent: "order",
          category: [{ text: "Referral to Specialist / Higher Center" }],
          subject: { reference: `Patient/${patient.id}` },
          performer: [{ display: patient.referral.facility }],
          reasonCode: [{ text: patient.referral.reason }],
          note: patient.referral.counterReferralNotes ? [{ text: patient.referral.counterReferralNotes }] : [],
        },
      }] : []),
    ],
  };
}

function FullPatientRecordModal({
  patient,
  onClose,
  onAddPrescription,
  onAddVisit,
  onAddLabReport,
  onAddReferral,
  onUpdateReferralStatus,
  currentDoctorName = "Dr. Aravind Kumar",
}: FullRecordModalProps) {
  const [activeTab, setActiveTab] = useState<"timeline" | "prescriptions" | "labs" | "referral" | "abdm">("timeline");
  
  // Modal Form States
  const [showAddEncounter, setShowAddEncounter] = useState(false);
  const [showAddRx, setShowAddRx] = useState(false);
  const [showAddLab, setShowAddLab] = useState(false);
  const [showAddReferral, setShowAddReferral] = useState(false);
  const [showUpdateReferralStage, setShowUpdateReferralStage] = useState(false);

  // Form Field States
  const [newEncounter, setNewEncounter] = useState({
    type: "visit" as "visit" | "triage" | "referral" | "followup",
    summary: "",
    doctor: currentDoctorName,
    riskBand: (patient.riskBand || "GREEN") as RiskBand,
    bp: "",
    hr: "",
    spo2: "",
    temp: "",
    details: "",
  });

  const [newRx, setNewRx] = useState({
    drug: "",
    dosage: "",
    frequency: "Once daily (Morning)",
    duration: "14 Days",
  });

  const [newLab, setNewLab] = useState({
    testName: "",
    loincCode: "",
    result: "",
    referenceRange: "",
    status: "Normal" as "Normal" | "Abnormal" | "Pending",
  });

  const [newReferral, setNewReferral] = useState({
    facility: "Patna Medical College Hospital (PMCH)",
    specialty: "Obstetrics & Gynecology Emergency",
    urgency: (patient.riskBand === "RED" ? "RED" : "YELLOW") as RiskBand,
    reason: "",
    transport: "108 ALS Ambulance Dispatched",
  });

  const [referralStage, setReferralStage] = useState<ReferralStatus>(patient.referral?.status || "dispatched");
  const [counterReferralNotes, setCounterReferralNotes] = useState(patient.referral?.counterReferralNotes || "");

  const [copiedFHIR, setCopiedFHIR] = useState(false);

  // Quick Clinical Presets
  const DRUG_PRESETS = [
    { drug: "Paracetamol 650mg", dosage: "1 Tab", frequency: "Thrice daily after food", duration: "5 Days" },
    { drug: "Amoxicillin 500mg", dosage: "1 Cap", frequency: "Twice daily after food", duration: "7 Days" },
    { drug: "Metformin 500mg", dosage: "1 Tab", frequency: "Twice daily with meals", duration: "30 Days" },
    { drug: "Amlodipine 5mg", dosage: "1 Tab", frequency: "Once daily (Morning)", duration: "30 Days" },
    { drug: "Iron + Folic Acid (IFA)", dosage: "1 Tab", frequency: "Once daily after food", duration: "100 Days" },
    { drug: "ORS Rehydration Sachet", dosage: "1 Packet", frequency: "Dissolved in 1L clean water", duration: "3 Days" },
    { drug: "Azithromycin 500mg", dosage: "1 Tab", frequency: "Once daily (Empty stomach)", duration: "3 Days" },
    { drug: "Telmisartan 40mg", dosage: "1 Tab", frequency: "Once daily (Bedtime)", duration: "30 Days" },
  ];

  const LAB_PRESETS = [
    { name: "Complete Blood Count (CBC)", loinc: "57021-8", range: "Hb 12.0-16.0 g/dL, TLC 4-11k", defaultResult: "Hb 11.4 g/dL, TLC 7,800/uL" },
    { name: "Urine Albumin & Sugar", loinc: "1751-7", range: "Nil / Negative", defaultResult: "Negative" },
    { name: "Sputum AFB Smear (TB)", loinc: "11545-1", range: "Negative for Acid Fast Bacilli", defaultResult: "Negative for AFB" },
    { name: "Blood Glucose Fasting (FBS)", loinc: "1558-6", range: "70 - 100 mg/dL", defaultResult: "92 mg/dL" },
    { name: "Obstetric Ultrasound (USG)", loinc: "24648-8", range: "Normal single live intrauterine pregnancy", defaultResult: "Single live fetus, cephalic, FHR 144 bpm" },
    { name: "Hemoglobin (Hb)", loinc: "718-7", range: "12.0 - 15.5 g/dL", defaultResult: "10.8 g/dL" },
    { name: "Lipid Profile", loinc: "24331-1", range: "Total Chol < 200 mg/dL, HDL > 40", defaultResult: "Total Chol 182 mg/dL, HDL 46" },
    { name: "Rapid Malarial Antigen (RDT)", loinc: "51655-9", range: "Negative for Pf / Pv", defaultResult: "Negative" },
  ];

  const REFERRAL_FACILITIES = [
    "Patna Medical College Hospital (PMCH)",
    "AIIMS Patna (Apex Tertiary Care)",
    "District Hospital Palghar",
    "Sub-Divisional Hospital (SDH) Boisar",
    "Nalanda Medical College Hospital (NMCH)",
    "Darbhanga Medical College Hospital (DMCH)",
  ];

  const REFERRAL_SPECIALTIES = [
    "Obstetrics & Gynecology Emergency",
    "Cardiology & Cath Lab",
    "Pulmonology / RNTCP (TB)",
    "Pediatrics & Neonatal ICU (NICU)",
    "General Surgery & Trauma",
    "Orthopedics",
    "Internal Medicine & Critical Care",
    "Nephrology & Dialysis",
  ];

  // Submission Handlers
  const handleCreateEncounter = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: TimelineEntry = {
      date: "Today",
      type: newEncounter.type,
      summary: newEncounter.summary.trim() || `Clinical ${newEncounter.type} completed by ${newEncounter.doctor || currentDoctorName}.`,
      riskBand: newEncounter.riskBand,
      doctor: newEncounter.doctor || currentDoctorName,
      details: newEncounter.details,
    };

    const newVitals: VitalReading[] = [];
    if (newEncounter.bp.trim()) newVitals.push({ type: "BP", value: newEncounter.bp.trim(), unit: "mmHg", source: "manual", timestamp: "Today" });
    if (newEncounter.hr.trim()) newVitals.push({ type: "HR", value: newEncounter.hr.trim(), unit: "bpm", source: "manual", timestamp: "Today" });
    if (newEncounter.spo2.trim()) newVitals.push({ type: "SpO2", value: newEncounter.spo2.trim(), unit: "%", source: "manual", timestamp: "Today" });
    if (newEncounter.temp.trim()) newVitals.push({ type: "Temp", value: newEncounter.temp.trim(), unit: "°C", source: "manual", timestamp: "Today" });

    onAddVisit(entry, newVitals.length > 0 ? newVitals : undefined);
    setShowAddEncounter(false);
    setNewEncounter({
      type: "visit",
      summary: "",
      doctor: currentDoctorName,
      riskBand: "GREEN",
      bp: "",
      hr: "",
      spo2: "",
      temp: "",
      details: "",
    });
  };

  const handleCreateRx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRx.drug.trim()) return;
    const item: PrescriptionItem = {
      id: `RX-${Date.now().toString().slice(-4)}`,
      drug: newRx.drug,
      dosage: newRx.dosage || "As advised",
      frequency: newRx.frequency,
      duration: newRx.duration,
      status: "Active",
      prescribedBy: currentDoctorName,
      prescribedOn: "Today",
    };
    onAddPrescription(item);
    setShowAddRx(false);
    setNewRx({ drug: "", dosage: "", frequency: "Once daily (Morning)", duration: "14 Days" });
  };

  const handleCreateLab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLab.testName.trim()) return;
    const report: LabReportItem = {
      id: `LAB-${Date.now().toString().slice(-4)}`,
      testName: newLab.testName,
      loincCode: newLab.loincCode || "9999-9",
      result: newLab.result || "Report normal",
      referenceRange: newLab.referenceRange || "Standard range",
      status: newLab.status,
      date: "Today",
    };
    onAddLabReport(report);
    setShowAddLab(false);
    setNewLab({ testName: "", loincCode: "", result: "", referenceRange: "", status: "Normal" });
  };

  const handleCreateReferral = (e: React.FormEvent) => {
    e.preventDefault();
    const referral: ReferralInfo = {
      id: `REF-${Date.now().toString().slice(-5)}`,
      facility: newReferral.facility,
      specialty: newReferral.specialty,
      status: "dispatched",
      createdAt: "Today",
      reason: newReferral.reason.trim() || `Specialist ${newReferral.specialty} tertiary evaluation required.`,
      counterReferralNotes: "Referral order dispatched with ambulance priority. Awaiting specialist intake.",
    };
    onAddReferral(referral);
    setShowAddReferral(false);
  };

  const handleSaveReferralStage = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateReferralStatus(referralStage, counterReferralNotes);
    setShowUpdateReferralStage(false);
  };

  const fhirBundle = useMemo(() => buildFHIRBundle(patient), [patient]);

  const copyFHIR = () => {
    navigator.clipboard.writeText(JSON.stringify(fhirBundle, null, 2));
    setCopiedFHIR(true);
    setTimeout(() => setCopiedFHIR(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-6xl h-[92vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150">

        {/* Modal Top Banner */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-display font-bold text-lg ${
              patient.riskBand === "RED" ? "bg-red-500" : patient.riskBand === "YELLOW" ? "bg-amber-500" : "bg-phc-blue"
            }`}>
              {patient.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-display font-bold text-xl">{patient.name}</h2>
                <span className="text-slate-400 text-sm font-sans">{patient.age} yrs · {patient.sex === "F" ? "Female" : "Male"}</span>
                {(() => {
                  const rm = getRiskMeta(patient.riskBand);
                  return (
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-display font-bold ${rm.bg} ${rm.text}`}>
                      {rm.icon} {rm.label}
                    </span>
                  );
                })()}
                {patient.referral && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-display font-bold bg-violet-100 text-violet-800 border border-violet-200">
                    Referred: {patient.referral.facility.split(" ")[0]}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-[12px] text-slate-300 mt-1 font-mono">
                <span>ID: {patient.id}</span>
                {patient.abhaId && (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <ShieldCheck size={13} /> ABHA: {patient.abhaId}
                  </span>
                )}
                <span className="text-slate-400 font-sans">
                  <MapPin size={12} className="inline mr-1 text-slate-400" />
                  {patient.village}, {patient.ward}, {patient.block}
                </span>
                {patient.asha && (
                  <span className="text-emerald-300 font-sans">
                    <UserCheck size={12} className="inline mr-1" /> ASHA: {patient.asha}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] text-slate-400 uppercase tracking-widest font-display">Longitudinal FHIR R4 Record</div>
              <div className="text-[12px] text-emerald-400 font-mono flex items-center justify-end gap-1 mt-0.5">
                <ShieldCheck size={12} /> ABDM Federated Care Link
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer ml-4"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-200 bg-slate-50 flex-shrink-0">
          {[
            { id: "timeline",      label: "Encounters & Timeline",   icon: <Activity size={14} />, badge: patient.timeline?.length },
            { id: "prescriptions", label: "Prescriptions & Regimen", icon: <Pill size={14} />, badge: patient.prescriptions?.length },
            { id: "labs",          label: "Lab & Diagnostics (LOINC)", icon: <FlaskConical size={14} />, badge: patient.labReports?.length },
            { id: "referral",      label: "Referral Pathway",         icon: <CornerUpRight size={14} />, alert: !!patient.referral },
            { id: "abdm",          label: "ABDM & FHIR Bundle",      icon: <QrCode size={14} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3.5 text-[13px] font-display font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "border-phc-blue text-phc-blue bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="text-[10.5px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-bold">
                  {tab.badge}
                </span>
              )}
              {tab.alert && (
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/40">

          {/* TAB 1: Encounters & Timeline */}
          {activeTab === "timeline" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-display font-bold text-slate-800 text-[15px]">Longitudinal Encounter History</h3>
                  <p className="text-[12px] text-slate-400">Chronological consultations, field triage visits, and hospital admissions</p>
                </div>
                <button
                  onClick={() => setShowAddEncounter(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-phc-blue text-white rounded-xl text-[12.5px] font-display font-semibold hover:bg-phc-blue-dark transition-all cursor-pointer shadow-xs"
                >
                  <Plus size={14} /> Log New Visit Encounter
                </button>
              </div>

              {/* Log Visit Encounter Drawer Form */}
              {showAddEncounter && (
                <form onSubmit={handleCreateEncounter} className="bg-white border border-phc-blue/40 rounded-2xl p-5 shadow-md space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b pb-2.5">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-phc-blue" />
                      <h4 className="font-display font-bold text-slate-800 text-[14px]">Log Clinical Visit Encounter</h4>
                    </div>
                    <button type="button" onClick={() => setShowAddEncounter(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10.5px] font-display font-bold text-slate-500 uppercase block mb-1">Encounter Type</label>
                      <select
                        value={newEncounter.type}
                        onChange={e => setNewEncounter({ ...newEncounter, type: e.target.value as any })}
                        className="w-full px-3 py-2 text-[12.5px] border border-slate-200 rounded-xl focus:border-phc-blue outline-none bg-white"
                      >
                        <option value="visit">OPD Consultation Visit</option>
                        <option value="followup">Antenatal Checkup (ANC)</option>
                        <option value="followup">TB DOTS Adherence Review</option>
                        <option value="triage">Field Emergency Triage</option>
                        <option value="referral">Tertiary Care Admission</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10.5px] font-display font-bold text-slate-500 uppercase block mb-1">Attending Doctor</label>
                      <input
                        value={newEncounter.doctor}
                        onChange={e => setNewEncounter({ ...newEncounter, doctor: e.target.value })}
                        placeholder="Dr. Aravind Kumar"
                        className="w-full px-3 py-2 text-[12.5px] border border-slate-200 rounded-xl focus:border-phc-blue outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10.5px] font-display font-bold text-slate-500 uppercase block mb-1">Clinical Risk Category</label>
                      <select
                        value={newEncounter.riskBand}
                        onChange={e => setNewEncounter({ ...newEncounter, riskBand: e.target.value as RiskBand })}
                        className="w-full px-3 py-2 text-[12.5px] border border-slate-200 rounded-xl focus:border-phc-blue outline-none bg-white"
                      >
                        <option value="GREEN">GREEN — Routine Clinical Follow-up</option>
                        <option value="YELLOW">YELLOW — Urgent Follow-up Required</option>
                        <option value="RED">RED — High Risk / Emergency Watch</option>
                      </select>
                    </div>
                  </div>

                  {/* Vitals inputs */}
                  <div>
                    <label className="text-[10.5px] font-display font-bold text-slate-500 uppercase block mb-1.5">
                      Vitals Recorded During Encounter (Optional)
                    </label>
                    <div className="grid grid-cols-4 gap-2.5">
                      <input
                        placeholder="BP (e.g. 120/80)"
                        value={newEncounter.bp}
                        onChange={e => setNewEncounter({ ...newEncounter, bp: e.target.value })}
                        className="px-3 py-2 text-[12px] border border-slate-200 rounded-xl focus:border-phc-blue outline-none"
                      />
                      <input
                        placeholder="HR (e.g. 78 bpm)"
                        value={newEncounter.hr}
                        onChange={e => setNewEncounter({ ...newEncounter, hr: e.target.value })}
                        className="px-3 py-2 text-[12px] border border-slate-200 rounded-xl focus:border-phc-blue outline-none"
                      />
                      <input
                        placeholder="SpO2 (e.g. 98%)"
                        value={newEncounter.spo2}
                        onChange={e => setNewEncounter({ ...newEncounter, spo2: e.target.value })}
                        className="px-3 py-2 text-[12px] border border-slate-200 rounded-xl focus:border-phc-blue outline-none"
                      />
                      <input
                        placeholder="Temp (e.g. 37.0°C)"
                        value={newEncounter.temp}
                        onChange={e => setNewEncounter({ ...newEncounter, temp: e.target.value })}
                        className="px-3 py-2 text-[12px] border border-slate-200 rounded-xl focus:border-phc-blue outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10.5px] font-display font-bold text-slate-500 uppercase block mb-1">
                      Clinical Assessment &amp; Encounter Notes
                    </label>
                    <textarea
                      rows={2}
                      value={newEncounter.summary}
                      onChange={e => setNewEncounter({ ...newEncounter, summary: e.target.value })}
                      placeholder="e.g. Routine 2nd trimester ANC checkup completed. BP well controlled. Fetal heart sounds clear (142 bpm). Prescribed Iron-Folic acid."
                      className="w-full px-3 py-2 text-[12.5px] border border-slate-200 rounded-xl focus:border-phc-blue outline-none"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowAddEncounter(false)}
                      className="px-4 py-2 text-[12px] font-display border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-phc-blue text-white rounded-xl text-[12px] font-display font-semibold hover:bg-phc-blue-dark transition cursor-pointer shadow-xs"
                    >
                      Save &amp; Log Encounter
                    </button>
                  </div>
                </form>
              )}

              {/* Timeline list */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                {(patient.timeline || []).length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No prior clinical encounters recorded for this patient.
                  </div>
                ) : (
                  (patient.timeline || []).map((entry, idx) => (
                    <div key={idx} className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-display font-bold text-xs ${
                        entry.type === "sos" ? "bg-red-500" : entry.type === "referral" ? "bg-violet-500" : entry.type === "triage" ? "bg-amber-500" : "bg-phc-blue"
                      }`}>
                        {entry.type === "sos" ? <AlertTriangle size={15} /> : entry.type === "referral" ? <CornerUpRight size={15} /> : <FileText size={15} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-display font-bold text-slate-800 text-[14px]">{entry.summary}</span>
                            {entry.riskBand && (() => {
                              const rm = getRiskMeta(entry.riskBand);
                              return (
                                <span className={`px-2 py-0.2 rounded-full text-[10px] font-display font-bold ${rm.bg} ${rm.text}`}>
                                  {entry.riskBand}
                                </span>
                              );
                            })()}
                          </div>
                          <span className="text-[11.5px] font-mono text-slate-400">{entry.date}</span>
                        </div>
                        {entry.doctor && (
                          <div className="text-[12px] text-slate-500 mt-1 font-display">
                            Attending: <span className="font-semibold text-slate-700">{entry.doctor}</span> · PHC Danapur
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Prescriptions & Meds */}
          {activeTab === "prescriptions" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-slate-800 text-[15px]">Active Medications &amp; PHC Pharmacy Regimen</h3>
                  <p className="text-[12px] text-slate-400">Integrated with PHC Central Dispensary inventory &amp; Patient Mobile App</p>
                </div>
                <button
                  onClick={() => setShowAddRx(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-phc-blue text-white rounded-xl text-[12.5px] font-display font-semibold hover:bg-phc-blue-dark transition-all cursor-pointer shadow-xs"
                >
                  <Plus size={14} /> Prescribe Medication
                </button>
              </div>

              {/* Add Prescription Drawer */}
              {showAddRx && (
                <form onSubmit={handleCreateRx} className="bg-white border border-phc-blue/30 rounded-2xl p-5 shadow-md space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <Pill size={16} className="text-phc-blue" />
                      <h4 className="font-display font-bold text-slate-800 text-[14px]">New Clinical Prescription</h4>
                    </div>
                    <button type="button" onClick={() => setShowAddRx(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={15} />
                    </button>
                  </div>

                  {/* Quick Medicine Preset Chips */}
                  <div>
                    <span className="text-[10px] font-display font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Quick PHC Formulary Presets:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {DRUG_PRESETS.map((p) => (
                        <button
                          key={p.drug}
                          type="button"
                          onClick={() => setNewRx({ drug: p.drug, dosage: p.dosage, frequency: p.frequency, duration: p.duration })}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-phc-blue hover:border-blue-200 border border-slate-200 text-[11px] font-medium transition cursor-pointer"
                        >
                          + {p.drug}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10.5px] font-display font-bold text-slate-500 uppercase block mb-1">Drug Name / Generic</label>
                      <input
                        value={newRx.drug}
                        onChange={e => setNewRx({ ...newRx, drug: e.target.value })}
                        placeholder="e.g. Paracetamol 650mg"
                        className="w-full px-3 py-2 text-[12.5px] border border-slate-200 rounded-xl focus:border-phc-blue outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10.5px] font-display font-bold text-slate-500 uppercase block mb-1">Dosage</label>
                      <input
                        value={newRx.dosage}
                        onChange={e => setNewRx({ ...newRx, dosage: e.target.value })}
                        placeholder="e.g. 1 Tablet"
                        className="w-full px-3 py-2 text-[12.5px] border border-slate-200 rounded-xl focus:border-phc-blue outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10.5px] font-display font-bold text-slate-500 uppercase block mb-1">Frequency</label>
                      <select
                        value={newRx.frequency}
                        onChange={e => setNewRx({ ...newRx, frequency: e.target.value })}
                        className="w-full px-3 py-2 text-[12.5px] border border-slate-200 rounded-xl focus:border-phc-blue outline-none bg-white"
                      >
                        <option>Once daily (Morning)</option>
                        <option>Once daily (Bedtime)</option>
                        <option>Twice daily after meals</option>
                        <option>Thrice daily after food</option>
                        <option>SOS (When needed)</option>
                        <option>Daily Direct Observation (DOTS)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10.5px] font-display font-bold text-slate-500 uppercase block mb-1">Duration</label>
                      <input
                        value={newRx.duration}
                        onChange={e => setNewRx({ ...newRx, duration: e.target.value })}
                        placeholder="e.g. 14 Days"
                        className="w-full px-3 py-2 text-[12.5px] border border-slate-200 rounded-xl focus:border-phc-blue outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button type="button" onClick={() => setShowAddRx(false)} className="px-4 py-1.5 text-[12px] font-display border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer">
                      Cancel
                    </button>
                    <button type="submit" className="px-5 py-1.5 bg-phc-blue text-white rounded-xl text-[12px] font-display font-semibold hover:bg-phc-blue-dark cursor-pointer shadow-xs">
                      Save &amp; Dispense
                    </button>
                  </div>
                </form>
              )}

              {/* Prescriptions Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10.5px] font-display font-bold text-slate-400 uppercase tracking-wider">
                      <th className="px-5 py-3">Medication</th>
                      <th className="px-5 py-3">Dosage &amp; Cadence</th>
                      <th className="px-5 py-3">Duration</th>
                      <th className="px-5 py-3">Prescriber</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[13px]">
                    {(patient.prescriptions || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-xs">
                          No active medications currently prescribed. Click "+ Prescribe Medication" above.
                        </td>
                      </tr>
                    ) : (
                      (patient.prescriptions || []).map(rx => (
                        <tr key={rx.id} className="hover:bg-slate-50/60">
                          <td className="px-5 py-3.5 font-display font-semibold text-slate-900">
                            {rx.drug}
                            <div className="text-[10px] font-mono text-slate-400 font-normal">{rx.id}</div>
                          </td>
                          <td className="px-5 py-3.5 text-slate-600">{rx.dosage} · <span className="font-medium text-slate-700">{rx.frequency}</span></td>
                          <td className="px-5 py-3.5 text-slate-600 font-mono text-[12px]">{rx.duration}</td>
                          <td className="px-5 py-3.5 text-slate-600">{rx.prescribedBy}</td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-display font-bold ${
                              rx.status === "Active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                            }`}>
                              {rx.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Lab & Diagnostics */}
          {activeTab === "labs" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-slate-800 text-[15px]">Laboratory &amp; Diagnostic Investigations</h3>
                  <p className="text-[12px] text-slate-400">LOINC-standardized pathology and radiology records</p>
                </div>
                <button
                  onClick={() => setShowAddLab(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-phc-blue text-white rounded-xl text-[12.5px] font-display font-semibold hover:bg-phc-blue-dark transition-all cursor-pointer shadow-xs"
                >
                  <Plus size={14} /> Order Diagnostic Test
                </button>
              </div>

              {/* Order Lab Test Drawer Form */}
              {showAddLab && (
                <form onSubmit={handleCreateLab} className="bg-white border border-phc-blue/30 rounded-2xl p-5 shadow-md space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <FlaskConical size={16} className="text-phc-blue" />
                      <h4 className="font-display font-bold text-slate-800 text-[14px]">Order / Record Diagnostic Investigation (LOINC)</h4>
                    </div>
                    <button type="button" onClick={() => setShowAddLab(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={15} />
                    </button>
                  </div>

                  {/* Quick Investigation Presets */}
                  <div>
                    <span className="text-[10px] font-display font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Standard Diagnostic Panels:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {LAB_PRESETS.map((p) => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => setNewLab({
                            testName: p.name,
                            loincCode: p.loinc,
                            result: p.defaultResult,
                            referenceRange: p.range,
                            status: "Normal",
                          })}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-phc-blue hover:border-blue-200 border border-slate-200 text-[11px] font-medium transition cursor-pointer"
                        >
                          + {p.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10.5px] font-display font-bold text-slate-500 uppercase block mb-1">Investigation Name</label>
                      <input
                        value={newLab.testName}
                        onChange={e => setNewLab({ ...newLab, testName: e.target.value })}
                        placeholder="e.g. Complete Blood Count (CBC)"
                        className="w-full px-3 py-2 text-[12.5px] border border-slate-200 rounded-xl focus:border-phc-blue outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10.5px] font-display font-bold text-slate-500 uppercase block mb-1">LOINC Standard Code</label>
                      <input
                        value={newLab.loincCode}
                        onChange={e => setNewLab({ ...newLab, loincCode: e.target.value })}
                        placeholder="e.g. 57021-8"
                        className="w-full px-3 py-2 text-[12.5px] border border-slate-200 rounded-xl focus:border-phc-blue outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10.5px] font-display font-bold text-slate-500 uppercase block mb-1">Evaluation Status</label>
                      <select
                        value={newLab.status}
                        onChange={e => setNewLab({ ...newLab, status: e.target.value as any })}
                        className="w-full px-3 py-2 text-[12.5px] border border-slate-200 rounded-xl focus:border-phc-blue outline-none bg-white font-semibold"
                      >
                        <option value="Normal">Normal Findings</option>
                        <option value="Abnormal">Abnormal / Pathological</option>
                        <option value="Pending">Pending Laboratory Analysis</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10.5px] font-display font-bold text-slate-500 uppercase block mb-1">Test Result / Findings</label>
                      <input
                        value={newLab.result}
                        onChange={e => setNewLab({ ...newLab, result: e.target.value })}
                        placeholder="e.g. Hb 11.4 g/dL, Platelets 2.2L"
                        className="w-full px-3 py-2 text-[12.5px] border border-slate-200 rounded-xl focus:border-phc-blue outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10.5px] font-display font-bold text-slate-500 uppercase block mb-1">Biological Reference Range</label>
                      <input
                        value={newLab.referenceRange}
                        onChange={e => setNewLab({ ...newLab, referenceRange: e.target.value })}
                        placeholder="e.g. 12.0 - 15.5 g/dL"
                        className="w-full px-3 py-2 text-[12.5px] border border-slate-200 rounded-xl focus:border-phc-blue outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button type="button" onClick={() => setShowAddLab(false)} className="px-4 py-1.5 text-[12px] font-display border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer">
                      Cancel
                    </button>
                    <button type="submit" className="px-5 py-1.5 bg-phc-blue text-white rounded-xl text-[12px] font-display font-semibold hover:bg-phc-blue-dark cursor-pointer shadow-xs">
                      Save Diagnostic Report
                    </button>
                  </div>
                </form>
              )}

              {/* Lab Reports Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10.5px] font-display font-bold text-slate-400 uppercase tracking-wider">
                      <th className="px-5 py-3">Investigation</th>
                      <th className="px-5 py-3">LOINC Code</th>
                      <th className="px-5 py-3">Result</th>
                      <th className="px-5 py-3">Reference Range</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[13px]">
                    {(patient.labReports || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-slate-400 text-xs">
                          No laboratory or diagnostic records found. Click "+ Order Diagnostic Test" above to log results.
                        </td>
                      </tr>
                    ) : (
                      (patient.labReports || []).map(lab => (
                        <tr key={lab.id} className="hover:bg-slate-50/60">
                          <td className="px-5 py-3.5 font-display font-semibold text-slate-900">
                            {lab.testName}
                            <div className="text-[10px] font-mono text-slate-400 font-normal">{lab.id}</div>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">{lab.loincCode}</td>
                          <td className={`px-5 py-3.5 font-mono font-bold ${lab.status === "Abnormal" ? "text-red-700" : "text-slate-800"}`}>
                            {lab.result}
                          </td>
                          <td className="px-5 py-3.5 text-slate-500 text-[12px]">{lab.referenceRange}</td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-display font-bold ${
                              lab.status === "Abnormal" ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                            }`}>
                              {lab.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">{lab.date}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Referral Pathway */}
          {activeTab === "referral" && (
            <div className="space-y-6">
              {patient.referral ? (
                <div className="bg-white border border-violet-200 rounded-2xl p-6 shadow-sm space-y-5">
                  <div className="flex items-start justify-between border-b pb-4">
                    <div>
                      <span className="text-[11px] font-display font-bold text-violet-600 uppercase tracking-wider">
                        Active Inter-Facility Referral
                      </span>
                      <h3 className="font-display font-bold text-xl text-slate-900 mt-1">{patient.referral.facility}</h3>
                      <div className="text-[13px] text-violet-700 font-medium">{patient.referral.specialty} Department</div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1.5">
                      <span className="text-[12px] font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{patient.referral.id}</span>
                      <button
                        onClick={() => setShowUpdateReferralStage(true)}
                        className="px-3 py-1 bg-violet-600 text-white rounded-lg text-[11.5px] font-display font-semibold hover:bg-violet-700 transition cursor-pointer"
                      >
                        Update Progression →
                      </button>
                    </div>
                  </div>

                  {/* 5-Step Pipeline */}
                  <div>
                    <div className="text-[11px] font-display font-bold text-slate-500 uppercase tracking-wider mb-3">
                      Referral Progression Stage
                    </div>
                    <div className="flex items-center justify-between relative">
                      {(["dispatched", "in_transit", "reached", "seen", "outcome"] as ReferralStatus[]).map((step, idx) => {
                        const statusOrder = ["dispatched", "in_transit", "reached", "seen", "outcome"];
                        const currIdx = statusOrder.indexOf(patient.referral!.status);
                        const isDone = idx <= currIdx;
                        const isCurrent = idx === currIdx;

                        return (
                          <div key={step} className="flex-1 flex flex-col items-center relative z-10">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-xs transition-all ${
                              isDone ? "bg-violet-600 text-white shadow-sm" : "bg-slate-100 text-slate-400"
                            } ${isCurrent ? "ring-4 ring-violet-200 animate-pulse" : ""}`}>
                              {isDone ? <Check size={14} /> : idx + 1}
                            </div>
                            <span className={`text-[11px] font-display mt-2 text-center ${isDone ? "font-bold text-slate-800" : "text-slate-400"}`}>
                              {REFERRAL_STATUS_LABELS[step]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stage Update Modal Form */}
                  {showUpdateReferralStage && (
                    <form onSubmit={handleSaveReferralStage} className="bg-violet-50/70 border border-violet-200 rounded-xl p-4 space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <h5 className="font-display font-bold text-violet-900 text-xs uppercase">Advance Referral Progression Stage</h5>
                        <button type="button" onClick={() => setShowUpdateReferralStage(false)} className="text-slate-400 hover:text-slate-600">
                          <X size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-display font-bold text-slate-500 uppercase block mb-1">Target Stage</label>
                          <select
                            value={referralStage}
                            onChange={e => setReferralStage(e.target.value as ReferralStatus)}
                            className="w-full px-3 py-1.5 text-xs border border-violet-200 rounded-lg bg-white"
                          >
                            <option value="dispatched">1. Dispatched from PHC</option>
                            <option value="in_transit">2. In Transit (Ambulance / En-route)</option>
                            <option value="reached">3. Reached Tertiary Facility</option>
                            <option value="seen">4. Seen by Specialist</option>
                            <option value="outcome">5. Counter-Referral / Outcome Done</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-display font-bold text-slate-500 uppercase block mb-1">Specialist Counter-Referral Feedback</label>
                          <input
                            value={counterReferralNotes}
                            onChange={e => setCounterReferralNotes(e.target.value)}
                            placeholder="e.g. Patient stabilized at PMCH. Advised 5 days IV antibiotics."
                            className="w-full px-3 py-1.5 text-xs border border-violet-200 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button type="button" onClick={() => setShowUpdateReferralStage(false)} className="px-3 py-1 text-xs border rounded-lg bg-white">Cancel</button>
                        <button type="submit" className="px-4 py-1 text-xs bg-violet-700 text-white font-bold rounded-lg hover:bg-violet-800">Save Stage</button>
                      </div>
                    </form>
                  )}

                  {/* Clinical Reason & Counter Referral */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <h5 className="text-[11px] font-display font-bold text-slate-500 uppercase mb-1">Referral Indication</h5>
                      <p className="text-[13px] text-slate-800 leading-relaxed">{patient.referral.reason}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                      <h5 className="text-[11px] font-display font-bold text-emerald-800 uppercase mb-1">Specialist Counter-Referral Summary</h5>
                      <p className="text-[13px] text-emerald-950 leading-relaxed">
                        {patient.referral.counterReferralNotes || "Awaiting specialist discharge feedback from tertiary center."}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs space-y-4">
                  <Building2 size={36} className="text-slate-300 mx-auto" />
                  <div>
                    <h4 className="font-display font-bold text-slate-700 text-base">No Active Referral Required</h4>
                    <p className="text-[13px] text-slate-400 max-w-md mx-auto mt-1">
                      This patient is currently managed at the PHC primary care tier. You can create a specialty-aware referral if clinical condition escalates.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddReferral(true)}
                    className="px-5 py-2.5 bg-phc-blue text-white rounded-xl text-[13px] font-display font-semibold hover:bg-phc-blue-dark transition-all cursor-pointer shadow-xs"
                  >
                    Initiate Specialist Referral
                  </button>

                  {/* Initiate Referral Drawer Form */}
                  {showAddReferral && (
                    <form onSubmit={handleCreateReferral} className="bg-slate-50 border border-violet-300 text-left rounded-2xl p-5 shadow-lg space-y-4 mt-4 animate-in fade-in">
                      <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2">
                          <CornerUpRight size={16} className="text-violet-600" />
                          <h4 className="font-display font-bold text-slate-800 text-[14px]">Initiate Inter-Facility Specialist Referral</h4>
                        </div>
                        <button type="button" onClick={() => setShowAddReferral(false)} className="text-slate-400 hover:text-slate-600">
                          <X size={15} />
                        </button>
                      </div>

                      {/* Quick Facility Chips */}
                      <div>
                        <span className="text-[10px] font-display font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Select Tertiary Center:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {REFERRAL_FACILITIES.map(f => (
                            <button
                              key={f}
                              type="button"
                              onClick={() => setNewReferral({ ...newReferral, facility: f })}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer border ${
                                newReferral.facility === f
                                  ? "bg-violet-100 text-violet-800 border-violet-300 font-bold"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {f.split(" ")[0]} ({f.includes("AIIMS") ? "AIIMS" : f.includes("PMCH") ? "PMCH" : "District"})
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10.5px] font-display font-bold text-slate-500 uppercase block mb-1">Destination Hospital</label>
                          <input
                            value={newReferral.facility}
                            onChange={e => setNewReferral({ ...newReferral, facility: e.target.value })}
                            className="w-full px-3 py-2 text-[12.5px] border border-slate-200 rounded-xl focus:border-violet-500 outline-none bg-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10.5px] font-display font-bold text-slate-500 uppercase block mb-1">Clinical Specialty</label>
                          <select
                            value={newReferral.specialty}
                            onChange={e => setNewReferral({ ...newReferral, specialty: e.target.value })}
                            className="w-full px-3 py-2 text-[12.5px] border border-slate-200 rounded-xl focus:border-violet-500 outline-none bg-white"
                          >
                            {REFERRAL_SPECIALTIES.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10.5px] font-display font-bold text-slate-500 uppercase block mb-1">Ambulance &amp; Transport Mode</label>
                          <select
                            value={newReferral.transport}
                            onChange={e => setNewReferral({ ...newReferral, transport: e.target.value })}
                            className="w-full px-3 py-2 text-[12.5px] border border-slate-200 rounded-xl focus:border-violet-500 outline-none bg-white"
                          >
                            <option>108 ALS Ambulance Dispatched (Emergency)</option>
                            <option>102 Janani Shishu Vahan (Maternal)</option>
                            <option>Patient Self-Arranged Vehicle</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10.5px] font-display font-bold text-slate-500 uppercase block mb-1">Clinical Urgency Tier</label>
                          <select
                            value={newReferral.urgency}
                            onChange={e => setNewReferral({ ...newReferral, urgency: e.target.value as RiskBand })}
                            className="w-full px-3 py-2 text-[12.5px] border border-slate-200 rounded-xl focus:border-violet-500 outline-none bg-white font-bold"
                          >
                            <option value="RED">RED — Life Threatening Emergency (Immediate)</option>
                            <option value="YELLOW">YELLOW — Urgent Assessment within 24 hrs</option>
                            <option value="GREEN">GREEN — Elective / Routine Specialist Opinion</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10.5px] font-display font-bold text-slate-500 uppercase block mb-1">Clinical Referral Indication &amp; Notes</label>
                        <textarea
                          rows={2}
                          value={newReferral.reason}
                          onChange={e => setNewReferral({ ...newReferral, reason: e.target.value })}
                          placeholder="e.g. Severe pre-eclampsia, BP 165/112 with persistent headache and blurred vision. Immediate tertiary NICU/Obstetric management required."
                          className="w-full px-3 py-2 text-[12.5px] border border-slate-200 rounded-xl focus:border-violet-500 outline-none bg-white"
                          required
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                        <button type="button" onClick={() => setShowAddReferral(false)} className="px-4 py-1.5 text-[12px] font-display border border-slate-200 rounded-xl text-slate-600 bg-white hover:bg-slate-100 cursor-pointer">
                          Cancel
                        </button>
                        <button type="submit" className="px-5 py-1.5 bg-violet-600 text-white rounded-xl text-[12px] font-display font-semibold hover:bg-violet-700 cursor-pointer shadow-xs">
                          Confirm &amp; Dispatch Referral
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ABDM & FHIR R4 Bundle */}
          {activeTab === "abdm" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-3 border-b pb-3">
                  <QrCode size={22} className="text-phc-blue" />
                  <div>
                    <h4 className="font-display font-bold text-slate-800 text-[15px]">ABHA National Health ID</h4>
                    <span className="text-[11.5px] text-slate-400 font-mono">Ayushman Bharat Digital Mission (ABDM)</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-[10.5px] text-slate-400 uppercase font-display font-bold">14-Digit ABHA ID</div>
                    <div className="font-mono font-bold text-lg text-emerald-700 mt-0.5">{patient.abhaId || "Not Registered"}</div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-display font-bold">
                    KYC Verified
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] font-display font-bold text-slate-500 uppercase">ABDM Federated Consent Artifact</div>
                  <div className="text-[12.5px] text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <div>• Purpose: <span className="font-semibold">Care Management / Continuity of Care</span></div>
                    <div>• HIP: <span className="font-semibold">Patna Rural PHC (Danapur Block)</span></div>
                    <div>• Health Info Types: <span className="font-semibold">Diagnostic Report, Prescription, Care Plan</span></div>
                    <div>• Consent Status: <span className="text-emerald-600 font-bold">GRANTED (Valid until Dec 2026)</span></div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b pb-3 mb-3">
                    <h4 className="font-display font-bold text-slate-800 text-[15px]">FHIR R4 JSON Bundle</h4>
                    <button
                      onClick={copyFHIR}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11.5px] font-display font-semibold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      {copiedFHIR ? <Check size={12} className="text-emerald-600" /> : <ClipboardCheck size={12} />}
                      {copiedFHIR ? "Copied!" : "Copy Bundle"}
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-auto max-h-60 leading-relaxed">
                    {JSON.stringify(fhirBundle, null, 2)}
                  </pre>
                </div>
                <button
                  onClick={copyFHIR}
                  className="w-full py-2.5 bg-phc-blue text-white rounded-xl text-[12.5px] font-display font-semibold hover:bg-phc-blue-dark transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Download size={14} /> Export FHIR R4 Bundle
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── Modal 2: Register New Patient ───────────────────────────────────────────

interface RegisterPatientModalProps {
  onClose: () => void;
  onRegister: (patient: Patient) => void;
}

function RegisterPatientModal({ onClose, onRegister }: RegisterPatientModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    sex: "F" as SexType,
    dob: "",
    mobile: "",
    abhaId: "",
    village: "Danapur",
    ward: "Ward 1",
    block: "Danapur",
    asha: "Meena K.",
    ashaId: "ASHA-031",
    cohort: "GENERAL" as Cohort,
    chiefComplaint: "",
  });

  const handleFinish = () => {
    const newPatient: Patient = {
      id: `BR-PAT-P-${String(Math.floor(1000 + Math.random() * 9000))}`,
      abhaId: formData.abhaId || `14-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      name: formData.name || "New Patient",
      age: parseInt(formData.age) || 30,
      sex: formData.sex,
      dob: formData.dob || "1994-01-01",
      village: formData.village,
      ward: formData.ward,
      block: formData.block,
      mobile: formData.mobile || "+91 98765 43210",
      asha: formData.asha,
      ashaId: formData.ashaId,
      cohort: formData.cohort,
      conditions: formData.chiefComplaint ? [formData.chiefComplaint] : ["Initial Health Assessment"],
      lastVisit: "Today",
      visits: 1,
      status: "active",
      riskBand: "GREEN",
      flags: [formData.cohort],
      syncStatus: "synced",
      abhaLinked: !!formData.abhaId,
      registeredAt: "Today",
      timeline: [
        { date: "Today", type: "visit", summary: "Registered at PHC Danapur. Baseline record created.", doctor: "Dr. Aravind Kumar" },
      ],
    };
    onRegister(newPatient);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in">
        {/* Header */}
        <div className="bg-phc-blue text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-lg">Register New Patient</h3>
            <p className="text-[12px] text-blue-100">ABHA-linked FHIR R4 longitudinal record creation</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 text-white">
            <X size={18} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 py-3 bg-slate-50 border-b border-slate-100 text-[12px] font-display">
          {[
            { s: 1, label: "Identity & ABHA" },
            { s: 2, label: "Location & ASHA" },
            { s: 3, label: "Clinical Cohort" },
          ].map(item => (
            <div key={item.s} className={`flex items-center gap-2 ${step === item.s ? "text-phc-blue font-bold" : "text-slate-400"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === item.s ? "bg-phc-blue text-white" : "bg-slate-200 text-slate-600"}`}>
                {item.s}
              </span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Step Body */}
        <div className="p-6 space-y-4">
          {step === 1 && (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-display font-bold text-slate-500 uppercase block mb-1">Full Name</label>
                <input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full px-3.5 py-2 text-[13px] border border-slate-200 rounded-xl focus:border-phc-blue outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-display font-bold text-slate-500 uppercase block mb-1">Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                    placeholder="e.g. 35"
                    className="w-full px-3.5 py-2 text-[13px] border border-slate-200 rounded-xl focus:border-phc-blue outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-display font-bold text-slate-500 uppercase block mb-1">Gender / Sex</label>
                  <select
                    value={formData.sex}
                    onChange={e => setFormData({ ...formData, sex: e.target.value as SexType })}
                    className="w-full px-3.5 py-2 text-[13px] border border-slate-200 rounded-xl focus:border-phc-blue outline-none bg-white"
                  >
                    <option value="F">Female</option>
                    <option value="M">Male</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-display font-bold text-slate-500 uppercase block mb-1">14-Digit ABHA ID (Optional)</label>
                <input
                  value={formData.abhaId}
                  onChange={e => setFormData({ ...formData, abhaId: e.target.value })}
                  placeholder="14-XXXX-XXXX-XXXX (Auto-generated if blank)"
                  className="w-full px-3.5 py-2 text-[13px] border border-slate-200 rounded-xl focus:border-phc-blue outline-none font-mono"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-display font-bold text-slate-500 uppercase block mb-1">Village</label>
                  <input
                    value={formData.village}
                    onChange={e => setFormData({ ...formData, village: e.target.value })}
                    className="w-full px-3.5 py-2 text-[13px] border border-slate-200 rounded-xl focus:border-phc-blue outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-display font-bold text-slate-500 uppercase block mb-1">Ward</label>
                  <input
                    value={formData.ward}
                    onChange={e => setFormData({ ...formData, ward: e.target.value })}
                    className="w-full px-3.5 py-2 text-[13px] border border-slate-200 rounded-xl focus:border-phc-blue outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-display font-bold text-slate-500 uppercase block mb-1">Assigned ASHA Worker</label>
                <select
                  value={formData.asha}
                  onChange={e => setFormData({ ...formData, asha: e.target.value })}
                  className="w-full px-3.5 py-2 text-[13px] border border-slate-200 rounded-xl focus:border-phc-blue outline-none bg-white"
                >
                  <option value="Meena K.">Meena K. (ASHA-031 · Ward 3)</option>
                  <option value="Sunita D.">Sunita D. (ASHA-018 · Ward 2)</option>
                  <option value="Rekha Sharma">Rekha Sharma (ASHA-022 · Ward 1)</option>
                  <option value="Neelam S.">Neelam S. (ASHA-009 · Ward 4)</option>
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <label className="text-[11px] font-display font-bold text-slate-500 uppercase block">Assign Clinical Cohort</label>
              <div className="grid grid-cols-2 gap-2.5">
                {(["ANC", "TB", "CHRONIC", "CHILD", "GENERAL"] as Cohort[]).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormData({ ...formData, cohort: c })}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      formData.cohort === c
                        ? "border-phc-blue bg-blue-50 text-phc-blue font-bold shadow-xs"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="p-2 rounded-lg bg-white shadow-2xs">{COHORT_META[c].icon}</span>
                    <div>
                      <div className="text-[13px] font-display">{COHORT_META[c].label}</div>
                      <div className="text-[10px] text-slate-400">{c === "ANC" || c === "CHRONIC" ? "High Priority Cohort" : "Standard OPD"}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div>
                <label className="text-[11px] font-display font-bold text-slate-500 uppercase block mb-1 mt-2">Chief Complaint / Notes</label>
                <input
                  value={formData.chiefComplaint}
                  onChange={e => setFormData({ ...formData, chiefComplaint: e.target.value })}
                  placeholder="e.g. Routine ANC second trimester registration"
                  className="w-full px-3.5 py-2 text-[13px] border border-slate-200 rounded-xl focus:border-phc-blue outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep((step - 1) as any)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 text-[12.5px] font-display font-medium hover:bg-white"
            >
              Back
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              onClick={() => setStep((step + 1) as any)}
              className="px-5 py-2 bg-phc-blue text-white rounded-xl text-[12.5px] font-display font-semibold hover:bg-phc-blue-dark"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-[12.5px] font-display font-semibold hover:bg-emerald-700 shadow-xs"
            >
              Complete Registration
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Patients Component ──────────────────────────────────────────────────

export default function Patients() {
  const { user } = useAuth();
  const currentDoctorName = user?.name || "Dr. Rajesh Sharma (PHC Medical Officer)";

  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRisk, setFilterRisk] = useState("all");
  const [filterCohort, setFilterCohort] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [fullRecordPatient, setFullRecordPatient] = useState<Patient | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [syncToast, setSyncToast] = useState<{ message: string; sub?: string } | null>(null);

  const showToast = (message: string, sub?: string) => {
    setSyncToast({ message, sub: sub || "Firestore Cloud · Patient App Bridge Synchronized" });
    setTimeout(() => setSyncToast(null), 4000);
  };

  // Listen for open-patient-details custom event from RealtimePatientModal
  useEffect(() => {
    const handleOpenDetails = (e: any) => {
      const patientId = e.detail?.patientId;
      if (patientId) {
        const match = patients.find(
          (p) =>
            p.id.toLowerCase() === patientId.toLowerCase() ||
            p.name.toLowerCase().includes(patientId.toLowerCase())
        );
        if (match) {
          setSelectedPatient(match);
        } else {
          setSearch(patientId);
        }
      }
    };
    window.addEventListener("open-patient-details", handleOpenDetails);
    return () => window.removeEventListener("open-patient-details", handleOpenDetails);
  }, [patients]);

  // Live Firestore subscription on `patients` collection
  useEffect(() => {
    const unsub = subscribePatients((liveDocs) => {
      if (liveDocs.length > 0) {
        const mappedLive: Patient[] = liveDocs.map((doc) => {
          const normRisk = normalizeRiskBand(doc.riskBand);
          const normStatus = normalizeStatus(doc.status, !!doc.referral);
          const normCohort = normalizeCohort(doc.cohort);
          const normSex = normalizeSex(doc.gender || (doc as any).gender || doc.sex, doc.name, doc.cohort);

          return {
            id: doc.id,
            abhaId: doc.abhaId || "14-XXXX-XXXX-XXXX",
            name: doc.name,
            age: doc.age ?? 30,
            sex: normSex,
            dob: doc.dob || "Unknown",
            village: doc.village || "Palghar",
            ward: doc.ward || "Ward 1",
            block: doc.block || "Danapur",
            mobile: doc.mobile || (doc as any).phone || "",
            asha: doc.ashaName,
            ashaId: doc.ashaId,
            cohort: normCohort,
            conditions: doc.conditions && doc.conditions.length > 0 ? doc.conditions : ["Field Registration"],
            lastVisit: doc.lastVisit || "Live App Sync",
            visits: doc.visits || 1,
            status: normStatus,
            riskBand: normRisk,
            flags: [normCohort, normRisk],
            syncStatus: "synced",
            registeredAt: typeof doc.createdAt === "number" ? new Date(doc.createdAt).toLocaleDateString("en-IN") : "Today",
            timeline: (doc.timeline && doc.timeline.length > 0)
              ? doc.timeline
              : (doc.encounters && doc.encounters.length > 0)
              ? doc.encounters
              : [
                  { date: "Today", type: "visit", summary: `Registered via ASHA Mobile App by ${doc.ashaName || doc.ashaId || "ASHA"}`, riskBand: normRisk }
                ],
            prescriptions: doc.prescriptions || [],
            labReports: doc.labReports || [],
            referral: doc.referral || undefined,
            vitals: doc.vitals || [],
          };
        });

        setPatients((prev) => {
          const liveIds = new Set(mappedLive.map((m) => m.id));
          const retainedOld = prev.filter((p) => !liveIds.has(p.id));
          return [...mappedLive, ...retainedOld];
        });

        // Also update fullRecordPatient in real-time if currently open
        setFullRecordPatient((curr) => {
          if (!curr) return null;
          const liveMatch = mappedLive.find((m) => m.id === curr.id);
          return liveMatch || curr;
        });
      }
    });

    return () => unsub();
  }, []);

  const handleRegisterNew = (newPat: Patient) => {
    setPatients(prev => [newPat, ...prev]);
    setSelectedPatient(newPat);
    showToast(`Registered new patient ${newPat.name}`, "Saved to PHC Registry");
  };

  // 1. Add Prescription
  const handleAddPrescription = async (rx: PrescriptionItem) => {
    if (!fullRecordPatient) return;
    const patientId = fullRecordPatient.id;
    const abhaId = fullRecordPatient.abhaId;
    const updatedRxList = [rx, ...(fullRecordPatient.prescriptions || [])];
    const newTimelineEntry: TimelineEntry = {
      date: "Today",
      type: "visit",
      summary: `Prescription: ${rx.drug} (${rx.dosage}, ${rx.frequency}) for ${rx.duration}`,
      doctor: rx.prescribedBy || currentDoctorName,
    };
    const updatedTimeline = [newTimelineEntry, ...(fullRecordPatient.timeline || [])];

    const updatedPatient: Patient = {
      ...fullRecordPatient,
      prescriptions: updatedRxList,
      timeline: updatedTimeline,
    };

    setFullRecordPatient(updatedPatient);
    setPatients(prev => prev.map(p => p.id === patientId ? updatedPatient : p));

    showToast(`Prescription for ${rx.drug} saved & synced to Patient App (ABHA)`, `Dosage: ${rx.dosage} · Prescribed by ${rx.prescribedBy || currentDoctorName}`);

    await savePatientClinicalRecord(patientId, {
      prescriptions: updatedRxList,
      timeline: updatedTimeline,
      encounters: updatedTimeline,
    });

    // Push segmented prescription & encounter records tagged with abhaId for the patient app
    await pushPrescriptionSegment(patientId, abhaId, rx);
    await pushLongitudinalEncounter(patientId, abhaId, {
      date: newTimelineEntry.date,
      type: "PRESCRIPTION",
      summary: newTimelineEntry.summary,
      doctor: newTimelineEntry.doctor,
    });
    await pushFHIRBundle(patientId, abhaId, buildFHIRBundle(updatedPatient));
  };

  // 2. Add Visit Encounter
  const handleAddVisit = async (entry: TimelineEntry, newVitals?: VitalReading[]) => {
    if (!fullRecordPatient) return;
    const patientId = fullRecordPatient.id;
    const abhaId = fullRecordPatient.abhaId;
    const updatedTimeline = [entry, ...(fullRecordPatient.timeline || [])];
    const updatedVitals = newVitals ? [...newVitals, ...(fullRecordPatient.vitals || [])] : fullRecordPatient.vitals;
    const newVisitsCount = (fullRecordPatient.visits || 0) + 1;

    const updatedPatient: Patient = {
      ...fullRecordPatient,
      timeline: updatedTimeline,
      vitals: updatedVitals,
      visits: newVisitsCount,
      lastVisit: entry.date,
      riskBand: entry.riskBand || fullRecordPatient.riskBand,
    };

    setFullRecordPatient(updatedPatient);
    setPatients(prev => prev.map(p => p.id === patientId ? updatedPatient : p));

    showToast(`Visit encounter logged & synced to Patient App (ABHA)`, `Recorded by ${entry.doctor || currentDoctorName} · Risk: ${updatedPatient.riskBand}`);

    await savePatientClinicalRecord(patientId, {
      timeline: updatedTimeline,
      encounters: updatedTimeline,
      vitals: updatedVitals || [],
      visits: newVisitsCount,
      lastVisit: entry.date,
      riskBand: updatedPatient.riskBand,
    });

    const vitalsMap = (newVitals || []).reduce<Record<string, any>>((acc, v) => {
      acc[v.type] = `${v.value} ${v.unit}`;
      return acc;
    }, {});

    // Push segmented encounter with vitals tagged with abhaId for the patient app
    await pushLongitudinalEncounter(patientId, abhaId, {
      date: entry.date,
      type: "VISIT_ENCOUNTER",
      summary: entry.summary,
      riskBand: entry.riskBand,
      doctor: entry.doctor || currentDoctorName,
      details: entry.details,
      vitals: Object.keys(vitalsMap).length > 0 ? vitalsMap : undefined,
    });
    await pushFHIRBundle(patientId, abhaId, buildFHIRBundle(updatedPatient));
  };

  // 3. Add Diagnostic Lab Report
  const handleAddLabReport = async (report: LabReportItem) => {
    if (!fullRecordPatient) return;
    const patientId = fullRecordPatient.id;
    const abhaId = fullRecordPatient.abhaId;
    const updatedLabs = [report, ...(fullRecordPatient.labReports || [])];
    const newTimelineEntry: TimelineEntry = {
      date: "Today",
      type: "visit",
      summary: `Diagnostic Lab: ${report.testName} (LOINC ${report.loincCode}) — Result: ${report.result}`,
      riskBand: report.status === "Abnormal" ? "RED" : "GREEN",
      doctor: currentDoctorName,
    };
    const updatedTimeline = [newTimelineEntry, ...(fullRecordPatient.timeline || [])];

    const updatedPatient: Patient = {
      ...fullRecordPatient,
      labReports: updatedLabs,
      timeline: updatedTimeline,
    };

    setFullRecordPatient(updatedPatient);
    setPatients(prev => prev.map(p => p.id === patientId ? updatedPatient : p));

    showToast(`Diagnostic order (${report.testName}) saved & synced to Patient App`, `LOINC ${report.loincCode} · Status: ${report.status}`);

    await savePatientClinicalRecord(patientId, {
      labReports: updatedLabs,
      timeline: updatedTimeline,
      encounters: updatedTimeline,
    });

    // Push segmented lab diagnostic record with LOINC tags
    await pushLabReportSegment(patientId, abhaId, report);
    await pushLongitudinalEncounter(patientId, abhaId, {
      date: newTimelineEntry.date,
      type: "LAB_DIAGNOSTIC",
      summary: newTimelineEntry.summary,
      riskBand: newTimelineEntry.riskBand,
      doctor: currentDoctorName,
    });
    await pushFHIRBundle(patientId, abhaId, buildFHIRBundle(updatedPatient));
  };

  // 4. Initiate Specialist Referral
  const handleAddReferral = async (referral: ReferralInfo) => {
    if (!fullRecordPatient) return;
    const patientId = fullRecordPatient.id;
    const abhaId = fullRecordPatient.abhaId;
    const newTimelineEntry: TimelineEntry = {
      date: "Today",
      type: "referral",
      summary: `Tertiary Referral Dispatched: ${referral.facility} (${referral.specialty})`,
      riskBand: fullRecordPatient.riskBand === "RED" ? "RED" : "YELLOW",
      doctor: currentDoctorName,
      details: referral.reason,
    };
    const updatedTimeline = [newTimelineEntry, ...(fullRecordPatient.timeline || [])];

    const updatedPatient: Patient = {
      ...fullRecordPatient,
      referral,
      status: "referred",
      timeline: updatedTimeline,
    };

    setFullRecordPatient(updatedPatient);
    setPatients(prev => prev.map(p => p.id === patientId ? updatedPatient : p));

    showToast(`Specialist referral dispatched & synced to Patient App`, `Department: ${referral.specialty} · Priority: ${fullRecordPatient.riskBand}`);

    await savePatientClinicalRecord(patientId, {
      referral,
      status: "referred",
      timeline: updatedTimeline,
      encounters: updatedTimeline,
    });

    await saveReferralRecord({
      id: referral.id,
      patientId: fullRecordPatient.id,
      patientName: fullRecordPatient.name,
      abhaId: fullRecordPatient.abhaId,
      ashaId: fullRecordPatient.ashaId,
      facilityName: referral.facility,
      specialty: referral.specialty,
      priority: fullRecordPatient.riskBand === "RED" ? "emergency" : "urgent",
      stage: referral.status || "dispatched",
      transportMode: "108 ALS Ambulance",
      counterReferralNotes: referral.counterReferralNotes,
      diagnosis: fullRecordPatient.conditions.join(", "),
      createdAt: Date.now(),
    });

    // Push segmented referral pathway document
    await pushReferralSegment(patientId, abhaId, {
      id: referral.id,
      facility: referral.facility,
      specialty: referral.specialty,
      status: referral.status || "dispatched",
      createdAt: referral.createdAt,
      reason: referral.reason,
      counterReferralNotes: referral.counterReferralNotes,
      riskBand: fullRecordPatient.riskBand,
      transportMode: "108 ALS Ambulance",
      doctor: currentDoctorName,
    });
    await pushLongitudinalEncounter(patientId, abhaId, {
      date: newTimelineEntry.date,
      type: "REFERRAL_DISPATCH",
      summary: newTimelineEntry.summary,
      riskBand: newTimelineEntry.riskBand,
      doctor: currentDoctorName,
      details: referral.reason,
    });
    await pushFHIRBundle(patientId, abhaId, buildFHIRBundle(updatedPatient));
  };

  // 5. Update Referral Progression Stage
  const handleUpdateReferralStatus = async (stage: ReferralStatus, notes?: string) => {
    if (!fullRecordPatient || !fullRecordPatient.referral) return;
    const patientId = fullRecordPatient.id;
    const abhaId = fullRecordPatient.abhaId;
    const updatedReferral: ReferralInfo = {
      ...fullRecordPatient.referral,
      status: stage,
      ...(notes ? { counterReferralNotes: notes } : {}),
    };

    const newTimelineEntry: TimelineEntry = {
      date: "Today",
      type: "referral",
      summary: `Referral Stage Updated: ${REFERRAL_STATUS_LABELS[stage] || stage}${notes ? ` — "${notes}"` : ""}`,
      doctor: currentDoctorName,
    };
    const updatedTimeline = [newTimelineEntry, ...(fullRecordPatient.timeline || [])];

    const updatedPatient: Patient = {
      ...fullRecordPatient,
      referral: updatedReferral,
      timeline: updatedTimeline,
    };

    setFullRecordPatient(updatedPatient);
    setPatients(prev => prev.map(p => p.id === patientId ? updatedPatient : p));

    showToast(`Referral progression updated & synced (${REFERRAL_STATUS_LABELS[stage] || stage})`, notes || "Inter-facility status synchronized");

    await savePatientClinicalRecord(patientId, {
      referral: updatedReferral,
      timeline: updatedTimeline,
      encounters: updatedTimeline,
    });

    await saveReferralRecord({
      id: updatedReferral.id,
      patientId: fullRecordPatient.id,
      patientName: fullRecordPatient.name,
      stage: stage,
      counterReferralNotes: notes || updatedReferral.counterReferralNotes,
    });

    // Update referral segment in sub-collection
    await pushReferralSegment(patientId, abhaId, {
      id: updatedReferral.id,
      facility: updatedReferral.facility,
      specialty: updatedReferral.specialty,
      status: stage,
      createdAt: updatedReferral.createdAt,
      reason: updatedReferral.reason,
      counterReferralNotes: notes || updatedReferral.counterReferralNotes,
      riskBand: fullRecordPatient.riskBand,
      doctor: currentDoctorName,
    });
    await pushLongitudinalEncounter(patientId, abhaId, {
      date: newTimelineEntry.date,
      type: "REFERRAL_UPDATE",
      summary: newTimelineEntry.summary,
      doctor: currentDoctorName,
      details: notes,
    });
    await pushFHIRBundle(patientId, abhaId, buildFHIRBundle(updatedPatient));
  };

  const filtered = useMemo(() => patients.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.village.toLowerCase().includes(q) ||
      (p.abhaId && p.abhaId.includes(q)) ||
      p.conditions.some(c => c.toLowerCase().includes(q));
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    const matchRisk = filterRisk === "all" || p.riskBand === filterRisk;
    const matchCohort = filterCohort === "all" || p.cohort === filterCohort;
    return matchSearch && matchStatus && matchRisk && matchCohort;
  }), [patients, search, filterStatus, filterRisk, filterCohort]);

  const counts = useMemo(() => ({
    active:   patients.filter(p => p.status === "active").length,
    referred: patients.filter(p => p.status === "referred").length,
    anc:      patients.filter(p => p.cohort === "ANC").length,
    red:      patients.filter(p => p.riskBand === "RED").length,
    overdue:  patients.filter(p => p.followUpOverdue).length,
    abha: patients.filter(p => p.abhaId).length,
  }), [patients]);

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-slate-900 text-2xl tracking-tight">Patients Register &amp; EHR</h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Patna Rural PHC · {patients.length} registered · ABHA-linked · FHIR R4 Longitudinal Care
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(patients, null, 2));
              const a = document.createElement("a");
              a.href = dataStr;
              a.download = "SeVaSetu_Patients_FHIR.json";
              a.click();
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-[13px] font-display font-semibold hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
          >
            <Download size={14} /> Export FHIR Bundle
          </button>
          <button
            onClick={() => setShowRegister(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-phc-blue text-white text-[13px] font-display font-semibold hover:bg-phc-blue-dark transition-all cursor-pointer shadow-xs"
          >
            <Plus size={15} /> Register Patient
          </button>
        </div>
      </div>

      {/* 6 Top Stat Cards */}
      <div className="grid grid-cols-6 gap-3.5">
        {[
          { label: "Active OPD",        value: counts.active,   color: "text-emerald-700", bg: "bg-emerald-50/70 border-emerald-200", action: () => setFilterStatus("active") },
          { label: "Referred Cases",    value: counts.referred, color: "text-violet-700",  bg: "bg-violet-50/70 border-violet-200",  action: () => setFilterStatus("referred") },
          { label: "ANC / Maternity",   value: counts.anc,      color: "text-pink-700",    bg: "bg-pink-50/70 border-pink-200",    action: () => setFilterCohort("ANC") },
          { label: "High Risk (Red)",   value: counts.red,      color: "text-red-700",     bg: "bg-red-50/70 border-red-200",     action: () => setFilterRisk("RED") },
          { label: "Follow-up Due",     value: counts.overdue,  color: "text-orange-700",  bg: "bg-orange-50/70 border-orange-200",  action: () => {} },
          { label: "ABHA Verified",   value: counts.abha, color: "text-emerald-700",  bg: "bg-emerald-50/70 border-emerald-200",  action: () => {} },
        ].map(s => (
          <button
            key={s.label}
            onClick={s.action}
            className={`border rounded-2xl p-4 text-left ${s.bg} transition-all cursor-pointer hover:shadow-xs hover:scale-[1.01]`}
          >
            <div className={`font-display font-bold text-2xl leading-none ${s.color}`}>{s.value}</div>
            <div className="text-[11.5px] text-slate-600 mt-1.5 font-display font-semibold">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Toolbar: Search, Filters, View Mode Toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, ABHA ID, patient ID, village, or condition…"
              className="w-full pl-9 pr-8 py-2 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-phc-blue/20 focus:border-phc-blue bg-white shadow-xs"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={13} />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-[12.5px] font-display font-semibold transition-all cursor-pointer shadow-xs ${
              showFilters || filterStatus !== "all" || filterRisk !== "all" || filterCohort !== "all"
                ? "border-phc-blue bg-blue-50 text-phc-blue"
                : "border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal size={14} /> Filters
          </button>

          {(filterStatus !== "all" || filterRisk !== "all" || filterCohort !== "all" || search) && (
            <button
              onClick={() => { setFilterStatus("all"); setFilterRisk("all"); setFilterCohort("all"); setSearch(""); }}
              className="text-[12px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[12px] text-slate-500">{filtered.length} patient{filtered.length !== 1 ? "s" : ""}</span>
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-xs">
            <button
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-display font-semibold transition-colors cursor-pointer ${
                viewMode === "cards" ? "bg-phc-blue text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <LayoutGrid size={13} /> Cards
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-display font-semibold transition-colors cursor-pointer ${
                viewMode === "table" ? "bg-phc-blue text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <List size={13} /> Table
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Filter Bar */}
      {showFilters && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap gap-6 animate-in fade-in">
          <div>
            <label className="text-[10.5px] font-display font-bold text-slate-400 uppercase tracking-widest block mb-2">Status</label>
            <div className="flex gap-1.5">
              {["all", "active", "referred", "critical"].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1 rounded-lg text-[12px] font-display capitalize border transition-all ${
                    filterStatus === s ? "bg-phc-blue text-white border-phc-blue font-bold" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {s === "all" ? "All" : s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10.5px] font-display font-bold text-slate-400 uppercase tracking-widest block mb-2">Triage Risk Band</label>
            <div className="flex gap-1.5">
              {(["all", "RED", "YELLOW", "GREEN"] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setFilterRisk(r)}
                  className={`px-3 py-1 rounded-lg text-[12px] font-display border transition-all ${
                    filterRisk === r ? "bg-phc-blue text-white border-phc-blue font-bold" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {r === "all" ? "All Bands" : RISK_META[r].label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10.5px] font-display font-bold text-slate-400 uppercase tracking-widest block mb-2">Clinical Cohort</label>
            <div className="flex gap-1.5 flex-wrap">
              {(["all", "ANC", "TB", "CHRONIC", "CHILD", "GENERAL"] as const).map(c => (
                <button
                  key={c}
                  onClick={() => setFilterCohort(c)}
                  className={`px-3 py-1 rounded-lg text-[12px] font-display border transition-all ${
                    filterCohort === c ? "bg-phc-blue text-white border-phc-blue font-bold" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {c === "all" ? "All Cohorts" : COHORT_META[c].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CARDS VIEW */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-3 gap-5">
          {filtered.map(p => {
            const sm = getStatusMeta(p.status, !!p.referral);
            const rm = getRiskMeta(p.riskBand);

            return (
              <div
                key={p.id}
                onClick={() => setFullRecordPatient(p)}
                className={`bg-white border rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md hover:border-phc-blue/60 group relative flex flex-col justify-between ${
                  p.riskBand === "RED" ? "border-l-4 border-l-red-500" : p.riskBand === "YELLOW" ? "border-l-4 border-l-amber-500" : "border-slate-200"
                }`}
              >
                <div>
                  {/* Top Card Row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-display font-bold text-[13px] text-white shadow-xs ${
                        p.riskBand === "RED" ? "bg-red-500" : p.riskBand === "YELLOW" ? "bg-amber-500" : "bg-phc-blue"
                      }`}>
                        {p.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-slate-900 text-[15px] group-hover:text-phc-blue transition-colors">
                          {p.name}
                        </h3>
                        <div className="text-[12px] text-slate-500 font-sans mt-0.5">
                          {p.age} yrs · {p.sex === "F" ? "Female" : "Male"} · {p.village}
                        </div>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-display font-bold border ${rm.bg} ${rm.text} ${rm.border}`}>
                      {rm.icon} {rm.label}
                    </span>
                  </div>

                  {/* Conditions & Flags */}
                  <div className="space-y-2 mb-4">
                    <div className="text-[12.5px] text-slate-700 font-medium line-clamp-1">
                      {p.conditions.join(", ")}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {p.flags.map(f => (
                        <span key={f} className={`px-2 py-0.5 rounded-md text-[10px] font-display font-bold border ${FLAG_STYLES[f] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Footer Row */}
                <div className="pt-3.5 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-display font-bold ${sm.bg} ${sm.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} /> {sm.label}
                    </span>

                    <div className="flex items-center gap-2">
                      {p.abhaLinked && (
                        <span className="flex items-center gap-0.5 text-emerald-700 font-display font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200" title="ABHA Verified Patient">
                          <ShieldCheck size={10} /> ABHA
                        </span>
                      )}
                      {p.asha && (
                        <span className="flex items-center gap-1 text-[11px] text-phc-green font-display font-semibold">
                          <UserCheck size={11} /> {p.asha}
                        </span>
                      )}
                    </div>
                  </div>

                  {p.abhaId && (
                    <div className="flex items-center justify-between text-[10.5px] font-mono text-emerald-700 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <span className="flex items-center gap-1">
                        <ShieldCheck size={11} /> {p.abhaId}
                      </span>
                      <span className="text-[10px] font-sans text-slate-400 group-hover:text-phc-blue font-semibold">Open EHR →</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === "table" && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10.5px] font-display font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-5 py-3.5">Patient / ABHA</th>
                <th className="px-5 py-3.5">Demographics</th>
                <th className="px-5 py-3.5">Cohort &amp; Conditions</th>
                <th className="px-5 py-3.5">ASHA Worker</th>
                <th className="px-5 py-3.5">Triage Risk</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {filtered.map(p => {
                const sm = STATUS_META[p.status];
                const rm = RISK_META[p.riskBand];

                return (
                  <tr
                    key={p.id}
                    onClick={() => setFullRecordPatient(p)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-display font-bold text-slate-900">{p.name}</div>
                      <div className="font-mono text-[11px] text-emerald-600 flex items-center gap-1 mt-0.5">
                        <ShieldCheck size={10} /> {p.abhaId || p.id}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {p.age} yrs · {p.sex === "F" ? "Female" : "Male"}
                      <div className="text-[11px] text-slate-400">{p.village}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      {(() => {
                        const cm = getCohortMeta(p.cohort);
                        const rm = getRiskMeta(p.riskBand);
                        const sm = getStatusMeta(p.status, !!p.referral);
                        return (
                          <>
                            <div className="flex items-center gap-1.5 text-[11px] font-display font-bold mb-1">
                              <span className={cm.color}>{cm.icon}</span>
                              <span>{cm.label}</span>
                            </div>
                            <div className="text-slate-700 text-[12.5px] line-clamp-1">{p.conditions.join(", ")}</div>
                          </>
                        );
                      })()}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 text-[12.5px]">
                      {p.asha ? (
                        <span className="flex items-center gap-1 text-phc-green font-medium">
                          <UserCheck size={12} /> {p.asha}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      {(() => {
                        const rm = getRiskMeta(p.riskBand);
                        return (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-display font-bold border ${rm.bg} ${rm.text} ${rm.border}`}>
                            {rm.icon} {rm.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-5 py-3.5">
                      {(() => {
                        const sm = getStatusMeta(p.status, !!p.referral);
                        return (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-display font-bold ${sm.bg} ${sm.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} /> {sm.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setFullRecordPatient(p); }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-phc-blue hover:text-white text-slate-700 rounded-lg text-[12px] font-display font-semibold transition-all cursor-pointer"
                      >
                        Open EHR →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Longitudinal EHR Record Modal */}
      {fullRecordPatient && (
        <FullPatientRecordModal
          patient={fullRecordPatient}
          onClose={() => setFullRecordPatient(null)}
          onAddPrescription={handleAddPrescription}
          onAddVisit={handleAddVisit}
          onAddLabReport={handleAddLabReport}
          onAddReferral={handleAddReferral}
          onUpdateReferralStatus={handleUpdateReferralStatus}
          currentDoctorName={currentDoctorName}
        />
      )}

      {/* Register Patient Modal */}
      {showRegister && (
        <RegisterPatientModal
          onClose={() => setShowRegister(false)}
          onRegister={handleRegisterNew}
        />
      )}

      {/* Cloud Sync Toast Notification */}
      {syncToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-500/40 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div className="text-[13px] font-display font-bold text-white leading-tight">{syncToast.message}</div>
            <div className="text-[11px] text-emerald-400 font-mono mt-0.5">{syncToast.sub}</div>
          </div>
        </div>
      )}
    </div>
  );
}
