package com.byteclub.ashasetu.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.byteclub.ashasetu.data.local.entity.Referral
import kotlinx.coroutines.flow.Flow

@Dao
interface ReferralDao {
    @Query("SELECT * FROM referrals ORDER BY createdTimestamp DESC")
    fun getAllReferrals(): Flow<List<Referral>>

    @Query("SELECT * FROM referrals WHERE patientId = :patientId")
    fun getReferralsForPatient(patientId: String): Flow<List<Referral>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertReferral(referral: Referral)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertReferrals(referrals: List<Referral>)

    @Update
    suspend fun updateReferral(referral: Referral)
}
