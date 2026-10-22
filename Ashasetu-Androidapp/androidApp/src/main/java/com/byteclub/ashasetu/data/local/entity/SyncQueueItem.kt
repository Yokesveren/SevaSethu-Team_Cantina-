package com.byteclub.ashasetu.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "sync_queue")
data class SyncQueueItem(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val entityType: String, // "Patient", "Triage", "Referral", "FollowUp"
    val entityId: String,
    val payloadJson: String,
    val priority: String = "NORMAL", // "HIGH", "NORMAL", "LOW"
    val retryCount: Int = 0,
    val createdTimestamp: Long = System.currentTimeMillis()
)
