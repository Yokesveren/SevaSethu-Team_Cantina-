package com.byteclub.ashasetu.ui.patient

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.byteclub.ashasetu.data.repository.PatientRepository
import com.byteclub.ashasetu.ui.components.PatientCard
import com.byteclub.ashasetu.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PatientListScreen(
    patientRepository: PatientRepository,
    onNavigateBack: () -> Unit,
    onNavigateToAddPatient: () -> Unit,
    onNavigateToPatientDetail: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val patients by patientRepository.getAllPatients().collectAsState(initial = emptyList())

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Patient Registry", fontWeight = FontWeight.Bold, color = CardWhite) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = null, tint = CardWhite)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = NavyPrimary)
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = onNavigateToAddPatient,
                containerColor = OrangeAccent
            ) {
                Icon(Icons.Default.Add, contentDescription = null, tint = CardWhite)
            }
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(OffWhiteBg)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(patients) { patient ->
                PatientCard(
                    patient = patient,
                    onClick = { onNavigateToPatientDetail(patient.id) }
                )
            }
        }
    }
}
