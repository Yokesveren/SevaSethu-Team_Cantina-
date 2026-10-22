package com.byteclub.ashasetu.ui.sos

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddAlert
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.PhoneInTalk
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
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
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
import com.byteclub.ashasetu.data.repository.CloudSyncService
import com.byteclub.ashasetu.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SosInboxScreen(
    cloudSyncService: CloudSyncService,
    onNavigateBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    var isDispatched by remember { mutableStateOf(false) }
    var patientName by remember { mutableStateOf("Sunita Devi") }
    var emergencyType by remember { mutableStateOf("MATERNAL_COLLAPSE / SEVERE BLEEDING") }
    var contactPhone by remember { mutableStateOf("+91 98230 11234") }
    var dispatchCount by remember { mutableStateOf(0) }

    val scope = rememberCoroutineScope()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("108 Emergency Broadcaster", fontWeight = FontWeight.Bold, color = CardWhite) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = null, tint = CardWhite)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = RedUrgent)
            )
        }
    ) { innerPadding ->
        Column(
            modifier = modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(OffWhiteBg)
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = if (isDispatched) GreenSyncedBg else RedUrgentBg)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = if (isDispatched) Icons.Default.CheckCircle else Icons.Default.AddAlert,
                        contentDescription = null,
                        tint = if (isDispatched) GreenSynced else RedUrgent,
                        modifier = Modifier.size(56.dp)
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = if (isDispatched) "108 EMERGENCY ALERT SENT TO PHC DASHBOARD" else "EMERGENCY SOS DISPATCH",
                        fontWeight = FontWeight.Bold,
                        fontSize = 17.sp,
                        color = if (isDispatched) GreenSynced else RedUrgent
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = if (isDispatched)
                            "Dispatched $dispatchCount time(s) to 'sos_alerts' collection in Firestore. 108 Command Centre and PHC Doctor Dashboard received live GPS coordinates."
                        else
                            "Broadcasts patient GPS location, maternal risk payload, and emergency type directly to 108 Command Centre & PHC Doctor Dashboard ('sos_alerts' collection).",
                        fontSize = 12.sp,
                        color = TextPrimary
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    OutlinedTextField(
                        value = patientName,
                        onValueChange = { patientName = it },
                        label = { Text("Emergency Patient Name") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = emergencyType,
                        onValueChange = { emergencyType = it },
                        label = { Text("Emergency Nature / Reason") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = contactPhone,
                        onValueChange = { contactPhone = it },
                        label = { Text("Contact Number") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    Button(
                        onClick = {
                            val parsedEmergencyType = when {
                                emergencyType.contains("CARDIAC", ignoreCase = true) || emergencyType.contains("CHEST", ignoreCase = true) -> "CARDIAC_CHEST_PAIN"
                                emergencyType.contains("RESPIRATORY", ignoreCase = true) || emergencyType.contains("BREATH", ignoreCase = true) -> "SEVERE_RESPIRATORY_DISTRESS"
                                emergencyType.contains("TRAUMA", ignoreCase = true) || emergencyType.contains("ACCIDENT", ignoreCase = true) -> "TRAUMA"
                                else -> "MATERNAL_COLLAPSE"
                            }
                            scope.launch {
                                cloudSyncService.sendSosEmergencyDispatch(
                                    patientId = "PAT-101",
                                    patientName = if (patientName.isBlank()) "Sunita Devi" else patientName,
                                    riskBand = "RED",
                                    priorityScore = 95,
                                    emergencyType = parsedEmergencyType,
                                    contactPhone = contactPhone
                                )
                                isDispatched = true
                                dispatchCount++
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = if (isDispatched) GreenSynced else RedUrgent),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp)
                    ) {
                        Icon(if (isDispatched) Icons.Default.CheckCircle else Icons.Default.PhoneInTalk, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = if (isDispatched) "RE-DISPATCH 108 ALERT TO PHC DASHBOARD" else "TRIGGER 108 AMBULANCE DISPATCH",
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}
