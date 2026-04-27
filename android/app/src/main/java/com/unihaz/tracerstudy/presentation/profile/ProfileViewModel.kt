package com.unihaz.tracerstudy.presentation.profile

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.unihaz.tracerstudy.core.network.NetworkResult
import com.unihaz.tracerstudy.data.local.SessionManager
import com.unihaz.tracerstudy.data.model.Alumni
import com.unihaz.tracerstudy.data.model.TracerStudy
import com.unihaz.tracerstudy.data.repository.AuthRepository
import com.unihaz.tracerstudy.data.repository.TracerStudyRepository
import com.unihaz.tracerstudy.domain.usecase.alumni.GetAlumniProfileUseCase
import kotlinx.coroutines.launch

data class ProfileUiState(
    val loading: Boolean = false,
    val alumni: Alumni? = null,
    val tracerStudy: TracerStudy? = null,
    val loggedOut: Boolean = false,
    val error: String? = null
)

class ProfileViewModel(
    private val sessionManager: SessionManager,
    private val getProfile: GetAlumniProfileUseCase,
    private val authRepository: AuthRepository,
    private val tracerStudyRepository: TracerStudyRepository
) : ViewModel() {
    private val _state = MutableLiveData(ProfileUiState())
    val state: LiveData<ProfileUiState> = _state

    fun load() {
        val session = sessionManager.getSession() ?: return
        viewModelScope.launch {
            _state.value = ProfileUiState(loading = true)
            val profileResult = getProfile(session.alumniId)
            val tracerResult = tracerStudyRepository.getDraft(session.alumniId)
            when (profileResult) {
                is NetworkResult.Success -> _state.value = ProfileUiState(
                    alumni = profileResult.data,
                    tracerStudy = (tracerResult as? NetworkResult.Success)?.data,
                    error = (tracerResult as? NetworkResult.Error)?.message
                )
                is NetworkResult.Error -> _state.value = ProfileUiState(error = profileResult.message)
                NetworkResult.Loading -> Unit
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.signOut()
            _state.value = ProfileUiState(loggedOut = true)
        }
    }
}
