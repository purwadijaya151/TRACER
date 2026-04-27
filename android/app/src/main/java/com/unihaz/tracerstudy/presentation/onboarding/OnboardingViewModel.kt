package com.unihaz.tracerstudy.presentation.onboarding

import androidx.lifecycle.ViewModel
import com.unihaz.tracerstudy.data.local.OnboardingPreferences

class OnboardingViewModel(private val preferences: OnboardingPreferences) : ViewModel() {
    suspend fun hasSeenOnboarding(): Boolean =
        preferences.hasSeenOnboarding()

    suspend fun markOnboardingShown() =
        preferences.markShown()
}
