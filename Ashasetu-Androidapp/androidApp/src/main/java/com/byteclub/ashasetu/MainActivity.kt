package com.byteclub.ashasetu

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.byteclub.ashasetu.ble.WearableDataSource
import com.byteclub.ashasetu.data.repository.CloudSyncService
import com.byteclub.ashasetu.data.repository.PatientRepository
import com.byteclub.ashasetu.data.repository.ReferralRepository
import com.byteclub.ashasetu.data.repository.TriageRepository
import com.byteclub.ashasetu.domain.nlp.SpeechRecognizerManager
import com.byteclub.ashasetu.ui.AppNavigation
import com.byteclub.ashasetu.ui.theme.SevaSethuTheme
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var patientRepository: PatientRepository

    @Inject
    lateinit var triageRepository: TriageRepository

    @Inject
    lateinit var referralRepository: ReferralRepository

    @Inject
    lateinit var wearableDataSource: WearableDataSource

    @Inject
    lateinit var cloudSyncService: CloudSyncService

    @Inject
    lateinit var speechRecognizerManager: SpeechRecognizerManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            SevaSethuTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    AppNavigation(
                        patientRepository = patientRepository,
                        triageRepository = triageRepository,
                        referralRepository = referralRepository,
                        wearableDataSource = wearableDataSource,
                        cloudSyncService = cloudSyncService,
                        speechRecognizerManager = speechRecognizerManager
                    )
                }
            }
        }
    }
}
