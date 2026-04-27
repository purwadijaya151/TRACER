package com.unihaz.tracerstudy.data.local

import android.content.Context
import androidx.core.content.edit
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

data class Session(
    val accessToken: String,
    val refreshToken: String?,
    val alumniId: String
)

class SessionManager(context: Context) {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val prefs = EncryptedSharedPreferences.create(
        context,
        "tracer_secure_session",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun saveSession(accessToken: String, refreshToken: String?, alumniId: String) {
        prefs.edit {
            putString(KEY_ACCESS_TOKEN, accessToken)
            putString(KEY_REFRESH_TOKEN, refreshToken)
            putString(KEY_ALUMNI_ID, alumniId)
        }
    }

    fun getSession(): Session? {
        val accessToken = prefs.getString(KEY_ACCESS_TOKEN, null) ?: return null
        val alumniId = prefs.getString(KEY_ALUMNI_ID, null) ?: return null
        return Session(
            accessToken = accessToken,
            refreshToken = prefs.getString(KEY_REFRESH_TOKEN, null),
            alumniId = alumniId
        )
    }

    fun isLoggedIn(): Boolean = getSession() != null

    fun clearSession() {
        prefs.edit { clear() }
    }

    companion object {
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_REFRESH_TOKEN = "refresh_token"
        private const val KEY_ALUMNI_ID = "alumni_id"
    }
}
