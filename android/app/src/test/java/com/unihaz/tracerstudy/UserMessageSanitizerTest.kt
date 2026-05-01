package com.unihaz.tracerstudy

import com.unihaz.tracerstudy.core.utils.UserMessageSanitizer
import org.junit.Assert.assertEquals
import org.junit.Test

class UserMessageSanitizerTest {
    @Test
    fun keepsUserSafeSnackbarMessages() {
        assertEquals("Profil berhasil diperbarui", UserMessageSanitizer.snackbar("Profil berhasil diperbarui"))
    }

    @Test
    fun hidesTechnicalSnackbarMessages() {
        assertEquals(
            "Terjadi kesalahan, silakan coba beberapa saat lagi",
            UserMessageSanitizer.snackbar("Supabase PostgREST HTTP 403 permission denied")
        )
    }

    @Test
    fun hidesTechnicalNotificationContent() {
        assertEquals("Pemberitahuan", UserMessageSanitizer.notificationTitle("PGRST204 schema cache error"))
        assertEquals(
            "Ada pembaruan dari sistem. Silakan periksa kembali data Anda.",
            UserMessageSanitizer.notificationBody("select * from public.alumni")
        )
    }

    @Test
    fun replacesEmptyNotificationBody() {
        assertEquals("Tidak ada detail notifikasi.", UserMessageSanitizer.notificationBody("   "))
    }
}
