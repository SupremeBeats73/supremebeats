# Run after Cursor completes a task: build, commit, push.
# Usage: .\scripts\deploy-workflow.ps1 [optional commit message]
# Env files are gitignored and will not be committed.

param([string]$Message = "Apply changes from Cursor")

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "1. Review: checking for changes..." -ForegroundColor Cyan
$status = git status --short
if (-not $status) {
  Write-Host "   Nothing to commit. Exiting." -ForegroundColor Yellow
  exit 0
}
Write-Host $status

Write-Host "`n2. Test locally: running build..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Host "   Build failed. Fix errors before committing." -ForegroundColor Red
  exit 1
}

Write-Host "`n3. Commit..." -ForegroundColor Cyan
git add -A
git status --short
git commit -m $Message
if ($LASTEXITCODE -ne 0) {
  Write-Host "   No commit made (nothing staged or commit cancelled)." -ForegroundColor Yellow
  exit 0
}

Write-Host "`n4. Push..." -ForegroundColor Cyan
git push origin main
if ($LASTEXITCODE -ne 0) {
  Write-Host "   Push failed (e.g. auth). Push manually: git push origin main" -ForegroundColor Red
  exit 1
}

Write-Host "`n5. Check deployment: open your Vercel dashboard to confirm the new deployment." -ForegroundColor Cyan
Write-Host "   Done." -ForegroundColor Green
