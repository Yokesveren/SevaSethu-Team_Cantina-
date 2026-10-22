package com.byteclub.ashasetu.ui.records

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.MedicalServices
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
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
import com.byteclub.ashasetu.data.local.entity.TriageRecord
import com.byteclub.ashasetu.data.repository.CloudSyncService
import com.byteclub.ashasetu.data.repository.TriageRepository
import com.byteclub.ashasetu.domain.triage.RiskBand
import com.byteclub.ashasetu.ui.components.BottomNavBar
import com.byteclub.ashasetu.ui.components.BottomNavTab
import com.byteclub.ashasetu.ui.components.RiskBadge
import com.byteclub.ashasetu.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RecordsScreen(
    triageRepository: TriageRepository,
    cloudSyncService: CloudSyncService? = null,
    onNavigateToRecordDetail: (String) -> Unit,
    onTabSelected: (BottomNavTab) -> Unit,
    modifier: Modifier = Modifier
) {
    val records by triageRepository.getAllTriageRecords().collectAsState(initial = emptyList())
    var recordToDelete by remember { mutableStateOf<TriageRecord?>(null) }
    val scope = rememberCoroutineScope()

    if (recordToDelete != null) {
        AlertDialog(
            onDismissRequest = { recordToDelete = null },
            title = { Text("Delete Triage Case Record", fontWeight = FontWeight.Bold, color = TextPrimary) },
            text = { Text("Are you sure you want to delete case #${recordToDelete?.id}? This action will remove the record locally and from the PHC cloud.", fontSize = 13.sp) },
            confirmButton = {
                TextButton(
                    onClick = {
                        val record = recordToDelete
                        recordToDelete = null
                        if (record != null) {
                            scope.launch {
                                triageRepository.deleteTriageRecord(record.id)
                            }
                        }
                    }
                ) {
                    Text("DELETE", fontWeight = FontWeight.Bold, color = RedUrgent)
                }
            },
            dismissButton = {
                TextButton(onClick = { recordToDelete = null }) {
                    Text("CANCEL", color = TextSecondary)
                }
            }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Triage & Care Records", fontWeight = FontWeight.Bold, color = CardWhite) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = NavyPrimary)
            )
        },
        bottomBar = {
            BottomNavBar(currentRoute = "records", onTabSelected = onTabSelected)
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(OffWhiteBg)
                .padding(16.dp)
        ) {
            item {
                Text(
                    text = "Historical Encounters (${records.size})",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Spacer(modifier = Modifier.height(10.dp))
            }

            if (records.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 40.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "No triage records available.",
                            fontSize = 13.sp,
                            color = TextMuted
                        )
                    }
                }
            } else {
                items(records) { record ->
                    val caseStatus by (cloudSyncService?.observeCaseStatus(record.id, record.riskBand)
                        ?: remember { kotlinx.coroutines.flow.flowOf(if (record.riskBand.equals("RED", ignoreCase = true)) "DOCTOR_ASSIGNED" else "WAITING_FOR_APPROVAL") })
                        .collectAsState(initial = if (record.riskBand.equals("RED", ignoreCase = true)) "DOCTOR_ASSIGNED" else "WAITING_FOR_APPROVAL")

                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onNavigateToRecordDetail(record.id) },
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = CardWhite)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
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

                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(6.dp))
                                            .background(NavyPrimary)
                                            .padding(horizontal = 8.dp, vertical = 2.dp)
                                    ) {
                                        Text(
                                            text = "Score: ${record.priorityScore}/100",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = CardWhite
                                        )
                                    }

                                    IconButton(
                                        onClick = { recordToDelete = record }
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Delete,
                                            contentDescription = "Delete Record",
                                            tint = RedUrgent
                                        )
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(4.dp))

                            Text(
                                text = "Record #${record.id}",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp,
                                color = NavyPrimary
                            )

                            Spacer(modifier = Modifier.height(2.dp))

                            Text(
                                text = "Specialty: ${record.primarySpecialty}",
                                fontSize = 12.sp,
                                color = TextPrimary,
                                fontWeight = FontWeight.SemiBold
                            )

                            Spacer(modifier = Modifier.height(2.dp))

                            Text(
                                text = "Symptoms: ${record.symptomsCsv}",
                                fontSize = 12.sp,
                                color = TextSecondary
                            )

                            Spacer(modifier = Modifier.height(10.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "TAP FOR TELECONSULT & DETAILS >",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = OrangeAccent
                                )

                                // Small status badge inside bottom right (red circle area)
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(
                                            when (caseStatus) {
                                                "CASE_ACKNOWLEDGED" -> GreenSyncedBg
                                                "DOCTOR_ASSIGNED" -> androidx.compose.ui.graphics.Color(0xFFEBF3FB)
                                                else -> YellowModerateBg
                                            }
                                        )
                                        .padding(horizontal = 8.dp, vertical = 4.dp)
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = when (caseStatus) {
                                                "CASE_ACKNOWLEDGED" -> Icons.Default.CheckCircle
                                                "DOCTOR_ASSIGNED" -> Icons.Default.MedicalServices
                                                else -> Icons.Default.Schedule
                                            },
                                            contentDescription = null,
                                            tint = when (caseStatus) {
                                                "CASE_ACKNOWLEDGED" -> GreenSynced
                                                "DOCTOR_ASSIGNED" -> NavyPrimary
                                                else -> YellowModerate
                                            },
                                            modifier = Modifier.size(12.dp)
                                        )
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(
                                            text = when (caseStatus) {
                                                "CASE_ACKNOWLEDGED" -> "Case acknowledged"
                                                "DOCTOR_ASSIGNED" -> "Doctor assigned"
                                                else -> "Waiting for approval"
                                            },
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = when (caseStatus) {
                                                "CASE_ACKNOWLEDGED" -> GreenSynced
                                                "DOCTOR_ASSIGNED" -> NavyPrimary
                                                else -> YellowModerate
                                            }
                                        )
                                    }
                                }
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                }
            }
        }
    }
}
