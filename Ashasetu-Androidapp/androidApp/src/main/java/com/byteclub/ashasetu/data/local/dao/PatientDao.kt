package com.byteclub.ashasetu.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.byteclub.ashasetu.data.local.entity.Patient
import kotlinx.coroutines.flow.Flow

@Dao
interface PatientDao {
    @Query("SELECT * FROM patients WHERE status != 'NO_PATIENT_FOUND_REQUESTED' ORDER BY name ASC")
    fun getAllPatients(): Flow<List<Patient>>

    @Query("SELECT * FROM patients WHERE id = :id")
    suspend fun getPatientById(id: String): Patient?

    @Query("SELECT * FROM patients WHERE (name LIKE '%' || :query || '%' OR phone LIKE '%' || :query || '%' OR abhaId LIKE '%' || :query || '%') AND status != 'NO_PATIENT_FOUND_REQUESTED'")
    fun searchPatients(query: String): Flow<List<Patient>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPatient(patient: Patient)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPatients(patients: List<Patient>)

    @Update
    suspend fun updatePatient(patient: Patient)

    @Query("UPDATE patients SET status = :status, mishapNotes = :notes WHERE id = :id")
    suspend fun reportMishap(id: String, status: String = "MISHAP_REPORTED", notes: String)

    @Query("UPDATE patients SET status = 'UNATTENDED', unattendedReason = :reason WHERE id = :id")
    suspend fun markUnattended(id: String, reason: String)

    @Query("UPDATE patients SET status = 'NO_PATIENT_FOUND_REQUESTED' WHERE id = :id")
    suspend fun requestNoPatientFoundDeletion(id: String)

    @Query("SELECT COUNT(*) FROM patients WHERE status != 'NO_PATIENT_FOUND_REQUESTED'")
    fun getPatientCount(): Flow<Int>
}
