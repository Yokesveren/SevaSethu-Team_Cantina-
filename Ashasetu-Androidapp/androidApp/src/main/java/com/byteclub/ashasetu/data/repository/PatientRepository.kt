package com.byteclub.ashasetu.data.repository

import com.byteclub.ashasetu.data.local.dao.PatientDao
import com.byteclub.ashasetu.data.local.entity.Patient
import com.byteclub.ashasetu.domain.sync.SyncManager
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PatientRepository @Inject constructor(
    private val patientDao: PatientDao,
    private val syncManager: SyncManager,
    private val cloudSyncService: CloudSyncService
) {
    fun getAllPatients(): Flow<List<Patient>> = patientDao.getAllPatients()

    fun searchPatients(query: String): Flow<List<Patient>> {
        return if (query.isBlank()) {
            patientDao.getAllPatients()
        } else {
            patientDao.searchPatients(query)
        }
    }

    suspend fun getPatientById(id: String): Patient? = patientDao.getPatientById(id)

    suspend fun addPatient(patient: Patient) {
        patientDao.insertPatient(patient)
        syncManager.queueForSync(
            entityType = "Patient",
            entityId = patient.id,
            payloadJson = "{\"id\":\"${patient.id}\",\"name\":\"${patient.name}\",\"status\":\"${patient.status}\"}",
            priority = "NORMAL"
        )
        cloudSyncService.syncPatientToCloud(patient)
    }

    suspend fun reportMishap(id: String, notes: String) {
        patientDao.reportMishap(id, "MISHAP_REPORTED", notes)
        syncManager.queueForSync(
            entityType = "PatientStatus",
            entityId = id,
            payloadJson = "{\"id\":\"$id\",\"status\":\"MISHAP_REPORTED\",\"notes\":\"$notes\"}",
            priority = "HIGH"
        )
        getPatientById(id)?.let { cloudSyncService.syncPatientToCloud(it) }
    }

    suspend fun markUnattended(id: String, reason: String) {
        patientDao.markUnattended(id, reason)
        syncManager.queueForSync(
            entityType = "PatientStatus",
            entityId = id,
            payloadJson = "{\"id\":\"$id\",\"status\":\"UNATTENDED\",\"reason\":\"$reason\"}",
            priority = "NORMAL"
        )
        getPatientById(id)?.let { cloudSyncService.syncPatientToCloud(it) }
    }

    suspend fun requestNoPatientFoundDeletion(id: String) {
        patientDao.requestNoPatientFoundDeletion(id)
        syncManager.queueForSync(
            entityType = "PatientDeletionRequest",
            entityId = id,
            payloadJson = "{\"id\":\"$id\",\"status\":\"NO_PATIENT_FOUND_REQUESTED\"}",
            priority = "HIGH"
        )
        getPatientById(id)?.let { cloudSyncService.syncPatientToCloud(it) }
    }

    suspend fun seedPatientsIfEmpty(samplePatients: List<Patient>) {
        patientDao.insertPatients(samplePatients)
        samplePatients.forEach { patient ->
            cloudSyncService.syncPatientToCloud(patient)
        }
    }
}
