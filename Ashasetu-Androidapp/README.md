# SevaSethu-Team_Cantina
*This repository is created by Team Cantina for DevHack-2026 hosted by Sahyadri College of Engineering.*

---

# ASHA Setu (आशा सेतू)
**Smart Rural Health Assistant, AI Voice Triage & Offline Community Care System**  
*Built for Accredited Social Health Activists (ASHAs) under the National Health Mission (NHM, Govt. of Maharashtra).*

---

## 📌 Executive Summary & Architecture Overview

**ASHA Setu (आशा सेतू)** is an offline-first, AI-assisted rural health triage and emergency teleconsultation Android application built using **Jetpack Compose (Material 3)**, **Clean Architecture**, and **Kotlin Coroutines**. Designed specifically for Accredited Social Health Activists (ASHAs) operating in extreme, low-connectivity rural regions, ASHA Setu provides **Indic multilingual AI voice triage**, **dataset-calibrated clinical risk scoring**, **SQLCipher 256-bit encrypted local storage**, **real-time doctor teleconsultation & chat**, **108 emergency SOS dispatch**, and **automated cloud synchronization** with Primary Health Centres (PHC), Doctor Dashboards, and Admin Portals via **Google Cloud Firestore**.

---

## ✨ Complete Feature Breakdown & Workflows

### 1. Indic AI Multilingual Voice Triage (`TriageCaptureScreen.kt`)
* **Multilingual Speech Recognition**: Supports native voice input in **Marathi (`mr-IN`)**, **Hindi (`hi-IN`)**, **Tamil (`ta-IN`)**, and **English (`en-IN`)** using Android's native `SpeechRecognizer`.
* **Multilingual NLP Symptom Extractor (`SymptomExtractor.kt`)**: Analyzes spoken transcripts across all 4 languages using regex-based clinical term matchers to extract symptoms (e.g., severe headache, vaginal bleeding, chest pain, high fever, fetal reduced movement, convulsions).
* **Voice-to-Vitals Extractor (`VitalsExtractor.kt`)**: Automatically extracts spoken numbers into clinical vitals (e.g., "BP 160 by 110", "Pulse 98", "SpO2 94 percent", "Hemoglobin 8.5").

### 2. Clinical Rule Engine & Risk Scoring (`RuleEngine.kt`)
* **Deterministic Risk Scoring (1 – 100)**:
  * 🔴 **RED (Emergency)**: Priority Score **85 – 100** (Severe Preeclampsia, Postpartum Hemorrhage, Severe Hypoxia SpO2 < 90%, Fetal Distress FHR < 110 or > 160 bpm, Critical Hypertension BP ≥ 160/110 mmHg).
  * 🟡 **YELLOW (Urgent)**: Priority Score **50 – 84** (Moderate Anemia Hb 7.0–9.9 g/dL, Mild Hypertension BP 140–159/90–109 mmHg, Moderate Fever).
  * 🟢 **GREEN (Routine)**: Priority Score **10 – 49** (Routine ANC/PNC care, stable vitals).
* **Clinical Protocol Generation**: Produces step-by-step action advice, required hospital specialty (Obstetrics, Cardiology, Neurology, Pediatrics, Trauma), and recommended facility tier (PHC, CHC, Sub-District Hospital, District Hospital).

### 3. Patient Registry & ABHA Management (`PatientListScreen.kt`, `AddPatientScreen.kt`, `PatientDetailScreen.kt`)
* **ABHA Integration**: Tracks 14-digit ABHA IDs (`XX-XXXX-XXXX-XXXX`), ANC trimester, cohort classification (`ANC`, `TB`, `CHRONIC`, `CHILD`, `GENERAL`), village, and ASHA ID.
* **Mishap & Unattended Incident Logging**: Logs critical field incidents/mishaps or reasons for unattended visits, synced directly to the PHC Cloud.
* **Interactive Triage History**: Displays a patient's historical clinical triage records with risk badges and priority scores. Tapping any history item navigates to the detailed triage encounter.

### 4. PHC Tele-Consultation & Direct Doctor Routing (`TriageRecordDetailScreen.kt`, `DoctorChatScreen.kt`)
* **Direct Request Routing**: Submits full clinical triage payload to Firestore `teleconsult_requests` directed specifically to `assignedDoctorId: "DOC-PHC-0001"` (`Dr. Aravind Kumar`).
* **Connection Buffering State**: Until the PHC Doctor approves the request on the Doctor Dashboard (`status == "APPROVED_CONNECTED"`), the app maintains a connection buffering screen with `CircularProgressIndicator` and assigned doctor details.
* **Live Two-Way Multilingual Chatbox**:
  * Real-time Firestore snapshot listener on `triage_cases/{caseId}/stream`.
  * **Multilingual Voice-to-Text Messaging**: Speak in Marathi, Hindi, Tamil, or English to compose chat messages.
  * **Medical Image Attachment**: Attach patient condition photos, uploaded to Firebase Storage and rendered using Coil.

### 5. 108 Emergency SOS Dispatch (`SosInboxScreen.kt`)
* **Instant Emergency Broadcast**: Captures real-time device GPS location coordinates (`LocationRepository.kt`) and broadcasts maternal risk details to `sos_alerts` in Firestore and 108 Ambulance Command Centers.

### 6. Hospital Facility Bed Pre-Booking & Referral (`ReferralScreen.kt`)
* **Facility Tracking**: Displays nearby healthcare facilities (District Hospitals, CHCs, PHCs) with live ICU bed availability, oxygen availability, blood bank status, distance in km, and staleness minutes.
* **Bed Pre-Booking**: Pre-books ICU/general beds and sends 108 ambulance dispatch requests to `ambulance_requests` in Firestore.

### 7. Follow-Up & Task Management (`FollowUpScreen.kt`)
* **Community Task Tracking**: Scheduled follow-ups for High-Risk ANC visits, Infant Vaccinations, TB DOTS adherence, and Hypertension monitoring with overdue highlights.

### 8. Wearable BLE Integration (`WearablePairingScreen.kt`, `WearableDataSource.kt`)
* **Continuous Vitals Stream**: Bluetooth Low Energy (BLE) pairing with pulse oximeters and heart rate monitors for real-time vitals streaming into triage capture.

### 9. Offline-First Vault & Background Sync (`SyncWorker.kt`, `SyncQueueDao`, `NetworkMonitor.kt`)
* **SQLCipher Encrypted Local Storage**: Room database encrypted with 256-bit AES SQLCipher (`SupportFactory`).
* **Automated Background Sync**: Offline triage records, referrals, and patient updates are saved to `sync_queue` and automatically flushed to Cloud Firestore by `WorkManager` when 4G/3G connectivity is restored.

### 10. Frontline Worker Telemetry (`CloudSyncService.kt`)
* **ASHA Tracking**: Periodically pushes live ASHA GPS coordinates, battery level percentage, network connection type (4G/3G/Offline), and pending sync queue size to `frontline_workers` in Firestore.

---

## 🔄 Inter-Feature System Relationship Matrix

```
[ ASHA Worker Voice / BLE Input ] 
             │
             ▼
┌─────────────────────────────────────────┐
│ 1. Voice Triage & NLP Parser            │
│    (SymptomExtractor & VitalsExtractor) │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│ 2. Clinical Rule Engine                 │
│    (Calculates Risk Band & Priority)    │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│ 3. SQLCipher Encrypted Room DB Vault    │
│    (Offline Persistence & Sync Queue)   │
└─────────┬──────────────────────┬────────┘
          │                      │
          ▼                      ▼
┌──────────────────┐   ┌───────────────────────────────────┐
│ 4. SOS Dispatch  │   │ 5. PHC Tele-Consultation Request  │
│ (GPS + SOS Alert)│   │    (Routed to DOC-PHC-0001)       │
└─────────┬────────┘   └─────────────────┬─────────────────┘
          │                              │
          ▼                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Google Cloud Firestore & Firebase Storage Sync               │
│    (Real-Time Web Dashboards & Doctor Tele-Consult Stream)       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📡 Complete Data Flow: Cloud Push & Pull Specification

### A. Data Pushed to Cloud (App ➔ Web / Cloud)

#### 1. `teleconsult_requests` Collection
* **Trigger**: Click "PHC MEDICAL TELE-CONSULTATION" on triage record detail screen.
* **Firestore Collection**: `teleconsult_requests` | **Document ID**: `requestId` (e.g. `REQ-892103`)
```json
{
  "id": "REQ-892103",
  "triageRecordId": "TRIAGE-E54616A3",
  "patientId": "PAT-101",
  "patientName": "Sunita Devi",
  "priorityScore": 89,
  "riskBand": "RED",
  "primarySpecialty": "Obstetrics & Gynecology Emergency",
  "status": "PENDING_DOCTOR_APPROVAL",
  "assignedDoctorId": "DOC-PHC-0001",
  "assignedDoctorName": "Dr. Aravind Kumar",
  "timestamp": 1788556980000
}
```

#### 2. `triage_cases` Collection
* **Trigger**: Triage record created or updated.
* **Firestore Collection**: `triage_cases` | **Document ID**: `recordId` (e.g. `TRIAGE-E54616A3`)
```json
{
  "id": "TRIAGE-E54616A3",
  "patientId": "PAT-101",
  "patientName": "Sunita Devi",
  "timestamp": 1788556980000,
  "symptomsCsv": "Heavy Vaginal Bleeding, Severe Abdominal Pain",
  "rawVoiceText": "माझ्या पोटात खूप दुखत आहे आणि रक्तस्त्राव होत आहे",
  "bpSystolic": 165,
  "bpDiastolic": 112,
  "heartRateBpm": 98,
  "spo2Percent": 96,
  "tempCelsius": 37.0,
  "respRatePerMin": 22,
  "bloodSugar": 110,
  "fetalHeartRate": 140,
  "hemoglobin": 8.5,
  "riskBand": "RED",
  "priorityScore": 89,
  "primarySpecialty": "Obstetrics & Gynecology Emergency",
  "aiSummary": "Sunita Devi (26y) [Pregnant Trimester 2]: Symptoms: Heavy Vaginal Bleeding, Severe Abdominal Pain. Vitals: BP 165/112, SpO2 96%, Pulse 98 bpm.",
  "actionAdvice": "CRITICAL (Priority Score 89/100): Immediate referral to DH / Trauma Centre. Dispatch 108 Ambulance.",
  "triageReason": "Severe Preeclampsia / Hemorrhage Protocol"
}
```

#### 3. `triage_cases/{caseId}/stream` Sub-Collection (ASHA Chat Message)
* **Trigger**: ASHA worker sends a text or medical image in `DoctorChatScreen`.
* **Firestore Collection**: `triage_cases/{caseId}/stream` | **Document ID**: Auto-generated
```json
{
  "senderType": "ASHA",
  "senderName": "Sunita Tai",
  "text": "Patient BP is rising, attached clinical image of spot bleeding.",
  "imageUri": "https://firebasestorage.googleapis.com/v0/b/.../chat_images/PAT-101/1788556980.jpg",
  "timestamp": 1788556980000
}
```

#### 4. `patients` Collection
* **Trigger**: New patient registration, mishap report, or visit.
* **Firestore Collection**: `patients` | **Document ID**: `patientId` (e.g. `PAT-101`)
```json
{
  "id": "PAT-101",
  "name": "Sunita Devi",
  "age": 26,
  "gender": "Female",
  "phone": "+91 98230 11234",
  "abhaId": "14-3456-7890-1234",
  "isPregnant": true,
  "trimester": 2,
  "cohort": "ANC",
  "village": "Palghar",
  "ashaId": "ASHA-MH-7892",
  "ashaName": "Sunita Tai",
  "phcCentreId": "BR-PAT-PHC-042",
  "status": "ACTIVE",
  "riskBand": "RED",
  "mishapNotes": null,
  "unattendedReason": null,
  "lastVisitDate": "1788556980000",
  "lastSyncedAt": "1788556980000"
}
```

#### 5. `admin_approvals` Collection
* **Trigger**: Automatic cloud push upon triage record creation.
* **Firestore Collection**: `admin_approvals` | **Document ID**: `recordId`
```json
{
  "recordId": "TRIAGE-E54616A3",
  "patientId": "PAT-101",
  "patientName": "Sunita Devi",
  "riskBand": "RED",
  "priorityScore": 89,
  "status": "APPROVED",
  "timestamp": 1788556980000
}
```

#### 6. `ambulance_requests` Collection
* **Trigger**: Bed pre-booking / 108 ambulance dispatch requested in `ReferralScreen`.
* **Firestore Collection**: `ambulance_requests` | **Document ID**: `requestId` (e.g. `AMB-432109`)
```json
{
  "requestId": "AMB-432109",
  "triageRecordId": "TRIAGE-E54616A3",
  "patientId": "PAT-101",
  "patientName": "Sunita Devi",
  "hospitalName": "Palghar District Hospital",
  "symptoms": "Accidental Fall / Acute Trauma Context",
  "riskBand": "RED",
  "priorityScore": 89,
  "status": "AMBULANCE_REQUESTED",
  "timestamp": 1788556980000
}
```

#### 7. `sos_alerts` Collection
* **Trigger**: One-tap SOS Emergency button tapped in `SosInboxScreen`.
* **Firestore Collection**: `sos_alerts` | **Document ID**: `alertId` (e.g. `SOS-1788556980000`)
```json
{
  "alertId": "SOS-1788556980000",
  "ashaId": "ASHA-MH-7892",
  "ashaName": "Sunita Tai",
  "region": "Palghar Rural GPS (19.6967, 72.7699)",
  "latitude": 19.6967,
  "longitude": 72.7699,
  "patientId": "PAT-101",
  "patientName": "Sunita Devi",
  "emergencyType": "MATERNAL_COLLAPSE",
  "riskBand": "RED",
  "priorityScore": 89,
  "status": "ACTIVE_DISPATCH",
  "contactPhone": "+91 98230 11234",
  "timestamp": 1788556980000
}
```

#### 8. `frontline_workers` Collection
* **Trigger**: Background telemetry timer (every 30 seconds).
* **Firestore Collection**: `frontline_workers` | **Document ID**: `ashaId`
```json
{
  "ashaId": "ASHA-MH-7892",
  "ashaName": "Sunita Tai",
  "latitude": 19.6967,
  "longitude": 72.7699,
  "batteryLevel": 85,
  "networkState": "4G",
  "pendingSyncQueueSize": 0,
  "lastUpdated": 1788556980000
}
```

---

### B. Data Pulled from Cloud (Web / Cloud ➔ App)

#### 1. Teleconsultation Doctor Approval (`teleconsult_requests`)
* **Observer**: Real-time snapshot listener on `teleconsult_requests` matching `triageRecordId`.
* **Expected Payload from Web / Doctor Dashboard**:
```json
{
  "id": "REQ-892103",
  "status": "APPROVED_CONNECTED",
  "assignedDoctorId": "DOC-PHC-0001",
  "assignedDoctorName": "Dr. Aravind Kumar"
}
```
* **App Action**: Unlocks the connection buffering state and opens the two-way live chatbox in `DoctorChatScreen`.

#### 2. Doctor Case Resolution (`triage_cases`)
* **Observer**: Real-time snapshot listener on `triage_cases/{caseId}`.
* **Expected Payload from Web**:
```json
{
  "id": "TRIAGE-E54616A3",
  "status": "CASE_ACKNOWLEDGED",
  "resolvedAt": 1788557000000
}
```
* **App Action**: Updates the case status card to green "Case acknowledged by Doctor".

#### 3. Real-Time Chat Messages (`triage_cases/{caseId}/stream`)
* **Observer**: Real-time snapshot listener on `triage_cases/{caseId}/stream` ordered by timestamp.
* **Expected Payload from Web / Doctor Dashboard**:
```json
{
  "senderType": "DOCTOR",
  "senderName": "Dr. Aravind Kumar",
  "text": "Keep the patient in left lateral tilt. 108 Ambulance is en route.",
  "imageUri": null,
  "timestamp": 1788557010000
}
```
* **App Action**: Renders doctor's advice in real-time inside `DoctorChatScreen`.

#### 4. Admin Approvals (`admin_approvals`)
* **Observer**: Real-time snapshot listener on `admin_approvals/{recordId}`.
* **Expected Payload from Web**:
```json
{
  "recordId": "TRIAGE-E54616A3",
  "status": "APPROVED",
  "approvedAt": 1788557000000
}
```
* **App Action**: Changes case status from "Waiting for Admin Approval" to "Doctor assigned".

#### 5. 108 Ambulance Dispatch Status (`ambulance_requests`)
* **Observer**: Real-time snapshot listener on `ambulance_requests` matching `triageRecordId` or `patientId`.
* **Expected Payload from Web**:
```json
{
  "requestId": "AMB-432109",
  "status": "AMBULANCE_ON_THE_WAY",
  "approvedAt": 1788557000000
}
```
* **App Action**: Triggers "Ambulance Approved!" alert popup and updates card to green "Ambulance on the way".

---

## 🔒 Local Encrypted Vault Schema (Room DB Entities)

All local data is stored inside a 256-bit AES SQLCipher encrypted Room database vault:

| Table Name | Entity Class | Primary Key | Key Fields |
| :--- | :--- | :--- | :--- |
| `patients` | `Patient` | `id` | `name`, `age`, `gender`, `phone`, `abhaId`, `isPregnant`, `trimester`, `cohort`, `village`, `mishapNotes`, `unattendedReason`, `isSynced` |
| `triage_records` | `TriageRecord` | `id` | `patientId`, `timestamp`, `symptomsCsv`, `rawVoiceText`, `bpSystolic`, `bpDiastolic`, `heartRateBpm`, `spo2Percent`, `tempCelsius`, `fetalHeartRate`, `hemoglobin`, `riskBand`, `priorityScore`, `primarySpecialty`, `aiSummary`, `actionAdvice` |
| `referrals` | `Referral` | `id` | `triageRecordId`, `patientId`, `facilityId`, `facilityName`, `urgency`, `transportArranged`, `status` |
| `facilities` | `Facility` | `id` | `name`, `facilityType`, `district`, `specialtiesCsv`, `icuBedsAvailable`, `totalIcuBeds`, `oxygenAvailable`, `bloodBankAvailable`, `distanceKm`, `stalenessMinutes` |
| `followup_tasks` | `FollowUpTask` | `id` | `patientId`, `patientName`, `taskCategory`, `dueDate`, `isOverdue`, `notes`, `isCompleted` |
| `sync_queue` | `SyncQueueItem` | `id` | `payloadType`, `payloadJson`, `timestamp`, `retryCount` |
| `activity_logs` | `ActivityLogEntity` | `id` | `actionType`, `description`, `timestamp` |

---

## 🛠 Tech Stack & Dependencies

| Layer | Technology / Library |
| :--- | :--- |
| **Language** | Kotlin `1.9.22` |
| **UI Framework** | Jetpack Compose (`Material 3`) + Navigation Compose (`2.7.7`) |
| **Architecture** | Clean Architecture + MVVM + StateFlow |
| **Dependency Injection** | Hilt `2.51.1` |
| **Encrypted Database** | Room `2.6.1` + SQLCipher `4.5.4` (`SupportFactory`) |
| **Cloud Backend** | Firebase BoM `32.7.2` (Firestore & Storage) |
| **Voice & Speech** | Android Native `SpeechRecognizer` (`mr-IN`, `hi-IN`, `ta-IN`, `en-IN`) |
| **Async & Coroutines** | KotlinX Coroutines + Play Services Tasks (`1.8.0`) |
| **Background Work** | AndroidX `WorkManager` (`2.9.0`) |
| **Image Loading** | Coil Compose `2.6.0` |

---

## 🚀 How to Build & Run

### Prerequisites
* Android Studio (2026.1+ or modern Ladybug/Koala release)
* JDK 17
* Android Device or Emulator (API 24+)

### Build Steps
1. **Clone Repository**:
   ```bash
   git clone https://github.com/Yokesveren/SevaSethu-Team_Cantina-.git
   cd SevaSethu-Team_Cantina-
   ```

2. **Configure `google-services.json`**:
   Ensure `google-services.json` is present in the `androidApp/` directory.

3. **Build Debug APK**:
   ```bash
   ./gradlew :androidApp:assembleDebug
   ```

4. **Deploy & Launch App**:
   ```bash
   adb install -r androidApp/build/outputs/apk/debug/androidApp-debug.apk
   adb shell am start -n com.byteclub.ashasetu/.MainActivity
   ```
