package com.byteclub.ashasetu.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.byteclub.ashasetu.data.local.entity.Facility
import kotlinx.coroutines.flow.Flow

@Dao
interface FacilityDao {
    @Query("SELECT * FROM facilities ORDER BY distanceKm ASC")
    fun getAllFacilities(): Flow<List<Facility>>

    @Query("SELECT * FROM facilities WHERE specialtiesCsv LIKE '%' || :specialty || '%' ORDER BY distanceKm ASC")
    fun getFacilitiesForSpecialty(specialty: String): Flow<List<Facility>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFacilities(facilities: List<Facility>)
}
