package com.unihaz.tracerstudy.presentation.tracerstudy

import android.os.Bundle
import android.view.View
import android.widget.ProgressBar
import android.widget.TextView
import androidx.fragment.app.Fragment
import com.google.android.material.button.MaterialButton
import com.unihaz.tracerstudy.R
import com.unihaz.tracerstudy.core.utils.showMessage
import org.koin.androidx.viewmodel.ext.android.viewModel

class TracerStudyFragment : Fragment(R.layout.fragment_tracer_study) {
    private val viewModel: TracerStudyViewModel by viewModel()
    private var renderedSignature: String? = null

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        val back = view.findViewById<MaterialButton>(R.id.btnWizardBack)
        val next = view.findViewById<MaterialButton>(R.id.btnWizardNext)
        val progress = view.findViewById<ProgressBar>(R.id.progressWizard)
        progress.max = TracerStudyQuestionnaire.sections.size
        back.setOnClickListener { viewModel.previous() }
        next.setOnClickListener {
            val state = viewModel.state.value ?: WizardState()
            if (state.currentStep == state.sections.size) viewModel.submit() else viewModel.next()
        }
        viewModel.state.observe(viewLifecycleOwner) { state ->
            val totalSteps = state.sections.size.coerceAtLeast(1)
            val signature = renderSignature(state)
            if (renderedSignature != signature) {
                renderStep(state)
                renderedSignature = signature
            }
            progress.max = totalSteps
            progress.progress = state.currentStep
            next.text = if (state.currentStep == totalSteps) "Kirim Tracer Study" else "Simpan & Lanjut"
            next.isEnabled = !state.loading
            back.isEnabled = state.currentStep > 1 && !state.loading
            state.error?.let(view::showMessage)
            if (state.submitted) view.showMessage("Tracer study berhasil dikirim")
        }
    }

    private fun renderStep(state: WizardState) {
        val step = state.currentStep
        val section = TracerStudyQuestionnaire.sectionForStep(step, state.sections)
        val total = state.sections.size.coerceAtLeast(1)
        val fragment = QuestionnaireStepFragment.newInstance(step)
        view?.findViewById<TextView>(R.id.tvStepTitle)?.text = "Langkah $step dari $total - ${section.title}"
        childFragmentManager.beginTransaction()
            .replace(R.id.stepContainer, fragment)
            .commit()
    }

    private fun renderSignature(state: WizardState): String =
        "${state.currentStep}:${state.sections.joinToString("|") { section ->
            "${section.id}:${section.title}:${section.questions.joinToString(",") { it.id }}"
        }}"
}
