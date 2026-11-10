# Linkster release APK (run in normal PowerShell, not IDE sandbox).
# Requires: JDK 17+, Android SDK, NDK 27.1 (Android Studio SDK Manager).

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path $PSScriptRoot -Parent

$Sdk = $env:ANDROID_HOME
if (-not $Sdk) { $Sdk = "$env:LOCALAPPDATA\Android\Sdk" }
if (-not (Test-Path $Sdk)) {
  Write-Error "Android SDK not found. Install Android Studio or set ANDROID_HOME."
}

$env:ANDROID_HOME = $Sdk
$BuildRoot = "C:\Linkster"
if (-not (Test-Path $BuildRoot)) {
  cmd /c "mklink /J `"$BuildRoot`" `"$ProjectRoot`""
}
$AndroidDir = Join-Path $BuildRoot "android"

$localProps = Join-Path $AndroidDir "local.properties"
$sdkDir = ($Sdk -replace '\\', '/')
Set-Content -Path $localProps -Value "sdk.dir=$($sdkDir -replace ':', '\:')" -Encoding ASCII

Push-Location $AndroidDir
try {
  Write-Host "Building release (arm64-v8a). First run may take 15-30 min."
  Write-Host ""
  & .\gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Gradle failed with exit code $LASTEXITCODE"
  }
  $apk = Get-ChildItem -Path "app\build\outputs\apk\release" -Filter *.apk -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($apk) {
    Write-Host ""
    Write-Host "Done: $($apk.FullName)"
  } else {
    Write-Warning "Gradle finished but no APK in app\build\outputs\apk\release. See log above."
  }
}
finally {
  Pop-Location
}
