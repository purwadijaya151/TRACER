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

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        val group = view.findViewById<RadioGroup>(R.id.rgStatusKerja)
        val selectedId = when (viewModel.state.value?.tracerStudy?.statusKerja) {
            "Bekerja" -> R.id.rbBekerja
            "Wirausaha" -> R.id.rbWirausaha
            "Melanjutkan Studi" -> R.id.rbStudi
            else -> R.id.rbBelum
        }
        group.check(selectedId)
        group.setOnCheckedChangeListener { _, checkedId ->
            val status = when (checkedId) {
                R.id.rbBekerja -> "Bekerja"
                R.id.rbWirausaha -> "Wirausaha"
                R.id.rbStudi -> "Melanjutkan Studi"
                else -> "Belum Bekerja"
            }
            viewModel.updateStatusKerja(status)
        }
    }
}
