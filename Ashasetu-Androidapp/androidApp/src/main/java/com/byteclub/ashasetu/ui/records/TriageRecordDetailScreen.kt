package com.byteclub.ashasetu.ui.records

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.LocalHospital
import androidx.compose.material.icons.filled.MedicalServices
import androidx.compose.material.icons.filled.PersonSearch
import androidx.compose.material.icons.filled.PhoneInTalk
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.byteclub.ashasetu.data.repository.CloudSyncService
import com.byteclub.ashasetu.data.repository.PatientRepository
import com.byteclub.ashasetu.data.repository.TriageRepository
import com.byteclub.ashasetu.domain.triage.RiskBand
import com.byteclub.ashasetu.ui.components.RiskBadge
import com.byteclub.ashasetu.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TriageRecordDetailScreen(
    recordId: String,
    triageRepository: TriageRepository,
    patientRepository: PatientRepository,
    cloudSyncService: CloudSyncService,
    onNavigateBack: () -> Unit,
    onNavigateToDoctorChat: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val records by triageRepository.getAllTriageRecords().collectAsState(initial = emptyList())
    val record = records.firstOrNull { it.id == recordId }
    val patients by patientRepository.getAllPatients().collectAsState(initial = emptyList())
    val patient = patients.firstOrNull { it.id == record?.patientId }

    val adminApprovalStatus by (record?.let { rec ->
        cloudSyncService.observeAdminApproval(rec.id, rec.riskBand, patient?.name ?: "")
    } ?: remember { kotlinx.coroutines.flow.flowOf("PENDING") }).collectAsState(initial = if (record?.riskBand.equals("RED", ignoreCase = true)) "APPROVED" else "PENDING")

    val caseStatus by (record?.let { rec ->
        cloudSyncService.observeCaseStatus(rec.id, rec.riskBand)
    } ?: remember { kotlinx.coroutines.flow.flowOf(if (record?.riskBand.equals("RED", ignoreCase = true)) "DOCTOR_ASSIGNED" else "WAITING_FOR_APPROVAL") }).collectAsState(initial = if (record?.riskBand.equals("RED", ignoreCase = true)) "DOCTOR_ASSIGNED" else "WAITING_FOR_APPROVAL")

    val observedTeleconsult by (record?.let { rec ->
        cloudSyncService.observeTeleconsultRequest(rec.id)
    } ?: remember { kotlinx.coroutines.flow.flowOf(null) }).collectAsState(initial = null)

    val teleconsultRequests by cloudSyncService.teleconsultState.collectAsState()
    val teleconsultStatus = observedTeleconsult ?: recordId.let { teleconsultRequests[it] }

    val ambulanceReq by (record?.let { rec ->
        cloudSyncService.observeAmbulanceRequest(rec.id)
    } ?: cloudSyncService.observeAmbulanceRequest(patient?.id ?: "PAT-101")).collectAsState(initial = null)

    var hasShownAmbulanceApprovedPopup by remember { mutableStateOf(false) }

    if (ambulanceReq?.status == "AMBULANCE_ON_THE_WAY" && !hasShownAmbulanceApprovedPopup) {
        AlertDialog(
            onDismissRequest = { hasShownAmbulanceApprovedPopup = true },
            icon = {
                Icon(
                    imageVector = Icons.Default.PhoneInTalk,
                    contentDescription = null,
                    tint = GreenSynced,
                    modifier = Modifier.size(48.dp)
                )
            },
            title = {
                Text(
                    text = "Ambulance Approved!",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = GreenSynced
                )
            },
            text = {
                Column {
                    Text(
                        text = "108 Ambulance dispatch approved by Admin via Cloud (`ambulance_requests`).",
                        fontSize = 13.sp,
                        color = TextPrimary
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text("• Patient: ${ambulanceReq?.patientName ?: patient?.name ?: "Sunita Devi"}", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                    Text("• Destination: ${ambulanceReq?.hospitalName ?: "Palghar District Hospital"}", fontSize = 12.sp, color = TextSecondary)
                    Text("• Status: 108 Ambulance is on the way to patient location", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = GreenSynced)
                }
            },
            confirmButton = {
                TextButton(onClick = { hasShownAmbulanceApprovedPopup = true }) {
                    Text("OK", fontWeight = FontWeight.Bold, color = NavyPrimary)
                }
            }
        )
    }

    var showDeleteDialog by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    if (showDeleteDialog && record != null) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Delete Record #${record.id}", fontWeight = FontWeight.Bold, color = TextPrimary) },
            text = { Text("Are you sure you want to delete this triage record? It will be removed locally and from the PHC cloud.", fontSize = 13.sp) },
            confirmButton = {
                TextButton(
                    onClick = {
                        showDeleteDialog = false
                        scope.launch {
                            triageRepository.deleteTriageRecord(record.id)
                            onNavigateBack()
                        }
                    }
                ) {
                    Text("DELETE RECORD", fontWeight = FontWeight.Bold, color = RedUrgent)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) {
                    Text("CANCEL", color = TextSecondary)
                }
            }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Triage Encounter Details", fontWeight = FontWeight.Bold, color = CardWhite) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = null, tint = CardWhite)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = NavyPrimary)
            )
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(OffWhiteBg)
                .padding(16.dp)
        ) {
            if (record != null) {
                // Header Risk & Priority Score
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = when (record.riskBand) {
                                "RED" -> RedUrgentBg
                                "YELLOW" -> YellowModerateBg
                                else -> GreenLowBg
                            }
                        )
                    ) {
                        Column(modifier = Modifier.padding(18.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                RiskBadge(
                                    riskBand = when (record.riskBand) {
                                        "RED" -> RiskBand.RED
                                        "YELLOW" -> RiskBand.YELLOW
                                        else -> RiskBand.GREEN
                                    }
                                )

                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(NavyPrimary)
                                        .padding(horizontal = 10.dp, vertical = 4.dp)
                                ) {
                                    Text(
                                        text = "Priority Score: ${record.priorityScore}/100",
                                        color = CardWhite,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(12.dp))

                            Text(
                                text = "Encounter ID: ${record.id}",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = TextSecondary
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Specialty Required: ${record.primarySpecialty}",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                        }
                    }
                }

                item { Spacer(modifier = Modifier.height(16.dp)) }

                // Patient Info Card
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = CardWhite)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("Patient Demographics", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = NavyPrimary)
                            Spacer(modifier = Modifier.height(6.dp))
                            Text("Name: ${patient?.name ?: "N/A"}", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                            Text("Age / Gender: ${patient?.age ?: "N/A"} yrs • ${patient?.gender ?: "N/A"}", fontSize = 12.sp, color = TextSecondary)
                            Text("ABHA ID: ${patient?.abhaId ?: "N/A"}", fontSize = 12.sp, color = TextMuted)
                            Text("Village: ${patient?.village ?: "N/A"}", fontSize = 12.sp, color = TextSecondary)
                        }
                    }
                }

                item { Spacer(modifier = Modifier.height(16.dp)) }

                // Clinical Vitals & Symptoms
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = CardWhite)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("Recorded Vitals & Symptoms", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = NavyPrimary)
                            Spacer(modifier = Modifier.height(8.dp))

                            Text("• Detected Conditions: ${record.symptomsCsv}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                            Spacer(modifier = Modifier.height(6.dp))

                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Sys/Dia BP: ${record.bpSystolic ?: "--"}/${record.bpDiastolic ?: "--"} mmHg", fontSize = 12.sp, color = TextSecondary)
                                Text("SpO2: ${record.spo2Percent ?: "--"}%", fontSize = 12.sp, color = TextSecondary)
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Pulse Rate: ${record.heartRateBpm ?: "--"} bpm", fontSize = 12.sp, color = TextSecondary)
                                Text("Hemoglobin: ${record.hemoglobin ?: "--"} g/dL", fontSize = 12.sp, color = TextSecondary)
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            Text("AI Clinical Summary:", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = TextPrimary)
                            Text(record.aiSummary, fontSize = 12.sp, color = TextSecondary)

                            Spacer(modifier = Modifier.height(8.dp))

                            Text("Action Plan:", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = TextPrimary)
                            Text(record.actionAdvice, fontSize = 12.sp, color = NavyPrimary, fontWeight = FontWeight.Medium)
                        }
                    }
                }

                item { Spacer(modifier = Modifier.height(16.dp)) }

                // Admin Cloud Approval & Doctor Resolution Status Card
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = when (caseStatus) {
                                "CASE_ACKNOWLEDGED" -> GreenLowBg
                                "DOCTOR_ASSIGNED" -> androidx.compose.ui.graphics.Color(0xFFEBF3FB)
                                else -> YellowModerateBg
                            }
                        )
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Admin & Doctor Case Status",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = NavyPrimary
                                )
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(NavyPrimary)
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text(
                                        text = "Cloud: triage_cases",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = CardWhite
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            when (caseStatus) {
                                "CASE_ACKNOWLEDGED" -> {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = GreenSynced, modifier = Modifier.size(24.dp))
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Column {
                                            Text("Case acknowledged", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = GreenSynced)
                                            Text("Doctor has reviewed, attended, and marked this case as resolved on the Doctor Dashboard via Cloud.", fontSize = 11.sp, color = TextSecondary)
                                        }
                                    }
                                }
                                "DOCTOR_ASSIGNED" -> {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.MedicalServices, contentDescription = null, tint = NavyPrimary, modifier = Modifier.size(24.dp))
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Column {
                                            Text("Doctor assigned", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = NavyPrimary)
                                            Text("Case approved by Admin and assigned to PHC Doctor on the Dashboard.", fontSize = 11.sp, color = TextSecondary)
                                        }
                                    }
                                }
                                else -> { // WAITING_FOR_APPROVAL
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.Schedule, contentDescription = null, tint = YellowModerate, modifier = Modifier.size(24.dp))
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Column {
                                            Text("Waiting for approval", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = YellowModerate)
                                            Text("Incoming triage request sent to Admin Dashboard via Cloud (`admin_approvals`). Awaiting Admin acceptance.", fontSize = 11.sp, color = TextSecondary)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                item { Spacer(modifier = Modifier.height(16.dp)) }

                // 108 Ambulance Dispatch Status Card (Firestore: ambulance_requests)
                if (ambulanceReq != null) {
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = if (ambulanceReq?.status == "AMBULANCE_ON_THE_WAY") GreenSyncedBg else RedUrgentBg
                            )
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = if (ambulanceReq?.status == "AMBULANCE_ON_THE_WAY") Icons.Default.CheckCircle else Icons.Default.PhoneInTalk,
                                            contentDescription = null,
                                            tint = if (ambulanceReq?.status == "AMBULANCE_ON_THE_WAY") GreenSynced else RedUrgent,
                                            modifier = Modifier.size(24.dp)
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text(
                                            text = if (ambulanceReq?.status == "AMBULANCE_ON_THE_WAY") "Ambulance on the way" else "Ambulance requested",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 15.sp,
                                            color = if (ambulanceReq?.status == "AMBULANCE_ON_THE_WAY") GreenSynced else RedUrgent
                                        )
                                    }

                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(6.dp))
                                            .background(NavyPrimary)
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    ) {
                                        Text(
                                            text = "Cloud: ambulance_requests",
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = CardWhite
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(8.dp))

                                Text(
                                    text = if (ambulanceReq?.status == "AMBULANCE_ON_THE_WAY")
                                        "108 Ambulance dispatch approved by Admin via Cloud (`ambulance_requests`). Vehicle is on the way to patient location."
                                    else
                                        "Incoming 108 ambulance dispatch request sent to Admin Dashboard via Cloud (`ambulance_requests`). Awaiting Admin approval.",
                                    fontSize = 12.sp,
                                    color = TextPrimary
                                )
                            }
                        }
                    }

                    item { Spacer(modifier = Modifier.height(16.dp)) }
                }

                // Tele-consultation Action Box (Requirement 2)
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (teleconsultStatus?.status == "APPROVED_CONNECTED") GreenSyncedBg else OrangeLight
                        )
                    ) {
                        Column(
                            modifier = Modifier.padding(18.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            if (teleconsultStatus == null) {
                                Icon(Icons.Default.PersonSearch, contentDescription = null, tint = OrangeAccent, modifier = Modifier.size(40.dp))
                                Spacer(modifier = Modifier.height(8.dp))
                                Text("PHC Medical Tele-Consultation", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = TextPrimary)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text("Send triage payload to Doctor Dashboard via Cloud (`teleconsult_requests`). Request will be assigned to Dr. Aravind Kumar (DOC-PHC-0001). Doctor approval required before chat opens.", fontSize = 12.sp, color = TextSecondary, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                                Spacer(modifier = Modifier.height(14.dp))

                                Button(
                                    onClick = {
                                        scope.launch {
                                            cloudSyncService.sendTeleconsultRequest(record, patient)
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = NavyPrimary),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.fillMaxWidth().height(48.dp)
                                ) {
                                    Icon(Icons.Default.MedicalServices, contentDescription = null)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("PHC MEDICAL TELE-CONSULTATION", fontWeight = FontWeight.Bold)
                                }
                            } else if (teleconsultStatus.status == "PENDING_DOCTOR_APPROVAL") {
                                CircularProgressIndicator(color = NavyPrimary, modifier = Modifier.size(36.dp))
                                Spacer(modifier = Modifier.height(10.dp))
                                Text("Connecting to Doctor Dashboard via Cloud...", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = NavyPrimary)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text("Request sent to Dr. Aravind Kumar (ID: DOC-PHC-0001). Buffering until Doctor approval is granted...", fontSize = 12.sp, color = TextSecondary, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                            } else {
                                Icon(Icons.Default.CheckCircle, contentDescription = null, tint = GreenSynced, modifier = Modifier.size(40.dp))
                                Spacer(modifier = Modifier.height(8.dp))
                                Text("Doctor connected", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = GreenSynced)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text("${teleconsultStatus.assignedDoctorName} (ID: ${teleconsultStatus.assignedDoctorId})", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = TextPrimary)
                                Text("Specialty: General Medicine & Trauma Emergency", fontSize = 11.sp, color = TextSecondary)
                                Spacer(modifier = Modifier.height(12.dp))

                                Button(
                                    onClick = { onNavigateToDoctorChat(record.id) },
                                    colors = ButtonDefaults.buttonColors(containerColor = GreenSynced),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.fillMaxWidth().height(48.dp)
                                ) {
                                    Icon(Icons.Default.Chat, contentDescription = null)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("OPEN DOCTOR CHATBOX", fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }

                item { Spacer(modifier = Modifier.height(16.dp)) }

                item {
                    Button(
                        onClick = { showDeleteDialog = true },
                        colors = ButtonDefaults.buttonColors(containerColor = RedUrgent),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth().height(48.dp)
                    ) {
                        Icon(Icons.Default.Delete, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("DELETE CASE RECORD", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
