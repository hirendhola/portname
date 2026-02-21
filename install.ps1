$ErrorActionPreference = "Stop"
$REPO = "hirendhola/portname"
$BINARY = "portname-windows.exe"

Write-Host "Detecting latest release..."

$release = Invoke-RestMethod -Uri "https://api.github.com/repos/$REPO/releases/latest"
$asset = $release.assets | Where-Object { $_.name -eq $BINARY }

if (-not $asset) {
  Write-Host "Could not find release. Download manually: https://github.com/$REPO/releases"
  exit 1
}

$url = $asset.browser_download_url

# Install to user's local bin — no admin required
$installDir = "$env:USERPROFILE\.portname\bin"
New-Item -ItemType Directory -Force -Path $installDir | Out-Null

$dest = "$installDir\portname.exe"

Write-Host "Downloading portname..."
Invoke-WebRequest -Uri $url -OutFile $dest

# Add to PATH permanently for current user
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($currentPath -notlike "*$installDir*") {
  [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$installDir", "User")
  Write-Host "Added $installDir to PATH"
}

Write-Host ""
Write-Host "portname installed successfully"
Write-Host "Restart your terminal then run: portname --help"