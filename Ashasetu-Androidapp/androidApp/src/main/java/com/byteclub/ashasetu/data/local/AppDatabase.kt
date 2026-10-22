package com.byteclub.ashasetu.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.byteclub.ashasetu.data.local.dao.*
import com.byteclub.ashasetu.data.local.entity.*

@Database(
    entities = [
        Patient::class,
        TriageRecord::class,
        Referral::class,
        SyncQueueItem::class,
        FollowUpTask::class,
        Facility::class,
        ActivityLogEntity::class
    ],
    version = 3,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun patientDao(): PatientDao
    abstract fun triageDao(): TriageDao
    abstract fun referralDao(): ReferralDao
    abstract fun syncQueueDao(): SyncQueueDao
    abstract fun followUpDao(): FollowUpDao
    abstract fun facilityDao(): FacilityDao
    abstract fun activityLogDao(): ActivityLogDao
}
