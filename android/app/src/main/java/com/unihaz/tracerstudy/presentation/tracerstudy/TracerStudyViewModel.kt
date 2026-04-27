package com.unihaz.tracerstudy.presentation.tracerstudy

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.unihaz.tracerstudy.core.network.NetworkResult
import com.unihaz.tracerstudy.data.local.SessionManager
import com.unihaz.tracerstudy.data.model.Alumni
import com.unihaz.tracerstudy.data.model.TracerStudy
import com.unihaz.tracerstudy.data.repository.TracerStudyRepository
import com.unihaz.tracerstudy.domain.usecase.alumni.GetAlumniProfileUseCase
import com.unihaz.tracerstudy.domain.usecase.tracerstudy.SaveTracerStudyUseCase
import com.unihaz.tracerstudy.domain.usecase.tracerstudy.SubmitTracerStudyUseCase
import kotlinx.coroutines.launch

data class WizardState(
    val currentStep: Int = 1,
    val tracerStudy: TracerStudy = TracerStudy(),
    val alumni: Alumni? = null,
    val confirmed: Boolean = false,
    val loading: Boolean = false,
    val submitted: Boolean = false,
    val error: String? = null
)

class TracerStudyViewModel(
    private val saveUseCase: SaveTracerStudyUseCase? = null,
    private val submitUseCase: SubmitTracerStudyUseCase? = null,
    private val sessionManager: SessionManager? = null,
    private val getProfileUseCase: GetAlumniProfileUseCase? = null,
    private val tracerStudyRepository: TracerStudyRepository? = null
) : ViewModel() {
    private val _state = MutableLiveData(WizardState())
    val state: LiveData<WizardState> = _state

    init {
        loadInitialData()
    }

    fun updateTracer(tracerStudy: TracerStudy) {
        _state.value = _state.value?.copy(tracerStudy = tracerStudy)
    }

    fun updateTracer(update: TracerStudy.() -> TracerStudy) {
        val current = _state.value ?: WizardState()
        _state.value = current.copy(tracerStudy = current.tracerStudy.update(), error = null)
    }

    fun updateStatusKerja(status: String) {
        val current = _state.value ?: WizardState()
        _state.value = current.copy(tracerStudy = current.tracerStudy.copy(statusKerja = status), error = null)
    }

    fun updateConfirmation(confirmed: Boolean) {
        val current = _state.value ?: WizardState()
        _state.value = current.copy(confirmed = confirmed, error = null)
    }

    fun next() {
        val current = _state.value ?: WizardState()
        validateStep(current)?.let { error ->
            _state.value = current.copy(error = error)
            return
        }
        autoSave(current.tracerStudy)
        val next = when {
            current.currentStep == 3 && current.tracerStudy.statusKerja != "Bekerja" -> 5
            else -> (current.currentStep + 1).coerceAtMost(6)
        }
        _state.value = current.copy(currentStep = next, error = null)
    }

    fun previous() {
        val current = _state.value ?: WizardState()
        val previous = when {
            current.currentStep == 5 && current.tracerStudy.statusKerja != "Bekerja" -> 3
            else -> (current.currentStep - 1).coerceAtLeast(1)
        }
        _state.value = current.copy(currentStep = previous)
    }

    fun submit() {
        val current = _state.value ?: WizardState()
        if (!current.confirmed) {
            _state.value = current.copy(error = "Konfirmasi kebenaran data wajib dicentang")
            return
        }
        val alumniId = sessionManager?.getSession()?.alumniId.orEmpty()
        val tracer = current.tracerStudy.copy(alumniId = alumniId.ifBlank { current.tracerStudy.alumniId })
        validateSubmit(tracer)?.let { error ->
            _state.value = current.copy(error = error)
            return
        }
        viewModelScope.launch {
            _state.value = current.copy(loading = true)
            val result = submitUseCase?.invoke(tracer) ?: NetworkResult.Success(tracer.copy(isSubmitted = true))
            _state.value = when (result) {
                is NetworkResult.Success -> current.copy(tracerStudy = result.data, loading = false, submitted = true)
                is NetworkResult.Error -> current.copy(loading = false, error = result.message)
                NetworkResult.Loading -> current.copy(loading = true)
            }
        }
    }

    private fun validateStep(state: WizardState): String? {
        val tracer = state.tracerStudy
        return when (state.currentStep) {
            4 -> validateWorkData(tracer)
            5 -> validateCompetencies(tracer)
            else -> null
        }
    }

    private fun validateSubmit(tracer: TracerStudy): String? {
        if (tracer.alumniId.isBlank()) return "Sesi login tidak ditemukan"
        return validateWorkData(tracer) ?: validateCompetencies(tracer)
    }

    private fun validateWorkData(tracer: TracerStudy): String? {
        if (tracer.statusKerja != "Bekerja") return null
        return when {
            tracer.namaPerusahaan.isNullOrBlank() -> "Nama perusahaan wajib diisi"
            tracer.bidangPekerjaan.isNullOrBlank() -> "Bidang pekerjaan wajib diisi"
            tracer.jabatan.isNullOrBlank() -> "Jabatan wajib diisi"
            tracer.rentangGaji.isNullOrBlank() -> "Rentang gaji wajib dipilih"
            tracer.provinsiKerja.isNullOrBlank() -> "Provinsi bekerja wajib diisi"
            tracer.kesesuaianBidang == null -> "Kesesuaian bidang wajib dinilai"
            else -> null
        }
    }

    private fun validateCompetencies(tracer: TracerStudy): String? {
        val allScores = listOf(
            tracer.nilaiHardSkill,
            tracer.nilaiSoftSkill,
            tracer.nilaiBahasaAsing,
            tracer.nilaiIt,
            tracer.nilaiKepemimpinan
        )
        return if (allScores.any { it == null }) {
            "Semua penilaian kompetensi wajib diisi"
        } else {
            null
        }
    }

    private fun autoSave(tracerStudy: TracerStudy) {
        val alumniId = sessionManager?.getSession()?.alumniId.orEmpty()
        val tracer = tracerStudy.copy(alumniId = alumniId.ifBlank { tracerStudy.alumniId })
        viewModelScope.launch {
            saveUseCase?.invoke(tracer)
        }
    }

    private fun loadInitialData() {
        val alumniId = sessionManager?.getSession()?.alumniId ?: return
        val getProfile = getProfileUseCase
        val repository = tracerStudyRepository
        if (getProfile == null && repository == null) return
        viewModelScope.launch {
            val profileResult = getProfile?.invoke(alumniId)
            val draftResult = repository?.getDraft(alumniId)
            val current = _state.value ?: WizardState()
            val draft = (draftResult as? NetworkResult.Success)?.data
            val defaultTracer = WizardState().tracerStudy
            val tracerStudy = when {
                draft != null && current.tracerStudy == defaultTracer -> draft
                current.tracerStudy.alumniId.isBlank() -> current.tracerStudy.copy(alumniId = alumniId)
                else -> current.tracerStudy
            }
            _state.value = current.copy(
                alumni = (profileResult as? NetworkResult.Success)?.data ?: current.alumni,
                tracerStudy = tracerStudy,
                submitted = draft?.isSubmitted == true || current.submitted,
                error = (profileResult as? NetworkResult.Error)?.message
                    ?: (draftResult as? NetworkResult.Error)?.message
            )
        }
    }
}
