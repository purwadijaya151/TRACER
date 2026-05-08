package com.unihaz.tracerstudy.presentation.history

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.unihaz.tracerstudy.core.network.NetworkResult
import com.unihaz.tracerstudy.data.local.Session
import com.unihaz.tracerstudy.data.local.SessionManager
import com.unihaz.tracerstudy.data.model.TracerStudy
import com.unihaz.tracerstudy.data.repository.TracerStudyRepository
import kotlinx.coroutines.launch

data class HistoryUiState(
    val loading: Boolean = false,
    val history: List<TracerStudy> = emptyList(),
    val error: String? = null
) {
    val latestTracerStudy: TracerStudy?
        get() = history.firstOrNull()
}

class HistoryViewModel(
    private val getSession: () -> Session?,
    private val getTracerStudyHistory: suspend (String) -> NetworkResult<List<TracerStudy>>
) : ViewModel() {
    constructor(
        sessionManager: SessionManager,
        tracerStudyRepository: TracerStudyRepository
    ) : this(
        getSession = sessionManager::getSession,
        getTracerStudyHistory = tracerStudyRepository::getSubmittedHistory
    )

    private val _state = MutableLiveData(HistoryUiState())
    val state: LiveData<HistoryUiState> = _state

    fun load() {
        val session = getSession() ?: run {
            _state.value = HistoryUiState(error = "Sesi login tidak ditemukan")
            return
        }

        viewModelScope.launch {
            _state.value = HistoryUiState(loading = true)
            when (val result = getTracerStudyHistory(session.alumniId)) {
                is NetworkResult.Success -> _state.value = HistoryUiState(history = result.data.filter { it.isSubmitted })
                is NetworkResult.Error -> _state.value = HistoryUiState(error = result.message)
                NetworkResult.Loading -> Unit
            }
        }
    }
}
