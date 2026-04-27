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
    private var renderedStep: Int? = null

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        val back = view.findViewById<MaterialButton>(R.id.btnWizardBack)
        val next = view.findViewById<MaterialButton>(R.id.btnWizardNext)
        val progress = view.findViewById<ProgressBar>(R.id.progressWizard)
        progress.max = TracerStudyQuestionnaire.sections.size
        back.setOnClickListener { viewModel.previous() }
        next.setOnClickListener {
            if (viewModel.state.value?.currentStep == TracerStudyQuestionnaire.sections.size) viewModel.submit() else viewModel.next()
        }
        viewModel.state.observe(viewLifecycleOwner) { state ->
            if (renderedStep != state.currentStep) {
                renderStep(state.currentStep)
                renderedStep = state.currentStep
            }
            progress.progress = state.currentStep
            next.text = if (state.currentStep == TracerStudyQuestionnaire.sections.size) "Kirim Tracer Study" else "Simpan & Lanjut"
            next.isEnabled = !state.loading
            back.isEnabled = state.currentStep > 1 && !state.loading
            state.error?.let(view::showMessage)
            if (state.submitted) view.showMessage("Tracer study berhasil dikirim")
        }
    }

    private fun renderStep(step: Int) {
        val section = TracerStudyQuestionnaire.sectionForStep(step)
        val total = TracerStudyQuestionnaire.sections.size
        val fragment = QuestionnaireStepFragment.newInstance(step)
        view?.findViewById<TextView>(R.id.tvStepTitle)?.text = "Langkah $step dari $total - ${section.title}"
        childFragmentManager.beginTransaction()
            .replace(R.id.stepContainer, fragment)
            .commit()
    }
}
