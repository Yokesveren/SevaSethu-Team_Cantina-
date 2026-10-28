# 📱 SeVaSetu — Patient Mobile App ↔ Firestore Integration Guide

> **Official Specification: Segmented Longitudinal Health Records & ABHA Sync**   
> **Portal:** SeVaSetu National PHC Management Portal (React 19 + TypeScript)  
> **Target Consumer:** Patient Mobile App (Flutter / Android Kotlin / iOS Swift / React Native)

---

## 📑 Table of Contents
1. [Overview & Architecture](#1-overview--architecture)
2. [Firestore Segmented Sub-Collection Hierarchy](#2-firestore-segmented-sub-collection-hierarchy)
3. [How the Patient App Pulls Data by ABHA ID](#3-how-the-patient-app-pulls-data-by-abha-id)
4. [Segment Schemas & Payloads](#4-segment-schemas--payloads)
   - [A. Longitudinal Encounters & Vitals](#a-longitudinal-encounters--vitals)
   - [B. Prescriptions & Active Medication List](#b-prescriptions--active-medication-list)
   - [C. Diagnostic Lab Reports (LOINC Coded)](#c-diagnostic-lab-reports-loinc-coded)
   - [D. Specialist Referral Pathway & Tracking](#d-specialist-referral-pathway--tracking)
   - [E. ABDM FHIR R4 JSON Bundle](#e-abdm-fhir-r4-json-bundle)
5. [Kotlin / Flutter Code Examples for Patient App](#5-kotlin--flutter-code-examples-for-patient-app)
6. [Firestore Security Rules & Indexes](#6-firestore-security-rules--indexes)

---

## 1. Overview & Architecture

To support granular querying by the **Patient Mobile App** without downloading heavy merged JSON payloads, clinical records created in the Doctor's Portal are broken into **isolated sub-collection segments**.

Every document in every sub-collection contains:
1. `patientId` (e.g. `PAT-101`)
2. `abhaId` (e.g. `14-3456-7890-1234`)
3. `segment` type tag (`ENCOUNTER`, `PRESCRIPTION`, `LAB_DIAGNOSTIC`, `REFERRAL_PATHWAY`, `FHIR_R4_BUNDLE`)
4. `timestamp` / `pushedAt` (epoch millis)

```
                       ┌───────────────────────────────┐
                       │   Doctor's Portal (SeVaSetu)  │
                       └──────────────┬────────────────┘
                                      │ Pushes each segment
                                      ▼
                        🔥 Google Cloud Firestore
                     patients/{patientId} (Summary Doc)
                      ├── encounters/{encId}
                      ├── prescriptions/{rxId}
                      ├── lab_reports/{labId}
                      ├── referral_pathway/{refId}
                      └── fhir_bundle/latest
                                      │
            ┌─────────────────────────┴─────────────────────────┐
            │ Query by ABHA ID (collectionGroup / direct path)   │
            ▼                                                   ▼
┌───────────────────────────────┐               ┌───────────────────────────────┐
│   📱 Patient Mobile App       │               │   🏥 ABDM / PHR Gateway       │
│   (Vitals, Active Rx, Status) │               │   (FHIR R4 Bundle)            │
└───────────────────────────────┘               └───────────────────────────────┘
```

---

## 2. Firestore Segmented Sub-Collection Hierarchy

```
patients/{patientId}
  │
  ├── encounters/
  │     └── {encounterId}
  │           ├── id: string
  │           ├── patientId: string
  │           ├── abhaId: string
  │           ├── segment: "ENCOUNTER"
  │           ├── type: "VISIT_ENCOUNTER" | "PRESCRIPTION" | "LAB_DIAGNOSTIC" | "REFERRAL_DISPATCH" | "REFERRAL_UPDATE"
  │           ├── date: string
  │           ├── summary: string
  │           ├── doctor: string
  │           ├── riskBand?: "GREEN" | "YELLOW" | "RED"
  │           ├── vitals?: { BP, HR, SpO2, Temp, RR, Weight }
  │           └── timestamp: number
  │
  ├── prescriptions/
  │     └── {prescriptionId}
  │           ├── id: string
  │           ├── patientId: string
  │           ├── abhaId: string
  │           ├── segment: "PRESCRIPTION"
  │           ├── drug: string
  │           ├── dosage: string
  │           ├── frequency: string
  │           ├── duration: string
  │           ├── status: "Active" | "Completed" | "Discontinued"
  │           ├── prescribedBy: string
  │           ├── prescribedOn: string
  │           └── timestamp: number
  │
  ├── lab_reports/
  │     └── {labReportId}
  │           ├── id: string
  │           ├── patientId: string
  │           ├── abhaId: string
  │           ├── segment: "LAB_DIAGNOSTIC"
  │           ├── testName: string
  │           ├── loincCode: string
  │           ├── loincSystem: "http://loinc.org"
  │           ├── result: string
  │           ├── referenceRange: string
  │           ├── status: "Normal" | "Abnormal" | "Pending"
  │           ├── date: string
  │           └── timestamp: number
  │
  ├── referral_pathway/
  │     └── {referralId}
  │           ├── id: string
  │           ├── patientId: string
  │           ├── abhaId: string
  │           ├── segment: "REFERRAL_PATHWAY"
  │           ├── facility: string
  │           ├── specialty: string
  │           ├── status: "dispatched" | "in_transit" | "reached" | "seen" | "outcome"
  │           ├── createdAt: string
  │           ├── reason: string
  │           ├── counterReferralNotes?: string
  │           ├── transportMode?: string
  │           ├── doctor?: string
  │           └── timestamp: number
  │
  └── fhir_bundle/
        └── latest
              ├── patientId: string
              ├── abhaId: string
              ├── segment: "FHIR_R4_BUNDLE"
              ├── resourceType: "Bundle"
              ├── type: "collection"
              ├── timestamp: ISO8601 string
              ├── entry: [ Patient, Condition[], MedicationRequest[], Observation[], ServiceRequest? ]
              └── generatedAt: number
```

---

## 3. How the Patient App Pulls Data by ABHA ID

The Patient App authenticates via ABDM (ABHA ID). Once the user logs in with their ABHA ID (e.g. `14-3456-7890-1234`), the app can pull data in **two ways**:

### Option 1: Locate `patientId` First, Then Read Sub-Collections (Recommended)

```javascript
// Step 1: Find patient document by abhaId
const patientQuery = query(
  collection(db, "patients"),
  where("abhaId", "==", userAbhaId)
);
const patientSnap = await getDocs(patientQuery);
const patientDoc = patientSnap.docs[0];
const patientId = patientDoc.id;

// Step 2: Stream live prescriptions
const rxSubCol = collection(db, "patients", patientId, "prescriptions");
onSnapshot(rxSubCol, (snapshot) => {
  const activeMeds = snapshot.docs.map(doc => doc.data());
  renderMedicationList(activeMeds);
});

// Step 3: Stream live referral status (Ambulance / Specialist Progress)
const refSubCol = collection(db, "patients", patientId, "referral_pathway");
onSnapshot(refSubCol, (snapshot) => {
  const referrals = snapshot.docs.map(doc => doc.data());
  renderReferralTimeline(referrals);
});
```

### Option 2: CollectionGroup Query by ABHA ID (Direct cross-query)

```javascript
// Pull all encounters directly using collectionGroup index
const encounterQuery = query(
  collectionGroup(db, "encounters"),
  where("abhaId", "==", userAbhaId),
  orderBy("timestamp", "desc")
);
```

---

## 4. Segment Schemas & Payloads

### A. Longitudinal Encounters & Vitals
- **Firestore Path:** `patients/{patientId}/encounters/{encounterId}`
- **Sample Payload:**
```json
{
  "id": "ENC-1725528000000",
  "patientId": "PAT-101",
  "abhaId": "14-3456-7890-1234",
  "segment": "ENCOUNTER",
  "type": "VISIT_ENCOUNTER",
  "date": "05/09/2026",
  "summary": "Follow-up consultation for Gestational Hypertension",
  "riskBand": "YELLOW",
  "doctor": "Dr. Aravind Kumar",
  "details": "Patient reports mild headache. BP controlled on Labetalol.",
  "vitals": {
    "BP": "134/86 mmHg",
    "HR": "78 bpm",
    "SpO2": "99%",
    "Temp": "36.8°C"
  },
  "timestamp": 1725528000000,
  "pushedAt": 1725528000000
}
```

### B. Prescriptions & Active Medication List
- **Firestore Path:** `patients/{patientId}/prescriptions/{rxId}`
- **Sample Payload:**
```json
{
  "id": "RX-8841",
  "patientId": "PAT-101",
  "abhaId": "14-3456-7890-1234",
  "segment": "PRESCRIPTION",
  "drug": "Iron + Folic Acid (IFA)",
  "dosage": "1 Tab",
  "frequency": "Once daily after food",
  "duration": "100 Days",
  "status": "Active",
  "prescribedBy": "Dr. Aravind Kumar",
  "prescribedOn": "Today",
  "timestamp": 1725528000000,
  "pushedAt": 1725528000000
}
```

### C. Diagnostic Lab Reports (LOINC Coded)
- **Firestore Path:** `patients/{patientId}/lab_reports/{labId}`
- **Sample Payload:**
```json
{
  "id": "LAB-5021",
  "patientId": "PAT-101",
  "abhaId": "14-3456-7890-1234",
  "segment": "LAB_DIAGNOSTIC",
  "testName": "Complete Blood Count (CBC)",
  "loincCode": "57021-8",
  "loincSystem": "http://loinc.org",
  "result": "Hb 11.4 g/dL, TLC 7,800/uL",
  "referenceRange": "Hb 12.0-16.0 g/dL, TLC 4-11k",
  "status": "Normal",
  "date": "Today",
  "timestamp": 1725528000000,
  "pushedAt": 1725528000000
}
```

### D. Specialist Referral Pathway & Tracking
- **Firestore Path:** `patients/{patientId}/referral_pathway/{referralId}`
- **Sample Payload:**
```json
{
  "id": "REF-9921",
  "patientId": "PAT-101",
  "abhaId": "14-3456-7890-1234",
  "segment": "REFERRAL_PATHWAY",
  "facility": "Patna Medical College Hospital (PMCH)",
  "specialty": "Obstetrics & Gynecology Emergency",
  "status": "dispatched",
  "createdAt": "Today",
  "reason": "Severe Pre-eclampsia evaluation and NICU standby",
  "counterReferralNotes": "Ambulance en route. Tertiary intake notified.",
  "riskBand": "RED",
  "transportMode": "108 ALS Ambulance",
  "doctor": "Dr. Aravind Kumar",
  "timestamp": 1725528000000,
  "pushedAt": 1725528000000
}
```
*Stage Progression Values:* `dispatched` ➔ `in_transit` ➔ `reached` ➔ `seen` ➔ `outcome`

### E. ABDM FHIR R4 JSON Bundle
- **Firestore Path:** `patients/{patientId}/fhir_bundle/latest`
- Standard HL7 FHIR Release 4 Collection Bundle containing `Patient`, `Condition`, `MedicationRequest`, `Observation`, and `ServiceRequest`.
- Compatible with ABDM Sandbox & Personal Health Record (PHR) apps (like ABHA PHR app, Aarogya Setu).

---

## 5. Kotlin / Flutter Code Examples for Patient App

### Kotlin (Android Jetpack Compose + Firebase Firestore Coroutines)

```kotlin
data class PatientPrescription(
    val id: String = "",
    val abhaId: String = "",
    val drug: String = "",
    val dosage: String = "",
    val frequency: String = "",
    val duration: String = "",
    val status: String = "Active",
    val prescribedBy: String = ""
)

class PatientHealthRepository(private val db: FirebaseFirestore) {

    // Stream live prescriptions by Patient ID
    fun streamPrescriptions(patientId: String): Flow<List<PatientPrescription>> = callbackFlow {
        val listener = db.collection("patients")
            .document(patientId)
            .collection("prescriptions")
            .orderBy("timestamp", Query.Direction.DESCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                val items = snapshot?.toObjects(PatientPrescription::class.java) ?: emptyList()
                trySend(items)
            }
        awaitClose { listener.remove() }
    }

    // Direct lookup of patientId from logged-in ABHA ID
    suspend fun getPatientIdByAbha(abhaId: String): String? {
        val snap = db.collection("patients")
            .whereEqualTo("abhaId", abhaId)
            .limit(1)
            .get()
            .await()
        return snap.documents.firstOrNull()?.id
    }
}
```

---

## 6. Firestore Security Rules & Indexes

Add the following collectionGroup indexes in your Firebase Console (`firestore.indexes.json`):

```json
{
  "indexes": [],
  "fieldOverrides": [
    {
      "collectionGroup": "encounters",
      "fieldPath": "abhaId",
      "indexes": [{ "order": "ASCENDING", "queryScope": "COLLECTION_GROUP" }]
    },
    {
      "collectionGroup": "prescriptions",
      "fieldPath": "abhaId",
      "indexes": [{ "order": "ASCENDING", "queryScope": "COLLECTION_GROUP" }]
    },
    {
      "collectionGroup": "lab_reports",
      "fieldPath": "abhaId",
      "indexes": [{ "order": "ASCENDING", "queryScope": "COLLECTION_GROUP" }]
    },
    {
      "collectionGroup": "referral_pathway",
      "fieldPath": "abhaId",
      "indexes": [{ "order": "ASCENDING", "queryScope": "COLLECTION_GROUP" }]
    }
  ]
}
```
