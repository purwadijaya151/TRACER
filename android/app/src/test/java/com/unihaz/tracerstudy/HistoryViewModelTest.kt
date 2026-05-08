package com.unihaz.tracerstudy

import androidx.arch.core.executor.testing.InstantTaskExecutorRule
import com.unihaz.tracerstudy.core.network.NetworkResult
import com.unihaz.tracerstudy.data.local.Session
import com.unihaz.tracerstudy.data.model.TracerStudy
import com.unihaz.tracerstudy.presentation.history.HistoryViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.TestDispatcher
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class HistoryViewModelTest {
    @get:Rule val instantTaskExecutorRule = InstantTaskExecutorRule()
    private val testDispatcher: TestDispatcher = StandardTestDispatcher()
    @get:Rule val mainDispatcherRule = MainDispatcherRule(testDispatcher)

    @Test
    fun load_populatesSubmittedTracerHistory() = runTest(testDispatcher.scheduler) {
        val tracerStudy = TracerStudy(
            alumniId = "alumni-1",
            statusKerja = "Bekerja",
            isSubmitted = true,
            submittedAt = "2026-05-07T10:00:00Z"
        )
        val previousTracerStudy = TracerStudy(
            alumniId = "alumni-1",
            statusKerja = "Belum Bekerja",
            isSubmitted = true,
            submittedAt = "2025-05-07T10:00:00Z"
        )
        val viewModel = HistoryViewModel(
            getSession = { Session("token", "refresh", "alumni-1") },
            getTracerStudyHistory = { NetworkResult.Success(listOf(tracerStudy, previousTracerStudy)) }
        )

        viewModel.load()
        advanceUntilIdle()

        assertEquals(listOf(tracerStudy, previousTracerStudy), viewModel.state.value?.history)
        assertEquals(tracerStudy, viewModel.state.value?.latestTracerStudy)
        assertEquals(null, viewModel.state.value?.error)
        assertEquals(false, viewModel.state.value?.loading)
    }

    @Test
    fun load_exposesRepositoryFailure() = runTest(testDispatcher.scheduler) {
        val viewModel = HistoryViewModel(
            getSession = { Session("token", "refresh", "alumni-1") },
            getTracerStudyHistory = { NetworkResult.Error("Gagal memuat riwayat") }
        )

        viewModel.load()
        advanceUntilIdle()

        assertEquals(emptyList<TracerStudy>(), viewModel.state.value?.history)
        assertEquals("Gagal memuat riwayat", viewModel.state.value?.error)
        assertEquals(false, viewModel.state.value?.loading)
    }
}
