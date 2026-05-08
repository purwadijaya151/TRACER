package com.unihaz.tracerstudy.presentation.home

import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.widget.TextView
import androidx.fragment.app.Fragment
import com.unihaz.tracerstudy.R
import com.unihaz.tracerstudy.core.utils.showMessage
import com.unihaz.tracerstudy.presentation.main.MainActivity
import org.koin.androidx.viewmodel.ext.android.viewModel
import java.util.Locale

class HomeFragment : Fragment(R.layout.fragment_home) {
    private val viewModel: HomeViewModel by viewModel()

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        view.findViewById<View>(R.id.cardTracer).setOnClickListener { (activity as? MainActivity)?.openTracerStudy() }
        view.findViewById<View>(R.id.cardProfile).setOnClickListener { (activity as? MainActivity)?.openProfile() }
        view.findViewById<View>(R.id.cardHistory).setOnClickListener { (activity as? MainActivity)?.openHistory() }
        view.findViewById<View>(R.id.cardContact).setOnClickListener { openWhatsAppContact(view) }
        view.findViewById<View>(R.id.homeBell).setOnClickListener { (activity as? MainActivity)?.openNotifications() }

        viewModel.state.observe(viewLifecycleOwner) { state ->
            val alumni = state.alumni
            if (alumni != null) {
                view.findViewById<TextView>(R.id.tvHomeGreeting).text = getString(R.string.home_greeting_format, alumni.namaLengkap)
                view.findViewById<TextView>(R.id.tvHomeMeta).text = getString(R.string.home_meta_format, alumni.prodi, alumni.angkatan)
            }
            view.findViewById<TextView>(R.id.tvUnreadBadge).text = String.format(Locale.getDefault(), "%d", state.unreadCount)
            val submitted = state.tracerStudy?.isSubmitted == true
            view.findViewById<TextView>(R.id.tvTracerStatus).text =
                getString(if (submitted) R.string.tracer_status_submitted else R.string.tracer_status_not_submitted)
            state.error?.let(view::showMessage)
        }
    }

    override fun onResume() {
        super.onResume()
        viewModel.load()
    }

    private fun openWhatsAppContact(view: View) {
        val contactUri = Uri.parse(getString(R.string.contact_whatsapp_url))
        val intent = Intent(Intent.ACTION_VIEW, contactUri)
        runCatching { startActivity(intent) }
            .onFailure {
                if (it is ActivityNotFoundException) {
                    view.showMessage(getString(R.string.contact_open_failed))
                } else {
                    throw it
                }
            }
    }
}
