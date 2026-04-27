package com.unihaz.tracerstudy.presentation.tracerstudy.steps

import android.os.Bundle
import android.view.View
import android.widget.ArrayAdapter
import android.widget.RatingBar
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.core.widget.doAfterTextChanged
import com.google.android.material.textfield.MaterialAutoCompleteTextView
import com.google.android.material.textfield.TextInputEditText
import com.unihaz.tracerstudy.R
import com.unihaz.tracerstudy.core.utils.Constants
import com.unihaz.tracerstudy.presentation.tracerstudy.TracerStudyViewModel

class Step4WorkDataFragment : Fragment(R.layout.step_4_work_data) {
    private val viewModel: TracerStudyViewModel by viewModels({ requireParentFragment() })

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        val tracerStudy = viewModel.state.value?.tracerStudy
        val rentangGaji = view.findViewById<MaterialAutoCompleteTextView>(R.id.spRentangGaji)
        rentangGaji.setAdapter(ArrayAdapter(requireContext(), R.layout.item_dropdown_option, Constants.RENTANG_GAJI))
        rentangGaji.setText(tracerStudy?.rentangGaji.orEmpty(), false)
        rentangGaji.setOnItemClickListener { _, _, position, _ ->
            viewModel.updateTracer { copy(rentangGaji = Constants.RENTANG_GAJI[position]) }
        }

        view.findViewById<TextInputEditText>(R.id.etNamaPerusahaan)
            .bindText(tracerStudy?.namaPerusahaan) { value -> viewModel.updateTracer { copy(namaPerusahaan = value) } }
        view.findViewById<TextInputEditText>(R.id.etBidangPekerjaan)
            .bindText(tracerStudy?.bidangPekerjaan) { value -> viewModel.updateTracer { copy(bidangPekerjaan = value) } }
        view.findViewById<TextInputEditText>(R.id.etJabatan)
            .bindText(tracerStudy?.jabatan) { value -> viewModel.updateTracer { copy(jabatan = value) } }
        view.findViewById<TextInputEditText>(R.id.etProvinsiKerja)
            .bindText(tracerStudy?.provinsiKerja) { value -> viewModel.updateTracer { copy(provinsiKerja = value) } }

        view.findViewById<RatingBar>(R.id.ratingKesesuaian).apply {
            rating = tracerStudy?.kesesuaianBidang?.toFloat() ?: 0f
            setOnRatingBarChangeListener { _, value, _ ->
                viewModel.updateTracer { copy(kesesuaianBidang = value.toOptionalRating()) }
            }
        }
    }

    private fun TextInputEditText.bindText(value: String?, onChanged: (String?) -> Unit) {
        setText(value.orEmpty())
        doAfterTextChanged { editable ->
            onChanged(editable?.toString()?.trim()?.takeIf { it.isNotEmpty() })
        }
    }

    private fun Float.toOptionalRating(): Int? = toInt().takeIf { it > 0 }
}
