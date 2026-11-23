# Script Packaging OTA Bundle untuk Ionic & Capacitor
param (
    [string]$Version = ""
)

$ErrorActionPreference = "Stop"

if (-not $Version) {
    $packageJson = Get-Content -Raw "package.json" | ConvertFrom-Json
    $baseVer = $packageJson.version
    $timestamp = Get-Date -Format "yyyyMMdd.HHmm"
    $Version = "$baseVer-$timestamp"
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "📦 Memulai Packaging Bundle OTA v$Version" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Pastikan build web ada
if (-not (Test-Path "www/index.html")) {
    Write-Host "⚠️  Folder 'www' belum dibuild. Menjalankan 'npm run build'..." -ForegroundColor Yellow
    npm run build
}

# 2. Buat folder output
$outputDir = "dist-ota"
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

$zipFileName = "bundle-$Version.zip"
$zipFilePath = Join-Path $outputDir $zipFileName

if (Test-Path $zipFilePath) {
    Remove-Item $zipFilePath -Force
}

# 3. Zip seluruh file di dalam folder www (file langsung di root zip)
Write-Host "🗜️  Mengompres berkas dari folder www ke $zipFilePath..." -ForegroundColor Green
Compress-Archive -Path "www/*" -DestinationPath $zipFilePath -Force

$zipSize = (Get-Item $zipFilePath).Length / 1MB
$checksum = (Get-FileHash -Path $zipFilePath -Algorithm SHA256).Hash

Write-Host ""
Write-Host "✅ BUNDLE OTA BERHASIL DIBUAT!" -ForegroundColor Green
Write-Host "   Nama File : $zipFileName"
Write-Host "   Ukuran    : $([math]::Round($zipSize, 2)) MB"
Write-Host "   SHA-256   : $checksum"
Write-Host "   Lokasi    : $zipFilePath"
Write-Host ""
Write-Host "🚀 Cara mempublikasikan ke backend:" -ForegroundColor Cyan
Write-Host "   php artisan app:publish-ota $Version --zip=`"$zipFilePath`" --notes=`"Pembaruan fitur v$Version`"" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Cyan
