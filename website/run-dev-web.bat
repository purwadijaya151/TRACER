@echo off
setlocal

cd /d "%~dp0"

set "PORT=%~1"
if "%PORT%"=="" set "PORT=3000"

if not exist "package.json" (
  echo package.json tidak ditemukan. Jalankan script ini dari folder website.
  exit /b 1
)

if not exist "node_modules" (
  echo node_modules belum ada. Menjalankan npm ci...
  npm ci
  if errorlevel 1 (
    echo npm ci gagal. Menjalankan npm install untuk sinkronisasi package-lock...
    npm install
    if errorlevel 1 exit /b 1
  )
)

echo Menjalankan TracerStudy Admin di http://localhost:%PORT%
npm run dev -- -p %PORT%

endlocal
