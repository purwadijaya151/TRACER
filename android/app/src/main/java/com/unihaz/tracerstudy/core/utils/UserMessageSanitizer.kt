package com.unihaz.tracerstudy.core.utils

object UserMessageSanitizer {
    private const val GENERIC_ERROR = "Terjadi kesalahan, silakan coba beberapa saat lagi"
    private const val SAFE_NOTIFICATION_TITLE = "Pemberitahuan"
    private const val SAFE_NOTIFICATION_BODY = "Ada pembaruan dari sistem. Silakan periksa kembali data Anda."
    private const val EMPTY_NOTIFICATION_BODY = "Tidak ada detail notifikasi."

    private val technicalTerms = listOf(
        "supabase",
        "postgrest",
        "jwt",
        "schema",
        "sqlstate",
        "postgres",
        "database",
        "relation",
        "column",
        "constraint",
        "foreign key",
        "duplicate key",
        "violates",
        "row-level security",
        "rls",
        "permission denied",
        "auth/v1",
        "rest/v1",
        "pgrst",
        "ktor",
        "exception",
        "stacktrace",
        "nullpointer"
    )

    private val technicalPatterns = listOf(
        Regex("\\bselect\\b.+\\bfrom\\b", RegexOption.IGNORE_CASE),
        Regex("\\binsert\\s+into\\b", RegexOption.IGNORE_CASE),
        Regex("\\bdelete\\s+from\\b", RegexOption.IGNORE_CASE),
        Regex("\\bupdate\\s+\\w+\\s+set\\b", RegexOption.IGNORE_CASE),
        Regex("\\b(alter|drop|create)\\s+(table|policy|schema|function)\\b", RegexOption.IGNORE_CASE),
        Regex("\\b(public|auth)\\.\\w+\\b", RegexOption.IGNORE_CASE),
        Regex("\\b(22P02|23505|42501|42P01|PGRST\\d+)\\b", RegexOption.IGNORE_CASE),
        Regex("\\bHTTP\\s+[45]\\d{2}\\b", RegexOption.IGNORE_CASE)
    )

    fun snackbar(message: String): String = sanitize(message, GENERIC_ERROR)

    fun notificationTitle(title: String): String = sanitize(title, SAFE_NOTIFICATION_TITLE)

    fun notificationBody(body: String): String {
        val trimmed = body.trim()
        if (trimmed.isEmpty()) return EMPTY_NOTIFICATION_BODY
        return sanitize(trimmed, SAFE_NOTIFICATION_BODY)
    }

    private fun sanitize(message: String, fallback: String): String {
        val trimmed = message.trim()
        if (trimmed.isEmpty()) return fallback
        return if (containsTechnicalText(trimmed)) fallback else trimmed
    }

    private fun containsTechnicalText(message: String): Boolean {
        val lowercase = message.lowercase()
        return technicalTerms.any(lowercase::contains) || technicalPatterns.any { it.containsMatchIn(message) }
    }
}
