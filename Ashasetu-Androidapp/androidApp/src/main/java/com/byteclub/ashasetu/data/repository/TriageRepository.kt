package com.byteclub.ashasetu.data.repository

import com.byteclub.ashasetu.data.local.dao.PatientDao
import com.byteclub.ashasetu.data.local.dao.TriageDao
import com.byteclub.ashasetu.data.local.entity.TriageRecord
import com.byteclub.ashasetu.domain.sync.SyncManager
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TriageRepository @Inject constructor(
    private val triageDao: TriageDao,
    private val patientDao: PatientDao,
    private val syncManager: SyncManager,
    private val cloudSyncService: CloudSyncService
) {
    fun getAllTriageRecords(): Flow<List<TriageRecord>> = triageDao.getAllRecords()

    fun getRecordsForPatient(patientId: String): Flow<List<TriageRecord>> = triageDao.getRecordsForPatient(patientId)

    suspend fun saveTriageRecord(record: TriageRecord) {
        triageDao.insertRecord(record)
        syncManager.queueForSync(
            entityType = "Triage",
            entityId = record.id,
            payloadJson = "{\"id\":\"${record.id}\",\"patientId\":\"${record.patientId}\",\"risk\":\"${record.riskBand}\"}",
            priority = if (record.riskBand == "RED") "HIGH" else "NORMAL"
        )
        val patient = patientDao.getPatientById(record.patientId)
        cloudSyncService.syncTriageCaseToCloud(record, patient)
    }

    suspend fun deleteTriageRecord(recordId: String) {
        triageDao.deleteRecordById(recordId)
        cloudSyncService.deleteTriageCaseFromCloud(recordId)
    }

    fun getRedAlertCount(): Flow<Int> = triageDao.getRedAlertCount()
}
