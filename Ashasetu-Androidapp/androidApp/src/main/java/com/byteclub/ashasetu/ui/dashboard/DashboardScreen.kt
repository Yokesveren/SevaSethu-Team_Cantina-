package com.byteclub.ashasetu.ui.dashboard

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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Watch
import java.util.Locale
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.byteclub.ashasetu.ui.components.*
import com.byteclub.ashasetu.ui.theme.*

@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel,
    onNavigateToTriage: () -> Unit,
    onNavigateToAddPatient: () -> Unit,
    onNavigateToReferrals: () -> Unit,
    onNavigateToSos: () -> Unit,
    onNavigateToWearables: () -> Unit,
    onNavigateToGuidelines: () -> Unit,
    onNavigateToPatientDetail: (String) -> Unit,
    onTabSelected: (BottomNavTab) -> Unit,
    modifier: Modifier = Modifier
) {
    val isOnline by viewModel.isOnline.collectAsState()
    val gpsLocation by viewModel.currentLocation.collectAsState()
    val pendingSyncCount by viewModel.pendingSyncCount.collectAsState()
    val patients by viewModel.patients.collectAsState()
    val redAlertCount by viewModel.redAlertCount.collectAsState()

    var searchQuery by remember { mutableStateOf("") }

    Scaffold(
        bottomBar = {
            BottomNavBar(
                currentRoute = "dashboard",
                onTabSelected = onTabSelected
            )
        }
    ) { innerPadding ->
        Column(
            modifier = modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(OffWhiteBg)
        ) {
            // Live Online / Offline Sync Bar
            SyncStatusBar(
                isOnline = isOnline,
                pendingSyncCount = pendingSyncCount,
                onToggleOnline = { viewModel.toggleOnlineMode(it) }
            )

            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp)
            ) {
                item { Spacer(modifier = Modifier.height(16.dp)) }

                // Header Profile Greeting
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "Namaste, Sunita-tai 🙏",
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "ASHA ID: MH-7892 • Palghar Block",
                                fontSize = 12.sp,
                                color = TextSecondary
                            )
                        }

                        Box(
                            modifier = Modifier
                                .size(42.dp)
                                .clip(CircleShape)
                                .background(NavyPrimary)
                                .clickable { onNavigateToSos() },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Notifications,
                                contentDescription = null,
                                tint = CardWhite,
                                modifier = Modifier.size(22.dp)
                            )
                        }
                    }
                }
                item { Spacer(modifier = Modifier.height(16.dp)) }

                // GPS Location Status & Update Card
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = CardWhite)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.LocationOn,
                                    contentDescription = "GPS Location",
                                    tint = GreenSynced,
                                    modifier = Modifier.size(20.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Column {
                                    Text(
                                        text = "📍 Live GPS: ${gpsLocation.regionName}",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = TextPrimary
                                    )
                                    Text(
                                        text = "Lat: ${String.format(Locale.US, "%.4f", gpsLocation.latitude)}, Lng: ${String.format(Locale.US, "%.4f", gpsLocation.longitude)} • Telemetry Active",
                                        fontSize = 10.sp,
                                        color = TextSecondary
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.width(6.dp))

                            Button(
                                onClick = { viewModel.refreshGpsLocation() },
                                colors = ButtonDefaults.buttonColors(containerColor = NavyPrimary),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.height(36.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Refresh,
                                    contentDescription = "Refresh GPS",
                                    tint = CardWhite,
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("UPDATE GPS", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }

                item { Spacer(modifier = Modifier.height(12.dp)) }

                // Search Bar
                item {
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        placeholder = { Text("Search patient by name, mobile, ABHA ID...") },
                        leadingIcon = {
                            Icon(Icons.Default.Search, contentDescription = null, tint = TextMuted)
                        },
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = CardWhite,
                            unfocusedContainerColor = CardWhite,
                            focusedBorderColor = NavyPrimary,
                            unfocusedBorderColor = BorderLight
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                item { Spacer(modifier = Modifier.height(16.dp)) }

                // Critical Red Alert Banner
                if (redAlertCount > 0) {
                    item {
                        AlertBanner(
                            redCount = redAlertCount,
                            onClick = onNavigateToSos
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                    }
                }

                // Featured Voice Triage Banner
                item {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onNavigateToTriage() },
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = NavyPrimary)
                    ) {
                        Row(
                            modifier = Modifier.padding(18.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "START VOICE TRIAGE",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = OrangeAccent
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Speak Symptoms in Hindi / Marathi",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = CardWhite
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Instant AI specialty triage & hospital bed availability",
                                    fontSize = 12.sp,
                                    color = OrangeLight
                                )
                            }
                            Icon(
                                imageVector = Icons.Default.ArrowForward,
                                contentDescription = null,
                                tint = OrangeAccent,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                    }
                }

                item { Spacer(modifier = Modifier.height(16.dp)) }

                // 2x2 Quick Action Grid
                item {
                    Text(
                        text = "Quick Actions",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    QuickActionGrid(
                        onVoiceTriageClick = onNavigateToTriage,
                        onAddPatientClick = onNavigateToAddPatient,
                        onReferralClick = onNavigateToReferrals,
                        onSosClick = onNavigateToSos
                    )
                }

                item { Spacer(modifier = Modifier.height(20.dp)) }

                // Health Toolkit Bar
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Button(
                            onClick = onNavigateToWearables,
                            colors = ButtonDefaults.buttonColors(containerColor = CardWhite),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Watch, contentDescription = null, tint = NavyPrimary)
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Pulse Oxi BLE", color = NavyPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        Button(
                            onClick = onNavigateToGuidelines,
                            colors = ButtonDefaults.buttonColors(containerColor = CardWhite),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Book, contentDescription = null, tint = NavyPrimary)
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("ANC Guidelines", color = NavyPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }

                item { Spacer(modifier = Modifier.height(20.dp)) }

                // Recent Patients Header
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Assigned Patients (${patients.size})",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Text(
                            text = "Add New +",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = NavyPrimary,
                            modifier = Modifier.clickable { onNavigateToAddPatient() }
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                }

                // Filtered Patient List
                val filteredPatients = if (searchQuery.isBlank()) patients else {
                    patients.filter {
                        it.name.contains(searchQuery, ignoreCase = true) ||
                                it.phone.contains(searchQuery) ||
                                it.abhaId.contains(searchQuery)
                    }
                }

                items(filteredPatients) { patient ->
                    PatientCard(
                        patient = patient,
                        onClick = { onNavigateToPatientDetail(patient.id) }
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                }

                item { Spacer(modifier = Modifier.height(30.dp)) }
            }
        }
    }
}
