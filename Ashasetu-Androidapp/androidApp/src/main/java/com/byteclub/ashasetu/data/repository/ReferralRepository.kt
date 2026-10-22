package com.byteclub.ashasetu.data.repository

import com.byteclub.ashasetu.data.local.dao.FacilityDao
import com.byteclub.ashasetu.data.local.dao.ReferralDao
import com.byteclub.ashasetu.data.local.entity.Facility
import com.byteclub.ashasetu.data.local.entity.Referral
import com.byteclub.ashasetu.domain.sync.SyncManager
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ReferralRepository @Inject constructor(
    private val referralDao: ReferralDao,
    private val facilityDao: FacilityDao,
    private val syncManager: SyncManager
) {
    fun getAllReferrals(): Flow<List<Referral>> = referralDao.getAllReferrals()

    fun getFacilitiesForSpecialty(specialty: String): Flow<List<Facility>> {
        return if (specialty.isBlank()) {
            facilityDao.getAllFacilities()
        } else {
            facilityDao.getFacilitiesForSpecialty(specialty)
        }
    }

    suspend fun createReferral(referral: Referral) {
        referralDao.insertReferral(referral)
        syncManager.queueForSync(
            entityType = "Referral",
            entityId = referral.id,
            payloadJson = "{\"id\":\"${referral.id}\",\"facility\":\"${referral.facilityName}\"}",
            priority = "HIGH"
        )
    }

    suspend fun seedFacilitiesIfEmpty(facilities: List<Facility>) {
        facilityDao.insertFacilities(facilities)
    }
}
