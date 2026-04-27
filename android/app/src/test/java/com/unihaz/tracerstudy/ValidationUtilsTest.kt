package com.unihaz.tracerstudy

import com.unihaz.tracerstudy.core.utils.ValidationUtils
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class ValidationUtilsTest {
    @Test
    fun validLoginReturnsNull() {
        assertNull(ValidationUtils.validateLogin("2019.01.0023", "password123"))
    }

    @Test
    fun invalidNimFails() {
        assertEquals("NPM tidak valid", ValidationUtils.validateLogin("abc", "password123"))
    }

    @Test
    fun validatesIpkRange() {
        assertTrue(ValidationUtils.isValidIpk(3.75))
        assertFalse(ValidationUtils.isValidIpk(4.2))
    }
}
