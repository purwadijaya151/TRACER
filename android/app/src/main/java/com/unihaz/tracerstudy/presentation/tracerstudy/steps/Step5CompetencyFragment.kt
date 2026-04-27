package com.unihaz.tracerstudy.presentation.tracerstudy.steps

import android.os.Bundle
import android.view.View
import android.widget.RatingBar
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import com.unihaz.tracerstudy.R
import com.unihaz.tracerstudy.data.model.TracerStudy
import com.unihaz.tracerstudy.presentation.tracerstudy.TracerStudyViewModel

class Step5CompetencyFragment : Fragment(R.layout.step_5_competency) {
    private val viewModel: TracerStudyViewModel by viewModels({ requireParentFragment() })

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        val tracerStudy = viewModel.state.value?.tracerStudy ?: TracerStudy()
        val bindings = listOf(
            RatingBinding(
                rowId = R.id.ratingHardSkill,
                label = "Hard Skill / Kemampuan Teknis",
                value = tracerStudy.nilaiHardSkill,
                update = { rating -> copy(nilaiHardSkill = rating) }
            ),
            RatingBinding(
                rowId = R.id.ratingSoftSkill,
                label = "Soft Skill / Interpersonal",
                value = tracerStudy.nilaiSoftSkill,
                update = { rating -> copy(nilaiSoftSkill = rating) }
            ),
            RatingBinding(
                rowId = R.id.ratingBahasa,
                label = "Bahasa Asing (Inggris)",
                value = tracerStudy.nilaiBahasaAsing,
                update = { rating -> copy(nilaiBahasaAsing = rating) }
            ),
            RatingBinding(
                rowId = R.id.ratingIt,
                label = "Penguasaan Teknologi & IT",
                value = tracerStudy.nilaiIt,
                update = { rating -> copy(nilaiIt = rating) }
            ),
            RatingBinding(
                rowId = R.id.ratingLeadership,
                label = "Kepemimpinan & Manajemen",
                value = tracerStudy.nilaiKepemimpinan,
                update = { rating -> copy(nilaiKepemimpinan = rating) }
            )
        )
        bindings.forEach { binding ->
            val row = view.findViewById<View>(binding.rowId)
            row.findViewById<TextView>(R.id.tvRatingLabel).text = binding.label
            row.findViewById<RatingBar>(R.id.ratingValue).apply {
                rating = binding.value?.toFloat() ?: 0f
                setOnRatingBarChangeListener { _, value, _ ->
                    viewModel.updateTracer { binding.update(this, value.toOptionalRating()) }
                }
            }
        }
    }

    private data class RatingBinding(
        val rowId: Int,
        val label: String,
        val value: Int?,
        val update: TracerStudy.(Int?) -> TracerStudy
    )

    private fun Float.toOptionalRating(): Int? = toInt().takeIf { it > 0 }
}
