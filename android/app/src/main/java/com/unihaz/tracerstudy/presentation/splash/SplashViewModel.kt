package com.unihaz.tracerstudy.presentation.splash

import androidx.lifecycle.ViewModel
import com.unihaz.tracerstudy.data.local.OnboardingPreferences
import com.unihaz.tracerstudy.data.repository.AuthRepository

enum class SplashDestination {
    MAIN,
    AUTH,
    ONBOARDING
}

class SplashViewModel(
    private val authRepository: AuthRepository,
    private val onboardingPreferences: OnboardingPreferences
) : ViewModel() {
    suspend fun resolveDestination(): SplashDestination {
        if (authRepository.hasValidSession()) return SplashDestination.MAIN
        return if (onboardingPreferences.hasSeenOnboarding()) {
            SplashDestination.AUTH
        } else {
            SplashDestination.ONBOARDING
        }
    }
}
