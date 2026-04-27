package com.unihaz.tracerstudy.presentation.notification

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.unihaz.tracerstudy.core.network.NetworkResult
import com.unihaz.tracerstudy.data.local.SessionManager
import com.unihaz.tracerstudy.data.model.Notification
import com.unihaz.tracerstudy.data.repository.NotificationRepository
import kotlinx.coroutines.launch

data class NotificationUiState(
    val loading: Boolean = false,
    val notifications: List<Notification> = emptyList(),
    val error: String? = null
)

class NotificationViewModel(
    private val sessionManager: SessionManager,
    private val repository: NotificationRepository
) : ViewModel() {
    private val _state = MutableLiveData(NotificationUiState())
    val state: LiveData<NotificationUiState> = _state

    fun load() {
        val alumniId = sessionManager.getSession()?.alumniId ?: return
        viewModelScope.launch {
            _state.value = NotificationUiState(loading = true)
            when (val result = repository.getNotifications(alumniId)) {
                is NetworkResult.Success -> _state.value = NotificationUiState(notifications = result.data)
                is NetworkResult.Error -> _state.value = NotificationUiState(error = result.message)
                NetworkResult.Loading -> Unit
            }
        }
    }

    fun markAsRead(notificationId: String) {
        viewModelScope.launch {
            repository.markAsRead(notificationId)
            load()
        }
    }

    fun markAllAsRead() {
        val unreadIds = _state.value?.notifications.orEmpty()
            .filterNot { it.isRead }
            .map { it.id }
        if (unreadIds.isEmpty()) return
        viewModelScope.launch {
            unreadIds.forEach { id ->
                repository.markAsRead(id)
            }
            load()
        }
    }
}
