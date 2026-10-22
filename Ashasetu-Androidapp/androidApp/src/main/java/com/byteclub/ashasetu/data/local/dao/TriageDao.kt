package com.byteclub.ashasetu.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.byteclub.ashasetu.data.local.entity.TriageRecord
import kotlinx.coroutines.flow.Flow

@Dao
interface TriageDao {
    @Query("SELECT * FROM triage_records ORDER BY timestamp DESC")
    fun getAllRecords(): Flow<List<TriageRecord>>

    @Query("SELECT * FROM triage_records WHERE patientId = :patientId ORDER BY timestamp DESC")
    fun getRecordsForPatient(patientId: String): Flow<List<TriageRecord>>

    @Query("SELECT * FROM triage_records WHERE id = :id")
    suspend fun getRecordById(id: String): TriageRecord?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRecord(record: TriageRecord)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRecords(records: List<TriageRecord>)

    @Query("SELECT COUNT(*) FROM triage_records WHERE riskBand = 'RED'")
    fun getRedAlertCount(): Flow<Int>

    @Query("DELETE FROM triage_records WHERE id = :id")
    suspend fun deleteRecordById(id: String)
}
