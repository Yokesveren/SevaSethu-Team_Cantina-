package com.byteclub.ashasetu.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "referrals")
data class Referral(
    @PrimaryKey val id: String,
    val triageRecordId: String,
    val patientId: String,
    val facilityId: String,
    val facilityName: String,
    val specialty: String,
    val urgency: String, // "RED_EMERGENCY", "YELLOW_URGENT", "ROUTINE"
    val transportArranged: Boolean = false,
    val status: String = "Pending", // "Pending", "Accepted", "En Route", "Completed"
    val createdTimestamp: Long = System.currentTimeMillis(),
    val isSynced: Boolean = false
)
