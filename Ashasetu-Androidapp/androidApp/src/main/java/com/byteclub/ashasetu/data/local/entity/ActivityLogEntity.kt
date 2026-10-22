package com.byteclub.ashasetu.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "activity_logs")
data class ActivityLogEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val timestamp: Long = System.currentTimeMillis(),
    val actionType: String, // "TRIAGE", "REFERRAL", "PATIENT_ADD", "SYNC", "SOS"
    val description: String,
    val patientName: String? = null
)
