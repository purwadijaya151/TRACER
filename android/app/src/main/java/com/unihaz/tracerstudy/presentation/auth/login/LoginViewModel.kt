package com.unihaz.tracerstudy.presentation.auth.login

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.unihaz.tracerstudy.core.network.NetworkResult
import com.unihaz.tracerstudy.core.utils.ValidationUtils
import com.unihaz.tracerstudy.domain.usecase.auth.LoginUseCase
import com.unihaz.tracerstudy.domain.usecase.auth.ResetPasswordUseCase
import kotlinx.coroutines.launch

data class LoginUiState(
    val loading: Boolean = false,
    val resettingPassword: Boolean = false,
    val success: Boolean = false,
    val error: String? = null,
    val message: String? = null
)

class LoginViewModel(
    private val loginUseCase: LoginUseCase,
    private val resetPasswordUseCase: ResetPasswordUseCase
) : ViewModel() {
    private val _state = MutableLiveData(LoginUiState())
    val state: LiveData<LoginUiState> = _state

    fun login(nim: String, password: String) {
        ValidationUtils.validateLogin(nim, password)?.let {
            _state.value = LoginUiState(error = it)
            return
        }
        viewModelScope.launch {
            _state.value = LoginUiState(loading = true)
            when (val result = loginUseCase(nim, password)) {
                is NetworkResult.Success -> _state.value = LoginUiState(success = true)
                is NetworkResult.Error -> _state.value = LoginUiState(error = result.message)
                NetworkResult.Loading -> Unit
            }
        }
    }

    fun resetPassword(nim: String) {
        if (!ValidationUtils.isValidNim(nim)) {
            _state.value = LoginUiState(error = "NPM tidak valid")
            return
        }
        viewModelScope.launch {
            _state.value = LoginUiState(resettingPassword = true)
            when (val result = resetPasswordUseCase(nim)) {
                is NetworkResult.Success -> _state.value = LoginUiState(message = "Reset password dikirim melalui email institusi NPM kamu")
                is NetworkResult.Error -> _state.value = LoginUiState(error = result.message)
                NetworkResult.Loading -> Unit
            }
        }
    }
}
