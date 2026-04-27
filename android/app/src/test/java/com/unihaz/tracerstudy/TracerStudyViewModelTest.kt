package com.unihaz.tracerstudy

import androidx.arch.core.executor.testing.InstantTaskExecutorRule
import com.unihaz.tracerstudy.data.model.TracerStudy
import com.unihaz.tracerstudy.presentation.tracerstudy.TracerStudyViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.TestDispatcher
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.setMain
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestWatcher
import org.junit.runner.Description

@OptIn(ExperimentalCoroutinesApi::class)
class TracerStudyViewModelTest {
    @get:Rule val instantTaskExecutorRule = InstantTaskExecutorRule()
    @get:Rule val mainDispatcherRule = MainDispatcherRule()

    @Test
    fun blocksFirstStepWhenStatusMissing() {
        val viewModel = TracerStudyViewModel()
        viewModel.next()
        assertEquals(1, viewModel.state.value?.currentStep)
        assertEquals("Jelaskan status Anda saat ini wajib diisi", viewModel.state.value?.error)
    }

    @Test
    fun mapsDiktiStatusToLegacyStatus() {
        val viewModel = TracerStudyViewModel()
        viewModel.updateAnswer("f8", "3")
        assertEquals("Wirausaha", viewModel.state.value?.tracerStudy?.statusKerja)
        assertEquals("3", viewModel.state.value?.tracerStudy?.answers?.get("f8"))
    }

    @Test
    fun requiresConditionalWorkFieldsWhenWorking() {
        val viewModel = TracerStudyViewModel()
        viewModel.updateAnswer("f8", "1")
        viewModel.next()
        viewModel.next()
        assertEquals(2, viewModel.state.value?.currentStep)
        assertEquals("Dalam berapa bulan Anda mendapatkan pekerjaan pertama atau mulai wirausaha? wajib diisi", viewModel.state.value?.error)
    }

    @Test
    fun submitRequiresQuestionnaireAnswers() {
        val viewModel = TracerStudyViewModel()
        viewModel.updateTracer(TracerStudy(alumniId = "user-id", statusKerja = "Belum Bekerja"))
        viewModel.updateConfirmation(true)
        viewModel.submit()
        assertEquals("Jelaskan status Anda saat ini wajib diisi", viewModel.state.value?.error)
    }
}

@OptIn(ExperimentalCoroutinesApi::class)
class MainDispatcherRule(
    private val dispatcher: TestDispatcher = UnconfinedTestDispatcher()
) : TestWatcher() {
    override fun starting(description: Description) {
        Dispatchers.setMain(dispatcher)
    }

    override fun finished(description: Description) {
        Dispatchers.resetMain()
    }
}
