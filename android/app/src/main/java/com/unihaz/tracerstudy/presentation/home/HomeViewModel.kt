package com.unihaz.tracerstudy.presentation.home

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.unihaz.tracerstudy.core.network.NetworkResult
import com.unihaz.tracerstudy.data.local.Session
import com.unihaz.tracerstudy.data.local.SessionManager
import com.unihaz.tracerstudy.data.model.Alumni
import com.unihaz.tracerstudy.data.model.Notification
import com.unihaz.tracerstudy.data.model.TracerStudy
import com.unihaz.tracerstudy.data.repository.NotificationRepository
import com.unihaz.tracerstudy.data.repository.TracerStudyRepository
import com.unihaz.tracerstudy.domain.usecase.alumni.GetAlumniProfileUseCase
import kotlinx.coroutines.launch

data class HomeUiState(
    val loading: Boolean = false,
    val alumni: Alumni? = null,
    val tracerStudy: TracerStudy? = null,
    val tracerStatusKnown: Boolean = false,
    val unreadCount: Int? = null,
    val error: String? = null
)

class HomeViewModel internal constructor(
    private val getSession: () -> Session?,
    private val loadProfile: suspend (String) -> NetworkResult<Alumni>,
    private val loadNotifications: suspend (String) -> NetworkResult<List<Notification>>,
    private val loadDraft: suspend (String) -> NetworkResult<TracerStudy?>
) : ViewModel() {
    constructor(
        sessionManager: SessionManager,
        getProfile: GetAlumniProfileUseCase,
        notificationRepository: NotificationRepository,
        tracerStudyRepository: TracerStudyRepository
    ) : this(
        getSession = sessionManager::getSession,
        loadProfile = getProfile::invoke,
        loadNotifications = notificationRepository::getNotifications,
        loadDraft = tracerStudyRepository::getDraft
    )

    private val _state = MutableLiveData(HomeUiState())
    val state: LiveData<HomeUiState> = _state

    fun load() {
        val session = getSession() ?: return
        val current = _state.value ?: HomeUiState()
        viewModelScope.launch {
            _state.value = current.copy(loading = true, error = null)
            val profile = loadProfile(session.alumniId)
            val notifications = loadNotifications(session.alumniId)
            val draft = loadDraft(session.alumniId)
            _state.value = HomeUiState(
                loading = false,
                alumni = (profile as? NetworkResult.Success)?.data ?: current.alumni,
                tracerStudy = (draft as? NetworkResult.Success)?.data ?: current.tracerStudy,
                tracerStatusKnown = draft is NetworkResult.Success,
                unreadCount = (notifications as? NetworkResult.Success)?.data?.count { !it.isRead } ?: current.unreadCount,
                error = (profile as? NetworkResult.Error)?.message
                    ?: (notifications as? NetworkResult.Error)?.message
                    ?: (draft as? NetworkResult.Error)?.message
            )
        }
    }
}
