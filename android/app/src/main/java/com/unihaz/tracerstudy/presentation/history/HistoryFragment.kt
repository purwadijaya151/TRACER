package com.unihaz.tracerstudy.presentation.history

import android.os.Bundle
import android.view.View
import android.widget.TextView
import androidx.activity.addCallback
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.google.android.material.button.MaterialButton
import com.unihaz.tracerstudy.R
import com.unihaz.tracerstudy.core.utils.DateUtils
import com.unihaz.tracerstudy.core.utils.showMessage
import com.unihaz.tracerstudy.data.model.TracerStudy
import com.unihaz.tracerstudy.presentation.main.MainActivity
import org.koin.androidx.viewmodel.ext.android.viewModel

class HistoryFragment : Fragment(R.layout.fragment_history) {
    private val viewModel: HistoryViewModel by viewModel()

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        requireActivity().onBackPressedDispatcher.addCallback(viewLifecycleOwner) {
            (activity as? MainActivity)?.openHome()
        }

        val refresh = view.findViewById<SwipeRefreshLayout>(R.id.historyRefresh)
        val content = view.findViewById<View>(R.id.historyContent)
        val emptyState = view.findViewById<View>(R.id.historyEmptyState)

        view.findViewById<View>(R.id.btnHistoryBack).setOnClickListener {
            (activity as? MainActivity)?.openHome()
        }
        view.findViewById<MaterialButton>(R.id.btnHistoryFillTracer).setOnClickListener {
            (activity as? MainActivity)?.openTracerStudy()
        }
        refresh.setOnRefreshListener { viewModel.load() }

        viewModel.state.observe(viewLifecycleOwner) { state ->
            refresh.isRefreshing = state.loading
            val submittedTracer = state.latestTracerStudy?.takeIf { it.isSubmitted }
            content.isVisible = submittedTracer != null
            emptyState.isVisible = submittedTracer == null && !state.loading

            submittedTracer?.let { bindTracerHistory(view, it, state.history) }
            state.error?.let(view::showMessage)
        }
    }

    override fun onResume() {
        super.onResume()
        viewModel.load()
    }

    private fun bindTracerHistory(view: View, tracerStudy: TracerStudy, history: List<TracerStudy>) {
        view.findViewById<TextView>(R.id.tvHistoryTotalValue).text =
            resources.getQuantityString(R.plurals.history_total_count, history.size, history.size)
        view.findViewById<TextView>(R.id.tvHistoryTimelineValue).text = buildTimeline(history)
        view.findViewById<TextView>(R.id.tvHistoryStatusValue).text =
            getString(R.string.history_status_submitted)
        view.findViewById<TextView>(R.id.tvHistorySubmittedAtValue).text =
            DateUtils.displayDate(tracerStudy.submittedAt)
        view.findViewById<TextView>(R.id.tvHistoryVersionValue).text = tracerStudy.questionnaireVersion.ifBlank { "-" }
        view.findViewById<TextView>(R.id.tvHistoryAnswersCountValue).text =
            getString(R.string.history_answers_count_format, tracerStudy.answers.size)
        view.findViewById<TextView>(R.id.tvHistoryStatusKerjaValue).text =
            formatLabelValue(R.string.history_status_kerja_label, tracerStudy.statusKerja.ifBlank { "-" })
        view.findViewById<TextView>(R.id.tvHistoryWaktuTungguValue).text =
            formatLabelValue(R.string.history_waktu_tunggu_label, tracerStudy.waktuTunggu.orDash())
        view.findViewById<TextView>(R.id.tvHistoryNamaPerusahaanValue).text =
            formatLabelValue(R.string.history_nama_perusahaan_label, tracerStudy.namaPerusahaan.orDash())
        view.findViewById<TextView>(R.id.tvHistoryBidangValue).text =
            formatLabelValue(R.string.history_bidang_label, tracerStudy.bidangPekerjaan.orDash())
        view.findViewById<TextView>(R.id.tvHistoryJabatanValue).text =
            formatLabelValue(R.string.history_jabatan_label, tracerStudy.jabatan.orDash())
        view.findViewById<TextView>(R.id.tvHistoryGajiValue).text =
            formatLabelValue(R.string.history_gaji_label, tracerStudy.rentangGaji.orDash())
        view.findViewById<TextView>(R.id.tvHistoryProvinsiValue).text =
            formatLabelValue(R.string.history_provinsi_label, tracerStudy.provinsiKerja.orDash())
        view.findViewById<TextView>(R.id.tvHistoryKesesuaianValue).text =
            formatLabelValue(R.string.history_kesesuaian_label, tracerStudy.kesesuaianBidang.asRating())
        view.findViewById<TextView>(R.id.tvHistoryHardSkillValue).text =
            formatLabelValue(R.string.history_hard_skill_label, tracerStudy.nilaiHardSkill.asRating())
        view.findViewById<TextView>(R.id.tvHistorySoftSkillValue).text =
            formatLabelValue(R.string.history_soft_skill_label, tracerStudy.nilaiSoftSkill.asRating())
        view.findViewById<TextView>(R.id.tvHistoryBahasaValue).text =
            formatLabelValue(R.string.history_bahasa_label, tracerStudy.nilaiBahasaAsing.asRating())
        view.findViewById<TextView>(R.id.tvHistoryItValue).text =
            formatLabelValue(R.string.history_it_label, tracerStudy.nilaiIt.asRating())
        view.findViewById<TextView>(R.id.tvHistoryLeadershipValue).text =
            formatLabelValue(R.string.history_leadership_label, tracerStudy.nilaiKepemimpinan.asRating())
        view.findViewById<TextView>(R.id.tvHistorySaranValue).text =
            formatLabelValue(R.string.history_saran_label, tracerStudy.saranKurikulum.orDash())
        view.findViewById<TextView>(R.id.tvHistoryKesanValue).text =
            formatLabelValue(R.string.history_kesan_label, tracerStudy.kesanKuliah.orDash())
    }

    private fun buildTimeline(history: List<TracerStudy>): String {
        if (history.isEmpty()) return getString(R.string.history_timeline_empty)
        return history
            .take(5)
            .mapIndexed { index, item ->
                getString(
                    R.string.history_timeline_item_format,
                    index + 1,
                    DateUtils.displayDate(item.submittedAt)
                )
            }
            .joinToString("\n")
    }

    private fun String?.orDash(): String = this?.takeIf { it.isNotBlank() } ?: "-"

    private fun Int?.asRating(): String = this?.toString() ?: "-"

    private fun formatLabelValue(labelResId: Int, value: String): String = "${getString(labelResId)}: $value"
}
