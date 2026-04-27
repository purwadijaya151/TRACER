package com.unihaz.tracerstudy.core.di

import com.unihaz.tracerstudy.data.local.OnboardingPreferences
import com.unihaz.tracerstudy.data.local.SessionManager
import com.unihaz.tracerstudy.data.repository.AlumniRepository
import com.unihaz.tracerstudy.data.repository.AuthRepository
import com.unihaz.tracerstudy.data.repository.NotificationRepository
import com.unihaz.tracerstudy.data.repository.TracerStudyRepository
import com.unihaz.tracerstudy.domain.usecase.alumni.GetAlumniProfileUseCase
import com.unihaz.tracerstudy.domain.usecase.auth.LoginUseCase
import com.unihaz.tracerstudy.domain.usecase.auth.RegisterUseCase
import com.unihaz.tracerstudy.domain.usecase.auth.ResetPasswordUseCase
import com.unihaz.tracerstudy.domain.usecase.tracerstudy.SaveTracerStudyUseCase
import com.unihaz.tracerstudy.domain.usecase.tracerstudy.SubmitTracerStudyUseCase
import com.unihaz.tracerstudy.presentation.auth.login.LoginViewModel
import com.unihaz.tracerstudy.presentation.auth.register.RegisterViewModel
import com.unihaz.tracerstudy.presentation.home.HomeViewModel
import com.unihaz.tracerstudy.presentation.notification.NotificationViewModel
import com.unihaz.tracerstudy.presentation.onboarding.OnboardingViewModel
import com.unihaz.tracerstudy.presentation.profile.ProfileViewModel
import com.unihaz.tracerstudy.presentation.splash.SplashViewModel
import com.unihaz.tracerstudy.presentation.tracerstudy.TracerStudyViewModel
import org.koin.android.ext.koin.androidContext
import org.koin.androidx.viewmodel.dsl.viewModel
import org.koin.dsl.module

val appModule = module {
    single { SessionManager(androidContext()) }
    single { OnboardingPreferences(androidContext()) }
    single { AlumniRepository(get()) }
    single { TracerStudyRepository(get()) }
    single { NotificationRepository(get()) }
    single { AuthRepository(get(), get()) }

    factory { LoginUseCase(get()) }
    factory { RegisterUseCase(get()) }
    factory { ResetPasswordUseCase(get()) }
    factory { GetAlumniProfileUseCase(get()) }
    factory { SaveTracerStudyUseCase(get()) }
    factory { SubmitTracerStudyUseCase(get()) }

    viewModel { SplashViewModel(get(), get()) }
    viewModel { OnboardingViewModel(get()) }
    viewModel { LoginViewModel(get(), get()) }
    viewModel { RegisterViewModel(get()) }
    viewModel { HomeViewModel(get(), get(), get(), get()) }
    viewModel { TracerStudyViewModel(get(), get(), get(), get(), get()) }
    viewModel { ProfileViewModel(get(), get(), get(), get()) }
    viewModel { NotificationViewModel(get(), get()) }
}
