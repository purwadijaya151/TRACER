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
    fun skipsWorkDataStepWhenNotWorking() {
        val viewModel = TracerStudyViewModel()
        viewModel.updateStatusKerja("Belum Bekerja")
        viewModel.next()
        viewModel.next()
        viewModel.next()
        assertEquals(5, viewModel.state.value?.currentStep)
    }

    @Test
    fun blocksWorkDataStepWhenWorkingDataIsMissing() {
        val viewModel = TracerStudyViewModel()
        viewModel.updateStatusKerja("Bekerja")
        viewModel.next()
        viewModel.next()
        viewModel.next()
        viewModel.next()
        assertEquals(4, viewModel.state.value?.currentStep)
        assertEquals("Nama perusahaan wajib diisi", viewModel.state.value?.error)
    }

    @Test
    fun submitRequiresCompetencyRatings() {
        val viewModel = TracerStudyViewModel()
        viewModel.updateTracer(TracerStudy(alumniId = "user-id", statusKerja = "Belum Bekerja"))
        viewModel.updateConfirmation(true)
        viewModel.submit()
        assertEquals("Semua penilaian kompetensi wajib diisi", viewModel.state.value?.error)
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
