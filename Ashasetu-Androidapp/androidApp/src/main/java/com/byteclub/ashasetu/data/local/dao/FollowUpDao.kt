package com.byteclub.ashasetu.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.byteclub.ashasetu.data.local.entity.FollowUpTask
import kotlinx.coroutines.flow.Flow

@Dao
interface FollowUpDao {
    @Query("SELECT * FROM followup_tasks ORDER BY dueDate ASC")
    fun getAllFollowUps(): Flow<List<FollowUpTask>>

    @Query("SELECT * FROM followup_tasks WHERE patientId = :patientId")
    fun getFollowUpsForPatient(patientId: String): Flow<List<FollowUpTask>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFollowUp(task: FollowUpTask)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFollowUps(tasks: List<FollowUpTask>)

    @Update
    suspend fun updateFollowUp(task: FollowUpTask)
}
