package com.unihaz.tracerstudy.presentation.auth.login

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.unihaz.tracerstudy.R
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
    val message: String? = null,
    val resetPasswordErrorResId: Int? = null,
    val resetPasswordEmailErrorResId: Int? = null,
    val resetPasswordMessageResId: Int? = null
)

class LoginViewModel private constructor(
    private val performLogin: suspend (String, String) -> NetworkResult<Unit>,
    private val performResetPassword: suspend (String, String) -> NetworkResult<Unit>
) : ViewModel() {
    constructor(
        loginUseCase: LoginUseCase,
        resetPasswordUseCase: ResetPasswordUseCase
    ) : this(
        performLogin = loginUseCase::invoke,
        performResetPassword = resetPasswordUseCase::invoke
    )

    internal constructor(
        resetPasswordAction: suspend (String, String) -> NetworkResult<Unit>,
        loginAction: suspend (String, String) -> NetworkResult<Unit> = { _, _ -> NetworkResult.Success(Unit) },
        @Suppress("UNUSED_PARAMETER") testConstructorMarker: Boolean = true
    ) : this(
        performLogin = loginAction,
        performResetPassword = resetPasswordAction
    )

    private val _state = MutableLiveData(LoginUiState())
    val state: LiveData<LoginUiState> = _state

    fun login(nim: String, password: String) {
        ValidationUtils.validateLogin(nim, password)?.let {
            _state.value = LoginUiState(error = it)
            return
        }
        viewModelScope.launch {
            _state.value = LoginUiState(loading = true)
            when (val result = performLogin(nim, password)) {
                is NetworkResult.Success -> _state.value = LoginUiState(success = true)
                is NetworkResult.Error -> _state.value = LoginUiState(error = result.message)
                NetworkResult.Loading -> Unit
            }
        }
    }

    fun resetPassword(nim: String, email: String) {
        if (!ValidationUtils.isValidNim(nim)) {
            _state.value = LoginUiState(resetPasswordErrorResId = R.string.login_reset_password_nim_invalid)
            return
        }
        if (!ValidationUtils.isValidEmail(email)) {
            _state.value = LoginUiState(resetPasswordEmailErrorResId = R.string.login_reset_password_email_invalid)
            return
        }
        viewModelScope.launch {
            _state.value = LoginUiState(resettingPassword = true)
            when (val result = performResetPassword(nim, email)) {
                is NetworkResult.Success -> _state.value = LoginUiState(
                    resetPasswordMessageResId = R.string.login_reset_password_success
                )
                is NetworkResult.Error -> _state.value = LoginUiState(error = result.message)
                NetworkResult.Loading -> Unit
            }
        }
    }

    fun clearFeedback() {
        _state.value = _state.value?.copy(
            error = null,
            message = null,
            resetPasswordErrorResId = null,
            resetPasswordEmailErrorResId = null,
            resetPasswordMessageResId = null
        )
    }
}
