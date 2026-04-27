package com.unihaz.tracerstudy.presentation.tracerstudy.steps

import android.os.Bundle
import android.view.View
import android.widget.CheckBox
import androidx.core.widget.doAfterTextChanged
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import com.google.android.material.textfield.TextInputEditText
import com.unihaz.tracerstudy.R
import com.unihaz.tracerstudy.presentation.tracerstudy.TracerStudyViewModel

class Step6FeedbackFragment : Fragment(R.layout.step_6_feedback) {
    private val viewModel: TracerStudyViewModel by viewModels({ requireParentFragment() })

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        val state = viewModel.state.value
        val tracerStudy = state?.tracerStudy

        view.findViewById<TextInputEditText>(R.id.etSaranKurikulum)
            .bindText(tracerStudy?.saranKurikulum) { value -> viewModel.updateTracer { copy(saranKurikulum = value) } }
        view.findViewById<TextInputEditText>(R.id.etKesanKuliah)
            .bindText(tracerStudy?.kesanKuliah) { value -> viewModel.updateTracer { copy(kesanKuliah = value) } }
        view.findViewById<CheckBox>(R.id.cbConfirmData).apply {
            isChecked = state?.confirmed == true
            setOnCheckedChangeListener { _, checked -> viewModel.updateConfirmation(checked) }
        }
    }

    private fun TextInputEditText.bindText(value: String?, onChanged: (String?) -> Unit) {
        setText(value.orEmpty())
        doAfterTextChanged { editable ->
            onChanged(editable?.toString()?.trim()?.takeIf { it.isNotEmpty() })
        }
    }
}
