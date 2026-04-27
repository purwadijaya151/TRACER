package com.unihaz.tracerstudy.core.utils

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

object DateUtils {
    fun nowIso(): String {
        val formatter = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US)
        formatter.timeZone = TimeZone.getTimeZone("UTC")
        return formatter.format(Date())
    }

    fun displayDate(isoDate: String?): String {
        if (isoDate.isNullOrBlank()) return "-"
        return isoDate.take(10).split("-").let {
            if (it.size == 3) "${it[2]}/${it[1]}/${it[0]}" else isoDate
        }
    }
}
