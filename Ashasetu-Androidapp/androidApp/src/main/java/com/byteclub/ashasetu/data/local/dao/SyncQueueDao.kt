package com.byteclub.ashasetu.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.byteclub.ashasetu.data.local.entity.SyncQueueItem
import kotlinx.coroutines.flow.Flow

@Dao
interface SyncQueueDao {
    @Query("SELECT * FROM sync_queue ORDER BY CASE priority WHEN 'HIGH' THEN 1 WHEN 'NORMAL' THEN 2 ELSE 3 END, createdTimestamp ASC")
    fun getAllPendingItems(): Flow<List<SyncQueueItem>>

    @Query("SELECT COUNT(*) FROM sync_queue")
    fun getPendingCountFlow(): Flow<Int>

    @Query("SELECT COUNT(*) FROM sync_queue")
    suspend fun getPendingCount(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertItem(item: SyncQueueItem)

    @Delete
    suspend fun deleteItem(item: SyncQueueItem)

    @Query("DELETE FROM sync_queue")
    suspend fun clearQueue()
}
