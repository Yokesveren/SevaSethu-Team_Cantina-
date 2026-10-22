package com.byteclub.ashasetu.ui.triage

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.byteclub.ashasetu.data.local.entity.Patient
import com.byteclub.ashasetu.data.local.entity.TriageRecord
import com.byteclub.ashasetu.data.repository.PatientRepository
import com.byteclub.ashasetu.data.repository.TriageRepository
import com.byteclub.ashasetu.domain.nlp.SpeechRecognizerManager
import com.byteclub.ashasetu.domain.nlp.SymptomExtractor
import com.byteclub.ashasetu.domain.triage.RiskBand
import com.byteclub.ashasetu.domain.triage.RuleEngine
import com.byteclub.ashasetu.domain.triage.SymptomRule
import com.byteclub.ashasetu.domain.triage.TriageResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

data class PatientFormData(
    val voiceTranscript: String = "",
    val detectedSymptoms: List<SymptomRule> = emptyList(),
    val bpSystolic: String = "",
    val bpDiastolic: String = "",
    val heartRateBpm: String = "",
    val spo2Percent: String = "",
    val tempF: String = "",
    val respRatePerMin: String = "",
    val bloodSugar: String = "",
    val fetalHeartRate: String = "",
    val hemoglobin: String = "",
    val calculatedResult: TriageResult? = null,
    val isSaved: Boolean = false
)

data class TriageUiState(
    val selectedPatient: Patient? = null,
    val selectedLanguage: String = "Marathi (मराठी)",
    val isRecording: Boolean = false,
    val voiceTranscript: String = "",
    val detectedSymptoms: List<SymptomRule> = emptyList(),
    val bpSystolic: String = "",
    val bpDiastolic: String = "",
    val heartRateBpm: String = "",
    val spo2Percent: String = "",
    val tempF: String = "",
    val respRatePerMin: String = "",
    val bloodSugar: String = "",
    val fetalHeartRate: String = "",
    val hemoglobin: String = "",
    val calculatedResult: TriageResult? = null,
    val errorMessage: String? = null,
    val isSaved: Boolean = false
)

@HiltViewModel
class TriageViewModel @Inject constructor(
    private val patientRepository: PatientRepository,
    private val triageRepository: TriageRepository,
    private val speechRecognizerManager: SpeechRecognizerManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(TriageUiState())
    val uiState: StateFlow<TriageUiState> = _uiState

    private val patientFormMap = mutableMapOf<String, PatientFormData>()

    val patients: StateFlow<List<Patient>> = patientRepository.getAllPatients().stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    init {
        viewModelScope.launch {
            speechRecognizerManager.isListening.collect { listening ->
                _uiState.value = _uiState.value.copy(isRecording = listening)
            }
        }

        viewModelScope.launch {
            speechRecognizerManager.recognizedText.collect { text ->
                if (text.isNotBlank()) {
                    extractSymptomsFromTranscript(text)
                }
            }
        }

        viewModelScope.launch {
            speechRecognizerManager.errorMessage.collect { err ->
                if (err != null) {
                    _uiState.value = _uiState.value.copy(errorMessage = err)
                }
            }
        }
    }

    fun selectPatient(patient: Patient) {
        val prevPatient = _uiState.value.selectedPatient
        if (prevPatient != null && prevPatient.id != patient.id) {
            saveCurrentPatientForm(prevPatient.id)
        }

        val savedForm = patientFormMap[patient.id] ?: PatientFormData()

        _uiState.value = _uiState.value.copy(
            selectedPatient = patient,
            voiceTranscript = savedForm.voiceTranscript,
            detectedSymptoms = savedForm.detectedSymptoms,
            bpSystolic = savedForm.bpSystolic,
            bpDiastolic = savedForm.bpDiastolic,
            heartRateBpm = savedForm.heartRateBpm,
            spo2Percent = savedForm.spo2Percent,
            tempF = savedForm.tempF,
            respRatePerMin = savedForm.respRatePerMin,
            bloodSugar = savedForm.bloodSugar,
            fetalHeartRate = savedForm.fetalHeartRate,
            hemoglobin = savedForm.hemoglobin,
            calculatedResult = savedForm.calculatedResult,
            isSaved = savedForm.isSaved,
            errorMessage = null
        )
        speechRecognizerManager.resetRecognizedText()
        reEvaluateTriage()
    }

    private fun saveCurrentPatientForm(patientId: String) {
        val state = _uiState.value
        patientFormMap[patientId] = PatientFormData(
            voiceTranscript = state.voiceTranscript,
            detectedSymptoms = state.detectedSymptoms,
            bpSystolic = state.bpSystolic,
            bpDiastolic = state.bpDiastolic,
            heartRateBpm = state.heartRateBpm,
            spo2Percent = state.spo2Percent,
            tempF = state.tempF,
            respRatePerMin = state.respRatePerMin,
            bloodSugar = state.bloodSugar,
            fetalHeartRate = state.fetalHeartRate,
            hemoglobin = state.hemoglobin,
            calculatedResult = state.calculatedResult,
            isSaved = state.isSaved
        )
    }

    fun onLanguageSelected(language: String) {
        _uiState.value = _uiState.value.copy(selectedLanguage = language)
    }

    fun toggleVoiceRecording() {
        if (_uiState.value.isRecording) {
            speechRecognizerManager.stopListening()
        } else {
            val languageCode = when {
                _uiState.value.selectedLanguage.contains("Tamil") -> "ta-IN"
                _uiState.value.selectedLanguage.contains("Hindi") -> "hi-IN"
                _uiState.value.selectedLanguage.contains("Marathi") -> "mr-IN"
                else -> "en-IN"
            }
            speechRecognizerManager.startListening(languageCode)
        }
    }

    fun extractSymptomsFromTranscript(transcript: String) {
        val extractedSymptoms = SymptomExtractor.extractSymptomsFromText(transcript)
        val extractedVitals = com.byteclub.ashasetu.domain.nlp.VitalsExtractor.extractVitalsFromText(transcript)

        val currentState = _uiState.value

        _uiState.value = currentState.copy(
            voiceTranscript = transcript,
            detectedSymptoms = extractedSymptoms,
            bpSystolic = extractedVitals.bpSystolic ?: currentState.bpSystolic,
            bpDiastolic = extractedVitals.bpDiastolic ?: currentState.bpDiastolic,
            spo2Percent = extractedVitals.spo2Percent ?: currentState.spo2Percent,
            heartRateBpm = extractedVitals.heartRateBpm ?: currentState.heartRateBpm,
            tempF = extractedVitals.tempF ?: currentState.tempF,
            respRatePerMin = extractedVitals.respRatePerMin ?: currentState.respRatePerMin,
            bloodSugar = extractedVitals.bloodSugar ?: currentState.bloodSugar,
            fetalHeartRate = extractedVitals.fetalHeartRate ?: currentState.fetalHeartRate,
            hemoglobin = extractedVitals.hemoglobin ?: currentState.hemoglobin,
            errorMessage = null,
            isSaved = false
        )
        reEvaluateTriage()
    }

    fun onVitalChanged(
        bpSystolic: String = _uiState.value.bpSystolic,
        bpDiastolic: String = _uiState.value.bpDiastolic,
        heartRateBpm: String = _uiState.value.heartRateBpm,
        spo2Percent: String = _uiState.value.spo2Percent,
        tempF: String = _uiState.value.tempF,
        respRatePerMin: String = _uiState.value.respRatePerMin,
        fetalHeartRate: String = _uiState.value.fetalHeartRate,
        hemoglobin: String = _uiState.value.hemoglobin
    ) {
        _uiState.value = _uiState.value.copy(
            bpSystolic = bpSystolic,
            bpDiastolic = bpDiastolic,
            heartRateBpm = heartRateBpm,
            spo2Percent = spo2Percent,
            tempF = tempF,
            respRatePerMin = respRatePerMin,
            fetalHeartRate = fetalHeartRate,
            hemoglobin = hemoglobin,
            isSaved = false
        )
        reEvaluateTriage()
    }

    fun reEvaluateTriage() {
        val state = _uiState.value
        val tempFloat = state.tempF.toFloatOrNull()
        val tempCelsius = tempFloat?.let { if (it > 50f) (it - 32f) * 5f / 9f else it }

        val result = RuleEngine.evaluate(
            patient = state.selectedPatient,
            symptoms = state.detectedSymptoms,
            bpSystolic = state.bpSystolic.toIntOrNull(),
            bpDiastolic = state.bpDiastolic.toIntOrNull(),
            heartRateBpm = state.heartRateBpm.toIntOrNull(),
            spo2Percent = state.spo2Percent.toIntOrNull(),
            tempCelsius = tempCelsius,
            bloodSugar = state.bloodSugar.toIntOrNull(),
            fetalHeartRate = state.fetalHeartRate.toIntOrNull(),
            hemoglobin = state.hemoglobin.toFloatOrNull()
        )
        _uiState.value = _uiState.value.copy(calculatedResult = result)

        val patientId = state.selectedPatient?.id
        if (patientId != null) {
            saveCurrentPatientForm(patientId)
        }
    }

    fun saveTriageRecord() {
        val state = _uiState.value
        val result = state.calculatedResult ?: return
        val patient = state.selectedPatient ?: return

        val tempFloat = state.tempF.toFloatOrNull()
        val tempCelsius = tempFloat?.let { if (it > 50f) (it - 32f) * 5f / 9f else it }

        val record = TriageRecord(
            id = "TRIAGE-${UUID.randomUUID().toString().take(8).uppercase()}",
            patientId = patient.id,
            timestamp = System.currentTimeMillis(),
            symptomsCsv = state.detectedSymptoms.joinToString(",") { it.canonicalName },
            rawVoiceText = state.voiceTranscript,
            bpSystolic = state.bpSystolic.toIntOrNull(),
            bpDiastolic = state.bpDiastolic.toIntOrNull(),
            heartRateBpm = state.heartRateBpm.toIntOrNull(),
            spo2Percent = state.spo2Percent.toIntOrNull(),
            tempCelsius = tempCelsius,
            respRatePerMin = state.respRatePerMin.toIntOrNull() ?: 0,
            hemoglobin = state.hemoglobin.toFloatOrNull(),
            riskBand = result.riskBand.name,
            priorityScore = result.priorityScore,
            primarySpecialty = result.primarySpecialty,
            aiSummary = result.aiSummary,
            actionAdvice = result.actionAdvice,
            triageReason = result.actionAdvice,
            isSynced = false
        )

        viewModelScope.launch {
            triageRepository.saveTriageRecord(record)
            _uiState.value = _uiState.value.copy(isSaved = true)
            saveCurrentPatientForm(patient.id)
        }
    }

    override fun onCleared() {
        super.onCleared()
        speechRecognizerManager.stopListening()
    }
}
