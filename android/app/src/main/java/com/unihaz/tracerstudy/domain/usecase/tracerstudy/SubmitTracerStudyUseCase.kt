package com.unihaz.tracerstudy.domain.usecase.tracerstudy

import com.unihaz.tracerstudy.core.network.NetworkResult
import com.unihaz.tracerstudy.data.model.TracerStudy
import com.unihaz.tracerstudy.data.repository.TracerStudyRepository

class SubmitTracerStudyUseCase(private val repository: TracerStudyRepository) {
    suspend operator fun invoke(tracerStudy: TracerStudy): NetworkResult<TracerStudy> =
        repository.submit(tracerStudy)
}
