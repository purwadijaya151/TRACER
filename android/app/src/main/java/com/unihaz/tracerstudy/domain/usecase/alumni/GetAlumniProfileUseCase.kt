package com.unihaz.tracerstudy.domain.usecase.alumni

import com.unihaz.tracerstudy.core.network.NetworkResult
import com.unihaz.tracerstudy.data.model.Alumni
import com.unihaz.tracerstudy.data.repository.AlumniRepository

class GetAlumniProfileUseCase(private val alumniRepository: AlumniRepository) {
    suspend operator fun invoke(alumniId: String): NetworkResult<Alumni> =
        alumniRepository.getProfile(alumniId)
}
