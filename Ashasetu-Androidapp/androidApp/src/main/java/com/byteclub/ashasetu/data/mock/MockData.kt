package com.byteclub.ashasetu.data.mock

import com.byteclub.ashasetu.data.local.entity.Facility
import com.byteclub.ashasetu.data.local.entity.FollowUpTask
import com.byteclub.ashasetu.data.local.entity.Patient

object MockData {
    val samplePatients = listOf(
        Patient(
            id = "PAT-101",
            name = "Sunita Devi",
            age = 26,
            gender = "Female",
            phone = "+91 98230 11234",
            abhaId = "14-3456-7890-1234",
            isPregnant = true,
            trimester = 2,
            cohort = "ANC",
            village = "Palghar",
            ashaId = "ASHA-MH-7892",
            ashaName = "Sunita Tai",
            phcCentreId = "BR-PAT-PHC-042",
            riskBand = "RED"
        ),
        Patient(
            id = "PAT-102",
            name = "Ramesh Patil",
            age = 54,
            gender = "Male",
            phone = "+91 98221 44556",
            abhaId = "14-7654-3210-4321",
            isPregnant = false,
            cohort = "CHRONIC",
            village = "Wada",
            ashaId = "ASHA-MH-7892",
            ashaName = "Sunita Tai",
            phcCentreId = "BR-PAT-PHC-042",
            riskBand = "YELLOW"
        ),
        Patient(
            id = "PAT-103",
            name = "Pooja Sharma",
            age = 22,
            gender = "Female",
            phone = "+91 97654 12389",
            abhaId = "14-6789-0123-5678",
            isPregnant = true,
            trimester = 3,
            cohort = "ANC",
            village = "Jawhar",
            ashaId = "ASHA-MH-7892",
            ashaName = "Sunita Tai",
            phcCentreId = "BR-PAT-PHC-042",
            riskBand = "RED"
        ),
        Patient(
            id = "PAT-104",
            name = "Anil Shinde",
            age = 61,
            gender = "Male",
            phone = "+91 99112 33445",
            abhaId = "14-4455-6677-8899",
            isPregnant = false,
            cohort = "GENERAL",
            village = "Vikramgad",
            ashaId = "ASHA-MH-7892",
            ashaName = "Sunita Tai",
            phcCentreId = "BR-PAT-PHC-042",
            riskBand = "GREEN"
        )
    )

    val sampleFacilities = listOf(
        Facility(
            id = "FAC-01",
            name = "District Hospital Palghar",
            facilityType = "DH",
            district = "Palghar",
            specialtiesCsv = "Obstetrics,Cardiology,Pediatrics,Trauma,ICU",
            icuBedsAvailable = 4,
            totalIcuBeds = 12,
            oxygenAvailable = true,
            bloodBankAvailable = true,
            distanceKm = 4.2f,
            phone = "+91 2525 252100",
            stalenessMinutes = 8
        ),
        Facility(
            id = "FAC-02",
            name = "Sub-District Hospital Wada",
            facilityType = "SDH",
            district = "Palghar",
            specialtiesCsv = "Obstetrics,General Medicine,Pediatrics",
            icuBedsAvailable = 2,
            totalIcuBeds = 6,
            oxygenAvailable = true,
            bloodBankAvailable = false,
            distanceKm = 11.5f,
            phone = "+91 2526 271220",
            stalenessMinutes = 15
        ),
        Facility(
            id = "FAC-03",
            name = "Jawhar Community Health Centre",
            facilityType = "CHC",
            district = "Palghar",
            specialtiesCsv = "Obstetrics,General Medicine",
            icuBedsAvailable = 0,
            totalIcuBeds = 2,
            oxygenAvailable = true,
            bloodBankAvailable = false,
            distanceKm = 18.0f,
            phone = "+91 2520 220011",
            stalenessMinutes = 45
        )
    )

    val sampleFollowUps = listOf(
        FollowUpTask(
            id = "TASK-01",
            patientId = "PAT-101",
            patientName = "Sunita Devi",
            taskCategory = "ANC Checkup",
            dueDate = System.currentTimeMillis() - 86400000L * 1, // Overdue by 1 day
            isOverdue = true,
            notes = "2nd Trimester ANC Checkup & Hb test due",
            isCompleted = false
        ),
        FollowUpTask(
            id = "TASK-02",
            patientId = "PAT-102",
            patientName = "Ramesh Patil",
            taskCategory = "Hypertension Followup",
            dueDate = System.currentTimeMillis() + 86400000L * 2, // In 2 days
            isOverdue = false,
            notes = "Weekly Blood Pressure monitoring & medication check",
            isCompleted = false
        ),
        FollowUpTask(
            id = "TASK-03",
            patientId = "PAT-103",
            patientName = "Pooja Sharma",
            taskCategory = "High Risk ANC",
            dueDate = System.currentTimeMillis() + 86400000L * 1, // Tomorrow
            isOverdue = false,
            notes = "BP check and fetal movement evaluation",
            isCompleted = false
        )
    )
}
