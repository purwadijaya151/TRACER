package com.unihaz.tracerstudy

import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions.click
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withText
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.unihaz.tracerstudy.presentation.main.MainActivity
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class TracerStudyWizardTest {
    @get:Rule val rule = ActivityScenarioRule(MainActivity::class.java)

    @Test
    fun canOpenTracerStudyWizard() {
        onView(withText("Tracer Study")).perform(click())
        onView(withText("Langkah 1 dari 6 - Data Pribadi")).check(matches(isDisplayed()))
    }
}
