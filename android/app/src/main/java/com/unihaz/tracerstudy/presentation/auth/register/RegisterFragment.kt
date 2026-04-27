package com.unihaz.tracerstudy.presentation.auth.register

import android.os.Bundle
import android.view.View
import android.widget.ArrayAdapter
import android.widget.TextView
import androidx.fragment.app.Fragment
import com.google.android.material.button.MaterialButton
import com.google.android.material.textfield.MaterialAutoCompleteTextView
import com.google.android.material.textfield.TextInputEditText
import com.unihaz.tracerstudy.R
import com.unihaz.tracerstudy.core.utils.Constants
import com.unihaz.tracerstudy.core.utils.showMessage
import com.unihaz.tracerstudy.presentation.auth.AuthActivity
import org.koin.androidx.viewmodel.ext.android.viewModel
import java.time.Year

class RegisterFragment : Fragment(R.layout.fragment_register) {
    private val viewModel: RegisterViewModel by viewModel()

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        val prodi = view.findViewById<MaterialAutoCompleteTextView>(R.id.spRegisterProdi)
        val tahun = view.findViewById<MaterialAutoCompleteTextView>(R.id.spRegisterTahun)
        val currentYear = Year.now().value
        val prodiOptions = Constants.PRODI
        val tahunOptions = (currentYear downTo 2018).map(Int::toString)
        prodi.setAdapter(ArrayAdapter(requireContext(), R.layout.item_dropdown_option, prodiOptions))
        tahun.setAdapter(ArrayAdapter(requireContext(), R.layout.item_dropdown_option, tahunOptions))
        prodi.setText(prodiOptions.firstOrNull().orEmpty(), false)
        tahun.setText(tahunOptions.firstOrNull().orEmpty(), false)

        view.findViewById<TextView>(R.id.tvBackLogin).setOnClickListener { (activity as? AuthActivity)?.showLogin() }
        val register = view.findViewById<MaterialButton>(R.id.btnRegister)
        register.setOnClickListener {
            viewModel.register(
                nim = view.findViewById<TextInputEditText>(R.id.etRegisterNim).text?.toString().orEmpty(),
                nama = view.findViewById<TextInputEditText>(R.id.etRegisterNama).text?.toString().orEmpty(),
                prodi = prodi.text?.toString().orEmpty(),
                tahunLulus = tahun.text?.toString()?.toIntOrNull() ?: currentYear,
                email = view.findViewById<TextInputEditText>(R.id.etRegisterEmail).text?.toString().orEmpty(),
                password = view.findViewById<TextInputEditText>(R.id.etRegisterPassword).text?.toString().orEmpty(),
                confirmPassword = view.findViewById<TextInputEditText>(R.id.etRegisterConfirm).text?.toString().orEmpty()
            )
        }

        viewModel.state.observe(viewLifecycleOwner) { state ->
            register.isEnabled = !state.loading
            register.text = if (state.loading) getString(R.string.register_button_loading) else "Daftar Sekarang"
            state.error?.let(view::showMessage)
            if (state.success) {
                view.showMessage("Akun berhasil dibuat. Silakan masuk.")
                (activity as? AuthActivity)?.showLogin()
            }
        }
    }
}
