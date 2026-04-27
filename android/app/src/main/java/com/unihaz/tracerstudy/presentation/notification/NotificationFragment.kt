package com.unihaz.tracerstudy.presentation.notification

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.widget.LinearLayout
import android.widget.TextView
import androidx.fragment.app.Fragment
import com.unihaz.tracerstudy.R
import com.unihaz.tracerstudy.core.utils.showMessage
import org.koin.androidx.viewmodel.ext.android.viewModel

class NotificationFragment : Fragment(R.layout.fragment_notification) {
    private val viewModel: NotificationViewModel by viewModel()

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        val markAllRead = view.findViewById<TextView>(R.id.tvMarkAllRead)
        markAllRead.setOnClickListener {
            viewModel.markAllAsRead()
        }
        viewModel.state.observe(viewLifecycleOwner) { state ->
            val list = view.findViewById<LinearLayout>(R.id.notificationList)
            val empty = view.findViewById<TextView>(R.id.tvNotificationEmpty)
            list.removeAllViews()
            empty.text = getString(if (state.loading) R.string.loading_notifications else R.string.empty_notifications)
            empty.visibility = if (state.notifications.isEmpty()) View.VISIBLE else View.GONE
            val hasUnread = state.notifications.any { !it.isRead }
            markAllRead.isEnabled = hasUnread && !state.loading
            markAllRead.alpha = if (markAllRead.isEnabled) 1f else 0.45f
            state.error?.let(view::showMessage)
            state.notifications.forEach { notification ->
                val item = LayoutInflater.from(requireContext()).inflate(R.layout.view_notification_item, list, false)
                item.findViewById<TextView>(R.id.tvNotificationTitle).text = notification.title
                item.findViewById<TextView>(R.id.tvNotificationBody).text = notification.body
                item.setBackgroundResource(if (notification.isRead) R.drawable.bg_card else R.drawable.bg_unread_notification)
                item.setOnClickListener { viewModel.markAsRead(notification.id) }
                list.addView(item)
            }
        }
    }

    override fun onResume() {
        super.onResume()
        viewModel.load()
    }
}
