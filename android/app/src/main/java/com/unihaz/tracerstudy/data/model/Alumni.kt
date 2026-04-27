package com.unihaz.tracerstudy.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Alumni(
    val id: String = "",
    val nim: String = "",
    @SerialName("nama_lengkap") val namaLengkap: String = "",
    val prodi: String = "Teknik Informatika",
    @SerialName("tahun_masuk") val tahunMasuk: Int = 0,
    @SerialName("tahun_lulus") val tahunLulus: Int = 0,
    val ipk: Double? = null,
    @SerialName("tempat_lahir") val tempatLahir: String? = null,
    @SerialName("tanggal_lahir") val tanggalLahir: String? = null,
    @SerialName("no_hp") val noHp: String? = null,
    val email: String? = null,
    val alamat: String? = null,
    @SerialName("foto_url") val fotoUrl: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("updated_at") val updatedAt: String? = null
) {
    val angkatan: Int
        get() = if (tahunMasuk > 0) tahunMasuk else tahunLulus - 4
}

@Serializable
data class AlumniRegisterPayload(
    val nim: String,
    @SerialName("nama_lengkap") val namaLengkap: String,
    val prodi: String,
    @SerialName("tahun_masuk") val tahunMasuk: Int,
    @SerialName("tahun_lulus") val tahunLulus: Int,
    val email: String
)
