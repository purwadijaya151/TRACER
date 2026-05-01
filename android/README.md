# Tracer Study Fakultas Teknik

Android Native Kotlin app untuk Tracer Study Fakultas Teknik.

## Setup

1. Buka `local.properties`, lalu isi:

   ```properties
   SUPABASE_URL=https://efutimhekjhqrwmrzmew.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   RESET_PASSWORD_API_URL=http://10.0.2.2:3002/api/auth/request-password-reset
   ```

2. Jalankan SQL di `../website/supabase/schema.sql` melalui Supabase SQL Editor.

3. Untuk emulator Android, `10.0.2.2` mengarah ke server website di komputer lokal. Untuk device fisik atau release, ganti `RESET_PASSWORD_API_URL` ke URL HTTPS website yang bisa diakses perangkat.

   ```properties
   RESET_PASSWORD_API_URL=https://your-vercel-domain.vercel.app/api/auth/request-password-reset
   ```

4. Untuk release, ganti domain dan pin sertifikat di `app/src/main/res/xml/network_security_config.xml` agar sesuai project Supabase dan website.

## Build

```powershell
.\gradlew.bat assembleDebug
.\gradlew.bat testDebugUnitTest
.\gradlew.bat assembleDebugAndroidTest
```

APK debug dibuat di `app/build/outputs/apk/debug/app-debug.apk`.
