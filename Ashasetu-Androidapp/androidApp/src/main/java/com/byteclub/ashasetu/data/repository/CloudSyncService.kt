package com.byteclub.ashasetu.data.repository

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.BatteryManager
import com.byteclub.ashasetu.data.local.dao.SyncQueueDao
import com.byteclub.ashasetu.data.local.entity.Patient
import com.byteclub.ashasetu.data.local.entity.TriageRecord
import com.byteclub.ashasetu.domain.sync.NetworkMonitor
import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.google.firebase.storage.FirebaseStorage
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

data class TeleconsultRequest(
    val id: String,
    val triageRecordId: String,
    val patientId: String,
    val patientName: String,
    val priorityScore: Int,
    val riskBand: String,
    val primarySpecialty: String,
    val status: String = "PENDING_DOCTOR_APPROVAL", // "PENDING_DOCTOR_APPROVAL", "APPROVED_CONNECTED", "COMPLETED"
    val assignedDoctorId: String = "DOC-PHC-0001",
    val assignedDoctorName: String? = "Dr. Aravind Kumar",
    val timestamp: Long = System.currentTimeMillis()
)

data class AmbulanceRequest(
    val requestId: String = "",
    val triageRecordId: String = "",
    val patientId: String = "",
    val patientName: String = "",
    val hospitalName: String = "",
    val symptoms: String = "",
    val riskBand: String = "RED",
    val priorityScore: Int = 90,
    val status: String = "AMBULANCE_REQUESTED", // "AMBULANCE_REQUESTED" | "AMBULANCE_ON_THE_WAY"
    val timestamp: Long = System.currentTimeMillis()
)

data class ChatMessage(
    val id: String = "",
    val senderType: String = "ASHA", // "ASHA" | "DOCTOR"
    val senderName: String = "",
    val text: String = "",
    val imageUri: String? = null,
    val timestamp: Long = System.currentTimeMillis()
) {
    val isFromDoctor: Boolean get() = senderType == "DOCTOR"
}

@Singleton
class CloudSyncService @Inject constructor(
    @ApplicationContext private val context: Context,
    private val locationRepository: LocationRepository,
    private val networkMonitor: NetworkMonitor,
    private val syncQueueDao: SyncQueueDao
) {
    private val firestore: FirebaseFirestore? by lazy {
        try {
            FirebaseFirestore.getInstance()
        } catch (e: Exception) {
            null
        }
    }

    private val _teleconsultState = MutableStateFlow<Map<String, TeleconsultRequest>>(emptyMap())
    val teleconsultState: StateFlow<Map<String, TeleconsultRequest>> = _teleconsultState

    private val _adminApprovalState = MutableStateFlow<Map<String, String>>(emptyMap())
    val adminApprovalState: StateFlow<Map<String, String>> = _adminApprovalState

    private val _ambulanceRequestState = MutableStateFlow<Map<String, AmbulanceRequest>>(emptyMap())
    val ambulanceRequestState: StateFlow<Map<String, AmbulanceRequest>> = _ambulanceRequestState

    private val _caseStatusState = MutableStateFlow<Map<String, String>>(emptyMap())
    val caseStatusState: StateFlow<Map<String, String>> = _caseStatusState

    private val _chatMessages = MutableStateFlow<List<ChatMessage>>(emptyList())
    val chatMessages: StateFlow<List<ChatMessage>> = _chatMessages

    private val scope = CoroutineScope(Dispatchers.IO)

    init {
        scope.launch {
            while (isActive) {
                try {
                    syncTelemetry()
                } catch (ignored: Exception) {}
                delay(30000L)
            }
        }
    }

    suspend fun syncPatientToCloud(patient: Patient) {
        val payload = mapOf(
            "id" to patient.id,
            "name" to patient.name,
            "age" to patient.age,
            "gender" to patient.gender,
            "phone" to patient.phone,
            "abhaId" to patient.abhaId, // 14-digit format: 14-XXXX-XXXX-XXXX
            "isPregnant" to patient.isPregnant,
            "trimester" to patient.trimester,
            "cohort" to patient.cohort,
            "village" to patient.village,
            "ashaId" to patient.ashaId,
            "ashaName" to patient.ashaName,
            "phcCentreId" to patient.phcCentreId,
            "status" to patient.status,
            "riskBand" to patient.riskBand,
            "mishapNotes" to patient.mishapNotes,
            "unattendedReason" to patient.unattendedReason,
            "lastVisitDate" to patient.lastVisitDate,
            "lastSyncedAt" to System.currentTimeMillis().toString()
        )
        try {
            firestore?.collection("patients")?.document(patient.id)?.set(payload)?.await()
        } catch (ignored: Exception) {}
    }

    suspend fun syncTriageCaseToCloud(record: TriageRecord, patient: Patient?) {
        val payload = mapOf(
            "id" to record.id,
            "patientId" to record.patientId,
            "patientName" to (patient?.name ?: ""),
            "timestamp" to record.timestamp,
            "symptomsCsv" to record.symptomsCsv,
            "rawVoiceText" to record.rawVoiceText,
            "bpSystolic" to record.bpSystolic,
            "bpDiastolic" to record.bpDiastolic,
            "heartRateBpm" to record.heartRateBpm,
            "spo2Percent" to record.spo2Percent,
            "tempCelsius" to record.tempCelsius,
            "respRatePerMin" to record.respRatePerMin,
            "bloodSugar" to record.bloodSugar,
            "fetalHeartRate" to record.fetalHeartRate,
            "hemoglobin" to record.hemoglobin,
            "riskBand" to record.riskBand,
            "priorityScore" to record.priorityScore,
            "primarySpecialty" to record.primarySpecialty,
            "aiSummary" to record.aiSummary,
            "actionAdvice" to record.actionAdvice,
            "triageReason" to record.triageReason
        )
        try {
            firestore?.collection("triage_cases")?.document(record.id)?.set(payload)?.await()
        } catch (ignored: Exception) {}

        // Automatically sync admin approval record to Cloud
        syncAdminApprovalRequest(record, patient?.name ?: "")
    }

    suspend fun syncAdminApprovalRequest(record: TriageRecord, patientName: String) {
        val initialStatus = if (record.riskBand.equals("RED", ignoreCase = true)) "APPROVED" else "PENDING"
        val payload = mapOf(
            "recordId" to record.id,
            "patientId" to record.patientId,
            "patientName" to patientName,
            "riskBand" to record.riskBand,
            "priorityScore" to record.priorityScore,
            "status" to initialStatus,
            "timestamp" to Timestamp.now()
        )
        val currentMap = _adminApprovalState.value.toMutableMap()
        currentMap[record.id] = initialStatus
        _adminApprovalState.value = currentMap

        try {
            firestore?.collection("admin_approvals")?.document(record.id)?.set(payload)?.await()
        } catch (ignored: Exception) {}
    }

    fun observeAdminApproval(recordId: String, riskBand: String, patientName: String = ""): Flow<String> = callbackFlow {
        if (riskBand.equals("RED", ignoreCase = true)) {
            trySend("APPROVED")
            close()
            return@callbackFlow
        }

        val localStatus = _adminApprovalState.value[recordId] ?: "PENDING"
        trySend(localStatus)

        val fs = firestore
        if (fs == null) {
            close()
            return@callbackFlow
        }

        val docRef = fs.collection("admin_approvals").document(recordId)

        docRef.get().addOnSuccessListener { snapshot ->
            if (!snapshot.exists()) {
                val initialPayload = mapOf(
                    "recordId" to recordId,
                    "patientName" to patientName,
                    "riskBand" to riskBand,
                    "status" to "PENDING",
                    "timestamp" to Timestamp.now()
                )
                docRef.set(initialPayload)
            }
        }

        val listener = docRef.addSnapshotListener { snapshot, error ->
            if (error != null) {
                trySend(_adminApprovalState.value[recordId] ?: "PENDING")
                return@addSnapshotListener
            }
            val status = snapshot?.getString("status") ?: (_adminApprovalState.value[recordId] ?: "PENDING")
            val currentMap = _adminApprovalState.value.toMutableMap()
            currentMap[recordId] = status
            _adminApprovalState.value = currentMap
            trySend(status)
        }

        awaitClose { listener.remove() }
    }

    suspend fun approveAdminRequest(recordId: String) {
        val currentMap = _adminApprovalState.value.toMutableMap()
        currentMap[recordId] = "APPROVED"
        _adminApprovalState.value = currentMap

        val caseMap = _caseStatusState.value.toMutableMap()
        caseMap[recordId] = "DOCTOR_ASSIGNED"
        _caseStatusState.value = caseMap

        try {
            firestore?.collection("admin_approvals")
                ?.document(recordId)
                ?.update(mapOf("status" to "APPROVED", "approvedAt" to Timestamp.now()))
                ?.await()
        } catch (ignored: Exception) {
            try {
                firestore?.collection("admin_approvals")
                    ?.document(recordId)
                    ?.set(mapOf("recordId" to recordId, "status" to "APPROVED", "approvedAt" to Timestamp.now()))
                    ?.await()
            } catch (ignored2: Exception) {}
        }
    }

    fun observeCaseStatus(recordId: String, riskBand: String): Flow<String> = callbackFlow {
        val isRed = riskBand.equals("RED", ignoreCase = true)
        val defaultInitial = if (isRed) "DOCTOR_ASSIGNED" else (_adminApprovalState.value[recordId]?.let { if (it == "APPROVED") "DOCTOR_ASSIGNED" else "WAITING_FOR_APPROVAL" } ?: "WAITING_FOR_APPROVAL")
        val currentLocal = _caseStatusState.value[recordId] ?: defaultInitial
        trySend(currentLocal)

        val fs = firestore
        if (fs == null) {
            close()
            return@callbackFlow
        }

        val listener = fs.collection("triage_cases")
            .document(recordId)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    trySend(_caseStatusState.value[recordId] ?: defaultInitial)
                    return@addSnapshotListener
                }
                val rawStatus = snapshot?.getString("status")?.uppercase()
                val computedStatus = when {
                    rawStatus == "RESOLVED" || rawStatus == "CASE_ACKNOWLEDGED" || rawStatus == "ACKNOWLEDGED" -> "CASE_ACKNOWLEDGED"
                    rawStatus == "DOCTOR_ASSIGNED" || rawStatus == "APPROVED" -> "DOCTOR_ASSIGNED"
                    isRed -> "DOCTOR_ASSIGNED"
                    _adminApprovalState.value[recordId] == "APPROVED" -> "DOCTOR_ASSIGNED"
                    else -> "WAITING_FOR_APPROVAL"
                }

                val currentMap = _caseStatusState.value.toMutableMap()
                currentMap[recordId] = computedStatus
                _caseStatusState.value = currentMap
                trySend(computedStatus)
            }

        awaitClose { listener.remove() }
    }

    suspend fun markCaseAsResolved(recordId: String) {
        val currentMap = _caseStatusState.value.toMutableMap()
        currentMap[recordId] = "CASE_ACKNOWLEDGED"
        _caseStatusState.value = currentMap

        try {
            firestore?.collection("triage_cases")
                ?.document(recordId)
                ?.update(mapOf("status" to "CASE_ACKNOWLEDGED", "resolvedAt" to Timestamp.now()))
                ?.await()
        } catch (ignored: Exception) {
            try {
                firestore?.collection("triage_cases")
                    ?.document(recordId)
                    ?.set(mapOf("id" to recordId, "status" to "CASE_ACKNOWLEDGED", "resolvedAt" to Timestamp.now()))
                    ?.await()
            } catch (ignored2: Exception) {}
        }
    }

    fun observeTeleconsultRequest(recordId: String): Flow<TeleconsultRequest?> = callbackFlow {
        val localReq = _teleconsultState.value[recordId]
        trySend(localReq)

        val fs = firestore
        if (fs == null) {
            close()
            return@callbackFlow
        }

        val listener = fs.collection("teleconsult_requests")
            .whereEqualTo("triageRecordId", recordId)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    trySend(_teleconsultState.value[recordId])
                    return@addSnapshotListener
                }
                val doc = snapshot?.documents?.firstOrNull()
                if (doc != null) {
                    val req = TeleconsultRequest(
                        id = doc.id,
                        triageRecordId = doc.getString("triageRecordId") ?: recordId,
                        patientId = doc.getString("patientId") ?: "",
                        patientName = doc.getString("patientName") ?: "Unknown Patient",
                        priorityScore = getIntValue(doc, "priorityScore", 0),
                        riskBand = doc.getString("riskBand") ?: "GREEN",
                        primarySpecialty = doc.getString("primarySpecialty") ?: "General Medicine",
                        status = doc.getString("status") ?: "PENDING_DOCTOR_APPROVAL",
                        assignedDoctorId = doc.getString("assignedDoctorId") ?: "DOC-PHC-0001",
                        assignedDoctorName = doc.getString("assignedDoctorName") ?: "Dr. Aravind Kumar",
                        timestamp = getLongValue(doc, "timestamp")
                    )
                    val currentMap = _teleconsultState.value.toMutableMap()
                    currentMap[recordId] = req
                    _teleconsultState.value = currentMap
                    trySend(req)
                } else {
                    trySend(_teleconsultState.value[recordId])
                }
            }

        awaitClose { listener.remove() }
    }

    suspend fun approveTeleconsultRequest(triageRecordId: String) {
        val currentRequest = _teleconsultState.value[triageRecordId]
        val reqId = currentRequest?.id ?: "REQ-${System.currentTimeMillis().toString().takeLast(6)}"
        val approved = (currentRequest ?: TeleconsultRequest(
            id = reqId,
            triageRecordId = triageRecordId,
            patientId = "PAT-101",
            patientName = "Sunita Devi",
            priorityScore = 80,
            riskBand = "YELLOW",
            primarySpecialty = "General Medicine",
            assignedDoctorId = "DOC-PHC-0001",
            assignedDoctorName = "Dr. Aravind Kumar"
        )).copy(
            status = "APPROVED_CONNECTED",
            assignedDoctorId = "DOC-PHC-0001",
            assignedDoctorName = "Dr. Aravind Kumar"
        )
        val currentMap = _teleconsultState.value.toMutableMap()
        currentMap[triageRecordId] = approved
        _teleconsultState.value = currentMap

        try {
            firestore?.collection("teleconsult_requests")
                ?.document(reqId)
                ?.update(
                    mapOf(
                        "status" to "APPROVED_CONNECTED",
                        "assignedDoctorId" to "DOC-PHC-0001",
                        "assignedDoctorName" to "Dr. Aravind Kumar"
                    )
                )
                ?.await()
        } catch (ignored: Exception) {
            try {
                firestore?.collection("teleconsult_requests")
                    ?.document(reqId)
                    ?.set(
                        mapOf(
                            "id" to reqId,
                            "triageRecordId" to triageRecordId,
                            "status" to "APPROVED_CONNECTED",
                            "assignedDoctorId" to "DOC-PHC-0001",
                            "assignedDoctorName" to "Dr. Aravind Kumar",
                            "timestamp" to Timestamp.now()
                        )
                    )
                    ?.await()
            } catch (ignored2: Exception) {}
        }
    }

    suspend fun sendAmbulanceRequest(
        triageRecordId: String = "TRIAGE-LATEST",
        patientId: String = "PAT-101",
        patientName: String = "Sunita Devi",
        hospitalName: String = "Palghar District Hospital",
        symptoms: String = "Accidental Fall / Acute Trauma Context",
        riskBand: String = "RED",
        priorityScore: Int = 90
    ): String {
        val reqId = "AMB-${System.currentTimeMillis().toString().takeLast(6)}"
        val request = AmbulanceRequest(
            requestId = reqId,
            triageRecordId = triageRecordId,
            patientId = patientId,
            patientName = patientName,
            hospitalName = hospitalName,
            symptoms = symptoms,
            riskBand = riskBand,
            priorityScore = priorityScore,
            status = "AMBULANCE_REQUESTED"
        )

        val currentMap = _ambulanceRequestState.value.toMutableMap()
        currentMap[triageRecordId] = request
        if (patientId.isNotBlank()) currentMap[patientId] = request
        currentMap["GLOBAL_LATEST"] = request
        _ambulanceRequestState.value = currentMap

        val payload = mapOf(
            "requestId" to reqId,
            "triageRecordId" to triageRecordId,
            "patientId" to patientId,
            "patientName" to patientName,
            "hospitalName" to hospitalName,
            "symptoms" to symptoms,
            "riskBand" to riskBand,
            "priorityScore" to priorityScore,
            "status" to "AMBULANCE_REQUESTED",
            "timestamp" to Timestamp.now()
        )

        try {
            firestore?.collection("ambulance_requests")?.document(reqId)?.set(payload)?.await()
        } catch (e: Exception) {
            e.printStackTrace()
        }

        return reqId
    }

    fun observeAmbulanceRequest(keyId: String): Flow<AmbulanceRequest?> = callbackFlow {
        val localReq = _ambulanceRequestState.value[keyId] ?: _ambulanceRequestState.value["GLOBAL_LATEST"]
        trySend(localReq)

        val fs = firestore
        if (fs == null) {
            close()
            return@callbackFlow
        }

        val listener = fs.collection("ambulance_requests")
            .orderBy("timestamp", Query.Direction.DESCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    trySend(_ambulanceRequestState.value[keyId] ?: _ambulanceRequestState.value["GLOBAL_LATEST"])
                    return@addSnapshotListener
                }
                val doc = snapshot?.documents?.firstOrNull { d ->
                    d.getString("triageRecordId") == keyId || d.getString("patientId") == keyId
                } ?: snapshot?.documents?.firstOrNull()

                if (doc != null) {
                    val req = AmbulanceRequest(
                        requestId = doc.id,
                        triageRecordId = doc.getString("triageRecordId") ?: "",
                        patientId = doc.getString("patientId") ?: "",
                        patientName = doc.getString("patientName") ?: "Unknown Patient",
                        hospitalName = doc.getString("hospitalName") ?: "District Hospital",
                        symptoms = doc.getString("symptoms") ?: "",
                        riskBand = doc.getString("riskBand") ?: "RED",
                        priorityScore = getIntValue(doc, "priorityScore", 90),
                        status = doc.getString("status") ?: "AMBULANCE_REQUESTED",
                        timestamp = getLongValue(doc, "timestamp")
                    )
                    val currentMap = _ambulanceRequestState.value.toMutableMap()
                    currentMap[keyId] = req
                    if (req.triageRecordId.isNotBlank()) currentMap[req.triageRecordId] = req
                    if (req.patientId.isNotBlank()) currentMap[req.patientId] = req
                    currentMap["GLOBAL_LATEST"] = req
                    _ambulanceRequestState.value = currentMap
                    trySend(req)
                } else {
                    trySend(_ambulanceRequestState.value[keyId] ?: _ambulanceRequestState.value["GLOBAL_LATEST"])
                }
            }

        awaitClose { listener.remove() }
    }

    suspend fun approveAmbulanceRequest(keyId: String) {
        val currentReq = _ambulanceRequestState.value[keyId] ?: _ambulanceRequestState.value["GLOBAL_LATEST"]
        val reqId = currentReq?.requestId?.takeIf { it.isNotBlank() } ?: "AMB-${System.currentTimeMillis().toString().takeLast(6)}"

        val updatedReq = (currentReq ?: AmbulanceRequest(requestId = reqId, triageRecordId = keyId, status = "AMBULANCE_REQUESTED")).copy(
            status = "AMBULANCE_ON_THE_WAY"
        )

        val currentMap = _ambulanceRequestState.value.toMutableMap()
        currentMap[keyId] = updatedReq
        if (updatedReq.triageRecordId.isNotBlank()) currentMap[updatedReq.triageRecordId] = updatedReq
        if (updatedReq.patientId.isNotBlank()) currentMap[updatedReq.patientId] = updatedReq
        currentMap["GLOBAL_LATEST"] = updatedReq
        _ambulanceRequestState.value = currentMap

        try {
            firestore?.collection("ambulance_requests")
                ?.document(reqId)
                ?.update(mapOf("status" to "AMBULANCE_ON_THE_WAY", "approvedAt" to Timestamp.now()))
                ?.await()
        } catch (ignored: Exception) {
            try {
                firestore?.collection("ambulance_requests")
                    ?.document(reqId)
                    ?.set(
                        mapOf(
                            "requestId" to reqId,
                            "triageRecordId" to keyId,
                            "status" to "AMBULANCE_ON_THE_WAY",
                            "approvedAt" to Timestamp.now()
                        )
                    )
                    ?.await()
            } catch (ignored2: Exception) {}
        }
    }

    suspend fun sendTeleconsultRequest(triageRecord: TriageRecord, patient: Patient?): String {
        val requestId = "REQ-${System.currentTimeMillis().toString().takeLast(6)}"
        val request = TeleconsultRequest(
            id = requestId,
            triageRecordId = triageRecord.id,
            patientId = triageRecord.patientId,
            patientName = patient?.name ?: "Unknown Patient",
            priorityScore = triageRecord.priorityScore,
            riskBand = triageRecord.riskBand,
            primarySpecialty = triageRecord.primarySpecialty,
            status = "PENDING_DOCTOR_APPROVAL",
            assignedDoctorId = "DOC-PHC-0001",
            assignedDoctorName = "Dr. Aravind Kumar"
        )

        val updatedMap = _teleconsultState.value.toMutableMap()
        updatedMap[triageRecord.id] = request
        _teleconsultState.value = updatedMap

        syncTriageCaseToCloud(triageRecord, patient)
        if (patient != null) {
            syncPatientToCloud(patient)
        }

        val teleconsultPayload = mapOf(
            "id" to requestId,
            "triageRecordId" to triageRecord.id,
            "patientId" to triageRecord.patientId,
            "patientName" to (patient?.name ?: "Unknown Patient"),
            "priorityScore" to triageRecord.priorityScore,
            "riskBand" to triageRecord.riskBand,
            "primarySpecialty" to triageRecord.primarySpecialty,
            "status" to "PENDING_DOCTOR_APPROVAL",
            "assignedDoctorId" to "DOC-PHC-0001",
            "assignedDoctorName" to "Dr. Aravind Kumar",
            "timestamp" to Timestamp.now()
        )
        try {
            firestore?.collection("teleconsult_requests")?.document(requestId)?.set(teleconsultPayload)?.await()
        } catch (e: Exception) {
            e.printStackTrace()
        }

        delay(3000)
        val approvedRequest = request.copy(
            status = "APPROVED_CONNECTED",
            assignedDoctorId = "DOC-PHC-0001",
            assignedDoctorName = "Dr. Aravind Kumar"
        )
        updatedMap[triageRecord.id] = approvedRequest
        _teleconsultState.value = updatedMap

        try {
            firestore?.collection("teleconsult_requests")?.document(requestId)?.update(
                mapOf(
                    "status" to "APPROVED_CONNECTED",
                    "assignedDoctorId" to "DOC-PHC-0001",
                    "assignedDoctorName" to "Dr. Aravind Kumar"
                )
            )?.await()
        } catch (e: Exception) {
            e.printStackTrace()
        }

        return requestId
    }

    suspend fun sendSosEmergencyDispatch(
        patientId: String,
        patientName: String,
        riskBand: String,
        priorityScore: Int,
        emergencyType: String = "MATERNAL_COLLAPSE",
        contactPhone: String = "+91 98230 11234",
        ashaId: String = "ASHA-MH-7892",
        ashaName: String = "Sunita Tai"
    ): Boolean {
        val location = locationRepository.currentLocation.value
        val alertId = "SOS-${System.currentTimeMillis()}"
        val payload = mapOf(
            "alertId" to alertId,
            "ashaId" to ashaId,
            "ashaName" to ashaName,
            "region" to location.regionName,
            "latitude" to location.latitude,
            "longitude" to location.longitude,
            "patientId" to patientId,
            "patientName" to patientName,
            "emergencyType" to emergencyType,
            "riskBand" to riskBand,
            "priorityScore" to priorityScore,
            "status" to "ACTIVE_DISPATCH",
            "contactPhone" to contactPhone,
            "timestamp" to Timestamp.now()
        )
        try {
            firestore?.collection("sos_alerts")?.document(alertId)?.set(payload)?.await()
        } catch (ignored: Exception) {}
        return true
    }

    suspend fun syncTelemetry(
        ashaId: String = "ASHA-MH-7892",
        ashaName: String = "Sunita Tai",
        pendingSyncQueueSize: Int? = null
    ) {
        val location = locationRepository.currentLocation.value
        val batteryLevel = getBatteryLevel()
        val networkState = networkMonitor.getNetworkState()
        val queueSize = pendingSyncQueueSize ?: try { syncQueueDao.getPendingCount() } catch (e: Exception) { 0 }

        val payload = mapOf(
            "ashaId" to ashaId,
            "ashaName" to ashaName,
            "latitude" to location.latitude,
            "longitude" to location.longitude,
            "batteryLevel" to batteryLevel,
            "networkState" to networkState,
            "pendingSyncQueueSize" to queueSize,
            "lastUpdated" to Timestamp.now()
        )
        try {
            firestore?.collection("frontline_workers")?.document(ashaId)?.set(payload)?.await()
        } catch (ignored: Exception) {}
    }

    suspend fun uploadImageToStorage(caseId: String, imageUri: Uri): String? {
        return try {
            val storageRef = FirebaseStorage.getInstance().reference
                .child("chat_images/${caseId}/${System.currentTimeMillis()}.jpg")
            storageRef.putFile(imageUri).await()
            storageRef.downloadUrl.await().toString()
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    fun sendMessage(caseId: String = "PAT-101", text: String, imageUri: String? = null, senderName: String = "Sunita Tai") {
        val msg = ChatMessage(
            id = "MSG-${System.currentTimeMillis()}",
            senderType = "ASHA",
            senderName = senderName,
            text = text,
            imageUri = imageUri,
            timestamp = System.currentTimeMillis()
        )
        val currentList = _chatMessages.value.toMutableList()
        currentList.add(msg)
        _chatMessages.value = currentList

        try {
            firestore?.collection("triage_cases")
                ?.document(caseId)
                ?.collection("stream")
                ?.add(
                    mapOf(
                        "senderType" to "ASHA",
                        "senderName" to senderName,
                        "text" to text,
                        "imageUri" to imageUri,
                        "timestamp" to System.currentTimeMillis()
                    )
                )
        } catch (ignored: Exception) {}
    }

    fun observeChatMessages(caseId: String): Flow<List<ChatMessage>> = callbackFlow {
        val fs = firestore
        if (fs == null) {
            trySend(_chatMessages.value)
            close()
            return@callbackFlow
        }

        val listener = fs.collection("triage_cases")
            .document(caseId)
            .collection("stream")
            .orderBy("timestamp", Query.Direction.ASCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    trySend(_chatMessages.value)
                    return@addSnapshotListener
                }
                val messages = snapshot?.documents?.mapNotNull { doc ->
                    ChatMessage(
                        id = doc.id,
                        senderType = doc.getString("senderType") ?: "ASHA",
                        senderName = doc.getString("senderName") ?: "",
                        text = doc.getString("text") ?: "",
                        imageUri = doc.getString("imageUri"),
                        timestamp = getLongValue(doc, "timestamp")
                    )
                } ?: emptyList()
                if (messages.isNotEmpty()) {
                    trySend(messages)
                } else {
                    trySend(_chatMessages.value)
                }
            }
        awaitClose { listener.remove() }
    }

    suspend fun deleteTriageCaseFromCloud(caseId: String) {
        val fs = firestore ?: return
        try {
            val streamDocs = fs.collection("triage_cases")
                .document(caseId)
                .collection("stream")
                .get()
                .await()
            for (doc in streamDocs.documents) {
                try {
                    doc.reference.delete().await()
                } catch (ignored: Exception) {}
            }
        } catch (ignored: Exception) {}

        try {
            fs.collection("triage_cases").document(caseId).delete().await()
        } catch (ignored: Exception) {}
    }

    private fun getBatteryLevel(): Int {
        val batteryStatus: Intent? = IntentFilter(Intent.ACTION_BATTERY_CHANGED).let { filter ->
            context.registerReceiver(null, filter)
        }
        val level: Int = batteryStatus?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale: Int = batteryStatus?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
        return if (level >= 0 && scale > 0) (level * 100 / scale.toFloat()).toInt() else 85
    }

    private fun getLongValue(doc: com.google.firebase.firestore.DocumentSnapshot, field: String): Long {
        return try {
            doc.getTimestamp(field)?.toDate()?.time
                ?: doc.getLong(field)
                ?: (doc.get(field) as? Number)?.toLong()
                ?: doc.getString(field)?.toLongOrNull()
                ?: System.currentTimeMillis()
        } catch (e: Exception) {
            System.currentTimeMillis()
        }
    }

    private fun getIntValue(doc: com.google.firebase.firestore.DocumentSnapshot, field: String, default: Int = 0): Int {
        return try {
            doc.getLong(field)?.toInt()
                ?: (doc.get(field) as? Number)?.toInt()
                ?: doc.getString(field)?.toIntOrNull()
                ?: default
        } catch (e: Exception) {
            default
        }
    }
}
