package com.byteclub.ashasetu.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "triage_records")
data class TriageRecord(
    @PrimaryKey val id: String = "",
    val patientId: String = "",
    val timestamp: Long = System.currentTimeMillis(),
    val symptomsCsv: String = "",
    val rawVoiceText: String? = null,
    val bpSystolic: Int? = null,
    val bpDiastolic: Int? = null,
    val heartRateBpm: Int? = null,
    val spo2Percent: Int? = null,
    val tempCelsius: Float? = null,
    val respRatePerMin: Int = 0,
    val bloodSugar: Int? = null,
    val fetalHeartRate: Int? = null,
    val hemoglobin: Float? = null,
    val riskBand: String = "GREEN", // "RED", "YELLOW", "GREEN"
    val priorityScore: Int = 0, // 0-100 priority score
    val primarySpecialty: String = "General",
    val aiSummary: String = "",
    val actionAdvice: String = "",
    val triageReason: String = "",
    val isSynced: Boolean = false
)
