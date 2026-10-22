import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Firestore,
  Unsubscribe,
  getDocs,
  limit,
} from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { firebaseConfig } from "../firebaseConfig";

// ─── Always-On Firebase Configuration ────────────────────────────────────────
// Credentials hardcoded for seva-sethu-1ae78. No setup or login required.

export interface FirebaseConfigObject {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// Keep these helpers so FirebaseStatusModal / Header still compile,
// but they always return the real hardcoded config.
export function getStoredFirebaseConfig(): FirebaseConfigObject {
  return firebaseConfig;
}

export function saveFirebaseConfigToStorage(_config: FirebaseConfigObject) {
  // No-op: credentials are hardcoded.
  window.location.reload();
}

export function resetFirebaseConfigStorage() {
  // No-op: credentials are hardcoded.
  window.location.reload();
}

// Always "configured" since we have real hardcoded creds.
export function isRealFirebaseConfigured(): boolean {
  return true;
}

const activeConfig = firebaseConfig;

let app: FirebaseApp;
let db: Firestore;
let storage: FirebaseStorage;
let isFirebaseInitialized = false;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(activeConfig);
  db = getFirestore(app);
  storage = getStorage(app);
  isFirebaseInitialized = true;
} catch (err) {
  console.warn("Firebase initialization warning (using local fallback layer if needed):", err);
}

export { app, db, storage, isFirebaseInitialized };

/**
 * Probe live Firestore connection
 */
export async function testFirebaseConnection(): Promise<{
  success: boolean;
  projectId: string;
  message: string;
  collections?: Record<string, number>;
}> {
  if (!isRealFirebaseConfigured()) {
    return {
      success: false,
      projectId: activeConfig.projectId || "Not Configured",
      message: "Placeholder credentials detected. Please paste your real Firebase API Key & Project ID.",
    };
  }

  try {
    const counts: Record<string, number> = {};
    const cols = ["patients", "triage_cases", "sos_alerts", "frontline_workers", "referrals"];

    for (const colName of cols) {
      try {
        const snap = await getDocs(query(collection(db, colName), limit(5)));
        counts[colName] = snap.size;
      } catch (err: any) {
        counts[colName] = -1; // permission or missing
      }
    }

    return {
      success: true,
      projectId: activeConfig.projectId,
      message: `Successfully connected to Firestore project: ${activeConfig.projectId}`,
      collections: counts,
    };
  } catch (error: any) {
    return {
      success: false,
      projectId: activeConfig.projectId,
      message: error?.message || "Failed to reach Firestore. Check network and Firestore security rules.",
    };
  }
}

// ─── Data Types Aligned with Android App Schemas ─────────────────────────────

export function resolveSex(rawSex?: any, rawGender?: any, name?: string, cohort?: string): "M" | "F" {
  const combined = rawGender || rawSex || "";
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

export interface PatientDoc {
  id: string;
  abhaId?: string;
  name: string;
  age: number;
  sex: "M" | "F";
  gender?: string;
  dob?: string;
  village?: string;
  ward?: string;
  block?: string;
  mobile?: string;
  phone?: string;
  ashaId?: string;
  ashaName?: string;
  cohort: "ANC" | "TB" | "CHRONIC" | "CHILD" | "GENERAL" | string;
  conditions?: string[];
  riskBand: "RED" | "YELLOW" | "GREEN";
  syncStatus?: string;
  status?: string;
  updatedAt?: number | string | { seconds: number };
  createdAt?: number | string | { seconds: number };
  timeline?: any[];
  encounters?: any[];
  prescriptions?: any[];
  labReports?: any[];
  referral?: any;
  vitals?: any[];
  visits?: number;
  lastVisit?: string;
}

export interface ReferralDoc {
  id: string;
  patientId: string;
  patientName: string;
  abhaId?: string;
  ashaId?: string;
  diagnosis?: string;
  facilityName?: string;
  specialty?: string;
  priority?: "emergency" | "urgent" | "routine" | string;
  stage?: "dispatched" | "in_transit" | "reached" | "seen" | "outcome" | string;
  transportMode?: string;
  latitude?: number | null;
  longitude?: number | null;
  counterReferralNotes?: string | null;
  syncStatus?: string;
  createdAt?: number | string | { seconds: number };
}

export interface FollowupDoc {
  id: string;
  patientId?: string;
  patientName?: string;
  patient?: string;
  caseType?: string;
  case?: string;
  dueDate?: string;
  date?: string;
  reason?: string;
  ashaId?: string;
  ashaName?: string;
  asha?: string;
  priority?: string;
  status?: "Due Today" | "Upcoming" | "Overdue" | "Completed" | string;
}

export interface TeleconsultRequestDoc {
  id: string; // e.g. "REQ-892103"
  triageRecordId?: string; // "TR-1001"
  caseId?: string; // "PAT-101"
  patientId: string; // "PAT-101"
  patientName: string; // "Sunita Devi"
  age?: number;
  sex?: "M" | "F";
  gender?: string;
  abhaId?: string;
  cohort?: string;
  village?: string;
  priorityScore?: number; // 89
  riskBand?: "RED" | "YELLOW" | "GREEN" | "HIGH_RISK" | "MODERATE_RISK" | string;
  primarySpecialty?: string; // "Obstetrics & Gynecology Emergency"
  status: "PENDING_APPROVAL" | "REQUESTED" | "APPROVED_CONNECTED" | "DECLINED" | string;
  assignedDoctorName?: string | null;
  assignedDoctorId?: string | null;
  assignedDoctorPhone?: string;
  ashaId?: string;
  ashaName?: string;
  ashaPhone?: string;
  symptoms?: string;
  vitals?: string;
  timestamp: number | string | { seconds: number };
  connectedAt?: number;
}

export interface FrontlineWorkerDoc {
  ashaId: string;
  ashaName: string;
  latitude: number;
  longitude: number;
  batteryLevel: number; // 0 - 100
  networkState: "5G" | "4G" | "3G" | "2G" | "OFFLINE" | string;
  pendingSyncQueueSize: number;
  lastUpdated: number | string | { seconds: number; nanoseconds: number };
  ward?: string;
  mobile?: string;
  households?: number;
  homeVisits?: number;
  ancFollowups?: number;
  immunisation?: number;
  status?: "active" | "inactive";
}

export interface TriageCaseDoc {
  id: string;
  patientId: string;
  patientName: string;
  ashaId: string;
  ashaName?: string;
  symptomsTranscript?: string;
  symptomsLanguage?: string;
  riskBand: "RED" | "YELLOW" | "GREEN";
  riskReason?: string;
  priorityScore?: number; // 10-19: GREEN (Routine), 20-39: YELLOW (Urgent), 40+: RED (Emergency)
  systolicBP?: number | null;
  diastolicBP?: number | null;
  heartRate?: number | null;
  spo2?: number | null;
  tempCelsius?: number | null;
  respRate?: number | null;
  muacCm?: number | null;
  vitalsSource?: string;
  snomedCodes?: string[];
  icdCodes?: string[];
  status: "SUBMITTED" | "REVIEWED" | "RESOLVED" | "waiting" | "assessing" | "treating" | "referred" | "done" | string;
  syncStatus?: string;
  createdAt: number | { seconds: number } | string;
  // Extra UI helpers
  token?: string;
  age?: number;
  sex?: "M" | "F";
  gender?: string;
  chiefComplaint?: string;
  notes?: string;
}

export interface CaseStreamMessageDoc {
  id: string;
  caseId: string;
  senderType: "ASHA" | "DOCTOR";
  senderName: string;
  type?: "chat" | "voice_dictation" | "clinical_note" | "prescription";
  content?: string;
  text?: string;
  imageUri?: string | null;
  snomedCodes?: string[];
  snomedTags?: string[];
  timestamp: number | { seconds: number } | string;
}

export interface SOSAlertDoc {
  alertId: string;
  ashaId: string;
  ashaName: string;
  region: string;
  latitude: number;
  longitude: number;
  patientId: string;
  patientName: string;
  emergencyType: string;
  riskBand: "RED" | "YELLOW" | "GREEN";
  priorityScore: number;
  status: "ACTIVE_DISPATCH" | "ACKNOWLEDGED" | "RESOLVED" | "active" | "dispatched" | "resolved";
  timestamp: number | { seconds: number } | string;
  age?: number;
  sex?: "M" | "F";
  condition?: string;
  action?: string;
  referredTo?: string;
  ambulance?: string;
  contactPhone?: string;
}

// ─── Real-Time Firestore Subscription Helpers ────────────────────────────────

/**
 * 1. Subscribe to Patients collection (`patients`)
 */
export function subscribePatients(
  onUpdate: (patients: PatientDoc[]) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  if (!isFirebaseInitialized || !db) return () => { };

  try {
    const colRef = collection(db, "patients");
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (snapshot.empty) {
          onUpdate([]);
          return;
        }
        const list: PatientDoc[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Partial<PatientDoc> & Record<string, any>;
          const resolvedSex = resolveSex(data.sex, data.gender, data.name, data.cohort);
          list.push({
            id: docSnap.id || data.id || "PAT-UNKNOWN",
            abhaId: data.abhaId || "14-XXXX-XXXX-XXXX",
            name: data.name || "Patient",
            age: data.age ?? 30,
            sex: resolvedSex,
            gender: data.gender || (resolvedSex === "M" ? "Male" : "Female"),
            dob: data.dob,
            village: data.village || "Danapur",
            ward: data.ward || "Ward 1",
            block: data.block || "Danapur",
            mobile: data.mobile || (data as any).phone || "",
            ashaId: data.ashaId,
            ashaName: data.ashaName,
            cohort: (data.cohort as any) || "GENERAL",
            conditions: data.conditions || [],
            riskBand: (data.riskBand as "RED" | "YELLOW" | "GREEN") || "GREEN",
            status: data.status || "active",
            syncStatus: data.syncStatus || "SYNCED",
            visits: data.visits || 1,
            lastVisit: data.lastVisit || "Live App Sync",
            timeline: data.timeline || data.encounters || [],
            prescriptions: data.prescriptions || [],
            labReports: data.labReports || [],
            referral: data.referral || undefined,
            vitals: data.vitals || [],
            updatedAt: data.updatedAt || Date.now(),
            createdAt: data.createdAt || Date.now(),
          });
        });
        onUpdate(list);
      },
      (error) => {
        console.warn("Firestore patients listener warning:", error);
        onError?.(error);
      }
    );
  } catch (err) {
    console.warn("Fallback error for patients subscription:", err);
    return () => { };
  }
}

/**
 * Helper: Parse any patient timestamp format (number, string, Firestore Timestamp object).
 */
export function getPatientTimestamp(data: Record<string, any>): number {
  const parseTs = (val: any): number => {
    if (!val) return 0;
    if (typeof val === "number") {
      return val < 10000000000 ? val * 1000 : val;
    }
    if (typeof val === "string") {
      const num = Number(val);
      if (!isNaN(num) && num > 0) {
        return num < 10000000000 ? num * 1000 : num;
      }
      const d = Date.parse(val);
      if (!isNaN(d) && d > 0) return d;
    }
    if (typeof val === "object" && val && "seconds" in val) {
      return val.seconds * 1000;
    }
    return 0;
  };

  return (
    parseTs(data.lastSyncedAt) ||
    parseTs(data.createdAt) ||
    parseTs(data.lastVisitDate) ||
    parseTs(data.updatedAt) ||
    parseTs(data.timestamp) ||
    0
  );
}

/**
 * 1B. Subscribe to Real-Time Newly Added Patients from ASHA Worker App.
 *
 * CRITICAL RULE:
 * Historical patients registered days/weeks ago will NOT pop up.
 * Only patients added in real time (or within the recent 45-min freshness window
 * that were not previously dismissed) trigger the real-time notification popup.
 */
export function subscribeRealtimeNewPatients(
  onNewPatient: (patient: PatientDoc, triageDoc?: any) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  if (!isFirebaseInitialized || !db) return () => {};

  try {
    const colRef = collection(db, "patients");
    let isInitialLoad = true;
    const handledPatientIds = new Set<string>();

    return onSnapshot(
      colRef,
      async (snapshot) => {
        const now = Date.now();
        // 45 minutes window to catch recent additions (e.g. Ram Kumar added just now from ASHA app)
        const FRESHNESS_WINDOW_MS = 45 * 60 * 1000;

        if (isInitialLoad) {
          const recentLivePatients: PatientDoc[] = [];

          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Partial<PatientDoc> & Record<string, any>;
            const patientId = docSnap.id || data.id || "PAT-UNKNOWN";
            const ts = getPatientTimestamp(data);

            // Freshness test: was this patient registered very recently (within 45 mins)?
            if (ts > 0 && now - ts <= FRESHNESS_WINDOW_MS) {
              const resolvedSex = resolveSex(data.sex, data.gender, data.name, data.cohort);
              recentLivePatients.push({
                id: patientId,
                abhaId: data.abhaId || "14-XXXX-XXXX-XXXX",
                name: data.name || "Patient",
                age: data.age ?? 25,
                sex: resolvedSex,
                gender: data.gender || (resolvedSex === "M" ? "Male" : "Female"),
                dob: data.dob,
                village: data.village || "Palghar",
                ward: data.ward || "Ward 1",
                block: data.block || "Danapur",
                mobile: data.mobile || data.phone || "",
                phone: data.phone || data.mobile || "",
                ashaId: data.ashaId,
                ashaName: data.ashaName,
                cohort: data.cohort || "GENERAL",
                conditions: data.conditions || [],
                riskBand: (data.riskBand as any) || "GREEN",
                status: data.status || "ACTIVE",
                syncStatus: data.syncStatus || "SYNCED",
                visits: data.visits || 1,
                lastVisit: data.lastVisit || "Live App Sync",
                timeline: data.timeline || data.encounters || [],
                prescriptions: data.prescriptions || [],
                labReports: data.labReports || [],
                referral: data.referral || undefined,
                vitals: data.vitals || [],
                updatedAt: data.updatedAt || ts,
                createdAt: data.createdAt || ts,
              });
            } else {
              // Historical patient from days ago: silently mark as handled so it NEVER pops up
              handledPatientIds.add(patientId);
            }
          });

          // Sort descending by timestamp so newest patient appears first
          recentLivePatients.sort((a, b) => {
            const tsA = getPatientTimestamp(a as any);
            const tsB = getPatientTimestamp(b as any);
            return tsB - tsA;
          });

          for (const p of recentLivePatients) {
            handledPatientIds.add(p.id);
            try {
              let triageCase: any = undefined;
              const triageSnap = await getDocs(
                query(collection(db, "triage_cases"), where("patientId", "==", p.id))
              );
              if (!triageSnap.empty) {
                triageCase = triageSnap.docs[0].data();
              }
              onNewPatient(p, triageCase);
            } catch {
              onNewPatient(p);
            }
          }

          isInitialLoad = false;
          return;
        }

        // Subsequent live real-time additions:
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === "added" || change.type === "modified") {
            const docSnap = change.doc;
            const data = docSnap.data() as Partial<PatientDoc> & Record<string, any>;
            const patientId = docSnap.id || data.id || "PAT-UNKNOWN";

            if (handledPatientIds.has(patientId) && change.type === "added") return;

            const ts = getPatientTimestamp(data);
            if (ts > 0 && now - ts > FRESHNESS_WINDOW_MS) {
              return; // Ignore updates to ancient records
            }

            handledPatientIds.add(patientId);

            const resolvedSex = resolveSex(data.sex, data.gender, data.name, data.cohort);
            const patient: PatientDoc = {
              id: patientId,
              abhaId: data.abhaId || "14-XXXX-XXXX-XXXX",
              name: data.name || "Patient",
              age: data.age ?? 25,
              sex: resolvedSex,
              gender: data.gender || (resolvedSex === "M" ? "Male" : "Female"),
              dob: data.dob,
              village: data.village || "Palghar",
              ward: data.ward || "Ward 1",
              block: data.block || "Danapur",
              mobile: data.mobile || data.phone || "",
              phone: data.phone || data.mobile || "",
              ashaId: data.ashaId,
              ashaName: data.ashaName,
              cohort: data.cohort || "GENERAL",
              conditions: data.conditions || [],
              riskBand: (data.riskBand as any) || "GREEN",
              status: data.status || "ACTIVE",
              syncStatus: data.syncStatus || "SYNCED",
              visits: data.visits || 1,
              lastVisit: data.lastVisit || "Live App Sync",
              timeline: data.timeline || data.encounters || [],
              prescriptions: data.prescriptions || [],
              labReports: data.labReports || [],
              referral: data.referral || undefined,
              vitals: data.vitals || [],
              updatedAt: data.updatedAt || ts || Date.now(),
              createdAt: data.createdAt || ts || Date.now(),
            };

            let triageCase: any = undefined;
            try {
              const triageSnap = await getDocs(
                query(collection(db, "triage_cases"), where("patientId", "==", patientId))
              );
              if (!triageSnap.empty) {
                triageCase = triageSnap.docs[0].data();
              }
            } catch {}

            onNewPatient(patient, triageCase);
          }
        });
      },
      (error) => {
        console.warn("Firestore real-time patients listener error:", error);
        onError?.(error);
      }
    );
  } catch (err) {
    console.warn("Error setting up real-time patients listener:", err);
    return () => {};
  }
}

/**
 * 2. Subscribe to Referrals collection (`referrals`)
 */
export function subscribeReferrals(
  onUpdate: (referrals: ReferralDoc[]) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  if (!isFirebaseInitialized || !db) return () => { };

  try {
    const colRef = collection(db, "referrals");
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (snapshot.empty) {
          onUpdate([]);
          return;
        }
        const list: ReferralDoc[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Partial<ReferralDoc>;
          list.push({
            id: docSnap.id || data.id || "REF-UNKNOWN",
            patientId: data.patientId || "",
            patientName: data.patientName || "Patient",
            abhaId: data.abhaId,
            ashaId: data.ashaId,
            diagnosis: data.diagnosis || "",
            facilityName: data.facilityName || "PMCH Patna",
            specialty: data.specialty || "General",
            priority: (data.priority as any) || "routine",
            stage: (data.stage as any) || "dispatched",
            transportMode: data.transportMode || "108 ALS Ambulance",
            latitude: data.latitude,
            longitude: data.longitude,
            counterReferralNotes: data.counterReferralNotes,
            syncStatus: data.syncStatus || "SYNCED",
            createdAt: data.createdAt || Date.now(),
          });
        });
        onUpdate(list);
      },
      (error) => {
        console.warn("Firestore referrals listener warning:", error);
        onError?.(error);
      }
    );
  } catch (err) {
    console.warn("Fallback error for referrals subscription:", err);
    return () => { };
  }
}

/**
 * 3. Subscribe to Follow-ups collection (`follow_ups`)
 */
export function subscribeFollowups(
  onUpdate: (followups: FollowupDoc[]) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  if (!isFirebaseInitialized || !db) return () => { };

  try {
    const colRef = collection(db, "follow_ups");
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (snapshot.empty) {
          onUpdate([]);
          return;
        }
        const list: FollowupDoc[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as any;
          list.push({
            id: docSnap.id,
            patient: data.patientName || data.patient || "Patient",
            patientName: data.patientName || data.patient || "Patient",
            patientId: data.patientId,
            case: data.caseType || data.case || "Routine Cadence",
            caseType: data.caseType || data.case || "Routine Cadence",
            date: data.dueDate || data.date || "Today",
            dueDate: data.dueDate || data.date || "Today",
            reason: data.reason || "Scheduled Follow-up",
            asha: data.ashaName || data.asha || "ASHA",
            ashaName: data.ashaName || data.asha || "ASHA",
            ashaId: data.ashaId,
            priority: data.priority || "Normal",
            status: data.status || "Due Today",
          });
        });
        onUpdate(list);
      },
      (error) => {
        console.warn("Firestore follow_ups listener warning:", error);
        onError?.(error);
      }
    );
  } catch (err) {
    console.warn("Fallback error for follow_ups subscription:", err);
    return () => { };
  }
}

/**
 * 4. Subscribe to Frontline Workers collection (`frontline_workers`)
 */
export function subscribeFrontlineWorkers(
  onUpdate: (workers: FrontlineWorkerDoc[]) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  if (!isFirebaseInitialized || !db) return () => { };

  try {
    const colRef = collection(db, "frontline_workers");
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (snapshot.empty) {
          return;
        }
        const workers: FrontlineWorkerDoc[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Partial<FrontlineWorkerDoc>;
          workers.push({
            ashaId: docSnap.id || data.ashaId || "ASHA-UNKNOWN",
            ashaName: data.ashaName || "ASHA Worker",
            latitude: data.latitude ?? 25.6294,
            longitude: data.longitude ?? 85.0442,
            batteryLevel: data.batteryLevel ?? 100,
            networkState: data.networkState ?? "4G",
            pendingSyncQueueSize: data.pendingSyncQueueSize ?? 0,
            lastUpdated: data.lastUpdated ?? Date.now(),
            ward: data.ward || "Danapur Block",
            mobile: data.mobile || "",
            households: data.households ?? 100,
            homeVisits: data.homeVisits ?? 50,
            ancFollowups: data.ancFollowups ?? 5,
            immunisation: data.immunisation ?? 10,
            status: data.status ?? "active",
          });
        });
        onUpdate(workers);
      },
      (error) => {
        console.warn("Firestore frontline_workers listener warning:", error);
        onError?.(error);
      }
    );
  } catch (err) {
    console.warn("Fallback error for frontline_workers subscription:", err);
    return () => { };
  }
}

/**
 * 5. Subscribe to Triage Cases (`triage_cases`) with real-time deletion handling
 */
export function subscribeTriageCases(
  onUpdate: (cases: TriageCaseDoc[], removedCaseIds: string[]) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  if (!isFirebaseInitialized || !db) return () => { };

  try {
    const colRef = collection(db, "triage_cases");
    return onSnapshot(
      colRef,
      (snapshot) => {
        const removedCaseIds: string[] = [];
        snapshot.docChanges().forEach((change) => {
          if (change.type === "removed") {
            removedCaseIds.push(change.doc.id);
          }
        });

        if (snapshot.empty) {
          onUpdate([], removedCaseIds);
          return;
        }

        const cases: TriageCaseDoc[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Partial<TriageCaseDoc> & Record<string, any>;
          const caseId = docSnap.id;

          const rawScore = data.priorityScore !== undefined && data.priorityScore !== null && !isNaN(Number(data.priorityScore))
            ? Number(data.priorityScore)
            : null;

          let resolvedRiskBand: "RED" | "YELLOW" | "GREEN";
          if (rawScore !== null) {
            if (rawScore > 80) resolvedRiskBand = "RED";
            else if (rawScore >= 50) resolvedRiskBand = "YELLOW";
            else resolvedRiskBand = "GREEN";
          } else {
            const b = String(data.riskBand || "").toUpperCase();
            if (b === "RED" || b === "HIGH_RISK" || b === "HIGH") resolvedRiskBand = "RED";
            else if (b === "YELLOW" || b === "MODERATE_RISK" || b === "MODERATE" || b === "ORANGE") resolvedRiskBand = "YELLOW";
            else resolvedRiskBand = "GREEN";
          }

          const resolvedPriorityScore = rawScore !== null
            ? rawScore
            : (resolvedRiskBand === "RED" ? 85 : resolvedRiskBand === "YELLOW" ? 65 : 30);

          const cleanPatientId = data.patientId && !data.patientId.startsWith("PAT-PAT-")
            ? data.patientId
            : `PAT-${caseId.replace(/^PAT-/, "")}`;

          const resolvedPatientName = data.patientName || data.name || (data.patientId ? `Patient (${data.patientId})` : "Patient");
          const resolvedAshaName = data.ashaName || (data.ashaId ? `ASHA (${data.ashaId})` : "ASHA Field Worker");
          const resolvedAshaId = data.ashaId || "ASHA-MH-7892";
          const parseVital = (val: any): number | null => {
            if (val === undefined || val === null || val === "" || isNaN(Number(val))) return null;
            const n = Number(val);
            return n > 0 ? n : null;
          };

          const systolic = parseVital(data.systolicBP ?? data.bpSystolic);
          const diastolic = parseVital(data.diastolicBP ?? data.bpDiastolic);
          const hr = parseVital(data.heartRate ?? data.heartRateBpm);
          const ox = parseVital(data.spo2 ?? data.spo2Percent);
          const temp = parseVital(data.tempCelsius);
          const rr = parseVital(data.respRate ?? data.respRatePerMin);

          cases.push({
            id: caseId,
            patientId: cleanPatientId,
            patientName: resolvedPatientName,
            ashaId: resolvedAshaId,
            ashaName: resolvedAshaName,
            symptomsTranscript: data.symptomsTranscript || data.chiefComplaint || data.symptomsCsv || data.rawVoiceText || "Field clinical assessment from ASHA worker",
            symptomsLanguage: data.symptomsLanguage || "hi-IN",
            riskBand: resolvedRiskBand,
            riskReason: data.riskReason || data.triageReason || data.actionAdvice || (resolvedRiskBand === "RED" ? "Critical risk criteria flagged" : resolvedRiskBand === "YELLOW" ? "Urgent evaluation required within 24 hours" : "Routine clinical assessment"),
            priorityScore: resolvedPriorityScore,
            systolicBP: systolic,
            diastolicBP: diastolic,
            heartRate: hr,
            spo2: ox,
            tempCelsius: temp,
            respRate: rr,
            muacCm: data.muacCm,
            vitalsSource: data.vitalsSource || "ASHA Field Diagnostic Kit (Synced via Mobile App)",
            snomedCodes: data.snomedCodes || [],
            icdCodes: data.icdCodes || [],
            status: data.status || "waiting",
            syncStatus: data.syncStatus || "SYNCED",
            createdAt: data.createdAt || data.timestamp || Date.now(),
            token: data.token || `#${caseId.replace(/\D/g, "").slice(0, 3) || "001"}`,
            age: data.age ?? 30,
            sex: resolveSex(data.sex, data.gender, resolvedPatientName, data.cohort),
            chiefComplaint: data.chiefComplaint || data.symptomsTranscript || data.symptomsCsv || data.aiSummary || "Field Triage Assessment",
            notes: data.notes,
          });
        });

        onUpdate(cases, removedCaseIds);
      },
      (error) => {
        console.warn("Firestore triage_cases listener warning:", error);
        onError?.(error);
      }
    );
  } catch (err) {
    console.warn("Fallback error for triage_cases subscription:", err);
    return () => { };
  }
}

/**
 * 6. Subscribe to Case Stream Messages (`triage_cases/{caseId}/stream`)
 */
export function subscribeCaseStream(
  caseId: string,
  onUpdate: (messages: CaseStreamMessageDoc[]) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  if (!isFirebaseInitialized || !db) return () => { };

  try {
    const streamCol = collection(db, "triage_cases", caseId, "stream");
    const q = query(streamCol, orderBy("timestamp", "asc"));

    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          onUpdate([]);
          return;
        }
        const messages: CaseStreamMessageDoc[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Partial<CaseStreamMessageDoc>;
          messages.push({
            id: docSnap.id,
            caseId: caseId,
            senderType: (data.senderType as "ASHA" | "DOCTOR") || "ASHA",
            senderName: data.senderName || (data.senderType === "DOCTOR" ? "Dr. Aravind Kumar" : "ASHA Worker"),
            type: data.type || "chat",
            content: data.content || data.text || "",
            text: data.text || data.content || "",
            imageUri: data.imageUri || null,
            snomedCodes: data.snomedCodes || data.snomedTags || [],
            snomedTags: data.snomedTags || data.snomedCodes || [],
            timestamp: data.timestamp || Date.now(),
          });
        });
        onUpdate(messages);
      },
      (error) => {
        console.warn(`Firestore stream listener warning for case ${caseId}:`, error);
        onError?.(error);
      }
    );
  } catch (err) {
    console.warn(`Fallback error for stream on case ${caseId}:`, err);
    return () => { };
  }
}

/**
 * 7. Send Doctor Reply to Case Stream (`triage_cases/{caseId}/stream`)
 */
export async function sendDoctorReply(
  caseId: string,
  content: string,
  doctorName = "Dr. Aravind Kumar",
  type: "chat" | "voice_dictation" | "clinical_note" | "prescription" = "chat",
  snomedCodes: string[] = [],
  imageUri: string | null = null
): Promise<string> {
  const msgId = `MSG-${Date.now()}`;
  const messageData: CaseStreamMessageDoc = {
    id: msgId,
    caseId,
    senderType: "DOCTOR",
    senderName: doctorName,
    type,
    content,
    text: content,
    imageUri,
    snomedCodes,
    snomedTags: snomedCodes,
    timestamp: Date.now(),
  };

  if (isFirebaseInitialized && db) {
    try {
      const docRef = doc(db, "triage_cases", caseId, "stream", msgId);
      await setDoc(docRef, {
        ...messageData,
        timestamp: Date.now(),
      });
      return msgId;
    } catch (err) {
      console.warn("Error sending message to Firestore stream:", err);
    }
  }
  return msgId;
}

/**
 * 8. Delete Triage Case (`triage_cases/{caseId}`)
 */
export async function deleteTriageCaseDoc(caseId: string): Promise<void> {
  if (isFirebaseInitialized && db) {
    try {
      const docRef = doc(db, "triage_cases", caseId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn("Error deleting case from Firestore:", err);
    }
  }
}

/**
 * 9. Subscribe to SOS Alerts (`sos_alerts`)
 */
export function subscribeSOSAlerts(
  onUpdate: (alerts: SOSAlertDoc[]) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  if (!isFirebaseInitialized || !db) return () => { };

  try {
    const colRef = collection(db, "sos_alerts");
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (snapshot.empty) {
          onUpdate([]);
          return;
        }
        const alerts: SOSAlertDoc[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Partial<SOSAlertDoc>;
          let ts = Date.now();
          if (typeof data.timestamp === "number") {
            ts = data.timestamp < 10000000000 ? data.timestamp * 1000 : data.timestamp;
          } else if (data.timestamp && typeof (data.timestamp as any).seconds === "number") {
            ts = (data.timestamp as any).seconds * 1000;
          }

          alerts.push({
            alertId: docSnap.id || data.alertId || "SOS-UNKNOWN",
            ashaId: data.ashaId || "ASHA-UNKNOWN",
            ashaName: data.ashaName || "ASHA Worker",
            region: data.region || "Danapur Block",
            latitude: data.latitude ?? 25.6381,
            longitude: data.longitude ?? 85.0519,
            patientId: data.patientId || "PAT-UNKNOWN",
            patientName: data.patientName || "Emergency Patient",
            emergencyType: data.emergencyType || "GENERAL_EMERGENCY",
            riskBand: (data.riskBand as "RED" | "YELLOW" | "GREEN") || "RED",
            priorityScore: data.priorityScore ?? 50,
            status: (data.status as SOSAlertDoc["status"]) || "ACTIVE_DISPATCH",
            timestamp: ts,
            age: data.age ?? 40,
            sex: data.sex || "M",
            condition: data.condition || data.emergencyType,
            action: data.action,
            referredTo: data.referredTo,
            ambulance: data.ambulance,
            contactPhone: data.contactPhone,
          });
        });
        // Sort newest first by timestamp so latest field broadcasts take precedence
        alerts.sort((a, b) => (typeof b.timestamp === "number" ? b.timestamp : 0) - (typeof a.timestamp === "number" ? a.timestamp : 0));
        onUpdate(alerts);
      },
      (error) => {
        console.warn("Firestore sos_alerts listener warning:", error);
        onError?.(error);
      }
    );
  } catch (err) {
    console.warn("Fallback error for sos_alerts subscription:", err);
    return () => { };
  }
}

/**
 * 10. Update SOS Alert Status (`ACKNOWLEDGED` / `RESOLVED` / etc.)
 */
export async function updateSOSAlertStatus(
  alertId: string,
  newStatus: "ACKNOWLEDGED" | "RESOLVED" | "ACTIVE_DISPATCH" | string,
  actionNotes?: string
): Promise<void> {
  if (isFirebaseInitialized && db) {
    try {
      const docRef = doc(db, "sos_alerts", alertId);
      await updateDoc(docRef, {
        status: newStatus,
        ...(actionNotes ? { action: actionNotes } : {}),
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.warn("Error updating SOS alert status in Firestore:", err);
    }
  }
}

/**
 * 11. Save / Update Patient Clinical Record (`patients/{patientId}`)
 * Persists longitudinal encounters, prescriptions, lab reports, and referrals to Firestore.
 */
export async function savePatientClinicalRecord(
  patientId: string,
  updates: Record<string, any>
): Promise<boolean> {
  if (!isFirebaseInitialized || !db) return false;
  try {
    const docRef = doc(db, "patients", patientId);
    await setDoc(docRef, { ...updates, updatedAt: Date.now() }, { merge: true });
    return true;
  } catch (err) {
    console.warn(`Error saving patient record for ${patientId}:`, err);
    return false;
  }
}

/**
 * 11b. Push single Longitudinal Encounter entry to sub-collection
 * `patients/{patientId}/encounters/{encounterId}`
 * Each entry tagged with abhaId so the Patient App can query by ABHA ID.
 */
export async function pushLongitudinalEncounter(
  patientId: string,
  abhaId: string | undefined,
  entry: {
    id?: string;
    date: string;
    type: string;
    summary: string;
    riskBand?: string;
    doctor?: string;
    details?: string;
    vitals?: Record<string, any>;
  }
): Promise<boolean> {
  if (!isFirebaseInitialized || !db) return false;
  try {
    const encId = entry.id || `ENC-${Date.now()}`;
    const docRef = doc(db, "patients", patientId, "encounters", encId);
    await setDoc(docRef, {
      ...entry,
      id: encId,
      patientId,
      abhaId: abhaId || null,
      segment: "ENCOUNTER",
      timestamp: Date.now(),
      pushedAt: Date.now(),
    });
    return true;
  } catch (err) {
    console.warn(`Error pushing encounter for ${patientId}:`, err);
    return false;
  }
}

/**
 * 11c. Push Prescription to sub-collection
 * `patients/{patientId}/prescriptions/{rxId}`
 * Patient App pulls by abhaId to render active medication list.
 */
export async function pushPrescriptionSegment(
  patientId: string,
  abhaId: string | undefined,
  rx: {
    id: string;
    drug: string;
    dosage: string;
    frequency: string;
    duration: string;
    status: string;
    prescribedBy: string;
    prescribedOn: string;
  }
): Promise<boolean> {
  if (!isFirebaseInitialized || !db) return false;
  try {
    const docRef = doc(db, "patients", patientId, "prescriptions", rx.id);
    await setDoc(docRef, {
      ...rx,
      patientId,
      abhaId: abhaId || null,
      segment: "PRESCRIPTION",
      timestamp: Date.now(),
      pushedAt: Date.now(),
    });
    return true;
  } catch (err) {
    console.warn(`Error pushing prescription for ${patientId}:`, err);
    return false;
  }
}

/**
 * 11d. Push Lab/Diagnostic Report to sub-collection
 * `patients/{patientId}/lab_reports/{labId}`
 * Includes LOINC code for interoperability with ABDM / FHIR pipeline.
 */
export async function pushLabReportSegment(
  patientId: string,
  abhaId: string | undefined,
  lab: {
    id: string;
    testName: string;
    loincCode: string;
    result: string;
    referenceRange: string;
    status: string;
    date: string;
  }
): Promise<boolean> {
  if (!isFirebaseInitialized || !db) return false;
  try {
    const docRef = doc(db, "patients", patientId, "lab_reports", lab.id);
    await setDoc(docRef, {
      ...lab,
      patientId,
      abhaId: abhaId || null,
      segment: "LAB_DIAGNOSTIC",
      loincSystem: "http://loinc.org",
      timestamp: Date.now(),
      pushedAt: Date.now(),
    });
    return true;
  } catch (err) {
    console.warn(`Error pushing lab report for ${patientId}:`, err);
    return false;
  }
}

/**
 * 11e. Push Referral entry / stage update to sub-collection
 * `patients/{patientId}/referral_pathway/{referralId}`
 * Each stage update is merged so the Patient App always sees the latest state.
 */
export async function pushReferralSegment(
  patientId: string,
  abhaId: string | undefined,
  referral: {
    id: string;
    facility: string;
    specialty: string;
    status: string;
    createdAt: string;
    reason: string;
    counterReferralNotes?: string;
    riskBand?: string;
    transportMode?: string;
    doctor?: string;
  }
): Promise<boolean> {
  if (!isFirebaseInitialized || !db) return false;
  try {
    const docRef = doc(db, "patients", patientId, "referral_pathway", referral.id);
    await setDoc(docRef, {
      ...referral,
      patientId,
      abhaId: abhaId || null,
      segment: "REFERRAL_PATHWAY",
      timestamp: Date.now(),
      pushedAt: Date.now(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn(`Error pushing referral segment for ${patientId}:`, err);
    return false;
  }
}

/**
 * 11f. Push / Overwrite FHIR R4 Bundle to single document
 * `patients/{patientId}/fhir_bundle/latest`
 * The Patient App fetches this path by patientId or ABHA ID for a complete
 * portable health record that conforms to ABDM FHIR R4 specs.
 */
export async function pushFHIRBundle(
  patientId: string,
  abhaId: string | undefined,
  bundle: Record<string, any>
): Promise<boolean> {
  if (!isFirebaseInitialized || !db) return false;
  try {
    const docRef = doc(db, "patients", patientId, "fhir_bundle", "latest");
    await setDoc(docRef, {
      ...bundle,
      patientId,
      abhaId: abhaId || null,
      segment: "FHIR_R4_BUNDLE",
      generatedAt: Date.now(),
      pushedAt: Date.now(),
    });
    return true;
  } catch (err) {
    console.warn(`Error pushing FHIR bundle for ${patientId}:`, err);
    return false;
  }
}

/**
 * 12. Save / Update Referral Document (`referrals/{referralId}`)
 * Pushes inter-facility referral to Firestore referrals collection.
 */
export async function saveReferralRecord(
  referral: Partial<ReferralDoc> & { id: string }
): Promise<boolean> {
  if (!isFirebaseInitialized || !db) return false;
  try {
    const docRef = doc(db, "referrals", referral.id);
    await setDoc(docRef, { ...referral, updatedAt: Date.now() }, { merge: true });
    return true;
  } catch (err) {
    console.warn(`Error saving referral record for ${referral.id}:`, err);
    return false;
  }
}

/**
 * 13. Helper to check if a worker's lastUpdated timestamp is stale (> 10 mins old)
 */
export function isWorkerStale(lastUpdated: number | string | { seconds: number; nanoseconds?: number } | undefined): boolean {
  if (!lastUpdated) return true;
  let timeMs = 0;
  if (typeof lastUpdated === "number") {
    timeMs = lastUpdated;
  } else if (typeof lastUpdated === "object" && "seconds" in lastUpdated) {
    timeMs = lastUpdated.seconds * 1000;
  } else if (typeof lastUpdated === "string") {
    timeMs = new Date(lastUpdated).getTime();
  }
  const diffMs = Date.now() - timeMs;
  return diffMs > 10 * 60 * 1000; // > 10 minutes
}

/**
 * 14. Subscribe to Teleconsult Requests (`teleconsult_requests`)
 * Used by Doctor Dashboard to receive incoming connection requests from ASHA workers.
 */
export function subscribeTeleconsultRequests(
  onUpdate: (requests: TeleconsultRequestDoc[]) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  // Normalize ASHA app risk band values (HIGH_RISK → RED, MODERATE_RISK → YELLOW)
  function normalizeRiskBand(band?: string | null): "RED" | "YELLOW" | "GREEN" {
    if (!band) return "YELLOW";
    const b = band.toUpperCase();
    if (b === "RED" || b === "HIGH_RISK" || b === "HIGH") return "RED";
    if (b === "YELLOW" || b === "MODERATE_RISK" || b === "MODERATE" || b === "ORANGE") return "YELLOW";
    return "GREEN";
  }

  // Skip records that doctor already actioned
  function isHandled(status?: string): boolean {
    const s = (status || "").toUpperCase();
    return s === "APPROVED_CONNECTED" || s === "APPROVED" || s === "DECLINED" || s === "RESOLVED";
  }

  function normalizeTimestamp(ts: any): number {
    if (!ts) return Date.now();
    if (typeof ts === "number") return ts < 10000000000 ? ts * 1000 : ts;
    if (typeof ts === "object" && typeof ts.seconds === "number") return ts.seconds * 1000;
    if (typeof ts.toDate === "function") return ts.toDate().getTime();
    return Date.now();
  }

  // No Firebase → no popups
  if (!isFirebaseInitialized || !db) {
    onUpdate([]);
    return () => {};
  }

  let teleconsultItems: TeleconsultRequestDoc[] = [];
  let triageItems: TeleconsultRequestDoc[] = [];

  const emitCombined = () => {
    const seenIds = new Set<string>();
    const seenCases = new Set<string>();
    const combined: TeleconsultRequestDoc[] = [];

    for (const item of teleconsultItems) {
      seenIds.add(item.id);
      if (item.caseId) seenCases.add(item.caseId);
      if (item.triageRecordId) seenCases.add(item.triageRecordId);
      combined.push(item);
    }

    for (const item of triageItems) {
      if (seenIds.has(item.id) || seenCases.has(item.id)) continue;
      if (item.caseId && seenCases.has(item.caseId)) continue;
      combined.push(item);
    }

    // Sort newest first
    combined.sort((a, b) => {
      const tsA = typeof a.timestamp === "number" ? a.timestamp : 0;
      const tsB = typeof b.timestamp === "number" ? b.timestamp : 0;
      return tsB - tsA;
    });
    onUpdate(combined);
  };

  try {
    const unsubTele = onSnapshot(
      collection(db, "teleconsult_requests"),
      (snapshot) => {
        const list: TeleconsultRequestDoc[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data() as Record<string, any>;

          // Skip already approved / declined
          if (isHandled(d.status)) return;

          // Skip mirror/tracking documents without patient info
          if (!d.patientName && !d.patientId && !docSnap.id.startsWith("REQ-")) return;

          const rawScore = d.priorityScore !== undefined && d.priorityScore !== null && !isNaN(Number(d.priorityScore))
            ? Number(d.priorityScore)
            : null;

          let riskBand: "RED" | "YELLOW" | "GREEN";
          if (rawScore !== null) {
            if (rawScore > 80) riskBand = "RED";
            else if (rawScore >= 50) riskBand = "YELLOW";
            else riskBand = "GREEN";
          } else {
            riskBand = normalizeRiskBand(d.riskBand);
          }

          const priorityScore = rawScore !== null
            ? rawScore
            : (riskBand === "RED" ? 85 : riskBand === "YELLOW" ? 65 : 30);

          // Build vitals string from either pre-built or individual fields
          const vitalsStr: string = typeof d.vitals === "string" && d.vitals
            ? d.vitals
            : `BP: ${d.bpSystolic ?? d.systolicBP ?? "--"}/${d.bpDiastolic ?? d.diastolicBP ?? "--"} mmHg · HR: ${d.heartRateBpm ?? d.heartRate ?? "--"} bpm · SpO2: ${d.spo2Percent ?? d.spo2 ?? "--"}% · Temp: ${d.tempCelsius ?? "--"}°C`;

          const resolvedSex = resolveSex(d.sex, d.gender, d.patientName, d.cohort);

          list.push({
            id: docSnap.id,
            triageRecordId: d.triageRecordId ?? undefined,
            caseId: d.caseId || d.triageRecordId || docSnap.id,
            patientId: d.patientId || "PAT-UNKNOWN",
            patientName: d.patientName || "Patient",
            age: d.age ?? 26,
            sex: resolvedSex,
            abhaId: d.abhaId || "",
            cohort: d.cohort || "",
            village: d.village || "",
            priorityScore,
            riskBand,
            primarySpecialty: d.primarySpecialty || "General Medicine",
            status: "PENDING_APPROVAL",
            assignedDoctorName: d.assignedDoctorName || null,
            assignedDoctorId: d.assignedDoctorId || null,
            assignedDoctorPhone: d.assignedDoctorPhone ?? "+91 98401 23456",
            ashaId: d.ashaId || "ASHA-MH-7892",
            ashaName: d.ashaName || "ASHA Worker",
            ashaPhone: d.ashaPhone || "+91 98230 11234",
            symptoms: d.symptoms || d.symptomsCsv || d.symptomsTranscript || "Field teleconsultation requested",
            vitals: vitalsStr,
            timestamp: normalizeTimestamp(d.timestamp),
            connectedAt: d.connectedAt ?? undefined,
          });
        });
        teleconsultItems = list;
        emitCombined();
      },
      (error) => {
        console.warn("Firestore teleconsult_requests listener warning:", error);
        onError?.(error);
      }
    );

    // Also listen to triage_cases so cases triggered directly from ASHA App appear for doctor approval
    const unsubTriage = onSnapshot(
      collection(db, "triage_cases"),
      (snapshot) => {
        const list: TeleconsultRequestDoc[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data() as Record<string, any>;
          if (isHandled(d.status)) return;
          const patientName = d.patientName || d.name;
          if (!patientName && !d.patientId) return;

          const rawScore = d.priorityScore !== undefined && d.priorityScore !== null && !isNaN(Number(d.priorityScore))
            ? Number(d.priorityScore)
            : null;

          let riskBand: "RED" | "YELLOW" | "GREEN";
          if (rawScore !== null) {
            if (rawScore > 80) riskBand = "RED";
            else if (rawScore >= 50) riskBand = "YELLOW";
            else riskBand = "GREEN";
          } else {
            riskBand = normalizeRiskBand(d.riskBand);
          }

          const priorityScore = rawScore !== null
            ? rawScore
            : (riskBand === "RED" ? 85 : riskBand === "YELLOW" ? 65 : 30);

          const vitalsStr: string = typeof d.vitals === "string" && d.vitals
            ? d.vitals
            : `BP: ${d.bpSystolic ?? d.systolicBP ?? "--"}/${d.bpDiastolic ?? d.diastolicBP ?? "--"} mmHg · HR: ${d.heartRateBpm ?? d.heartRate ?? "--"} bpm · SpO2: ${d.spo2Percent ?? d.spo2 ?? "--"}% · Temp: ${d.tempCelsius ?? "--"}°C`;

          const resolvedSex = resolveSex(d.sex, d.gender, patientName, d.cohort);

          list.push({
            id: docSnap.id,
            triageRecordId: docSnap.id,
            caseId: docSnap.id,
            patientId: d.patientId || docSnap.id,
            patientName: patientName || "Field Patient",
            age: d.age ?? 39,
            sex: resolvedSex,
            abhaId: d.abhaId || "",
            cohort: d.cohort || "General OPD",
            village: d.village || "Palghar Rural",
            priorityScore,
            riskBand,
            primarySpecialty: d.primarySpecialty || "General Internal Medicine",
            status: "PENDING_APPROVAL",
            assignedDoctorName: d.assignedDoctorName || null,
            assignedDoctorId: d.assignedDoctorId || null,
            assignedDoctorPhone: d.assignedDoctorPhone ?? "+91 98401 23456",
            ashaId: d.ashaId || "ASHA-MH-7892",
            ashaName: d.ashaName || "ASHA Worker",
            ashaPhone: d.ashaPhone || "+91 98230 11234",
            symptoms: d.aiSummary || d.symptomsCsv || d.actionAdvice || d.triageReason || "Triage evaluation submitted from ASHA App",
            vitals: vitalsStr,
            timestamp: normalizeTimestamp(d.timestamp),
            connectedAt: d.connectedAt ?? undefined,
          });
        });
        triageItems = list;
        emitCombined();
      },
      (error) => {
        console.warn("Firestore triage_cases listener warning:", error);
      }
    );

    return () => {
      unsubTele();
      unsubTriage();
    };
  } catch (err) {
    console.warn("Fallback error for teleconsult_requests:", err);
    return () => {};
  }
}

/**
 * Helper: Parse vitals string from ASHA worker app payload
 */
export function parseVitalsString(vitalsStr?: string | null) {
  if (!vitalsStr) return {};
  let systolicBP: number | undefined;
  let diastolicBP: number | undefined;
  let heartRate: number | undefined;
  let spo2: number | undefined;
  let tempCelsius: number | undefined;
  let respRate: number | undefined;

  const bpMatch = vitalsStr.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
  if (bpMatch) {
    systolicBP = parseInt(bpMatch[1], 10);
    diastolicBP = parseInt(bpMatch[2], 10);
  }
  const hrMatch = vitalsStr.match(/(?:HR|Pulse|Heart Rate):\s*(\d{2,3})/i);
  if (hrMatch) {
    heartRate = parseInt(hrMatch[1], 10);
  }
  const spo2Match = vitalsStr.match(/(?:SpO2|Oxygen):\s*(\d{2,3})/i);
  if (spo2Match) {
    spo2 = parseInt(spo2Match[1], 10);
  }
  const tempMatch = vitalsStr.match(/(?:Temp|Temperature):\s*(\d{2}(?:\.\d)?)/i);
  if (tempMatch) {
    tempCelsius = parseFloat(tempMatch[1]);
  }
  const respMatch = vitalsStr.match(/(?:Resp|RR):\s*(\d{1,2})/i);
  if (respMatch) {
    respRate = parseInt(respMatch[1], 10);
  }

  return { systolicBP, diastolicBP, heartRate, spo2, tempCelsius, respRate };
}

/**
 * 15. Approve Teleconsult Connection
 * Approves the clinical connection between ASHA worker and doctor, assigns the patient to the doctor.
 */
export async function approveTeleconsultConnection(
  requestId: string,
  doctorName: string,
  doctorId?: string,
  patientId?: string,
  caseId?: string,
  reqData?: Partial<TeleconsultRequestDoc>
): Promise<boolean> {
  const updates = {
    status: "APPROVED_CONNECTED",
    assignedDoctorName: doctorName,
    assignedDoctorId: doctorId || "DOC-PHC-0001",
    assignedDoctorPhone: "+91 98401 23456",
    connectedAt: Date.now(),
    updatedAt: Date.now(),
  };

  const parsed = parseVitalsString(reqData?.vitals);
  const systolicBP = parsed.systolicBP ?? (reqData as any)?.bpSystolic ?? (reqData as any)?.systolicBP;
  const diastolicBP = parsed.diastolicBP ?? (reqData as any)?.bpDiastolic ?? (reqData as any)?.diastolicBP;
  const heartRate = parsed.heartRate ?? (reqData as any)?.heartRateBpm ?? (reqData as any)?.heartRate;
  const spo2 = parsed.spo2 ?? (reqData as any)?.spo2Percent ?? (reqData as any)?.spo2;
  const tempCelsius = parsed.tempCelsius ?? (reqData as any)?.tempCelsius;
  const respRate = parsed.respRate ?? (reqData as any)?.respRatePerMin ?? (reqData as any)?.respRate;

  const vitalsPayload: Record<string, any> = {};
  if (systolicBP !== undefined && systolicBP !== null) vitalsPayload.systolicBP = systolicBP;
  if (diastolicBP !== undefined && diastolicBP !== null) vitalsPayload.diastolicBP = diastolicBP;
  if (heartRate !== undefined && heartRate !== null) vitalsPayload.heartRate = heartRate;
  if (spo2 !== undefined && spo2 !== null) vitalsPayload.spo2 = spo2;
  if (tempCelsius !== undefined && tempCelsius !== null) vitalsPayload.tempCelsius = tempCelsius;
  if (respRate !== undefined && respRate !== null) vitalsPayload.respRate = respRate;

  const patientName = reqData?.patientName || "Patient";
  const ashaName = reqData?.ashaName || "ASHA Worker";
  const ashaId = reqData?.ashaId || "ASHA-MH-7892";
  const symptoms = reqData?.symptoms || "Field teleconsult requested";

  if (isFirebaseInitialized && db) {
    try {
      // 1. Update primary teleconsult_requests document
      const reqRef = doc(db, "teleconsult_requests", requestId);
      await setDoc(reqRef, updates, { merge: true });

      // 2. If triageRecordId exists, also update teleconsult_requests/{triageRecordId}
      if (reqData?.triageRecordId && reqData.triageRecordId !== requestId) {
        try {
          const triageReqRef = doc(db, "teleconsult_requests", reqData.triageRecordId);
          await setDoc(triageReqRef, updates, { merge: true });
        } catch (e) {
          // optional mirror doc
        }
      }

      // 3. Update triage_cases doc so live Case Stream and Triage are in sync
      const targetCaseId = caseId || reqData?.triageRecordId || requestId.replace("REQ-", "");
      try {
        const caseRef = doc(db, "triage_cases", targetCaseId);
        await setDoc(caseRef, {
          assignedDoctorName: doctorName,
          assignedDoctorId: doctorId || "DOC-PHC-0001",
          status: "APPROVED_CONNECTED",
          patientId: patientId || targetCaseId,
          patientName,
          age: reqData?.age ?? 26,
          sex: resolveSex(reqData?.sex, reqData?.gender, patientName, reqData?.cohort),
          ashaId,
          ashaName,
          symptomsTranscript: symptoms,
          chiefComplaint: symptoms,
          ...vitalsPayload,
          vitalsSource: "ASHA Field Diagnostic Kit (Synced via Mobile App)",
          connectedAt: Date.now(),
          updatedAt: Date.now(),
        }, { merge: true });
      } catch (e) {
        // triage case optional
      }

      // 4. Update patient doc in patients collection
      if (patientId) {
        try {
          const patRef = doc(db, "patients", patientId);
          await setDoc(patRef, {
            name: patientName,
            assignedDoctor: doctorName,
            assignedDoctorName: doctorName,
            assignedDoctorId: doctorId || "DOC-PHC-0001",
            status: "active",
            teleconsultStatus: "APPROVED_CONNECTED",
            ashaId,
            ashaName,
            connectedAt: Date.now(),
            vitals: [
              {
                date: new Date().toISOString().split("T")[0],
                bp: `${systolicBP}/${diastolicBP}`,
                pulse: heartRate,
                spo2: spo2,
                temp: tempCelsius,
                respRate: respRate,
              }
            ],
            updatedAt: Date.now(),
          }, { merge: true });
        } catch (e) {
          // patient optional
        }
      }

      // 5. Post initial handshake message to case stream
      try {
        const handshakeId = `MSG-CONN-${Date.now()}`;
        const streamRef = doc(db, "triage_cases", targetCaseId, "stream", handshakeId);
        await setDoc(streamRef, {
          id: handshakeId,
          caseId: targetCaseId,
          senderType: "DOCTOR",
          senderName: doctorName,
          type: "chat",
          content: `Teleconsultation connected with ${doctorName}. Channel active for ${patientName}. You can now consult and exchange clinical instructions.`,
          text: `Teleconsultation connected with ${doctorName}. Channel active for ${patientName}. You can now consult and exchange clinical instructions.`,
          timestamp: Date.now(),
        });
      } catch (e) {
        // stream optional
      }

      return true;
    } catch (err) {
      console.warn(`Error approving teleconsult request ${requestId}:`, err);
      return false;
    }
  }
  return true;
}

/**
 * 16. Decline Teleconsult Request
 */
export async function declineTeleconsultConnection(
  requestId: string,
  reason?: string
): Promise<boolean> {
  if (isFirebaseInitialized && db) {
    try {
      const reqRef = doc(db, "teleconsult_requests", requestId);
      await setDoc(reqRef, {
        status: "DECLINED",
        declinedReason: reason || "Doctor occupied in emergency procedure, forwarded to district pool",
        updatedAt: Date.now(),
      }, { merge: true });
      return true;
    } catch (err) {
      console.warn(`Error declining teleconsult request ${requestId}:`, err);
      return false;
    }
  }
  return true;
}

/**
 * 17. Create / Simulate Incoming ASHA Teleconsult Request
 */
export async function createSimulatedTeleconsultRequest(
  request?: Partial<TeleconsultRequestDoc>
): Promise<string> {
  const reqId = request?.id || `REQ-${Math.floor(100000 + Math.random() * 900000)}`;
  const payload: TeleconsultRequestDoc = {
    id: reqId,
    triageRecordId: `TR-${Math.floor(1000 + Math.random() * 9000)}`,
    caseId: request?.caseId || request?.patientId || "PAT-101",
    patientId: request?.patientId || "PAT-101",
    patientName: request?.patientName || "Field Patient",
    age: request?.age ?? 26,
    sex: resolveSex(request?.sex, request?.gender, request?.patientName, request?.cohort),
    abhaId: request?.abhaId || "14-3456-7890-1234",
    cohort: request?.cohort || "Maternal ANC (Trimester 2)",
    village: request?.village || "Palghar Rural, Ward 1",
    priorityScore: request?.priorityScore ?? 89,
    riskBand: request?.riskBand || "RED",
    primarySpecialty: request?.primarySpecialty || "Obstetrics & Gynecology Emergency",
    status: "PENDING_APPROVAL",
    assignedDoctorName: null,
    assignedDoctorId: null,
    ashaId: request?.ashaId || "ASHA-MH-7892",
    ashaName: request?.ashaName || "ASHA Worker",
    ashaPhone: request?.ashaPhone || "+91 98230 11234",
    symptoms: request?.symptoms || "Severe Abdominal Pain, Heavy Vaginal Bleeding",
    vitals: request?.vitals || "BP: 165/112 mmHg · HR: 98 bpm · SpO2: 96% · Temp: 37.0°C",
    timestamp: Date.now(),
  };

  if (isFirebaseInitialized && db) {
    try {
      const docRef = doc(db, "teleconsult_requests", reqId);
      await setDoc(docRef, payload);
    } catch (err) {
      console.warn("Error creating simulated teleconsult request in Firestore:", err);
    }
  }
  return reqId;
}
