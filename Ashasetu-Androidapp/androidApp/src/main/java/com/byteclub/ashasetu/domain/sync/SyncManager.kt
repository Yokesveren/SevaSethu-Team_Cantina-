package com.byteclub.ashasetu.domain.sync

import com.byteclub.ashasetu.data.local.dao.SyncQueueDao
import com.byteclub.ashasetu.data.local.entity.SyncQueueItem
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SyncManager @Inject constructor(
    private val syncQueueDao: SyncQueueDao
) {
    private val _isOnline = MutableStateFlow(true) // Default Online mode for live demo toggle
    val isOnline: StateFlow<Boolean> = _isOnline

    val pendingSyncCount: Flow<Int> = syncQueueDao.getPendingCountFlow()

    fun setOnlineMode(online: Boolean) {
        _isOnline.value = online
    }

    suspend fun queueForSync(entityType: String, entityId: String, payloadJson: String, priority: String = "NORMAL") {
        val item = SyncQueueItem(
            entityType = entityType,
            entityId = entityId,
            payloadJson = payloadJson,
            priority = priority
        )
        syncQueueDao.insertItem(item)
    }

    suspend fun performSync(): Int {
        if (!_isOnline.value) return 0
        val count = syncQueueDao.getPendingCount()
        if (count > 0) {
            syncQueueDao.clearQueue()
        }
        return count
    }
}
