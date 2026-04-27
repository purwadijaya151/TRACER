package com.unihaz.tracerstudy

import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.unihaz.tracerstudy.presentation.auth.AuthActivity
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withText

@RunWith(AndroidJUnit4::class)
class LoginFlowTest {
    @get:Rule val rule = ActivityScenarioRule(AuthActivity::class.java)

    @Test
    fun loginScreenIsDisplayed() {
        onView(withText("Masuk ke Akun")).check(matches(isDisplayed()))
    }
}
