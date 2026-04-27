package com.unihaz.tracerstudy.presentation.tracerstudy.steps

import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import com.google.android.material.textfield.TextInputEditText
import com.unihaz.tracerstudy.R
import com.unihaz.tracerstudy.data.model.Alumni
import com.unihaz.tracerstudy.presentation.tracerstudy.TracerStudyViewModel
import java.util.Locale

class Step2GraduationFragment : Fragment(R.layout.step_2_graduation) {
    private val viewModel: TracerStudyViewModel by viewModels({ requireParentFragment() })

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        viewModel.state.observe(viewLifecycleOwner) { state ->
            state.alumni?.let { render(view, it) }
        }
    }

    private fun render(view: View, alumni: Alumni) {
        view.findViewById<TextInputEditText>(R.id.etNimKelulusan).setText(alumni.nim)
        view.findViewById<TextInputEditText>(R.id.etProdiKelulusan).setText(alumni.prodi)
        view.findViewById<TextInputEditText>(R.id.etTahunMasuk).setText(alumni.tahunMasuk.formatYear())
        view.findViewById<TextInputEditText>(R.id.etTahunLulus).setText(alumni.tahunLulus.formatYear())
        view.findViewById<TextInputEditText>(R.id.etIpk).setText(alumni.ipk?.let { String.format(Locale.getDefault(), "%.2f", it) }.orEmpty())
    }

    private fun Int.formatYear(): String =
        takeIf { it > 0 }?.let { String.format(Locale.getDefault(), "%d", it) }.orEmpty()
}
