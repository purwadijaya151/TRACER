package com.unihaz.tracerstudy

import androidx.arch.core.executor.testing.InstantTaskExecutorRule
import com.unihaz.tracerstudy.core.network.NetworkResult
import com.unihaz.tracerstudy.data.local.Session
import com.unihaz.tracerstudy.data.model.Alumni
import com.unihaz.tracerstudy.data.model.Notification
import com.unihaz.tracerstudy.data.model.TracerStudy
import com.unihaz.tracerstudy.presentation.home.HomeViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class HomeViewModelTest {
    @get:Rule
    val instantTaskExecutorRule = InstantTaskExecutorRule()

    private val dispatcher = StandardTestDispatcher()

    @Before
    fun setUp() {
        Dispatchers.setMain(dispatcher)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun hidesUnreadBadgeAndTracerStatusWhenBackendDataFails() = runTest {
        val viewModel = HomeViewModel(
            getSession = {
                Session(
                    accessToken = "access-token",
                    refreshToken = "refresh-token",
                    alumniId = "alumni-1"
                )
            },
            loadProfile = {
                NetworkResult.Success(
                    Alumni(
                        id = "alumni-1",
                        nim = "2019.01.0023",
                        namaLengkap = "Alumni Test",
                        prodi = "Teknik Informatika",
                        tahunMasuk = 2019,
                        tahunLulus = 2023
                    )
                )
            },
            loadNotifications = { NetworkResult.Error("Gagal memuat notifikasi") },
            loadDraft = { NetworkResult.Error("Gagal memuat tracer") }
        )

        viewModel.load()
        advanceUntilIdle()

        val state = requireNotNull(viewModel.state.value)
        assertFalse(state.loading)
        assertEquals("Alumni Test", state.alumni?.namaLengkap)
        assertFalse(state.tracerStatusKnown)
        assertNull(state.unreadCount)
        assertEquals("Gagal memuat notifikasi", state.error)
    }
}
