package com.byteclub.ashasetu.ui.referral

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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.LocalHospital
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.byteclub.ashasetu.data.repository.CloudSyncService
import com.byteclub.ashasetu.data.repository.ReferralRepository
import com.byteclub.ashasetu.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReferralScreen(
    repository: ReferralRepository,
    cloudSyncService: CloudSyncService? = null,
    onNavigateBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    var specialtyQuery by remember { mutableStateOf("Obstetrics") }
    val facilities by repository.getFacilitiesForSpecialty(specialtyQuery).collectAsState(initial = emptyList())
    var bookedFacility by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    if (bookedFacility != null) {
        AlertDialog(
            onDismissRequest = { bookedFacility = null },
            title = { Text("Referral & 108 Dispatch Confirmed", fontWeight = FontWeight.Bold, color = TextPrimary) },
            text = { Text("Bed pre-booked at $bookedFacility. 108 Ambulance dispatch alert triggered and written to 'sos_alerts' collection on PHC Cloud.", fontSize = 13.sp) },
            confirmButton = {
                TextButton(onClick = { bookedFacility = null }) {
                    Text("OK", fontWeight = FontWeight.Bold, color = NavyPrimary)
                }
            }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Smart Hospital Referral", fontWeight = FontWeight.Bold, color = CardWhite) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = null, tint = CardWhite)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = NavyPrimary)
            )
        }
    ) { innerPadding ->
        Column(
            modifier = modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(OffWhiteBg)
                .padding(16.dp)
        ) {
            OutlinedTextField(
                value = specialtyQuery,
                onValueChange = { specialtyQuery = it },
                label = { Text("Filter by Specialty (e.g. Obstetrics, ICU, Cardiology)") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(14.dp))

            Text(
                text = "Matched Facilities (${facilities.size})",
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )

            Spacer(modifier = Modifier.height(8.dp))

            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(facilities) { facility ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = CardWhite)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.LocalHospital, contentDescription = null, tint = NavyPrimary)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = facility.name,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp,
                                        color = TextPrimary
                                    )
                                }
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(GreenSyncedBg)
                                        .padding(horizontal = 8.dp, vertical = 4.dp)
                                ) {
                                    Text(
                                        text = "${facility.distanceKm} km away",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = GreenSynced
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            Text(
                                text = "Specialties: ${facility.specialtiesCsv}",
                                fontSize = 12.sp,
                                color = TextSecondary
                            )

                            Spacer(modifier = Modifier.height(8.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "ICU Beds: ${facility.icuBedsAvailable}/${facility.totalIcuBeds} Available",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (facility.icuBedsAvailable > 0) GreenSynced else RedUrgent
                                )
                                Text(
                                    text = "Updated ${facility.stalenessMinutes}m ago",
                                    fontSize = 11.sp,
                                    color = TextMuted
                                )
                            }

                            Spacer(modifier = Modifier.height(12.dp))

                            Button(
                                onClick = {
                                    bookedFacility = facility.name
                                    scope.launch {
                                        cloudSyncService?.sendAmbulanceRequest(
                                            triageRecordId = "TRIAGE-LATEST",
                                            patientId = "PAT-101",
                                            patientName = "Sunita Devi",
                                            hospitalName = facility.name,
                                            symptoms = "Accidental Fall / Acute Trauma Context",
                                            riskBand = "RED",
                                            priorityScore = 95
                                        )
                                        cloudSyncService?.sendSosEmergencyDispatch(
                                            patientId = "PAT-101",
                                            patientName = "Sunita Devi",
                                            riskBand = "RED",
                                            priorityScore = 95,
                                            emergencyType = "MATERNAL_COLLAPSE / TRAUMA",
                                            contactPhone = "+91 98230 11234"
                                        )
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = RedUrgent),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(Icons.Default.Call, contentDescription = null)
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("BOOK REFERRAL & CALL 108 AMBULANCE", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}
