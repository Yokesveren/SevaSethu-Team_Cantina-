package com.byteclub.ashasetu

import android.app.Application
import com.byteclub.ashasetu.data.repository.LocationRepository
import com.byteclub.ashasetu.domain.sync.NetworkMonitor
import com.google.firebase.FirebaseApp
import dagger.hilt.android.HiltAndroidApp
import javax.inject.Inject

@HiltAndroidApp
class AshaSetuApplication : Application() {

    @Inject
    lateinit var networkMonitor: NetworkMonitor

    @Inject
    lateinit var locationRepository: LocationRepository

    override fun onCreate() {
        super.onCreate()
        FirebaseApp.initializeApp(this)
        networkMonitor.startMonitoring()
        locationRepository.initLocationTracking()
    }
}
