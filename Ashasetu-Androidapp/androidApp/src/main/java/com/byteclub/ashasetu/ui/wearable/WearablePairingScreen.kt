package com.byteclub.ashasetu.ui.wearable

import android.content.Intent
import android.provider.Settings
import androidx.compose.foundation.Canvas
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
import androidx.compose.material.icons.filled.DeviceThermostat
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.MonitorHeart
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.filled.WaterDrop
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.byteclub.ashasetu.ble.WearableDataSource
import com.byteclub.ashasetu.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun EcgWaveformGraph(
    ecgPoints: List<Float>,
    modifier: Modifier = Modifier
) {
    Canvas(
        modifier = modifier
            .fillMaxWidth()
            .height(110.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0xFF0F172A))
            .padding(8.dp)
    ) {
        if (ecgPoints.size < 2) return@Canvas

        val width = size.width
        val height = size.height
        val minVal = (ecgPoints.minOrNull() ?: 0f).coerceAtMost(1000f)
        val maxVal = (ecgPoints.maxOrNull() ?: 4095f).coerceAtLeast(3000f)
        val range = (maxVal - minVal).coerceAtLeast(100f)

        val stepX = width / (ecgPoints.size - 1)

        val path = Path()
        ecgPoints.forEachIndexed { index, value ->
            val x = index * stepX
            val normalizedY = 1f - ((value - minVal) / range)
            val y = (normalizedY * (height - 20f)) + 10f

            if (index == 0) {
                path.moveTo(x, y)
            } else {
                path.lineTo(x, y)
            }
        }

        drawPath(
            path = path,
            color = Color(0xFF10B981), // Green ECG line
            style = Stroke(
                width = 3.dp.toPx(),
                cap = StrokeCap.Round,
                join = StrokeJoin.Round
            )
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WearablePairingScreen(
    wearableDataSource: WearableDataSource,
    onNavigateBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val state by wearableDataSource.connectionState.collectAsState()
    val scope = rememberCoroutineScope()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("ESP32 IoT Wearable Telemetry", fontWeight = FontWeight.Bold, color = CardWhite) },
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
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // SOS Trigger Alert Banner
            if (state.sosTriggered) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = RedUrgentBg)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Warning, contentDescription = null, tint = RedUrgent, modifier = Modifier.size(28.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("🚨 HARDWARE SOS BUTTON PRESSED!", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = RedUrgent)
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text("Emergency hardware signal received from ESP32 wearable on patient: ${state.patientName} (ID: ${state.patientId}).", fontSize = 12.sp, color = TextPrimary)
                            Spacer(modifier = Modifier.height(12.dp))
                            Button(
                                onClick = { wearableDataSource.resetSosTrigger() },
                                colors = ButtonDefaults.buttonColors(containerColor = RedUrgent),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text("RESET SOS ALERT STATE", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            // Connection Status & Patient Demographics Card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = CardWhite)
                ) {
                    Column(
                        modifier = Modifier.padding(18.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            imageVector = Icons.Default.Wifi,
                            contentDescription = null,
                            tint = if (state.isConnected) GreenSynced else OrangeAccent,
                            modifier = Modifier.size(52.dp)
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        Text(
                            text = state.deviceName,
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = TextPrimary
                        )

                        Spacer(modifier = Modifier.height(4.dp))

                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (state.isConnected) GreenSyncedBg else YellowModerateBg)
                                .padding(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = if (state.isConnected) "Status: LIVE WI-FI STREAM (192.168.4.1/api/vitals)" else "Status: DISCONNECTED / NOT SYNCING",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (state.isConnected) GreenSynced else NavyPrimary
                            )
                        }

                        if (state.connectionMessage != null) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = state.connectionMessage!!,
                                fontSize = 11.sp,
                                color = if (state.isConnected) TextSecondary else RedUrgent,
                                fontWeight = FontWeight.Medium
                            )
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(OffWhiteBg)
                                .padding(12.dp)
                        ) {
                            Column {
                                Text("Patient: ${state.patientName}", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = NavyPrimary)
                                Text("Patient ID: ${state.patientId} • Hotspot SSID: IOT_WEARABLE", fontSize = 12.sp, color = TextSecondary)
                            }
                        }
                    }
                }
            }

            // Real-Time Vitals Metric Grid & Live ECG
            if (state.isConnected) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = CardWhite)
                    ) {
                        Column(modifier = Modifier.padding(18.dp)) {
                            Text("Real-Time ESP32 Wearable Sensors", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = NavyPrimary)
                            Spacer(modifier = Modifier.height(14.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                // SpO2 Card
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text("SpO2", fontSize = 11.sp, color = TextSecondary)
                                    Text("${state.spo2}%", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = GreenSynced)
                                }

                                // Pulse Card
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text("Pulse Rate", fontSize = 11.sp, color = TextSecondary)
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.Favorite, contentDescription = null, tint = RedUrgent, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("${state.heartRate} bpm", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                                    }
                                }

                                // Temperature Card
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text("Temperature", fontSize = 11.sp, color = TextSecondary)
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.DeviceThermostat, contentDescription = null, tint = OrangeAccent, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(2.dp))
                                        Text("${String.format("%.1f", state.temperature)}°C", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                                    }
                                }

                                // Humidity Card
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text("Humidity", fontSize = 11.sp, color = TextSecondary)
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.WaterDrop, contentDescription = null, tint = NavyPrimary, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(2.dp))
                                        Text("${String.format("%.0f", state.humidity)}%", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                                    }
                                }
                            }
                        }
                    }
                }

                // Live ECG Analog Graph Card
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
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.MonitorHeart, contentDescription = null, tint = GreenSynced)
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Live Analog ECG Waveform", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = NavyPrimary)
                                }
                                Text("Raw: ${state.ecgRaw}", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = GreenSynced)
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            EcgWaveformGraph(ecgPoints = state.ecgHistory)
                        }
                    }
                }

                item {
                    OutlinedButton(
                        onClick = { wearableDataSource.disconnectDevice() },
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("DISCONNECT ESP32 WI-FI STREAM", color = RedUrgent, fontWeight = FontWeight.Bold)
                    }
                }
            } else {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = CardWhite)
                    ) {
                        Column(modifier = Modifier.padding(18.dp)) {
                            Text("Wi-Fi Setup Instructions:", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = NavyPrimary)
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("1. Connect your phone's Wi-Fi to Hotspot: 'IOT_WEARABLE'", fontSize = 12.sp, color = TextPrimary)
                            Text("2. Hotspot Password: '12345678'", fontSize = 12.sp, color = TextPrimary)
                            Text("3. Once connected to 'IOT_WEARABLE', tap the button below to start live telemetry.", fontSize = 12.sp, color = TextSecondary)

                            Spacer(modifier = Modifier.height(16.dp))

                            if (state.isConnecting) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.Center,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    CircularProgressIndicator(color = NavyPrimary, modifier = Modifier.size(24.dp))
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Text("Connecting to http://192.168.4.1/api/vitals...", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = NavyPrimary)
                                }
                            } else {
                                Button(
                                    onClick = {
                                        scope.launch {
                                            wearableDataSource.connectToWifiWearable()
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = NavyPrimary),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(48.dp)
                                ) {
                                    Icon(Icons.Default.Wifi, contentDescription = null)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("CONNECT TO ESP32 WI-FI (IOT_WEARABLE)", fontWeight = FontWeight.Bold)
                                }

                                Spacer(modifier = Modifier.height(10.dp))

                                OutlinedButton(
                                    onClick = {
                                        try {
                                            context.startActivity(Intent(Settings.ACTION_WIFI_SETTINGS))
                                        } catch (ignored: Exception) {}
                                    },
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.fillMaxWidth().height(44.dp)
                                ) {
                                    Icon(Icons.Default.Settings, contentDescription = null, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("OPEN PHONE WI-FI SETTINGS", color = NavyPrimary)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
