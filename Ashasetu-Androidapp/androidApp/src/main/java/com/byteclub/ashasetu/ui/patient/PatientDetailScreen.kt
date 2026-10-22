package com.byteclub.ashasetu.ui.patient

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.DeleteForever
import androidx.compose.material.icons.filled.PersonOff
import androidx.compose.material.icons.filled.ReportProblem
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.clickable
import com.byteclub.ashasetu.data.repository.PatientRepository
import com.byteclub.ashasetu.data.repository.TriageRepository
import com.byteclub.ashasetu.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PatientDetailScreen(
    patientId: String,
    patientRepository: PatientRepository,
    triageRepository: TriageRepository,
    onNavigateBack: () -> Unit,
    onNavigateToTriage: () -> Unit,
    onNavigateToRecordDetail: ((String) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val patients by patientRepository.getAllPatients().collectAsState(initial = emptyList())
    val patient = patients.firstOrNull { it.id == patientId }
    val triageRecords by triageRepository.getRecordsForPatient(patientId).collectAsState(initial = emptyList())

    val scope = rememberCoroutineScope()

    var showMishapDialog by remember { mutableStateOf(false) }
    var mishapNotesInput by remember { mutableStateOf("") }

    var showUnattendedDialog by remember { mutableStateOf(false) }
    var unattendedReasonInput by remember { mutableStateOf("") }

    var showDeleteRequestDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(patient?.name ?: "Patient Details", fontWeight = FontWeight.Bold, color = CardWhite) },
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
            if (patient != null) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = CardWhite)
                    ) {
                        Column(modifier = Modifier.padding(18.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(text = patient.name, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                                if (patient.status != "ACTIVE") {
                                    Text(
                                        text = patient.status,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = RedUrgent
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(text = "ABHA ID: ${patient.abhaId}", fontSize = 13.sp, color = NavyPrimary, fontWeight = FontWeight.SemiBold)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(text = "Age: ${patient.age} yrs • Gender: ${patient.gender}", fontSize = 13.sp, color = TextSecondary)
                            Text(text = "Village: ${patient.village} • Mobile: ${patient.phone}", fontSize = 13.sp, color = TextSecondary)
                            if (patient.isPregnant) {
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(text = "Maternal Status: Pregnant (Trimester ${patient.trimester ?: 1})", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = OrangeAccent)
                            }
                        }
                    }
                }

                item { Spacer(modifier = Modifier.height(16.dp)) }

                item {
                    Button(
                        onClick = onNavigateToTriage,
                        colors = ButtonDefaults.buttonColors(containerColor = NavyPrimary),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp)
                    ) {
                        Text("START NEW VOICE TRIAGE", fontWeight = FontWeight.Bold)
                    }
                }

                item { Spacer(modifier = Modifier.height(16.dp)) }

                // Patient Management & Reporting Actions Box
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = CardWhite)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("Reporting & Status Actions", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = NavyPrimary)
                            Spacer(modifier = Modifier.height(10.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                OutlinedButton(
                                    onClick = { showMishapDialog = true },
                                    modifier = Modifier.weight(1f),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Icon(Icons.Default.ReportProblem, contentDescription = null, tint = RedUrgent, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Report Mishap", fontSize = 11.sp, color = RedUrgent, fontWeight = FontWeight.Bold)
                                }

                                OutlinedButton(
                                    onClick = { showUnattendedDialog = true },
                                    modifier = Modifier.weight(1f),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Icon(Icons.Default.PersonOff, contentDescription = null, tint = YellowModerate, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Mark Unattended", fontSize = 11.sp, color = TextPrimary, fontWeight = FontWeight.Bold)
                                }
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            OutlinedButton(
                                onClick = { showDeleteRequestDialog = true },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Icon(Icons.Default.DeleteForever, contentDescription = null, tint = RedUrgent, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("No Patient Found (Request ID Deletion)", fontSize = 11.sp, color = RedUrgent, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }

                item { Spacer(modifier = Modifier.height(20.dp)) }

                item {
                    Text(
                        text = "Triage Medical History (${triageRecords.size})",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                }

                items(triageRecords) { record ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onNavigateToRecordDetail?.invoke(record.id) },
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = CardWhite)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Risk: ${record.riskBand} (${record.priorityScore}/100)",
                                    fontWeight = FontWeight.Bold,
                                    color = if (record.riskBand == "RED") RedUrgent else GreenLow
                                )
                                Spacer(modifier = Modifier.width(12.dp))
                                Text(text = "Specialty: ${record.primarySpecialty}", fontSize = 12.sp, color = TextSecondary)
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(text = "Symptoms: ${record.symptomsCsv}", fontSize = 12.sp, color = TextPrimary)
                            Text(text = record.aiSummary, fontSize = 11.sp, color = TextMuted)
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                }
            }
        }

        // Dialogs for reporting actions
        if (showMishapDialog) {
            AlertDialog(
                onDismissRequest = { showMishapDialog = false },
                title = { Text("Report Patient Mishap", fontWeight = FontWeight.Bold) },
                text = {
                    Column {
                        Text("Describe the mishap or critical incident to notify PHC Cloud:", fontSize = 12.sp)
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = mishapNotesInput,
                            onValueChange = { mishapNotesInput = it },
                            placeholder = { Text("Enter mishap details...") },
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            scope.launch {
                                patientRepository.reportMishap(patientId, mishapNotesInput)
                                showMishapDialog = false
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = RedUrgent)
                    ) {
                        Text("SUBMIT MISHAP REPORT")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showMishapDialog = false }) { Text("Cancel") }
                }
            )
        }

        if (showUnattendedDialog) {
            AlertDialog(
                onDismissRequest = { showUnattendedDialog = false },
                title = { Text("Mark Patient Unattended", fontWeight = FontWeight.Bold) },
                text = {
                    Column {
                        Text("Reason for marking patient unattended:", fontSize = 12.sp)
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = unattendedReasonInput,
                            onValueChange = { unattendedReasonInput = it },
                            placeholder = { Text("e.g. Patient away from home / migrated") },
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            scope.launch {
                                patientRepository.markUnattended(patientId, unattendedReasonInput)
                                showUnattendedDialog = false
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = NavyPrimary)
                    ) {
                        Text("MARK UNATTENDED")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showUnattendedDialog = false }) { Text("Cancel") }
                }
            )
        }

        if (showDeleteRequestDialog) {
            AlertDialog(
                onDismissRequest = { showDeleteRequestDialog = false },
                title = { Text("Request Patient Deletion", fontWeight = FontWeight.Bold) },
                text = {
                    Text("Are you sure? Patient is not found at address. A deletion request will be submitted to the PHC Dashboard.", fontSize = 13.sp)
                },
                confirmButton = {
                    Button(
                        onClick = {
                            scope.launch {
                                patientRepository.requestNoPatientFoundDeletion(patientId)
                                showDeleteRequestDialog = false
                                onNavigateBack()
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = RedUrgent)
                    ) {
                        Text("REQUEST DELETION")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showDeleteRequestDialog = false }) { Text("Cancel") }
                }
            )
        }
    }
}
