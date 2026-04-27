package com.unihaz.tracerstudy.data.repository

import android.util.Log
import com.unihaz.tracerstudy.BuildConfig
import com.unihaz.tracerstudy.core.network.NetworkResult
import com.unihaz.tracerstudy.core.utils.Constants
import io.ktor.client.HttpClient
import io.ktor.client.engine.android.Android
import io.ktor.client.plugins.HttpTimeout
import io.ktor.client.plugins.logging.LogLevel
import io.ktor.client.plugins.logging.Logging
import io.ktor.client.request.HttpRequestBuilder
import io.ktor.client.request.accept
import io.ktor.client.request.headers
import io.ktor.client.statement.HttpResponse
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.contentType
import kotlinx.serialization.json.Json
import java.net.SocketTimeoutException
import java.net.UnknownHostException
import java.io.IOException
import javax.net.ssl.SSLException

internal object SupabaseRest {
    val json: Json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
        encodeDefaults = true
    }

    val httpClient: HttpClient = HttpClient(Android) {
        install(HttpTimeout) {
            requestTimeoutMillis = 30_000
            connectTimeoutMillis = 15_000
            socketTimeoutMillis = 30_000
        }
        install(Logging) {
            level = if (BuildConfig.DEBUG) LogLevel.INFO else LogLevel.NONE
        }
    }

    val baseUrl: String
        get() = BuildConfig.SUPABASE_URL.trimEnd('/')

    fun HttpRequestBuilder.supabaseHeaders(accessToken: String? = null, prefer: String? = null) {
        headers {
            append("apikey", BuildConfig.SUPABASE_ANON_KEY)
            append(HttpHeaders.Authorization, "Bearer ${accessToken ?: BuildConfig.SUPABASE_ANON_KEY}")
            prefer?.let { append("Prefer", it) }
        }
        accept(ContentType.Application.Json)
        contentType(ContentType.Application.Json)
    }

    suspend fun responseToUnit(response: HttpResponse): NetworkResult<Unit> {
        return if (response.status.value in 200..299) {
            NetworkResult.Success(Unit)
        } else {
            val body = response.bodyAsText()
            logSupabaseError(response.status.value)
            NetworkResult.Error(mapError(body, response.status.value), response.status.value)
        }
    }

    suspend fun <T> parseResponse(
        response: HttpResponse,
        parser: suspend (String) -> T
    ): NetworkResult<T> {
        val body = response.bodyAsText()
        return if (response.status.value in 200..299) {
            runCatching { NetworkResult.Success(parser(body)) }.getOrElse {
                if (BuildConfig.DEBUG) {
                    Log.e(Constants.LOG_TAG, "Parsing error", it)
                }
                NetworkResult.Error("Terjadi kesalahan, silakan coba beberapa saat lagi")
            }
        } else {
            logSupabaseError(response.status.value)
            NetworkResult.Error(mapError(body, response.status.value), response.status.value)
        }
    }

    fun mapThrowable(throwable: Throwable): NetworkResult.Error {
        Log.e(Constants.LOG_TAG, "Network error", throwable)
        return when (throwable) {
            is SSLException -> NetworkResult.Error("Koneksi aman ke server gagal. Coba lagi beberapa saat lagi")
            is UnknownHostException -> NetworkResult.Error("Tidak ada koneksi internet, coba lagi")
            is SocketTimeoutException -> NetworkResult.Error("Koneksi ke server terlalu lama, coba lagi")
            is IOException -> NetworkResult.Error("Tidak ada koneksi internet, coba lagi")
            else -> NetworkResult.Error("Terjadi kesalahan, silakan coba beberapa saat lagi")
        }
    }

    private fun logSupabaseError(code: Int) {
        if (BuildConfig.DEBUG) {
            Log.e(Constants.LOG_TAG, "Supabase request failed with HTTP $code")
        }
    }

    private fun mapError(body: String, code: Int): String = when {
        body.contains("tracer_study_closed", ignoreCase = true) -> "Pengisian tracer study sedang ditutup"
        body.contains("tracer_study_period_closed", ignoreCase = true) -> "Periode tahun lulus tidak termasuk dalam pengisian tracer study"
        code == 401 || body.contains("Invalid login", ignoreCase = true) -> "NPM atau password salah"
        code == 409 || body.contains("already registered", ignoreCase = true) -> "NPM sudah terdaftar"
        code == 0 -> "Tidak ada koneksi internet, coba lagi"
        else -> "Terjadi kesalahan, silakan coba beberapa saat lagi"
    }
}
