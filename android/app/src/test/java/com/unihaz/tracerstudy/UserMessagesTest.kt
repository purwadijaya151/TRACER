package com.unihaz.tracerstudy

import com.unihaz.tracerstudy.core.utils.UserMessages
import org.junit.Assert.assertFalse
import org.junit.Test

class UserMessagesTest {
    @Test
    fun profileMessagesDoNotExposeTechnicalBackendTerms() {
        val bannedTerms = listOf(
            "supabase",
            "schema",
            "postgrest",
            "rest/v1",
            "auth/v1",
            "storage/v1",
            "jwt",
            "bearer",
            "sql",
            "database"
        )

        val messages = listOf(
            UserMessages.EDIT_PROFILE_UNAVAILABLE,
            UserMessages.PROFILE_NOT_AVAILABLE
        )

        messages.forEach { message ->
            val normalized = message.lowercase()
            bannedTerms.forEach { term ->
                assertFalse("$message should not expose $term", normalized.contains(term))
            }
        }
    }
}
