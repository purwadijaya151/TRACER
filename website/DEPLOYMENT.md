# Deployment Website

## Vercel Environment Variables

Set variable berikut di Vercel project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-smtp-email@gmail.com
SMTP_PASS=your-gmail-app-password
MAIL_FROM="Tracer Study UNIHAZ <your-smtp-email@gmail.com>"
```

`PASSWORD_RESET_REDIRECT_TO` bersifat opsional. Jika kosong, API reset password otomatis memakai domain request:

```text
https://your-vercel-domain.vercel.app/reset-password
```

Jika ingin mengunci ke domain production, isi:

```env
PASSWORD_RESET_REDIRECT_TO=https://your-vercel-domain.vercel.app/reset-password
```

## Supabase Auth Redirect

Di Supabase Dashboard, buka `Authentication > URL Configuration`.

Set `Site URL`:

```text
https://your-vercel-domain.vercel.app
```

Tambahkan `Redirect URLs`:

```text
https://your-vercel-domain.vercel.app/reset-password
```

Untuk Vercel preview, tambahkan redirect preview sesuai domain preview yang dipakai. Untuk production, pakai URL exact.

## Android Release

Untuk build Android release, set:

```properties
RESET_PASSWORD_API_URL=https://your-vercel-domain.vercel.app/api/auth/request-password-reset
```

Jangan pakai `localhost` atau `10.0.2.2` untuk APK yang dipasang di device fisik atau dibagikan ke user.
