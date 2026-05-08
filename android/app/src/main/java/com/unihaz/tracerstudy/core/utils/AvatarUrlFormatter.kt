package com.unihaz.tracerstudy.core.utils

import android.net.Uri

object AvatarUrlFormatter {
    fun withVersion(url: String?, updatedAt: String?): String? {
        if (url.isNullOrBlank() || updatedAt.isNullOrBlank()) return url

        return runCatching {
            val parsed = Uri.parse(url)
            parsed.buildUpon()
                .appendQueryParameter("v", updatedAt)
                .build()
                .toString()
        }.getOrElse {
            val separator = if (url.contains("?")) "&" else "?"
            "$url${separator}v=$updatedAt"
        }
    }
}
