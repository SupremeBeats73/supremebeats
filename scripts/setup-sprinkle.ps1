# One-time setup: add "sprinkle" command to your PowerShell profile.
# Run from project root: .\scripts\setup-sprinkle.ps1

$profileDir = Split-Path $PROFILE -Parent
if (-not (Test-Path $profileDir)) {
  New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
}

$block = @"

# Sprinkle: build, commit, push (run from project root: npm run sprinkle)
function sprinkle { npm run sprinkle }

"@

if (Test-Path $PROFILE) {
  $content = Get-Content $PROFILE -Raw
  if ($content -match "function sprinkle") {
    Write-Host "Profile already has sprinkle. No change." -ForegroundColor Green
    exit 0
  }
}

Add-Content -Path $PROFILE -Value $block
Write-Host "Added sprinkle to your PowerShell profile." -ForegroundColor Green
Write-Host "Profile: $PROFILE" -ForegroundColor Cyan
Write-Host "Restart the terminal (or run . `$PROFILE), then type sprinkle from this project root." -ForegroundColor Cyan
