package com.unihaz.tracerstudy.presentation.home

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.unihaz.tracerstudy.core.network.NetworkResult
import com.unihaz.tracerstudy.data.local.SessionManager
import com.unihaz.tracerstudy.data.model.Alumni
import com.unihaz.tracerstudy.data.model.TracerStudy
import com.unihaz.tracerstudy.data.repository.NotificationRepository
import com.unihaz.tracerstudy.data.repository.TracerStudyRepository
import com.unihaz.tracerstudy.domain.usecase.alumni.GetAlumniProfileUseCase
import kotlinx.coroutines.launch

data class HomeUiState(
    val loading: Boolean = false,
    val alumni: Alumni? = null,
    val tracerStudy: TracerStudy? = null,
    val unreadCount: Int = 0,
    val error: String? = null
)

class HomeViewModel(
    private val sessionManager: SessionManager,
    private val getProfile: GetAlumniProfileUseCase,
    private val notificationRepository: NotificationRepository,
    private val tracerStudyRepository: TracerStudyRepository
) : ViewModel() {
    private val _state = MutableLiveData(HomeUiState())
    val state: LiveData<HomeUiState> = _state

    fun load() {
        val session = sessionManager.getSession() ?: return
        viewModelScope.launch {
            _state.value = HomeUiState(loading = true)
            val profile = getProfile(session.alumniId)
            val notifications = notificationRepository.getNotifications(session.alumniId)
            val draft = tracerStudyRepository.getDraft(session.alumniId)
            _state.value = HomeUiState(
                alumni = (profile as? NetworkResult.Success)?.data,
                tracerStudy = (draft as? NetworkResult.Success)?.data,
                unreadCount = (notifications as? NetworkResult.Success)?.data?.count { !it.isRead } ?: 0,
                error = (profile as? NetworkResult.Error)?.message
            )
        }
    }
}
