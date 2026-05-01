package com.unihaz.tracerstudy.domain.usecase.alumni

import com.unihaz.tracerstudy.core.network.NetworkResult
import com.unihaz.tracerstudy.data.model.Alumni
import com.unihaz.tracerstudy.data.repository.AlumniRepository

class UpdateAlumniPhotoUseCase(private val alumniRepository: AlumniRepository) {
    suspend operator fun invoke(fileName: String, bytes: ByteArray, mimeType: String): NetworkResult<Alumni> {
        return when (val upload = alumniRepository.uploadFoto(fileName, bytes, mimeType)) {
            is NetworkResult.Success -> alumniRepository.saveProfilePhotoUrl(upload.data)
            is NetworkResult.Error -> upload
            NetworkResult.Loading -> NetworkResult.Loading
        }
    }
}
