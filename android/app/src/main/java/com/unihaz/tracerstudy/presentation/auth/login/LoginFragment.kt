package com.unihaz.tracerstudy.presentation.auth.login

import android.content.Intent
import android.content.DialogInterface
import android.os.Bundle
import android.view.View
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import com.google.android.material.button.MaterialButton
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout
import com.unihaz.tracerstudy.R
import com.unihaz.tracerstudy.core.utils.ValidationUtils
import com.unihaz.tracerstudy.core.utils.showMessage
import com.unihaz.tracerstudy.presentation.auth.AuthActivity
import com.unihaz.tracerstudy.presentation.main.MainActivity
import org.koin.androidx.viewmodel.ext.android.viewModel

class LoginFragment : Fragment(R.layout.fragment_login) {
    private val viewModel: LoginViewModel by viewModel()
    private var resetPasswordDialog: AlertDialog? = null
    private var resetPasswordNimLayout: TextInputLayout? = null
    private var resetPasswordNimInput: TextInputEditText? = null
    private var resetPasswordEmailLayout: TextInputLayout? = null
    private var resetPasswordEmailInput: TextInputEditText? = null

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        val nim = view.findViewById<TextInputEditText>(R.id.etLoginNim)
        val password = view.findViewById<TextInputEditText>(R.id.etLoginPassword)
        val login = view.findViewById<MaterialButton>(R.id.btnLogin)
        val register = view.findViewById<MaterialButton>(R.id.btnGoRegister)
        val forgot = view.findViewById<TextView>(R.id.tvForgotPassword)

        login.setOnClickListener {
            viewModel.login(nim.text?.toString().orEmpty(), password.text?.toString().orEmpty())
        }
        register.setOnClickListener { (activity as? AuthActivity)?.showRegister() }
        forgot.setOnClickListener { showResetPasswordDialog(nim.text?.toString().orEmpty()) }

        viewModel.state.observe(viewLifecycleOwner) { state ->
            val loginInProgress = state.loading
            login.isEnabled = !loginInProgress
            register.isEnabled = !loginInProgress
            forgot.isEnabled = !state.resettingPassword && !loginInProgress
            forgot.text = if (state.resettingPassword) {
                getString(R.string.reset_password_button_loading)
            } else {
                getString(R.string.login_forgot_password)
            }
            login.text = if (state.loading) getString(R.string.login_button_loading) else "Masuk"
            updateResetPasswordLoading(state.resettingPassword)
            state.error?.let {
                view.showMessage(it)
                viewModel.clearFeedback()
            }
            state.message?.let {
                view.showMessage(it)
                viewModel.clearFeedback()
            }
            state.resetPasswordErrorResId?.let { resId ->
                resetPasswordNimLayout?.error = getString(resId)
                viewModel.clearFeedback()
            }
            state.resetPasswordEmailErrorResId?.let { resId ->
                resetPasswordEmailLayout?.error = getString(resId)
                viewModel.clearFeedback()
            }
            state.resetPasswordMessageResId?.let { resId ->
                resetPasswordNimInput?.text?.clear()
                resetPasswordEmailInput?.text?.clear()
                resetPasswordDialog?.dismiss()
                view.showMessage(getString(resId))
                viewModel.clearFeedback()
            }
            if (state.success) {
                startActivity(Intent(requireContext(), MainActivity::class.java))
                requireActivity().finish()
            }
        }
    }

    override fun onDestroyView() {
        resetPasswordDialog?.dismiss()
        resetPasswordDialog = null
        resetPasswordNimLayout = null
        resetPasswordNimInput = null
        resetPasswordEmailLayout = null
        resetPasswordEmailInput = null
        super.onDestroyView()
    }

    private fun showResetPasswordDialog(initialNim: String) {
        if (viewModel.state.value?.resettingPassword == true) return

        val dialogView = layoutInflater.inflate(R.layout.dialog_reset_password, null)
        val nimLayout = dialogView.findViewById<TextInputLayout>(R.id.tilResetPasswordNim)
        val nimInput = dialogView.findViewById<TextInputEditText>(R.id.etResetPasswordNim)
        val emailLayout = dialogView.findViewById<TextInputLayout>(R.id.tilResetPasswordEmail)
        val emailInput = dialogView.findViewById<TextInputEditText>(R.id.etResetPasswordEmail)
        nimInput.setText(initialNim.trim())

        val dialog = MaterialAlertDialogBuilder(requireContext())
            .setView(dialogView)
            .setNegativeButton(R.string.login_reset_password_cancel, null)
            .setPositiveButton(R.string.login_reset_password_send, null)
            .create()

        dialog.setOnDismissListener {
            if (resetPasswordDialog == dialog) {
                resetPasswordDialog = null
                resetPasswordNimLayout = null
                resetPasswordNimInput = null
                resetPasswordEmailLayout = null
                resetPasswordEmailInput = null
            }
        }
        dialog.setOnShowListener {
            val positiveButton = dialog.getButton(DialogInterface.BUTTON_POSITIVE)
            positiveButton.isEnabled = viewModel.state.value?.resettingPassword != true
            positiveButton.setOnClickListener {
                if (viewModel.state.value?.resettingPassword == true) return@setOnClickListener
                nimLayout.error = null
                emailLayout.error = null
                val nimText = nimInput.text?.toString().orEmpty().trim()
                val emailText = emailInput.text?.toString().orEmpty().trim()
                if (!ValidationUtils.isValidNim(nimText)) {
                    nimLayout.error = getString(R.string.login_reset_password_nim_invalid)
                    return@setOnClickListener
                }
                if (!ValidationUtils.isValidEmail(emailText)) {
                    emailLayout.error = getString(R.string.login_reset_password_email_invalid)
                    return@setOnClickListener
                }
                positiveButton.isEnabled = false
                viewModel.resetPassword(nimText, emailText)
            }
        }

        resetPasswordDialog = dialog
        resetPasswordNimLayout = nimLayout
        resetPasswordNimInput = nimInput
        resetPasswordEmailLayout = emailLayout
        resetPasswordEmailInput = emailInput
        dialog.show()
    }

    private fun updateResetPasswordLoading(isResettingPassword: Boolean) {
        resetPasswordDialog
            ?.getButton(DialogInterface.BUTTON_POSITIVE)
            ?.isEnabled = !isResettingPassword
    }
}
