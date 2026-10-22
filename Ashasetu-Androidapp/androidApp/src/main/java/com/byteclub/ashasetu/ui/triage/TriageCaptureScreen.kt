package com.byteclub.ashasetu.ui.triage

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import kotlinx.coroutines.launch
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.compose.material.icons.filled.DeviceThermostat
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.MonitorHeart
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.filled.WaterDrop
import androidx.compose.material.icons.filled.Wifi
import com.byteclub.ashasetu.ble.WearableDataSource
import com.byteclub.ashasetu.data.repository.CloudSyncService
import com.byteclub.ashasetu.domain.triage.RiskBand
import com.byteclub.ashasetu.ui.components.RiskBadge
import com.byteclub.ashasetu.ui.theme.*
import com.byteclub.ashasetu.ui.wearable.EcgWaveformGraph

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TriageCaptureScreen(
    viewModel: TriageViewModel,
    wearableDataSource: WearableDataSource? = null,
    cloudSyncService: CloudSyncService? = null,
    onNavigateBack: () -> Unit,
    onNavigateToReferral: () -> Unit,
    onNavigateToSos: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val uiState by viewModel.uiState.collectAsState()
    val patients by viewModel.patients.collectAsState()
    val wearableState by (wearableDataSource?.connectionState ?: remember { kotlinx.coroutines.flow.flowOf(null) }).collectAsState(initial = null)

    var patientDropdownExpanded by remember { mutableStateOf(false) }
    var languageDropdownExpanded by remember { mutableStateOf(false) }

    val languages = listOf("Marathi (मराठी)", "Hindi (हिंदी)", "Tamil (தமிழ்)", "English")

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            viewModel.toggleVoiceRecording()
        }
    }

    if (uiState.selectedPatient == null && patients.isNotEmpty()) {
        viewModel.selectPatient(patients.first())
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("AI Voice Triage & Vitals", fontWeight = FontWeight.Bold, color = CardWhite) },
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
            // Patient Selection Section
            item {
                Text(
                    text = "Select Patient",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Spacer(modifier = Modifier.height(8.dp))

                Box(modifier = Modifier.fillMaxWidth()) {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { patientDropdownExpanded = true },
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = CardWhite)
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = uiState.selectedPatient?.name ?: "Select Patient...",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp,
                                    color = TextPrimary
                                )
                                Text(
                                    text = "ABHA: ${uiState.selectedPatient?.abhaId ?: "N/A"}",
                                    fontSize = 12.sp,
                                    color = TextSecondary
                                )
                            }
                            Text("Change ▼", fontSize = 12.sp, color = NavyPrimary, fontWeight = FontWeight.Bold)
                        }
                    }

                    DropdownMenu(
                        expanded = patientDropdownExpanded,
                        onDismissRequest = { patientDropdownExpanded = false }
                    ) {
                        patients.forEach { patient ->
                            DropdownMenuItem(
                                text = { Text("${patient.name} (${patient.village})") },
                                onClick = {
                                    viewModel.selectPatient(patient)
                                    patientDropdownExpanded = false
                                }
                            )
                        }
                    }
                }
            }

            // Hardware SOS Trigger Emergency Banner
            if (wearableState?.sosTriggered == true) {
                item {
                    Spacer(modifier = Modifier.height(14.dp))
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = RedUrgentBg)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Warning, contentDescription = null, tint = RedUrgent, modifier = Modifier.size(28.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("🚨 HARDWARE SOS BUTTON PRESSED!", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = RedUrgent)
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text("Emergency hardware signal received from ESP32 wearable on patient: ${wearableState?.patientName ?: "YOKES"} (ID: ${wearableState?.patientId ?: "01201"}).", fontSize = 12.sp, color = TextPrimary)
                            Spacer(modifier = Modifier.height(10.dp))
                            Button(
                                onClick = { onNavigateToSos?.invoke() },
                                colors = ButtonDefaults.buttonColors(containerColor = RedUrgent),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text("TRIGGER 108 EMERGENCY SOS DISPATCH", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            // ESP32 IoT Wearable Stream & Auto-Fill Card
            wearableState?.let { wState ->
                item {
                    Spacer(modifier = Modifier.height(14.dp))
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = CardWhite)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.Wifi,
                                        contentDescription = null,
                                        tint = if (wState.isConnected) GreenSynced else TextMuted,
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = if (wState.isConnected) "ESP32 Wearable Live Stream" else "ESP32 Wearable Disconnected",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp,
                                        color = NavyPrimary
                                    )
                                }
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(if (wState.isConnected) GreenSyncedBg else YellowModerateBg)
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text(
                                        text = if (wState.isConnected) "192.168.4.1/api/vitals" else "Wi-Fi Hotspot: IOT_WEARABLE",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (wState.isConnected) GreenSynced else NavyPrimary
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            if (wState.isConnected) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("SpO2", fontSize = 11.sp, color = TextSecondary)
                                        Text("${wState.spo2}%", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = GreenSynced)
                                    }
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("Pulse", fontSize = 11.sp, color = TextSecondary)
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(Icons.Default.Favorite, contentDescription = null, tint = RedUrgent, modifier = Modifier.size(14.dp))
                                            Spacer(modifier = Modifier.width(2.dp))
                                            Text("${wState.heartRate} bpm", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                                        }
                                    }
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("Temp", fontSize = 11.sp, color = TextSecondary)
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(Icons.Default.DeviceThermostat, contentDescription = null, tint = OrangeAccent, modifier = Modifier.size(14.dp))
                                            Spacer(modifier = Modifier.width(2.dp))
                                            Text("${String.format("%.1f", wState.temperature)}°C", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                                        }
                                    }
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("ECG Raw", fontSize = 11.sp, color = TextSecondary)
                                        Text("${wState.ecgRaw}", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = NavyPrimary)
                                    }
                                }

                                Spacer(modifier = Modifier.height(10.dp))

                                EcgWaveformGraph(ecgPoints = wState.ecgHistory)

                                Spacer(modifier = Modifier.height(12.dp))

                                Button(
                                    onClick = {
                                        viewModel.onVitalChanged(
                                            heartRateBpm = wState.heartRate.toString(),
                                            spo2Percent = wState.spo2.toString(),
                                            tempF = String.format("%.1f", wState.temperature)
                                        )
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = NavyPrimary),
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier.fillMaxWidth().height(42.dp)
                                ) {
                                    Icon(Icons.Default.MonitorHeart, contentDescription = null, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("AUTO-FILL VITALS FROM WEARABLE", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                }
                            } else {
                                Text(
                                    text = "Connect phone Wi-Fi to 'IOT_WEARABLE' hotspot (Pass: 12345678) to pull real-time sensor vitals.",
                                    fontSize = 12.sp,
                                    color = TextSecondary
                                )
                                Spacer(modifier = Modifier.height(10.dp))
                                Button(
                                    onClick = {
                                        scope.launch {
                                            wearableDataSource?.connectToWifiWearable()
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = NavyPrimary),
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier.fillMaxWidth().height(40.dp)
                                ) {
                                    Icon(Icons.Default.Wifi, contentDescription = null, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("CONNECT TO ESP32 WI-FI STREAM", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                }
                            }
                        }
                    }
                }
            }

            item { Spacer(modifier = Modifier.height(16.dp)) }

            // Voice Language Selector Bar
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Voice Input Language",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )

                    Box {
                        Row(
                            modifier = Modifier
                                .clip(RoundedCornerShape(20.dp))
                                .background(NavyPrimary)
                                .clickable { languageDropdownExpanded = true }
                                .padding(horizontal = 12.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.Language, contentDescription = null, tint = OrangeAccent, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(uiState.selectedLanguage, color = CardWhite, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }

                        DropdownMenu(
                            expanded = languageDropdownExpanded,
                            onDismissRequest = { languageDropdownExpanded = false }
                        ) {
                            languages.forEach { lang ->
                                DropdownMenuItem(
                                    text = { Text(lang) },
                                    onClick = {
                                        viewModel.onLanguageSelected(lang)
                                        languageDropdownExpanded = false
                                    }
                                )
                            }
                        }
                    }
                }
            }

            item { Spacer(modifier = Modifier.height(10.dp)) }

            // Voice Recording Box
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (uiState.isRecording) RedUrgentBg else NavyDark
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(18.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = if (uiState.isRecording) "LISTENING TO MICROPHONE (${uiState.selectedLanguage.uppercase()})..." else "TAP MIC TO SPEAK SYMPTOMS",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (uiState.isRecording) RedUrgent else OrangeAccent
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        Box(
                            modifier = Modifier
                                .size(64.dp)
                                .clip(CircleShape)
                                .background(if (uiState.isRecording) RedUrgent else OrangeAccent)
                                .clickable {
                                    val hasPermission = ContextCompat.checkSelfPermission(
                                        context,
                                        Manifest.permission.RECORD_AUDIO
                                    ) == PackageManager.PERMISSION_GRANTED

                                    if (hasPermission) {
                                        viewModel.toggleVoiceRecording()
                                    } else {
                                        permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                                    }
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = if (uiState.isRecording) Icons.Default.Stop else Icons.Default.Mic,
                                contentDescription = null,
                                tint = CardWhite,
                                modifier = Modifier.size(32.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        Text(
                            text = if (uiState.voiceTranscript.isBlank()) "\"Press microphone to speak symptoms in ${uiState.selectedLanguage}\"" else "\"${uiState.voiceTranscript}\"",
                            fontSize = 13.sp,
                            color = if (uiState.voiceTranscript.isBlank()) TextMuted else CardWhite,
                            modifier = Modifier.padding(horizontal = 8.dp)
                        )

                        if (uiState.errorMessage != null) {
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = uiState.errorMessage!!,
                                fontSize = 11.sp,
                                color = RedUrgent,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            item { Spacer(modifier = Modifier.height(16.dp)) }

            // Detected Symptoms Chips
            item {
                Text(
                    text = "Extracted Symptoms (${uiState.detectedSymptoms.size})",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Spacer(modifier = Modifier.height(8.dp))

                if (uiState.detectedSymptoms.isEmpty()) {
                    Text("No specific symptom keywords detected.", fontSize = 12.sp, color = TextMuted)
                } else {
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(uiState.detectedSymptoms) { symptom ->
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(if (symptom.defaultRisk == RiskBand.RED) RedUrgentBg else YellowModerateBg)
                                    .padding(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Text(
                                    text = "• ${symptom.canonicalName}",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (symptom.defaultRisk == RiskBand.RED) RedUrgent else YellowModerate
                                )
                            }
                        }
                    }
                }
            }

            item { Spacer(modifier = Modifier.height(20.dp)) }

            // Vitals Input Section
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Clinical Vitals",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )

                    val hasVoiceVitals = uiState.bpSystolic.isNotBlank() || uiState.spo2Percent.isNotBlank() || uiState.heartRateBpm.isNotBlank()
                    if (hasVoiceVitals && uiState.voiceTranscript.isNotBlank()) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(GreenLowBg)
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = "✨ Voice Auto-filled",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = GreenSynced
                            )
                        }
                    } else {
                        Text(
                            text = "(Auto-filled from Voice / Editable)",
                            fontSize = 11.sp,
                            color = TextMuted
                        )
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))

                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = CardWhite)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            OutlinedTextField(
                                value = uiState.bpSystolic,
                                onValueChange = { viewModel.onVitalChanged(bpSystolic = it) },
                                label = { Text("Sys BP (mmHg)") },
                                placeholder = { Text("e.g. 120") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                singleLine = true,
                                modifier = Modifier.weight(1f)
                            )
                            OutlinedTextField(
                                value = uiState.bpDiastolic,
                                onValueChange = { viewModel.onVitalChanged(bpDiastolic = it) },
                                label = { Text("Dia BP (mmHg)") },
                                placeholder = { Text("e.g. 80") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                singleLine = true,
                                modifier = Modifier.weight(1f)
                            )
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            OutlinedTextField(
                                value = uiState.spo2Percent,
                                onValueChange = { viewModel.onVitalChanged(spo2Percent = it) },
                                label = { Text("SpO2 (%)") },
                                placeholder = { Text("e.g. 98") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                singleLine = true,
                                modifier = Modifier.weight(1f)
                            )
                            OutlinedTextField(
                                value = uiState.heartRateBpm,
                                onValueChange = { viewModel.onVitalChanged(heartRateBpm = it) },
                                label = { Text("Pulse (bpm)") },
                                placeholder = { Text("e.g. 72") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                singleLine = true,
                                modifier = Modifier.weight(1f)
                            )
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            OutlinedTextField(
                                value = uiState.hemoglobin,
                                onValueChange = { viewModel.onVitalChanged(hemoglobin = it) },
                                label = { Text("Hb (g/dL)") },
                                placeholder = { Text("e.g. 12.5") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                singleLine = true,
                                modifier = Modifier.weight(1f)
                            )
                            OutlinedTextField(
                                value = uiState.fetalHeartRate,
                                onValueChange = { viewModel.onVitalChanged(fetalHeartRate = it) },
                                label = { Text("FHR (bpm)") },
                                placeholder = { Text("e.g. 140") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                singleLine = true,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }
            }

            item { Spacer(modifier = Modifier.height(20.dp)) }

            // Calculated Risk Result Card (Only rendered when vitals or voice input are provided)
            val result = uiState.calculatedResult
            if (result != null) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = when (result.riskBand) {
                                RiskBand.RED -> RedUrgentBg
                                RiskBand.YELLOW -> YellowModerateBg
                                RiskBand.GREEN -> GreenLowBg
                            }
                        )
                    ) {
                        Column(modifier = Modifier.padding(18.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                RiskBadge(riskBand = result.riskBand)
                                Text(
                                    text = "Specialty: ${result.primarySpecialty}",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp,
                                    color = TextPrimary
                                )
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            Text(
                                text = "AI Assessment:",
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp,
                                color = TextPrimary
                            )
                            Text(
                                text = result.aiSummary,
                                fontSize = 12.sp,
                                color = TextPrimary
                            )

                            Spacer(modifier = Modifier.height(8.dp))

                            Text(
                                text = "Recommended Action:",
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp,
                                color = TextPrimary
                            )
                            Text(
                                text = result.actionAdvice,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium,
                                color = TextPrimary
                            )
                        }
                    }
                }

                item { Spacer(modifier = Modifier.height(20.dp)) }

                // Actions: Save Triage & Proceed to Referral
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Button(
                            onClick = { viewModel.saveTriageRecord() },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (uiState.isSaved) GreenSynced else NavyPrimary
                            ),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .weight(1f)
                                .height(50.dp)
                        ) {
                            Icon(Icons.Default.CheckCircle, contentDescription = null)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(if (uiState.isSaved) "SAVED" else "SAVE TRIAGE")
                        }

                        if (result.riskBand != RiskBand.GREEN) {
                            Button(
                                onClick = onNavigateToReferral,
                                colors = ButtonDefaults.buttonColors(containerColor = RedUrgent),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier
                                    .weight(1f)
                                    .height(50.dp)
                            ) {
                                Text("FIND HOSPITAL", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            item { Spacer(modifier = Modifier.height(30.dp)) }
        }
    }
}
