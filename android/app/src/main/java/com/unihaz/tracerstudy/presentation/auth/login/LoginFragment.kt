package com.unihaz.tracerstudy.presentation.auth.login

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.TextView
import androidx.fragment.app.Fragment
import com.google.android.material.button.MaterialButton
import com.google.android.material.textfield.TextInputEditText
import com.unihaz.tracerstudy.R
import com.unihaz.tracerstudy.core.utils.showMessage
import com.unihaz.tracerstudy.presentation.auth.AuthActivity
import com.unihaz.tracerstudy.presentation.main.MainActivity
import org.koin.androidx.viewmodel.ext.android.viewModel

class LoginFragment : Fragment(R.layout.fragment_login) {
    private val viewModel: LoginViewModel by viewModel()

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
        forgot.setOnClickListener {
            viewModel.resetPassword(nim.text?.toString().orEmpty())
        }

        viewModel.state.observe(viewLifecycleOwner) { state ->
            val loginInProgress = state.loading
            login.isEnabled = !loginInProgress
            register.isEnabled = !loginInProgress
            forgot.isEnabled = !state.resettingPassword && !loginInProgress
            forgot.text = if (state.resettingPassword) getString(R.string.reset_password_button_loading) else "Lupa Password?"
            login.text = if (state.loading) getString(R.string.login_button_loading) else "Masuk"
            state.error?.let(view::showMessage)
            state.message?.let(view::showMessage)
            if (state.success) {
                startActivity(Intent(requireContext(), MainActivity::class.java))
                requireActivity().finish()
            }
        }
    }
}
