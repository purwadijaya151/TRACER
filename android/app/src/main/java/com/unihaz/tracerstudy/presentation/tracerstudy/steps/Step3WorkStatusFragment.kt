package com.unihaz.tracerstudy.presentation.tracerstudy.steps

import android.os.Bundle
import android.view.View
import android.widget.RadioGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import com.unihaz.tracerstudy.R
import com.unihaz.tracerstudy.presentation.tracerstudy.TracerStudyViewModel

class Step3WorkStatusFragment : Fragment(R.layout.step_3_work_status) {
    private val viewModel: TracerStudyViewModel by viewModels({ requireParentFragment() })
    private var syncingSelection = false

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        val group = view.findViewById<RadioGroup>(R.id.rgStatusKerja)
        group.setOnCheckedChangeListener { _, checkedId ->
            if (syncingSelection) return@setOnCheckedChangeListener
            val status = when (checkedId) {
                R.id.rbBekerja -> "Bekerja"
                R.id.rbWirausaha -> "Wirausaha"
                R.id.rbStudi -> "Melanjutkan Studi"
                R.id.rbBelum -> "Belum Bekerja"
                else -> ""
            }
            if (status.isNotBlank()) {
                viewModel.updateStatusKerja(status)
            }
        }
        viewModel.state.observe(viewLifecycleOwner) { state ->
            syncingSelection = true
            when (state.tracerStudy.statusKerja) {
                "Bekerja" -> group.check(R.id.rbBekerja)
                "Wirausaha" -> group.check(R.id.rbWirausaha)
                "Melanjutkan Studi" -> group.check(R.id.rbStudi)
                "Belum Bekerja" -> group.check(R.id.rbBelum)
                else -> group.clearCheck()
            }
            syncingSelection = false
        }
    }
}
