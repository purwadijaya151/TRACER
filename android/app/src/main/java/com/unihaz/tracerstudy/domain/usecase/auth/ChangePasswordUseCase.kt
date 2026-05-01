package com.unihaz.tracerstudy.domain.usecase.auth

import com.unihaz.tracerstudy.data.repository.AuthRepository

class ChangePasswordUseCase(private val authRepository: AuthRepository) {
    suspend operator fun invoke(currentPassword: String, newPassword: String): Result<Unit> =
        authRepository.changePassword(currentPassword, newPassword)
}
