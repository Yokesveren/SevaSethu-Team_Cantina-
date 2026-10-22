package com.byteclub.ashasetu.ui.patient

import androidx.compose.foundation.BorderStroke
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.byteclub.ashasetu.data.local.entity.Patient
import com.byteclub.ashasetu.data.repository.PatientRepository
import com.byteclub.ashasetu.ui.theme.*
import kotlinx.coroutines.launch
import java.util.UUID

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddPatientScreen(
    patientRepository: PatientRepository,
    onNavigateBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    var name by remember { mutableStateOf("") }
    var age by remember { mutableStateOf("") }
    var gender by remember { mutableStateOf("Female") }
    var phone by remember { mutableStateOf("") }
    var abhaId by remember { mutableStateOf("") }
    var isPregnant by remember { mutableStateOf(false) }
    var village by remember { mutableStateOf("Palghar") }

    val scope = rememberCoroutineScope()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Register New Patient", fontWeight = FontWeight.Bold, color = CardWhite) },
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
            item {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Full Name / नाव") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(10.dp))

                OutlinedTextField(
                    value = age,
                    onValueChange = { age = it },
                    label = { Text("Age (Years) / वय") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(12.dp))

                // Gender Selection
                Text(
                    text = "Gender / लिंग / பாலினம்",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Spacer(modifier = Modifier.height(6.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf("Female", "Male", "Other").forEach { option ->
                        val selected = gender == option
                        Card(
                            modifier = Modifier
                                .weight(1f)
                                .clickable {
                                    gender = option
                                    if (option != "Female") {
                                        isPregnant = false
                                    }
                                },
                            shape = RoundedCornerShape(10.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = if (selected) NavyPrimary else CardWhite
                            ),
                            border = BorderStroke(
                                width = 1.dp,
                                color = if (selected) NavyPrimary else TextMuted.copy(alpha = 0.5f)
                            )
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 12.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = when (option) {
                                        "Female" -> "Female / स्त्री"
                                        "Male" -> "Male / पुरुष"
                                        else -> "Other / इतर"
                                    },
                                    fontSize = 12.sp,
                                    fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
                                    color = if (selected) CardWhite else TextPrimary
                                )
                            }
                        }
                    }
                }
                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("Mobile Number / मोबाईल क्र.") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(10.dp))

                OutlinedTextField(
                    value = abhaId,
                    onValueChange = { abhaId = it },
                    label = { Text("ABHA ID (14 digits) / आभा आयडी") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(10.dp))

                OutlinedTextField(
                    value = village,
                    onValueChange = { village = it },
                    label = { Text("Village / गाव") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(10.dp))

                if (gender == "Female") {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(
                            checked = isPregnant,
                            onCheckedChange = { isPregnant = it }
                        )
                        Text("Is Patient Currently Pregnant? (maternal track)", fontSize = 13.sp)
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                }

                Spacer(modifier = Modifier.height(20.dp))

                Button(
                    onClick = {
                        if (name.isNotBlank()) {
                            scope.launch {
                                val patient = Patient(
                                    id = "PAT-${UUID.randomUUID().toString().take(6).uppercase()}",
                                    name = name,
                                    age = age.toIntOrNull() ?: 25,
                                    gender = gender,
                                    phone = if (phone.isBlank()) "+91 98230 11234" else phone,
                                    abhaId = if (abhaId.isBlank()) "14-3456-7890-9999" else abhaId,
                                    isPregnant = isPregnant,
                                    trimester = if (isPregnant) 2 else null,
                                    cohort = if (isPregnant) "ANC" else "GENERAL",
                                    village = village,
                                    ashaId = "ASHA-MH-7892",
                                    ashaName = "Sunita Tai",
                                    phcCentreId = "BR-PAT-PHC-042",
                                    riskBand = "GREEN"
                                )
                                patientRepository.addPatient(patient)
                                onNavigateBack()
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = NavyPrimary),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp)
                ) {
                    Text("REGISTER & CREATE ABHA RECORD", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
