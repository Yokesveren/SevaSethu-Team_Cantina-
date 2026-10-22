package com.byteclub.ashasetu.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.byteclub.ashasetu.data.local.entity.Patient
import com.byteclub.ashasetu.data.mock.MockData
import com.byteclub.ashasetu.data.repository.AshaGpsLocation
import com.byteclub.ashasetu.data.repository.CloudSyncService
import com.byteclub.ashasetu.data.repository.LocationRepository
import com.byteclub.ashasetu.data.repository.PatientRepository
import com.byteclub.ashasetu.data.repository.ReferralRepository
import com.byteclub.ashasetu.data.repository.TriageRepository
import com.byteclub.ashasetu.domain.sync.SyncManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val patientRepository: PatientRepository,
    private val triageRepository: TriageRepository,
    private val referralRepository: ReferralRepository,
    val locationRepository: LocationRepository,
    val cloudSyncService: CloudSyncService,
    val syncManager: SyncManager
) : ViewModel() {

    val isOnline: StateFlow<Boolean> = syncManager.isOnline
    val currentLocation: StateFlow<AshaGpsLocation> = locationRepository.currentLocation

    val pendingSyncCount: StateFlow<Int> = syncManager.pendingSyncCount.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = 0
    )

    val patients: StateFlow<List<Patient>> = patientRepository.getAllPatients().stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    val redAlertCount: StateFlow<Int> = triageRepository.getRedAlertCount().stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = 1
    )

    init {
        viewModelScope.launch {
            patientRepository.seedPatientsIfEmpty(MockData.samplePatients)
            referralRepository.seedFacilitiesIfEmpty(MockData.sampleFacilities)
        }
    }

    fun toggleOnlineMode(online: Boolean) {
        syncManager.setOnlineMode(online)
    }

    fun triggerSync() {
        viewModelScope.launch {
            syncManager.performSync()
        }
    }

    fun refreshGpsLocation() {
        viewModelScope.launch {
            val updated = locationRepository.refreshLocation()
            cloudSyncService.syncTelemetry(
                ashaId = "ASHA-MH-7892",
                ashaName = "Sunita Tai",
                pendingSyncQueueSize = pendingSyncCount.value
            )
        }
    }
}
