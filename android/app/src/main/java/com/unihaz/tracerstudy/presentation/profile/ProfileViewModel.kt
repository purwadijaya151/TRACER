package com.unihaz.tracerstudy.presentation.profile

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.unihaz.tracerstudy.R
import com.unihaz.tracerstudy.core.utils.ValidationUtils
import com.unihaz.tracerstudy.core.network.NetworkResult
import com.unihaz.tracerstudy.data.local.SessionManager
import com.unihaz.tracerstudy.data.local.Session
import com.unihaz.tracerstudy.data.model.Alumni
import com.unihaz.tracerstudy.data.model.TracerStudy
import com.unihaz.tracerstudy.data.repository.AuthRepository
import com.unihaz.tracerstudy.data.repository.TracerStudyRepository
import com.unihaz.tracerstudy.domain.usecase.alumni.GetAlumniProfileUseCase
import com.unihaz.tracerstudy.domain.usecase.alumni.UpdateAlumniPhotoUseCase
import com.unihaz.tracerstudy.domain.usecase.alumni.UpdateAlumniProfileUseCase
import com.unihaz.tracerstudy.domain.usecase.auth.ChangePasswordUseCase
import kotlinx.coroutines.launch

data class ProfileUiState(
    val loading: Boolean = false,
    val saving: Boolean = false,
    val uploadingPhoto: Boolean = false,
    val isChangingPassword: Boolean = false,
    val alumni: Alumni? = null,
    val tracerStudy: TracerStudy? = null,
    val loggedOut: Boolean = false,
    val message: String? = null,
    val error: String? = null,
    val passwordMessageResId: Int? = null,
    val passwordErrorResId: Int? = null
)

class ProfileViewModel private constructor(
    private val sessionProvider: () -> Session?,
    private val getProfileAction: suspend (String) -> NetworkResult<Alumni>,
    private val updatePhotoAction: suspend (String, ByteArray, String) -> NetworkResult<Alumni>,
    private val updateProfileAction: suspend (String, String, String?) -> NetworkResult<Alumni>,
    private val changePasswordAction: suspend (String, String) -> Result<Unit>,
    private val signOutAction: suspend () -> NetworkResult<Unit>,
    private val getDraftAction: suspend (String) -> NetworkResult<TracerStudy?>
) : ViewModel() {
    constructor(
        sessionManager: SessionManager,
        getProfile: GetAlumniProfileUseCase,
        updatePhotoUseCase: UpdateAlumniPhotoUseCase,
        updateProfileUseCase: UpdateAlumniProfileUseCase,
        changePasswordUseCase: ChangePasswordUseCase,
        authRepository: AuthRepository,
        tracerStudyRepository: TracerStudyRepository
    ) : this(
        sessionProvider = sessionManager::getSession,
        getProfileAction = getProfile::invoke,
        updatePhotoAction = updatePhotoUseCase::invoke,
        updateProfileAction = updateProfileUseCase::invoke,
        changePasswordAction = changePasswordUseCase::invoke,
        signOutAction = authRepository::signOut,
        getDraftAction = tracerStudyRepository::getDraft
    )

    internal constructor(
        changePasswordAction: suspend (String, String) -> Result<Unit>,
        signOutAction: suspend () -> NetworkResult<Unit> = { NetworkResult.Success(Unit) }
    ) : this(
        sessionProvider = { null },
        getProfileAction = { NetworkResult.Error("Not used in this test") },
        updatePhotoAction = { _, _, _ -> NetworkResult.Error("Not used in this test") },
        updateProfileAction = { _, _, _ -> NetworkResult.Error("Not used in this test") },
        changePasswordAction = changePasswordAction,
        signOutAction = signOutAction,
        getDraftAction = { NetworkResult.Error("Not used in this test") }
    )

    private val _state = MutableLiveData(ProfileUiState())
    val state: LiveData<ProfileUiState> = _state

    fun load() {
        val session = sessionProvider() ?: return
        viewModelScope.launch {
            val current = _state.value ?: ProfileUiState()
            _state.value = current.copy(loading = true, error = null, message = null)
            val profileResult = getProfileAction(session.alumniId)
            val tracerResult = getDraftAction(session.alumniId)
            when (profileResult) {
                is NetworkResult.Success -> _state.value = current.copy(
                    loading = false,
                    alumni = profileResult.data,
                    tracerStudy = (tracerResult as? NetworkResult.Success)?.data,
                    error = (tracerResult as? NetworkResult.Error)?.message
                )
                is NetworkResult.Error -> _state.value = current.copy(loading = false, error = profileResult.message)
                NetworkResult.Loading -> Unit
            }
        }
    }

    fun updateProfile(email: String, noHp: String?) {
        val current = _state.value ?: ProfileUiState()
        val alumniId = current.alumni?.id ?: sessionProvider()?.alumniId
        if (alumniId.isNullOrBlank()) {
            _state.value = current.copy(error = "Profil belum siap. Tarik untuk memuat ulang.")
            return
        }
        viewModelScope.launch {
            _state.value = current.copy(saving = true, error = null, message = null)
            when (val result = updateProfileAction(alumniId, email, noHp)) {
                is NetworkResult.Success -> {
                    val refreshed = getProfileAction(alumniId)
                    val refreshedAlumni = (refreshed as? NetworkResult.Success)?.data ?: result.data
                    val latest = _state.value ?: current
                    _state.value = latest.copy(
                        saving = false,
                        loading = false,
                        alumni = refreshedAlumni,
                        message = "Profil berhasil diperbarui"
                    )
                }
                is NetworkResult.Error -> {
                    val latest = _state.value ?: current
                    _state.value = latest.copy(saving = false, error = result.message)
                }
                NetworkResult.Loading -> {
                    val latest = _state.value ?: current
                    _state.value = latest.copy(saving = true)
                }
            }
        }
    }

    fun updateProfilePhoto(fileName: String, bytes: ByteArray, mimeType: String) {
        val current = _state.value ?: ProfileUiState()
        viewModelScope.launch {
            _state.value = current.copy(uploadingPhoto = true, error = null, message = null)
            when (val result = updatePhotoAction(fileName, bytes, mimeType)) {
                is NetworkResult.Success -> {
                    val latest = _state.value ?: current
                    _state.value = latest.copy(
                        uploadingPhoto = false,
                        alumni = result.data,
                        message = "Foto profil berhasil diperbarui"
                    )
                }
                is NetworkResult.Error -> {
                    val latest = _state.value ?: current
                    _state.value = latest.copy(uploadingPhoto = false, error = result.message)
                }
                NetworkResult.Loading -> {
                    val latest = _state.value ?: current
                    _state.value = latest.copy(uploadingPhoto = true)
                }
            }
        }
    }

    fun changePassword(currentPassword: String, newPassword: String, confirmPassword: String) {
        val current = _state.value ?: ProfileUiState()
        val validationErrorResId = when {
            currentPassword.isBlank() -> R.string.profile_password_current_required
            newPassword.isBlank() -> R.string.profile_password_new_required
            !ValidationUtils.isValidPassword(newPassword) -> R.string.profile_password_min_length
            confirmPassword.isBlank() -> R.string.profile_password_confirm_required
            !ValidationUtils.isPasswordConfirmationMatch(newPassword, confirmPassword) -> R.string.profile_password_mismatch
            !ValidationUtils.isDifferentPassword(currentPassword, newPassword) -> R.string.profile_password_same_as_current
            else -> null
        }

        if (validationErrorResId != null) {
            _state.value = current.copy(
                isChangingPassword = false,
                passwordMessageResId = null,
                passwordErrorResId = validationErrorResId
            )
            return
        }

        viewModelScope.launch {
            _state.value = current.copy(
                isChangingPassword = true,
                passwordMessageResId = null,
                passwordErrorResId = null
            )
            val result = runCatching {
                changePasswordAction(currentPassword, newPassword)
            }.getOrElse { throwable ->
                Result.failure(throwable)
            }
            val latest = _state.value ?: current
            _state.value = if (result.isSuccess) {
                latest.copy(
                    isChangingPassword = false,
                    passwordMessageResId = R.string.profile_password_success,
                    passwordErrorResId = null
                )
            } else {
                latest.copy(
                    isChangingPassword = false,
                    passwordMessageResId = null,
                    passwordErrorResId = passwordErrorResIdFor(result.exceptionOrNull()?.message)
                )
            }
        }
    }

    fun clearFeedback() {
        _state.value = _state.value?.copy(
            error = null,
            message = null,
            passwordMessageResId = null,
            passwordErrorResId = null
        )
    }

    fun logout() {
        viewModelScope.launch {
            signOutAction()
            _state.value = ProfileUiState(loggedOut = true)
        }
    }

    private fun passwordErrorResIdFor(message: String?): Int {
        val normalized = message?.trim()?.lowercase().orEmpty()
        return when {
            normalized.contains("current password") ||
                normalized.contains("current-password") ||
                normalized.contains("password saat ini") -> R.string.profile_password_wrong_current
            normalized.contains("unauthorized") ||
                normalized.contains("session") ||
                normalized.contains("sesi") ||
                normalized.contains("expired") ||
                normalized.contains("login invalid") ||
                normalized.contains("masuk ulang") -> R.string.profile_password_session_expired
            else -> R.string.profile_password_generic_error
        }
    }
}
