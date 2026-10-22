package com.byteclub.ashasetu.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "patients")
data class Patient(
    @PrimaryKey val id: String = "",
    val name: String = "",
    val age: Int = 0,
    val gender: String = "", // "Female", "Male", "Other"
    val phone: String = "",
    val abhaId: String = "", // format: 14-XXXX-XXXX-XXXX
    val isPregnant: Boolean = false,
    val trimester: Int? = null,
    val cohort: String = if (isPregnant) "ANC" else "GENERAL", // "ANC", "TB", "CHRONIC", "CHILD", "GENERAL"
    val village: String = "",
    val ashaId: String = "ASHA-MH-7892",
    val ashaName: String = "Sunita Tai",
    val phcCentreId: String = "BR-PAT-PHC-042",
    val status: String = "ACTIVE", // "ACTIVE", "UNATTENDED", "MISHAP_REPORTED", "NO_PATIENT_FOUND_REQUESTED"
    val riskBand: String = "GREEN", // "RED", "YELLOW", "GREEN"
    val mishapNotes: String? = null,
    val unattendedReason: String? = null,
    val lastVisitDate: Long = System.currentTimeMillis(),
    val lastSyncedAt: String = "",
    val isSynced: Boolean = false
)
