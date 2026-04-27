package com.unihaz.tracerstudy.domain.usecase.auth

import com.unihaz.tracerstudy.core.network.NetworkResult
import com.unihaz.tracerstudy.data.model.AlumniRegisterPayload
import com.unihaz.tracerstudy.data.repository.AuthRepository

class RegisterUseCase(private val authRepository: AuthRepository) {
    suspend operator fun invoke(nim: String, password: String, payload: AlumniRegisterPayload): NetworkResult<Unit> =
        authRepository.signUp(nim, password, payload)
}
