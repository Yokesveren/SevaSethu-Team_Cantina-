package com.byteclub.ashasetu.domain.nlp

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SpeechRecognizerManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private var speechRecognizer: SpeechRecognizer? = null

    private val _isListening = MutableStateFlow(false)
    val isListening: StateFlow<Boolean> = _isListening

    private val _recognizedText = MutableStateFlow("")
    val recognizedText: StateFlow<String> = _recognizedText

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage

    fun startListening(languageCode: String) {
        if (!SpeechRecognizer.isRecognitionAvailable(context)) {
            _isListening.value = false
            _errorMessage.value = "Voice recognition unavailable on this device. Please enter symptoms/vitals manually."
            return
        }

        stopListening()

        try {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context).apply {
                setRecognitionListener(object : RecognitionListener {
                    override fun onReadyForSpeech(params: Bundle?) {
                        _isListening.value = true
                        _errorMessage.value = null
                    }

                    override fun onBeginningOfSpeech() {}
                    override fun onRmsChanged(rmsdB: Float) {}
                    override fun onBufferReceived(buffer: ByteArray?) {}

                    override fun onEndOfSpeech() {
                        _isListening.value = false
                    }

                    override fun onError(errorCode: Int) {
                        _isListening.value = false
                        val msg = when (errorCode) {
                            SpeechRecognizer.ERROR_NO_MATCH -> "No speech recognized. Please try speaking again."
                            SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "Speech timeout. Tap microphone to try again."
                            SpeechRecognizer.ERROR_AUDIO -> "Audio error. Please check microphone."
                            SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Microphone permission required."
                            else -> "Speech recognition error ($errorCode). Tap mic to retry."
                        }
                        if (_recognizedText.value.isBlank()) {
                            _errorMessage.value = msg
                        }
                    }

                    override fun onResults(results: Bundle?) {
                        _isListening.value = false
                        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        if (!matches.isNullOrEmpty()) {
                            _recognizedText.value = matches[0]
                            _errorMessage.value = null
                        } else {
                            if (_recognizedText.value.isBlank()) {
                                _errorMessage.value = "No speech recognized. Tap microphone to speak."
                            }
                        }
                    }

                    override fun onPartialResults(partialResults: Bundle?) {
                        val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        if (!matches.isNullOrEmpty()) {
                            _recognizedText.value = matches[0]
                        }
                    }

                    override fun onEvent(eventType: Int, params: Bundle?) {}
                })
            }

            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, languageCode)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, languageCode)
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3)
            }

            speechRecognizer?.startListening(intent)
            _isListening.value = true
        } catch (e: Exception) {
            _isListening.value = false
            _errorMessage.value = "Unable to initialize speech recognizer: ${e.message}"
        }
    }

    fun stopListening() {
        try {
            speechRecognizer?.stopListening()
            speechRecognizer?.destroy()
        } catch (ignored: Exception) {}
        speechRecognizer = null
        _isListening.value = false
    }

    fun resetRecognizedText() {
        _recognizedText.value = ""
    }
}
