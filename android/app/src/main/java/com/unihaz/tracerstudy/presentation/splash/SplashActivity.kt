package com.unihaz.tracerstudy.presentation.splash

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.unihaz.tracerstudy.R
import com.unihaz.tracerstudy.presentation.auth.AuthActivity
import com.unihaz.tracerstudy.presentation.main.MainActivity
import com.unihaz.tracerstudy.presentation.onboarding.OnboardingActivity
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.koin.androidx.viewmodel.ext.android.viewModel

class SplashActivity : AppCompatActivity(R.layout.activity_splash) {
    private val viewModel: SplashViewModel by viewModel()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        lifecycleScope.launch {
            delay(1500)
            val target = when (viewModel.resolveDestination()) {
                SplashDestination.MAIN -> MainActivity::class.java
                SplashDestination.AUTH -> AuthActivity::class.java
                SplashDestination.ONBOARDING -> OnboardingActivity::class.java
            }
            startActivity(Intent(this@SplashActivity, target))
            finish()
        }
    }
}
