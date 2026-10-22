package com.byteclub.ashasetu.ui.login

import androidx.lifecycle.ViewModel
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import javax.inject.Inject

data class LoginUiState(
    val phone: String = "9823011234",
    val otp: String = "",
    val isOtpSent: Boolean = false,
    val selectedLanguage: String = "Marathi (मराठी)",
    val selectedSubDistrict: String = "Palghar (पालघर)",
    val isAuthenticated: Boolean = false,
    val errorMessage: String? = null
)

@HiltViewModel
class LoginViewModel @Inject constructor() : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState

    fun onPhoneChanged(newPhone: String) {
        _uiState.value = _uiState.value.copy(phone = newPhone, errorMessage = null)
    }

    fun onOtpChanged(newOtp: String) {
        _uiState.value = _uiState.value.copy(otp = newOtp, errorMessage = null)
    }

    fun onLanguageSelected(language: String) {
        _uiState.value = _uiState.value.copy(selectedLanguage = language)
    }

    fun sendOtp() {
        if (_uiState.value.phone.length >= 10) {
            _uiState.value = _uiState.value.copy(isOtpSent = true, otp = "1234")
        } else {
            _uiState.value = _uiState.value.copy(errorMessage = "Enter valid 10-digit mobile number")
        }
    }

    fun verifyOtp() {
        if (_uiState.value.otp.length == 4) {
            _uiState.value = _uiState.value.copy(isAuthenticated = true)
        } else {
            _uiState.value = _uiState.value.copy(errorMessage = "Enter valid 4-digit OTP")
        }
    }

    fun authenticateWithBiometrics() {
        _uiState.value = _uiState.value.copy(isAuthenticated = true)
    }
}
