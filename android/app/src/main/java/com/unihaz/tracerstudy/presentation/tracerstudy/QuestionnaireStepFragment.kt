package com.unihaz.tracerstudy.presentation.tracerstudy

import android.os.Bundle
import android.text.InputType
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.RadioGroup
import android.widget.ScrollView
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.core.os.bundleOf
import androidx.core.widget.doAfterTextChanged
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import com.google.android.material.checkbox.MaterialCheckBox
import com.google.android.material.radiobutton.MaterialRadioButton
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout
import com.unihaz.tracerstudy.R

class QuestionnaireStepFragment : Fragment() {
    private val viewModel: TracerStudyViewModel by viewModels({ requireParentFragment() })
    private val step: Int by lazy { requireArguments().getInt(ARG_STEP, 1) }
    private var content: LinearLayout? = null
    private var lastRenderedAnswers: Map<String, String>? = null
    private var lastRenderedConfirmed: Boolean? = null
    private var lastRenderedSectionSignature: String? = null

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        val context = requireContext()
        val scrollView = ScrollView(context).apply {
            layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
            isFillViewport = true
        }
        content = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundResource(R.drawable.bg_card)
            setPadding(dp(16), dp(16), dp(16), dp(20))
        }
        scrollView.addView(
            content,
            ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
        )
        return scrollView
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        viewModel.state.observe(viewLifecycleOwner) { state ->
            val sectionSignature = sectionSignature(state)
            val shouldRender = lastRenderedAnswers == null ||
                lastRenderedSectionSignature != sectionSignature ||
                (view.findFocus() !is TextInputEditText &&
                    (lastRenderedAnswers != state.tracerStudy.answers || lastRenderedConfirmed != state.confirmed))
            if (shouldRender) render(state)
        }
    }

    private fun render(state: WizardState) {
        val section = TracerStudyQuestionnaire.sectionForStep(step, state.sections)
        val answers = state.tracerStudy.answers
        val container = content ?: return
        container.removeAllViews()
        container.addView(sectionHeader(section.title))
        section.questions
            .filter { TracerStudyQuestionnaire.isVisible(it, answers) }
            .forEach { question ->
                container.addView(questionView(question, answers))
            }
        if (step == state.sections.size) {
            container.addView(confirmView(state.confirmed))
        }
        lastRenderedAnswers = answers.toMap()
        lastRenderedConfirmed = state.confirmed
        lastRenderedSectionSignature = sectionSignature(state)
    }

    private fun questionView(question: QuestionnaireQuestion, answers: Map<String, String>): View {
        return when (question) {
            is TextQuestion -> textQuestionView(question, answers)
            is SingleChoiceQuestion -> singleChoiceView(question, answers)
            is MultiChoiceQuestion -> multiChoiceView(question, answers)
            is ScaleQuestion -> scaleQuestionView(question, answers)
            is MatrixPairQuestion -> matrixPairView(question, answers)
        }
    }

    private fun textQuestionView(question: TextQuestion, answers: Map<String, String>): View {
        val context = requireContext()
        val wrapper = blockWrapper()
        wrapper.addView(labelView(requiredLabel(question)))
        val layout = TextInputLayout(context).apply {
            hint = question.suffix?.takeIf { it.isNotBlank() }?.let { "Isi dalam $it" } ?: "Isi jawaban"
            suffixText = question.suffix
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        }
        val input = TextInputEditText(context).apply {
            setText(answers[question.id].orEmpty())
            inputType = when (question.inputType) {
                TextQuestionType.Number -> InputType.TYPE_CLASS_NUMBER
                TextQuestionType.Date -> InputType.TYPE_CLASS_DATETIME or InputType.TYPE_DATETIME_VARIATION_DATE
                TextQuestionType.Text -> {
                    if (question.multiline) {
                        InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_CAP_SENTENCES or InputType.TYPE_TEXT_FLAG_MULTI_LINE
                    } else {
                        InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_CAP_SENTENCES
                    }
                }
            }
            maxLines = if (question.multiline) 6 else 1
            minLines = if (question.multiline) 3 else 1
            doAfterTextChanged { editable ->
                viewModel.updateAnswer(question.id, editable?.toString())
            }
        }
        layout.addView(input)
        wrapper.addView(layout)
        return wrapper
    }

    private fun singleChoiceView(question: SingleChoiceQuestion, answers: Map<String, String>): View {
        val wrapper = blockWrapper()
        wrapper.addView(labelView(requiredLabel(question)))
        val group = RadioGroup(requireContext()).apply {
            orientation = RadioGroup.VERTICAL
        }
        val idToValue = mutableMapOf<Int, String>()
        question.options.forEach { option ->
            val id = View.generateViewId()
            idToValue[id] = option.value
            group.addView(MaterialRadioButton(requireContext()).apply {
                this.id = id
                text = option.label
                textSize = 14f
                setTextColor(ContextCompat.getColor(requireContext(), R.color.text_primary))
                isChecked = answers[question.id] == option.value
            })
        }
        group.setOnCheckedChangeListener { _, checkedId ->
            viewModel.updateAnswer(question.id, idToValue[checkedId])
            render(viewModel.state.value ?: WizardState())
        }
        wrapper.addView(group)
        return wrapper
    }

    private fun multiChoiceView(question: MultiChoiceQuestion, answers: Map<String, String>): View {
        val wrapper = blockWrapper()
        wrapper.addView(labelView(requiredLabel(question)))
        question.options.forEach { option ->
            wrapper.addView(MaterialCheckBox(requireContext()).apply {
                text = option.label
                textSize = 14f
                setTextColor(ContextCompat.getColor(requireContext(), R.color.text_primary))
                isChecked = answers[option.field] == option.value
                setOnCheckedChangeListener { _, checked ->
                    viewModel.updateAnswer(option.field, if (checked) option.value else null)
                    render(viewModel.state.value ?: WizardState())
                }
            })
        }
        return wrapper
    }

    private fun scaleQuestionView(question: ScaleQuestion, answers: Map<String, String>): View {
        val wrapper = blockWrapper()
        wrapper.addView(labelView(requiredLabel(question)))
        wrapper.addView(scaleGroup(question.id, question.scale, answers[question.id]))
        return wrapper
    }

    private fun matrixPairView(question: MatrixPairQuestion, answers: Map<String, String>): View {
        val wrapper = blockWrapper()
        wrapper.addView(labelView(requiredLabel(question)))
        question.rows.forEach { row ->
            wrapper.addView(labelView(row.label, topMarginDp = 14))
            wrapper.addView(smallLabel(question.leftLabel))
            wrapper.addView(scaleGroup(row.leftField, question.scale, answers[row.leftField]))
            wrapper.addView(smallLabel(question.rightLabel))
            wrapper.addView(scaleGroup(row.rightField, question.scale, answers[row.rightField]))
        }
        return wrapper
    }

    private fun confirmView(confirmed: Boolean): MaterialCheckBox =
        MaterialCheckBox(requireContext()).apply {
            text = "Saya menyatakan data yang diisi sudah benar dan dapat digunakan untuk tracer study."
            textSize = 14f
            setTextColor(ContextCompat.getColor(requireContext(), R.color.text_primary))
            isChecked = confirmed
            layoutParams = blockParams()
            setOnCheckedChangeListener { _, checked -> viewModel.updateConfirmation(checked) }
        }

    private fun scaleGroup(field: String, options: List<ChoiceOption>, value: String?): RadioGroup {
        val group = RadioGroup(requireContext()).apply {
            orientation = RadioGroup.VERTICAL
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        }
        val idToValue = mutableMapOf<Int, String>()
        options.forEach { option ->
            val id = View.generateViewId()
            idToValue[id] = option.value
            group.addView(MaterialRadioButton(requireContext()).apply {
                this.id = id
                text = "${option.value}. ${option.label}"
                textSize = 14f
                setTextColor(ContextCompat.getColor(requireContext(), R.color.text_primary))
                isChecked = value == option.value
            })
        }
        group.setOnCheckedChangeListener { _, checkedId ->
            viewModel.updateAnswer(field, idToValue[checkedId])
        }
        return group
    }

    private fun requiredLabel(question: QuestionnaireQuestion): String {
        val state = viewModel.state.value ?: WizardState()
        val required = TracerStudyQuestionnaire.isRequired(question, state.tracerStudy.answers)
        return if (required) "${question.label} *" else question.label
    }

    private fun sectionHeader(title: String): TextView =
        TextView(requireContext()).apply {
            text = title
            textSize = 18f
            setTextColor(ContextCompat.getColor(requireContext(), R.color.text_primary))
            setTypeface(typeface, android.graphics.Typeface.BOLD)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { bottomMargin = dp(12) }
        }

    private fun labelView(textValue: String, topMarginDp: Int = 0): TextView =
        TextView(requireContext()).apply {
            text = textValue
            textSize = 15f
            setTextColor(ContextCompat.getColor(requireContext(), R.color.text_primary))
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                if (topMarginDp > 0) topMargin = dp(topMarginDp)
                bottomMargin = dp(6)
            }
        }

    private fun smallLabel(textValue: String): TextView =
        TextView(requireContext()).apply {
            text = textValue
            textSize = 12f
            setTextColor(ContextCompat.getColor(requireContext(), R.color.text_secondary))
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = dp(8)
                bottomMargin = dp(2)
            }
        }

    private fun blockWrapper(): LinearLayout =
        LinearLayout(requireContext()).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = blockParams()
        }

    private fun blockParams(): LinearLayout.LayoutParams =
        LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { bottomMargin = dp(18) }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

    private fun sectionSignature(state: WizardState): String {
        val section = TracerStudyQuestionnaire.sectionForStep(step, state.sections)
        return "${section.id}:${section.title}:${section.questions.joinToString(",") { it.id }}"
    }

    companion object {
        private const val ARG_STEP = "step"

        fun newInstance(step: Int): QuestionnaireStepFragment =
            QuestionnaireStepFragment().apply {
                arguments = bundleOf(ARG_STEP to step)
            }
    }
}
