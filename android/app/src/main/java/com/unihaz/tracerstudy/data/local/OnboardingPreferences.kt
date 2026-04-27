package com.unihaz.tracerstudy.data.local

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first

private val Context.onboardingStore by preferencesDataStore(name = "onboarding")

class OnboardingPreferences(context: Context) {
    private val dataStore = context.applicationContext.onboardingStore

    suspend fun hasSeenOnboarding(): Boolean =
        dataStore.data.first()[KEY_SHOWN] ?: false

    suspend fun markShown() {
        dataStore.edit { preferences ->
            preferences[KEY_SHOWN] = true
        }
    }

    companion object {
        private val KEY_SHOWN = booleanPreferencesKey("shown")
    }
}
