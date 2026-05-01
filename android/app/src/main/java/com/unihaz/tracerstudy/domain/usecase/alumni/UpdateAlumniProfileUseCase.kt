package com.unihaz.tracerstudy.domain.usecase.alumni

import com.unihaz.tracerstudy.core.network.NetworkResult
import com.unihaz.tracerstudy.data.model.Alumni
import com.unihaz.tracerstudy.data.repository.AlumniRepository

class UpdateAlumniProfileUseCase(private val alumniRepository: AlumniRepository) {
    suspend operator fun invoke(alumniId: String, email: String, noHp: String?): NetworkResult<Alumni> =
        alumniRepository.updateProfile(alumniId, email, noHp)
}
