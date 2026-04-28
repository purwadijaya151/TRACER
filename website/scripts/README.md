# Website Scripts

Gunakan `npm.cmd` di PowerShell Windows jika `npm` diblokir oleh execution policy.

## Development

- `npm.cmd run dev` menjalankan Next dev di `http://127.0.0.1:3002`.
- `npm.cmd run dev:check` menampilkan konfigurasi dev tanpa menyalakan server.
- `npm.cmd run dev:clean` membersihkan cache dev target lalu menjalankan server.

## Cleanup

- `npm.cmd run clean:next` menghapus cache `.next`.
- `npm.cmd run clean:next:inactive` menghapus semua cache Next selain `.next-dev-3002`.
- `npm.cmd run clean:next:all` menghapus semua cache Next.
- Tambahkan `-- --dry-run` untuk melihat target tanpa menghapus file.

## Data dan QA

- `npm.cmd run seed:questions` seed pertanyaan launch v1 dari daftar kuesioner.
- `npm.cmd run qa:questionnaire` memeriksa pertanyaan aktif Supabase terhadap tipe yang didukung Android.
- `npm.cmd run e2e:admin` menjalankan smoke test panel admin.
