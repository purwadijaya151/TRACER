package com.unihaz.tracerstudy.presentation.auth.register

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.unihaz.tracerstudy.core.network.NetworkResult
import com.unihaz.tracerstudy.core.utils.ValidationUtils
import com.unihaz.tracerstudy.data.model.AlumniRegisterPayload
import com.unihaz.tracerstudy.domain.usecase.auth.RegisterUseCase
import kotlinx.coroutines.launch

data class RegisterUiState(
    val loading: Boolean = false,
    val success: Boolean = false,
    val error: String? = null
)

class RegisterViewModel(private val registerUseCase: RegisterUseCase) : ViewModel() {
    private val _state = MutableLiveData(RegisterUiState())
    val state: LiveData<RegisterUiState> = _state

    fun register(
        nim: String,
        nama: String,
        prodi: String,
        tahunLulus: Int,
        email: String,
        password: String,
        confirmPassword: String
    ) {
        ValidationUtils.validateRegister(nim, nama, prodi, tahunLulus, email, password, confirmPassword)?.let {
            _state.value = RegisterUiState(error = it)
            return
        }
        viewModelScope.launch {
            _state.value = RegisterUiState(loading = true)
            val payload = AlumniRegisterPayload(
                nim = nim,
                namaLengkap = nama,
                prodi = prodi,
                tahunMasuk = tahunLulus - 4,
                tahunLulus = tahunLulus,
                email = email
            )
            when (val result = registerUseCase(nim, password, payload)) {
                is NetworkResult.Success -> _state.value = RegisterUiState(success = true)
                is NetworkResult.Error -> _state.value = RegisterUiState(error = result.message)
                NetworkResult.Loading -> Unit
            }
        }
    }
}
