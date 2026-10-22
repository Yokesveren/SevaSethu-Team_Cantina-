package com.byteclub.ashasetu.domain.sync

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NetworkMonitor @Inject constructor(
    @ApplicationContext private val context: Context,
    private val syncManager: SyncManager
) {
    private val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
    private val scope = CoroutineScope(Dispatchers.IO)

    fun startMonitoring() {
        if (connectivityManager == null) return

        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()

        val initialConnected = isInternetAvailable()
        syncManager.setOnlineMode(initialConnected)

        try {
            connectivityManager.registerNetworkCallback(request, object : ConnectivityManager.NetworkCallback() {
                override fun onAvailable(network: Network) {
                    scope.launch {
                        syncManager.setOnlineMode(true)
                        syncManager.performSync()
                    }
                }

                override fun onLost(network: Network) {
                    scope.launch {
                        syncManager.setOnlineMode(false)
                    }
                }
            })
        } catch (ignored: Exception) {}
    }

    fun getNetworkState(): String {
        val activeNetwork = connectivityManager?.activeNetwork ?: return "OFFLINE"
        val capabilities = connectivityManager.getNetworkCapabilities(activeNetwork) ?: return "OFFLINE"
        if (!capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)) {
            return "OFFLINE"
        }
        val downKbps = capabilities.linkDownstreamBandwidthKbps
        return if (downKbps in 1..500) "2G" else "4G"
    }

    private fun isInternetAvailable(): Boolean {
        val activeNetwork = connectivityManager?.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(activeNetwork) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }
}
