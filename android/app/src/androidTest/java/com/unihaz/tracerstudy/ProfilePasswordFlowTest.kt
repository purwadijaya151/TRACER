package com.unihaz.tracerstudy

import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions.click
import androidx.test.espresso.action.ViewActions.closeSoftKeyboard
import androidx.test.espresso.action.ViewActions.replaceText
import androidx.test.espresso.assertion.ViewAssertions.doesNotExist
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withId
import androidx.test.espresso.matcher.ViewMatchers.withText
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.unihaz.tracerstudy.presentation.main.MainActivity
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class ProfilePasswordFlowTest {
    @get:Rule val rule = ActivityScenarioRule(MainActivity::class.java)

    @Test
    fun changePasswordDialogShowsEntryPointFieldsAndCancelFlow() {
        onView(withId(R.id.nav_profile)).perform(click())
        onView(withId(R.id.btnChangePassword)).check(matches(withText("Ubah Password")))
        onView(withId(R.id.btnChangePassword)).perform(click())

        onView(withText("Password Saat Ini")).check(matches(isDisplayed()))
        onView(withText("Password Baru")).check(matches(isDisplayed()))
        onView(withText("Konfirmasi Password Baru")).check(matches(isDisplayed()))

        onView(withText("Batal")).perform(click())
        onView(withId(R.id.etCurrentPassword)).check(doesNotExist())
    }

    @Test
    fun changePasswordDialogShowsLocalValidationErrors() {
        openChangePasswordDialog()

        onView(withId(R.id.etCurrentPassword)).perform(replaceText("password-lama"), closeSoftKeyboard())
        onView(withId(R.id.etNewPassword)).perform(replaceText("123"), closeSoftKeyboard())
        onView(withId(R.id.etConfirmNewPassword)).perform(replaceText("123"), closeSoftKeyboard())
        onView(withText("Simpan")).perform(click())
        onView(withText("Password minimal 6 karakter")).check(matches(isDisplayed()))

        onView(withId(R.id.etNewPassword)).perform(replaceText("password-baru"), closeSoftKeyboard())
        onView(withId(R.id.etConfirmNewPassword)).perform(replaceText("password-beda"), closeSoftKeyboard())
        onView(withText("Simpan")).perform(click())
        onView(withText("Konfirmasi password tidak sama")).check(matches(isDisplayed()))

        onView(withText("Batal")).perform(click())
        onView(withId(R.id.etCurrentPassword)).check(doesNotExist())
    }

    private fun openChangePasswordDialog() {
        onView(withId(R.id.nav_profile)).perform(click())
        onView(withId(R.id.btnChangePassword)).perform(click())
    }
}
