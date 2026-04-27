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

    fun updateAnswer(field: String, value: String?) {
        val current = _state.value ?: WizardState()
        val answers = current.tracerStudy.answers.toMutableMap()
        val normalized = value?.trim()?.takeIf { it.isNotEmpty() }
        if (normalized == null) {
            answers.remove(field)
        } else {
            answers[field] = normalized
        }
        val tracer = current.tracerStudy
            .copy(questionnaireVersion = TracerStudyQuestionnaire.VERSION, answers = answers)
            .withLegacyFields()
        _state.value = current.copy(tracerStudy = tracer, error = null)
    }

    fun updateStatusKerja(status: String) {
        val value = when (status) {
            "Bekerja" -> "1"
            "Wirausaha" -> "3"
            "Melanjutkan Studi" -> "4"
            else -> "5"
        }
        updateAnswer("f8", value)
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
        val next = (current.currentStep + 1).coerceAtMost(TracerStudyQuestionnaire.sections.size)
        _state.value = current.copy(currentStep = next, error = null)
    }

    fun previous() {
        val current = _state.value ?: WizardState()
        val previous = (current.currentStep - 1).coerceAtLeast(1)
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
        val section = TracerStudyQuestionnaire.sectionForStep(state.currentStep)
        return TracerStudyQuestionnaire.missingRequiredQuestion(section, state.tracerStudy.answers)
            ?.let { "$it wajib diisi" }
    }

    private fun validateSubmit(tracer: TracerStudy): String? {
        if (tracer.alumniId.isBlank()) return "Sesi login tidak ditemukan"
        TracerStudyQuestionnaire.sections.forEach { section ->
            TracerStudyQuestionnaire.missingRequiredQuestion(section, tracer.answers)
                ?.let { return "$it wajib diisi" }
        }
        return null
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
            }.withSeededAnswers().withLegacyFields()
            _state.value = current.copy(
                alumni = (profileResult as? NetworkResult.Success)?.data ?: current.alumni,
                tracerStudy = tracerStudy,
                submitted = draft?.isSubmitted == true || current.submitted,
                error = (profileResult as? NetworkResult.Error)?.message
                    ?: (draftResult as? NetworkResult.Error)?.message
            )
        }
    }

    private fun TracerStudy.withSeededAnswers(): TracerStudy {
        if (answers.isNotEmpty()) return this
        val seeded = mutableMapOf<String, String>()
        seeded["f8"] = when (statusKerja) {
            "Bekerja" -> "1"
            "Wirausaha" -> "3"
            "Melanjutkan Studi" -> "4"
            else -> "5"
        }
        namaPerusahaan?.takeIf { it.isNotBlank() }?.let { seeded["f5b"] = it }
        jabatan?.takeIf { it.isNotBlank() }?.let { seeded["f5c"] = it }
        provinsiKerja?.takeIf { it.isNotBlank() }?.let { seeded["f5a1"] = it }
        kesesuaianBidang?.let { seeded["f14"] = it.toString() }
        nilaiHardSkill?.let { seeded["f1763"] = it.toString() }
        nilaiBahasaAsing?.let { seeded["f1765"] = it.toString() }
        nilaiIt?.let { seeded["f1767"] = it.toString() }
        nilaiSoftSkill?.let { seeded["f1769"] = it.toString() }
        nilaiKepemimpinan?.let { seeded["f1771"] = it.toString() }
        return copy(questionnaireVersion = TracerStudyQuestionnaire.VERSION, answers = seeded)
    }

    private fun TracerStudy.withLegacyFields(): TracerStudy {
        val mappedStatus = when (answers["f8"]) {
            "1" -> "Bekerja"
            "3" -> "Wirausaha"
            "4" -> "Melanjutkan Studi"
            else -> "Belum Bekerja"
        }
        return copy(
            questionnaireVersion = TracerStudyQuestionnaire.VERSION,
            statusKerja = mappedStatus,
            namaPerusahaan = answers["f5b"],
            jabatan = answers["f5c"],
            provinsiKerja = answers["f5a1"],
            kesesuaianBidang = answers["f14"]?.toIntOrNull(),
            nilaiHardSkill = answers["f1763"]?.toIntOrNull(),
            nilaiBahasaAsing = answers["f1765"]?.toIntOrNull(),
            nilaiIt = answers["f1767"]?.toIntOrNull(),
            nilaiSoftSkill = answers["f1769"]?.toIntOrNull(),
            nilaiKepemimpinan = answers["f1771"]?.toIntOrNull()
        )
    }
}
