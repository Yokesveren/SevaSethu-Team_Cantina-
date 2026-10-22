package com.byteclub.ashasetu.ble

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import javax.inject.Inject
import javax.inject.Singleton

data class WearableData(
    val deviceName: String = "ESP32 IoT Wearable (SSID: IOT_WEARABLE)",
    val isConnected: Boolean = false,
    val isConnecting: Boolean = false,
    val patientName: String = "YOKES",
    val patientId: String = "01201",
    val sosTriggered: Boolean = false,
    val heartRate: Int = 0,
    val spo2: Int = 0,
    val ecgRaw: Int = 0,
    val temperature: Float = 0f,
    val humidity: Float = 0f,
    val batteryPct: Int = 0,
    val ecgHistory: List<Float> = emptyList(),
    val connectionMessage: String? = null
) {
    val spo2Percent: Int get() = spo2
    val heartRateBpm: Int get() = heartRate
}

@Singleton
class WearableDataSource @Inject constructor() {

    private val ecgHistoryList = mutableListOf<Float>()
    private var consecutiveFailures = 0

    private val _connectionState = MutableStateFlow(
        WearableData(
            deviceName = "ESP32 IoT Wearable (SSID: IOT_WEARABLE)",
            isConnected = false,
            isConnecting = false,
            patientName = "YOKES",
            patientId = "01201",
            sosTriggered = false,
            heartRate = 0,
            spo2 = 0,
            ecgRaw = 0,
            temperature = 0f,
            humidity = 0f,
            batteryPct = 0,
            ecgHistory = emptyList(),
            connectionMessage = "Connect your phone Wi-Fi to 'IOT_WEARABLE' hotspot (Pass: 12345678)"
        )
    )
    val connectionState: StateFlow<WearableData> = _connectionState

    private val scope = CoroutineScope(Dispatchers.IO)

    init {
        // Continuous Wi-Fi telemetry loop (ONLY syncs when connected)
        scope.launch {
            while (isActive) {
                val current = _connectionState.value
                if (current.isConnected) {
                    val fetched = fetchEsp32VitalsFromWifi("http://192.168.4.1/api/vitals")
                        ?: fetchEsp32VitalsFromWifi("http://192.168.4.1/vitals")
                        ?: fetchEsp32VitalsFromWifi("http://192.168.4.1/data")
                        ?: fetchEsp32VitalsFromWifi("http://192.168.4.1/")

                    if (fetched != null) {
                        consecutiveFailures = 0
                        val newHistory = updateEcgHistory(fetched.ecgRaw.toFloat())
                        _connectionState.value = fetched.copy(
                            isConnected = true,
                            isConnecting = false,
                            ecgHistory = newHistory,
                            connectionMessage = "Live Sync Active (http://192.168.4.1/api/vitals)"
                        )
                    } else {
                        consecutiveFailures++
                        if (consecutiveFailures >= 3) {
                            _connectionState.value = current.copy(
                                isConnected = false,
                                isConnecting = false,
                                connectionMessage = "Connection Lost. Ensure Wi-Fi is connected to 'IOT_WEARABLE'"
                            )
                        }
                    }
                }
                delay(1000)
            }
        }
    }

    suspend fun connectToWifiWearable(): Boolean {
        _connectionState.value = _connectionState.value.copy(
            isConnecting = true,
            connectionMessage = "Connecting to http://192.168.4.1/api/vitals..."
        )

        val fetched = fetchEsp32VitalsFromWifi("http://192.168.4.1/api/vitals")
            ?: fetchEsp32VitalsFromWifi("http://192.168.4.1/vitals")
            ?: fetchEsp32VitalsFromWifi("http://192.168.4.1/data")
            ?: fetchEsp32VitalsFromWifi("http://192.168.4.1/")

        if (fetched != null) {
            consecutiveFailures = 0
            val newHistory = updateEcgHistory(fetched.ecgRaw.toFloat())
            _connectionState.value = fetched.copy(
                isConnected = true,
                isConnecting = false,
                ecgHistory = newHistory,
                connectionMessage = "Connected to ESP32 Wearable! Live data streaming."
            )
            return true
        } else {
            _connectionState.value = _connectionState.value.copy(
                isConnected = false,
                isConnecting = false,
                connectionMessage = "Failed to connect to 192.168.4.1. Please connect phone Wi-Fi to 'IOT_WEARABLE' (Password: 12345678) and try again."
            )
            return false
        }
    }

    fun disconnectDevice() {
        consecutiveFailures = 0
        _connectionState.value = _connectionState.value.copy(
            isConnected = false,
            isConnecting = false,
            connectionMessage = "Disconnected from ESP32 Wearable."
        )
    }

    fun resetSosTrigger() {
        _connectionState.value = _connectionState.value.copy(
            sosTriggered = false
        )
    }

    private fun updateEcgHistory(newVal: Float): List<Float> {
        synchronized(ecgHistoryList) {
            ecgHistoryList.add(newVal)
            if (ecgHistoryList.size > 50) {
                ecgHistoryList.removeAt(0)
            }
            return ecgHistoryList.toList()
        }
    }

    private fun fetchEsp32VitalsFromWifi(endpointUrl: String): WearableData? {
        return try {
            val url = URL(endpointUrl)
            val connection = url.openConnection() as HttpURLConnection
            connection.connectTimeout = 1500
            connection.readTimeout = 1500
            connection.requestMethod = "GET"

            if (connection.responseCode == 200) {
                val jsonString = connection.inputStream.bufferedReader().use { it.readText() }
                val json = JSONObject(jsonString)

                val tempVal = try {
                    json.getDouble("temperature").toFloat()
                } catch (e: Exception) {
                    json.optString("temperature", "0").toFloatOrNull() ?: 0f
                }

                val humVal = try {
                    json.getDouble("humidity").toFloat()
                } catch (e: Exception) {
                    json.optString("humidity", "0").toFloatOrNull() ?: 0f
                }

                WearableData(
                    deviceName = "ESP32 Wearable (SSID: IOT_WEARABLE)",
                    isConnected = true,
                    isConnecting = false,
                    patientName = json.optString("patient_name", json.optString("patientName", "YOKES")),
                    patientId = json.optString("patient_id", json.optString("patientId", "01201")),
                    sosTriggered = json.optBoolean("sos_triggered", json.optBoolean("sosTriggered", false)),
                    heartRate = json.optInt("heart_rate", json.optInt("heartRate", json.optInt("bpm", 0))),
                    spo2 = json.optInt("spo2", json.optInt("spo2Percent", 0)),
                    ecgRaw = json.optInt("ecg_raw", json.optInt("ecgRaw", json.optInt("ecgAnalog", 0))),
                    temperature = tempVal,
                    humidity = humVal,
                    batteryPct = json.optInt("battery_pct", json.optInt("batteryPct", 95))
                )
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }

    fun observeLiveVitals(): Flow<Pair<Int, Int>> = flow {
        while (true) {
            val state = _connectionState.value
            if (state.isConnected) {
                emit(Pair(state.spo2, state.heartRate))
            }
            delay(1000)
        }
    }
}
