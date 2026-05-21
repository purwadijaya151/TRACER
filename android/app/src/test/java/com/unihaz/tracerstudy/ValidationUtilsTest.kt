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
        assertNull(ValidationUtils.validateLogin("2019010023", "password123"))
    }

    @Test
    fun invalidNimFails() {
        assertEquals("NPM tidak valid", ValidationUtils.validateLogin("abc", "password123"))
        assertEquals("NPM tidak valid", ValidationUtils.validateLogin(".....", "password123"))
    }

    @Test
    fun normalizesTenDigitNimToDottedFormat() {
        assertEquals("2019.01.0023", ValidationUtils.normalizeNim("2019010023"))
        assertEquals("202600001", ValidationUtils.normalizeNim("202600001"))
    }

    @Test
    fun matchingPasswordConfirmationReturnsTrue() {
        assertTrue(ValidationUtils.isPasswordConfirmationMatch("password123", "password123"))
    }

    @Test
    fun mismatchedPasswordConfirmationReturnsFalse() {
        assertFalse(ValidationUtils.isPasswordConfirmationMatch("password123", "password124"))
    }

    @Test
    fun sameCurrentAndNewPasswordReturnsFalse() {
        assertFalse(ValidationUtils.isDifferentPassword("password123", "password123"))
    }

    @Test
    fun differentCurrentAndNewPasswordReturnsTrue() {
        assertTrue(ValidationUtils.isDifferentPassword("password123", "password124"))
    }

    @Test
    fun isValidPasswordUsesMinimumLength() {
        assertFalse(ValidationUtils.isValidPassword("12345"))
        assertTrue(ValidationUtils.isValidPassword("123456"))
    }

    @Test
    fun validatesIpkRange() {
        assertTrue(ValidationUtils.isValidIpk(3.75))
        assertFalse(ValidationUtils.isValidIpk(4.2))
    }

    @Test
    fun acceptsBlankProfilePhone() {
        assertTrue(ValidationUtils.isValidProfilePhone(null))
        assertTrue(ValidationUtils.isValidProfilePhone(""))
        assertTrue(ValidationUtils.isValidProfilePhone("   "))
    }

    @Test
    fun limitsProfilePhoneToDatabaseLength() {
        assertTrue(ValidationUtils.isValidProfilePhone("081234567890123"))
        assertFalse(ValidationUtils.isValidProfilePhone("0812345678901234"))
    }

    @Test
    fun registerValidationRejectsInvalidIpk() {
        assertEquals(
            "IPK tidak valid",
            ValidationUtils.validateRegister(
                nim = "2019.01.0023",
                nama = "Alumni Test",
                prodi = "Teknik Informatika",
                tahunLulus = 2023,
                ipk = 4.5,
                email = "alumni@example.com",
                password = "password123",
                confirmPassword = "password123"
            )
        )
    }
}
