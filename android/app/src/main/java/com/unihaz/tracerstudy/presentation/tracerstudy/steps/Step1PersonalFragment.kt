package com.unihaz.tracerstudy.presentation.tracerstudy.steps

import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import com.google.android.material.textfield.TextInputEditText
import com.unihaz.tracerstudy.R
import com.unihaz.tracerstudy.data.model.Alumni
import com.unihaz.tracerstudy.presentation.tracerstudy.TracerStudyViewModel

class Step1PersonalFragment : Fragment(R.layout.step_1_personal) {
    private val viewModel: TracerStudyViewModel by viewModels({ requireParentFragment() })

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        viewModel.state.observe(viewLifecycleOwner) { state ->
            state.alumni?.let { render(view, it) }
        }
    }

    private fun render(view: View, alumni: Alumni) {
        view.findViewById<TextInputEditText>(R.id.etNamaLengkap).setText(alumni.namaLengkap)
        view.findViewById<TextInputEditText>(R.id.etTempatLahir).setText(alumni.tempatLahir.orEmpty())
        view.findViewById<TextInputEditText>(R.id.etTanggalLahir).setText(alumni.tanggalLahir.orEmpty())
        view.findViewById<TextInputEditText>(R.id.etNoHp).setText(alumni.noHp.orEmpty())
        view.findViewById<TextInputEditText>(R.id.etAlamat).setText(alumni.alamat.orEmpty())
    }
}
