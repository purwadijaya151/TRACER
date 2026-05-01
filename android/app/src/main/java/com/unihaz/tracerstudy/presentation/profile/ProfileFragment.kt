package com.unihaz.tracerstudy.presentation.profile

import android.content.Intent
import android.content.DialogInterface
import android.net.Uri
import android.os.Bundle
import android.util.Patterns
import android.view.View
import android.widget.ImageView
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.google.android.material.button.MaterialButton
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout
import coil.load
import coil.transform.CircleCropTransformation
import com.unihaz.tracerstudy.R
import com.unihaz.tracerstudy.core.utils.ValidationUtils
import com.unihaz.tracerstudy.core.utils.showMessage
import com.unihaz.tracerstudy.data.model.Alumni
import com.unihaz.tracerstudy.presentation.auth.AuthActivity
import org.koin.androidx.viewmodel.ext.android.viewModel
import java.io.ByteArrayOutputStream
import java.io.InputStream

class ProfileFragment : Fragment(R.layout.fragment_profile) {
    private val viewModel: ProfileViewModel by viewModel()
    private val pickProfilePhoto = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) uploadProfilePhoto(uri)
    }
    private var changePasswordDialog: AlertDialog? = null
    private var changePasswordForm: ChangePasswordForm? = null

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        val refresh = view.findViewById<SwipeRefreshLayout>(R.id.profileRefresh)
        val editProfile = view.findViewById<MaterialButton>(R.id.btnEditProfile)
        val changePassword = view.findViewById<MaterialButton>(R.id.btnChangePassword)
        val profilePhoto = view.findViewById<ImageView>(R.id.ivProfilePhoto)
        refresh.setOnRefreshListener { viewModel.load() }
        view.findViewById<TextView>(R.id.btnLogout).setOnClickListener { viewModel.logout() }
        profilePhoto.setOnClickListener { pickProfilePhoto.launch("image/*") }
        editProfile.setOnClickListener {
            val alumni = viewModel.state.value?.alumni
            if (alumni == null) {
                view.showMessage(getString(R.string.profile_not_ready))
            } else {
                showEditProfileDialog(alumni)
            }
        }
        changePassword.setOnClickListener { showChangePasswordDialog() }

        viewModel.state.observe(viewLifecycleOwner) { state ->
            refresh.isRefreshing = state.loading
            editProfile.isEnabled = state.alumni != null && !state.saving
            editProfile.text = getString(if (state.saving) R.string.profile_edit_saving else R.string.profile_edit_button)
            changePassword.isEnabled = !state.isChangingPassword
            updateChangePasswordLoading(state.isChangingPassword)
            profilePhoto.isEnabled = state.alumni != null && !state.uploadingPhoto
            profilePhoto.alpha = if (state.uploadingPhoto) 0.55f else 1f
            state.error?.let {
                view.showMessage(it)
                viewModel.clearFeedback()
            }
            state.message?.let {
                view.showMessage(it)
                viewModel.clearFeedback()
            }
            state.passwordMessageResId?.let { resId ->
                changePasswordForm?.clearFields()
                changePasswordDialog?.dismiss()
                view.showMessage(getString(resId))
                viewModel.clearFeedback()
            }
            state.passwordErrorResId?.let { resId ->
                view.showMessage(getString(resId))
                viewModel.clearFeedback()
            }
            val alumni = state.alumni
            if (alumni != null) {
                val submitted = state.tracerStudy?.isSubmitted == true
                view.findViewById<TextView>(R.id.tvProfileName).text = alumni.namaLengkap
                view.findViewById<TextView>(R.id.tvProfileMeta).text = getString(R.string.profile_meta_format, alumni.nim, alumni.prodi)
                view.findViewById<TextView>(R.id.tvProfileTracerStatus).apply {
                    text = getString(if (submitted) R.string.tracer_status_submitted else R.string.tracer_status_not_submitted)
                    setBackgroundResource(if (submitted) R.drawable.bg_badge_success else R.drawable.bg_badge_gold)
                    setTextColor(
                        ContextCompat.getColor(
                            requireContext(),
                            if (submitted) R.color.status_success else R.color.status_warning
                        )
                    )
                }
                view.findViewById<TextView>(R.id.tvProfileEmail).text =
                    getString(R.string.profile_email_format, alumni.email ?: getString(R.string.placeholder_dash))
                view.findViewById<TextView>(R.id.tvProfilePhone).text =
                    getString(R.string.profile_phone_format, alumni.noHp ?: getString(R.string.placeholder_dash))
                view.findViewById<TextView>(R.id.tvProfileAngkatan).text = getString(R.string.profile_angkatan_format, alumni.angkatan)
                profilePhoto.load(alumni.fotoUrl) {
                    placeholder(R.drawable.bg_avatar)
                    transformations(CircleCropTransformation())
                }
            }
            if (state.loggedOut) {
                startActivity(Intent(requireContext(), AuthActivity::class.java))
                requireActivity().finish()
            }
        }
    }

    override fun onResume() {
        super.onResume()
        viewModel.load()
    }

    override fun onDestroyView() {
        changePasswordDialog?.dismiss()
        changePasswordDialog = null
        changePasswordForm = null
        super.onDestroyView()
    }

    private fun showEditProfileDialog(alumni: Alumni) {
        val dialogView = layoutInflater.inflate(R.layout.dialog_edit_profile, null)
        val emailLayout = dialogView.findViewById<TextInputLayout>(R.id.tilEditProfileEmail)
        val phoneLayout = dialogView.findViewById<TextInputLayout>(R.id.tilEditProfilePhone)
        val emailInput = dialogView.findViewById<TextInputEditText>(R.id.etEditProfileEmail)
        val phoneInput = dialogView.findViewById<TextInputEditText>(R.id.etEditProfilePhone)

        emailInput.setText(alumni.email.orEmpty())
        phoneInput.setText(alumni.noHp.orEmpty())

        val dialog = MaterialAlertDialogBuilder(requireContext())
            .setView(dialogView)
            .setNegativeButton(R.string.profile_edit_cancel, null)
            .setPositiveButton(R.string.profile_edit_save, null)
            .create()

        dialog.setOnShowListener {
            dialog.getButton(DialogInterface.BUTTON_POSITIVE).setOnClickListener {
                emailLayout.error = null
                phoneLayout.error = null
                val email = emailInput.text?.toString().orEmpty().trim()
                val phoneText = phoneInput.text?.toString().orEmpty().trim()
                val phone = phoneText.takeIf { it.isNotEmpty() }
                when {
                    email.isBlank() -> emailLayout.error = getString(R.string.profile_edit_email_required)
                    !Patterns.EMAIL_ADDRESS.matcher(email).matches() -> {
                        emailLayout.error = getString(R.string.profile_edit_email_invalid)
                    }
                    !ValidationUtils.isValidProfilePhone(phoneText) -> {
                        phoneLayout.error = getString(R.string.profile_edit_phone_too_long)
                    }
                    else -> {
                        viewModel.updateProfile(email, phone)
                        dialog.dismiss()
                    }
                }
            }
        }
        dialog.show()
    }

    private fun showChangePasswordDialog() {
        if (viewModel.state.value?.isChangingPassword == true) return

        val dialogView = layoutInflater.inflate(R.layout.dialog_change_password, null)
        val form = ChangePasswordForm(
            currentLayout = dialogView.findViewById(R.id.tilCurrentPassword),
            currentInput = dialogView.findViewById(R.id.etCurrentPassword),
            newLayout = dialogView.findViewById(R.id.tilNewPassword),
            newInput = dialogView.findViewById(R.id.etNewPassword),
            confirmLayout = dialogView.findViewById(R.id.tilConfirmNewPassword),
            confirmInput = dialogView.findViewById(R.id.etConfirmNewPassword)
        )

        val dialog = MaterialAlertDialogBuilder(requireContext())
            .setView(dialogView)
            .setNegativeButton(R.string.profile_password_cancel, null)
            .setPositiveButton(R.string.profile_password_save, null)
            .create()

        dialog.setOnDismissListener {
            if (changePasswordDialog == dialog) {
                changePasswordDialog = null
                changePasswordForm = null
            }
        }
        dialog.setOnShowListener {
            val positiveButton = dialog.getButton(DialogInterface.BUTTON_POSITIVE)
            positiveButton.isEnabled = viewModel.state.value?.isChangingPassword != true
            positiveButton.setOnClickListener {
                if (viewModel.state.value?.isChangingPassword == true) return@setOnClickListener
                if (validateChangePasswordForm(form)) {
                    positiveButton.isEnabled = false
                    viewModel.changePassword(form.currentPassword(), form.newPassword(), form.confirmPassword())
                }
            }
        }

        changePasswordDialog = dialog
        changePasswordForm = form
        dialog.show()
    }

    private fun validateChangePasswordForm(form: ChangePasswordForm): Boolean {
        form.clearErrors()
        val currentPassword = form.currentPassword()
        val newPassword = form.newPassword()
        val confirmPassword = form.confirmPassword()

        return when {
            currentPassword.isBlank() -> {
                form.currentLayout.error = getString(R.string.profile_password_current_required)
                false
            }
            newPassword.isBlank() -> {
                form.newLayout.error = getString(R.string.profile_password_new_required)
                false
            }
            !ValidationUtils.isValidPassword(newPassword) -> {
                form.newLayout.error = getString(R.string.profile_password_min_length)
                false
            }
            confirmPassword.isBlank() -> {
                form.confirmLayout.error = getString(R.string.profile_password_confirm_required)
                false
            }
            !ValidationUtils.isPasswordConfirmationMatch(newPassword, confirmPassword) -> {
                form.confirmLayout.error = getString(R.string.profile_password_mismatch)
                false
            }
            !ValidationUtils.isDifferentPassword(currentPassword, newPassword) -> {
                form.newLayout.error = getString(R.string.profile_password_same_as_current)
                false
            }
            else -> true
        }
    }

    private fun updateChangePasswordLoading(isChangingPassword: Boolean) {
        changePasswordDialog
            ?.getButton(DialogInterface.BUTTON_POSITIVE)
            ?.isEnabled = !isChangingPassword
    }

    private fun uploadProfilePhoto(uri: Uri) {
        val resolver = requireContext().contentResolver
        val mimeType = resolver.getType(uri)?.lowercase().orEmpty()
        val fileName = when (mimeType) {
            "image/png" -> "profile.png"
            "image/webp" -> "profile.webp"
            "image/jpeg" -> "profile.jpg"
            else -> {
                view?.showMessage(getString(R.string.profile_photo_invalid_format))
                return
            }
        }
        val photoReadResult = runCatching {
            resolver.openInputStream(uri)?.use(::readProfilePhotoBytes)
        }.getOrNull() ?: ProfilePhotoReadResult.Failed

        val bytes = when (photoReadResult) {
            is ProfilePhotoReadResult.Success -> photoReadResult.bytes
            ProfilePhotoReadResult.TooLarge -> {
                view?.showMessage(getString(R.string.profile_photo_too_large))
                return
            }
            ProfilePhotoReadResult.Failed -> {
                view?.showMessage(getString(R.string.profile_photo_read_failed))
                return
            }
        }

        if (!matchesMimeSignature(mimeType, bytes)) {
            view?.showMessage(getString(R.string.profile_photo_invalid_format))
            return
        }
        viewModel.updateProfilePhoto(fileName, bytes, mimeType)
    }

    private fun readProfilePhotoBytes(input: InputStream): ProfilePhotoReadResult {
        val output = ByteArrayOutputStream()
        val buffer = ByteArray(DEFAULT_BUFFER_SIZE)
        var totalBytes = 0

        while (true) {
            val read = input.read(buffer)
            if (read == -1) break
            totalBytes += read
            if (totalBytes > MAX_PROFILE_PHOTO_BYTES) {
                return ProfilePhotoReadResult.TooLarge
            }
            output.write(buffer, 0, read)
        }

        val bytes = output.toByteArray()
        return if (bytes.isEmpty()) {
            ProfilePhotoReadResult.Failed
        } else {
            ProfilePhotoReadResult.Success(bytes)
        }
    }

    private fun matchesMimeSignature(mimeType: String, bytes: ByteArray): Boolean =
        when (mimeType) {
            "image/jpeg" -> bytes.size >= 3 &&
                bytes[0] == 0xFF.toByte() &&
                bytes[1] == 0xD8.toByte() &&
                bytes[2] == 0xFF.toByte()
            "image/png" -> bytes.size >= PNG_SIGNATURE.size &&
                PNG_SIGNATURE.indices.all { index -> bytes[index] == PNG_SIGNATURE[index] }
            "image/webp" -> bytes.size >= 12 &&
                bytes[0] == 'R'.code.toByte() &&
                bytes[1] == 'I'.code.toByte() &&
                bytes[2] == 'F'.code.toByte() &&
                bytes[3] == 'F'.code.toByte() &&
                bytes[8] == 'W'.code.toByte() &&
                bytes[9] == 'E'.code.toByte() &&
                bytes[10] == 'B'.code.toByte() &&
                bytes[11] == 'P'.code.toByte()
            else -> false
        }

    private data class ChangePasswordForm(
        val currentLayout: TextInputLayout,
        val currentInput: TextInputEditText,
        val newLayout: TextInputLayout,
        val newInput: TextInputEditText,
        val confirmLayout: TextInputLayout,
        val confirmInput: TextInputEditText
    ) {
        fun currentPassword(): String = currentInput.text?.toString().orEmpty()

        fun newPassword(): String = newInput.text?.toString().orEmpty()

        fun confirmPassword(): String = confirmInput.text?.toString().orEmpty()

        fun clearErrors() {
            currentLayout.error = null
            newLayout.error = null
            confirmLayout.error = null
        }

        fun clearFields() {
            currentInput.text?.clear()
            newInput.text?.clear()
            confirmInput.text?.clear()
            clearErrors()
        }
    }

    private sealed class ProfilePhotoReadResult {
        data class Success(val bytes: ByteArray) : ProfilePhotoReadResult()
        data object TooLarge : ProfilePhotoReadResult()
        data object Failed : ProfilePhotoReadResult()
    }

    private companion object {
        const val MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024
        val PNG_SIGNATURE = byteArrayOf(
            0x89.toByte(),
            0x50,
            0x4E,
            0x47,
            0x0D,
            0x0A,
            0x1A,
            0x0A
        )
    }
}
