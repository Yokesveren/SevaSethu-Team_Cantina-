package com.byteclub.ashasetu.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "followup_tasks")
data class FollowUpTask(
    @PrimaryKey val id: String,
    val patientId: String,
    val patientName: String,
    val taskCategory: String, // "ANC", "Hypertension", "TB", "Infant Vaccination", "Postpartum"
    val dueDate: Long,
    val isOverdue: Boolean = false,
    val notes: String,
    val isCompleted: Boolean = false,
    val isSynced: Boolean = false
)
