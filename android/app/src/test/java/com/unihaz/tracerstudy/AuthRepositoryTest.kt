package com.unihaz.tracerstudy

import com.unihaz.tracerstudy.data.repository.AuthRepository
import org.junit.Assert.assertEquals
import org.junit.Test

class AuthRepositoryTest {
    @Test
    fun mapsNimToInstitutionEmail() {
        assertEquals(
            "2019.01.0023@ft.unihaz.ac.id",
            AuthRepository.nimToInstitutionEmail("2019.01.0023")
        )
    }
}
