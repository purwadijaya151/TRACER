package com.unihaz.tracerstudy.core.utils

object ValidationUtils {
    private val nimRegex = Regex("^[0-9.]{5,20}$")

    fun isValidNim(nim: String): Boolean = nimRegex.matches(nim.trim())

    fun isValidPassword(password: String): Boolean = password.length >= 6

    fun isValidEmail(email: String): Boolean =
        Regex("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$").matches(email.trim())

    fun isValidYear(year: Int): Boolean = year in 1990..2100

    fun isValidIpk(ipk: Double?): Boolean = ipk == null || ipk in 0.0..4.0

    fun validateLogin(nim: String, password: String): String? = when {
        !isValidNim(nim) -> "NPM tidak valid"
        !isValidPassword(password) -> "Password minimal 6 karakter"
        else -> null
    }

    fun validateRegister(
        nim: String,
        nama: String,
        prodi: String,
        tahunLulus: Int,
        email: String,
        password: String,
        confirmPassword: String
    ): String? = when {
        !isValidNim(nim) -> "NPM tidak valid"
        nama.trim().length < 3 -> "Nama lengkap wajib diisi"
        prodi !in Constants.PRODI -> "Program studi tidak valid"
        !isValidYear(tahunLulus) -> "Tahun lulus tidak valid"
        !isValidEmail(email) -> "Email tidak valid"
        !isValidPassword(password) -> "Password minimal 6 karakter"
        password != confirmPassword -> "Konfirmasi password tidak sama"
        else -> null
    }
}
