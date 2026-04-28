# Admin Credentials

Login admin web sekarang menggunakan NPP dan password.

NPP khusus akun admin/staff kampus memakai format asli 18 digit angka. Mahasiswa/alumni memakai NPM pada aplikasi Android dan data alumni.

Konfigurasi seed lokal:

- NPP: disimpan di `website/.env.local` sebagai `ADMIN_NPP`
- Password: disimpan di `website/.env.local` sebagai `ADMIN_PASSWORD` dan tidak dicatat di repo
- Email Auth internal: disimpan di `website/.env.local` sebagai `ADMIN_EMAIL`

Cara membuat atau memperbarui akun admin di Supabase:

1. Isi `SUPABASE_SERVICE_ROLE_KEY` di `website/.env.local`.
2. Dari folder `website`, jalankan:

```bash
npm run seed:admin
```

Jika database live belum punya kolom `alumni.npp`, script akan menyimpan NPP admin di metadata Auth dan kolom `nim` hanya diisi kode staff internal karena schema lama masih mewajibkan kolom tersebut. Setelah SQL terbaru di `website/supabase/schema.sql` dijalankan, ulangi `npm run seed:admin` untuk mengisi kolom `npp` final.

Setelah akun dibuat, login di panel admin memakai NPP dan password dari `ADMIN_PASSWORD`. Email tetap disimpan sebagai identifier internal Supabase Auth.
