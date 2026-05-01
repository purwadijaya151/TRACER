package com.unihaz.tracerstudy.presentation.profile

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.ImageView
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import coil.load
import coil.transform.CircleCropTransformation
import com.unihaz.tracerstudy.R
import com.unihaz.tracerstudy.core.utils.UserMessages
import com.unihaz.tracerstudy.core.utils.showMessage
import com.unihaz.tracerstudy.presentation.auth.AuthActivity
import org.koin.androidx.viewmodel.ext.android.viewModel

class ProfileFragment : Fragment(R.layout.fragment_profile) {
    private val viewModel: ProfileViewModel by viewModel()

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        val refresh = view.findViewById<SwipeRefreshLayout>(R.id.profileRefresh)
        refresh.setOnRefreshListener { viewModel.load() }
        view.findViewById<TextView>(R.id.btnLogout).setOnClickListener { viewModel.logout() }
        view.findViewById<View>(R.id.btnEditProfile).setOnClickListener {
            view.showMessage(UserMessages.EDIT_PROFILE_UNAVAILABLE)
        }

        viewModel.state.observe(viewLifecycleOwner) { state ->
            refresh.isRefreshing = state.loading
            state.error?.let(view::showMessage)
            val alumni = state.alumni
            if (alumni != null) {
                val submitted = state.tracerStudy?.isSubmitted == true
                view.findViewById<TextView>(R.id.tvProfileName).text = alumni.namaLengkap
                view.findViewById<TextView>(R.id.tvProfileMeta).text = getString(R.string.profile_meta_format, alumni.nim, alumni.prodi)
                view.findViewById<TextView>(R.id.tvProfileTracerStatus).apply {
                    text = getString(if (submitted) R.string.tracer_status_submitted else R.string.tracer_status_not_submitted)
                    setBackgroundResource(if (submitted) R.drawable.bg_badge_success else R.drawable.bg_badge_gold)
                    setTextColor(
                        ContextCompat.getColor(
                            requireContext(),
                            if (submitted) R.color.status_success else R.color.status_warning
                        )
                    )
                }
                view.findViewById<TextView>(R.id.tvProfileEmail).text =
                    getString(R.string.profile_email_format, alumni.email ?: getString(R.string.placeholder_dash))
                view.findViewById<TextView>(R.id.tvProfilePhone).text =
                    getString(R.string.profile_phone_format, alumni.noHp ?: getString(R.string.placeholder_dash))
                view.findViewById<TextView>(R.id.tvProfileAngkatan).text = getString(R.string.profile_angkatan_format, alumni.angkatan)
                view.findViewById<ImageView>(R.id.ivProfilePhoto).load(alumni.fotoUrl) {
                    placeholder(R.drawable.bg_avatar)
                    transformations(CircleCropTransformation())
                }
            }
            if (state.loggedOut) {
                startActivity(Intent(requireContext(), AuthActivity::class.java))
                requireActivity().finish()
            }
        }
    }

    override fun onResume() {
        super.onResume()
        viewModel.load()
    }
}
