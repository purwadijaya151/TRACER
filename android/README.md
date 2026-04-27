# Tracer Study Fakultas Teknik

Android Native Kotlin app untuk Tracer Study Fakultas Teknik.

## Setup

1. Buka `local.properties`, lalu isi:

   ```properties
   SUPABASE_URL=https://efutimhekjhqrwmrzmew.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   ```

2. Jalankan SQL di `../website/supabase/schema.sql` melalui Supabase SQL Editor.

3. Untuk release, ganti domain dan pin sertifikat di `app/src/main/res/xml/network_security_config.xml` agar sesuai project Supabase.

## Build

```powershell
.\gradlew.bat assembleDebug
.\gradlew.bat testDebugUnitTest
.\gradlew.bat assembleDebugAndroidTest
```

APK debug dibuat di `app/build/outputs/apk/debug/app-debug.apk`.
