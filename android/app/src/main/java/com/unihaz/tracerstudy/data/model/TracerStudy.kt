package com.unihaz.tracerstudy.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class TracerStudy(
    val id: String? = null,
    @SerialName("alumni_id") val alumniId: String = "",
    @SerialName("status_kerja") val statusKerja: String = "Belum Bekerja",
    @SerialName("nama_perusahaan") val namaPerusahaan: String? = null,
    @SerialName("bidang_pekerjaan") val bidangPekerjaan: String? = null,
    val jabatan: String? = null,
    @SerialName("rentang_gaji") val rentangGaji: String? = null,
    @SerialName("provinsi_kerja") val provinsiKerja: String? = null,
    @SerialName("waktu_tunggu") val waktuTunggu: String? = null,
    @SerialName("kesesuaian_bidang") val kesesuaianBidang: Int? = null,
    @SerialName("nilai_hard_skill") val nilaiHardSkill: Int? = null,
    @SerialName("nilai_soft_skill") val nilaiSoftSkill: Int? = null,
    @SerialName("nilai_bahasa_asing") val nilaiBahasaAsing: Int? = null,
    @SerialName("nilai_it") val nilaiIt: Int? = null,
    @SerialName("nilai_kepemimpinan") val nilaiKepemimpinan: Int? = null,
    @SerialName("saran_kurikulum") val saranKurikulum: String? = null,
    @SerialName("kesan_kuliah") val kesanKuliah: String? = null,
    @SerialName("is_submitted") val isSubmitted: Boolean = false,
    @SerialName("submitted_at") val submittedAt: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("updated_at") val updatedAt: String? = null
)

@Serializable
data class TracerStudyUpsert(
    @SerialName("alumni_id") val alumniId: String,
    @SerialName("status_kerja") val statusKerja: String,
    @SerialName("nama_perusahaan") val namaPerusahaan: String? = null,
    @SerialName("bidang_pekerjaan") val bidangPekerjaan: String? = null,
    val jabatan: String? = null,
    @SerialName("rentang_gaji") val rentangGaji: String? = null,
    @SerialName("provinsi_kerja") val provinsiKerja: String? = null,
    @SerialName("waktu_tunggu") val waktuTunggu: String? = null,
    @SerialName("kesesuaian_bidang") val kesesuaianBidang: Int? = null,
    @SerialName("nilai_hard_skill") val nilaiHardSkill: Int? = null,
    @SerialName("nilai_soft_skill") val nilaiSoftSkill: Int? = null,
    @SerialName("nilai_bahasa_asing") val nilaiBahasaAsing: Int? = null,
    @SerialName("nilai_it") val nilaiIt: Int? = null,
    @SerialName("nilai_kepemimpinan") val nilaiKepemimpinan: Int? = null,
    @SerialName("saran_kurikulum") val saranKurikulum: String? = null,
    @SerialName("kesan_kuliah") val kesanKuliah: String? = null,
    @SerialName("is_submitted") val isSubmitted: Boolean = false,
    @SerialName("submitted_at") val submittedAt: String? = null
)

fun TracerStudy.toUpsert(): TracerStudyUpsert = TracerStudyUpsert(
    alumniId = alumniId,
    statusKerja = statusKerja,
    namaPerusahaan = namaPerusahaan,
    bidangPekerjaan = bidangPekerjaan,
    jabatan = jabatan,
    rentangGaji = rentangGaji,
    provinsiKerja = provinsiKerja,
    waktuTunggu = waktuTunggu,
    kesesuaianBidang = kesesuaianBidang,
    nilaiHardSkill = nilaiHardSkill,
    nilaiSoftSkill = nilaiSoftSkill,
    nilaiBahasaAsing = nilaiBahasaAsing,
    nilaiIt = nilaiIt,
    nilaiKepemimpinan = nilaiKepemimpinan,
    saranKurikulum = saranKurikulum,
    kesanKuliah = kesanKuliah,
    isSubmitted = isSubmitted,
    submittedAt = submittedAt
)
