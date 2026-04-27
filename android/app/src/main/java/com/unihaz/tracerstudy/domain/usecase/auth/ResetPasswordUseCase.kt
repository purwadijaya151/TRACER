package com.unihaz.tracerstudy.domain.usecase.auth

import com.unihaz.tracerstudy.core.network.NetworkResult
import com.unihaz.tracerstudy.data.repository.AuthRepository

class ResetPasswordUseCase(private val authRepository: AuthRepository) {
    suspend operator fun invoke(nim: String): NetworkResult<Unit> =
        authRepository.resetPassword(nim)
}
