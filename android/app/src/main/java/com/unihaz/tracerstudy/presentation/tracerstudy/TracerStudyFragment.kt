package com.unihaz.tracerstudy.presentation.tracerstudy

import android.os.Bundle
import android.view.View
import android.widget.ProgressBar
import android.widget.TextView
import androidx.fragment.app.Fragment
import com.google.android.material.button.MaterialButton
import com.unihaz.tracerstudy.R
import com.unihaz.tracerstudy.core.utils.showMessage
import com.unihaz.tracerstudy.presentation.tracerstudy.steps.Step1PersonalFragment
import com.unihaz.tracerstudy.presentation.tracerstudy.steps.Step2GraduationFragment
import com.unihaz.tracerstudy.presentation.tracerstudy.steps.Step3WorkStatusFragment
import com.unihaz.tracerstudy.presentation.tracerstudy.steps.Step4WorkDataFragment
import com.unihaz.tracerstudy.presentation.tracerstudy.steps.Step5CompetencyFragment
import com.unihaz.tracerstudy.presentation.tracerstudy.steps.Step6FeedbackFragment
import org.koin.androidx.viewmodel.ext.android.viewModel

class TracerStudyFragment : Fragment(R.layout.fragment_tracer_study) {
    private val viewModel: TracerStudyViewModel by viewModel()
    private var renderedStep: Int? = null

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        val back = view.findViewById<MaterialButton>(R.id.btnWizardBack)
        val next = view.findViewById<MaterialButton>(R.id.btnWizardNext)
        back.setOnClickListener { viewModel.previous() }
        next.setOnClickListener {
            if (viewModel.state.value?.currentStep == 6) viewModel.submit() else viewModel.next()
        }
        viewModel.state.observe(viewLifecycleOwner) { state ->
            if (renderedStep != state.currentStep) {
                renderStep(state.currentStep)
                renderedStep = state.currentStep
            }
            view.findViewById<ProgressBar>(R.id.progressWizard).progress = state.currentStep
            next.text = if (state.currentStep == 6) "Kirim Tracer Study" else "Simpan & Lanjut"
            next.isEnabled = !state.loading
            back.isEnabled = state.currentStep > 1 && !state.loading
            state.error?.let(view::showMessage)
            if (state.submitted) view.showMessage("Tracer study berhasil dikirim")
        }
    }

    private fun renderStep(step: Int) {
        val fragment = when (step) {
            1 -> Step1PersonalFragment()
            2 -> Step2GraduationFragment()
            3 -> Step3WorkStatusFragment()
            4 -> Step4WorkDataFragment()
            5 -> Step5CompetencyFragment()
            else -> Step6FeedbackFragment()
        }
        view?.findViewById<TextView>(R.id.tvStepTitle)?.text = when (step) {
            1 -> "Langkah 1 dari 6 - Data Pribadi"
            2 -> "Langkah 2 dari 6 - Data Kelulusan"
            3 -> "Langkah 3 dari 6 - Status Pekerjaan"
            4 -> "Langkah 4 dari 6 - Data Pekerjaan"
            5 -> "Langkah 5 dari 6 - Penilaian Kompetensi"
            else -> "Langkah 6 dari 6 - Saran & Masukan"
        }
        childFragmentManager.beginTransaction()
            .replace(R.id.stepContainer, fragment)
            .commit()
    }
}
