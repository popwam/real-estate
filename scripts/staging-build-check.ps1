param()

$ErrorActionPreference = "Stop"

function Invoke-Stage6Step {
  param(
    [string]$Label,
    [string[]]$Command
  )

  Write-Host ""
  Write-Host "==> $Label"
  $commandArgs = @($Command | Select-Object -Skip 1)
  & $Command[0] @commandArgs
  if ($LASTEXITCODE -ne 0) {
    throw "$Label failed with exit code $LASTEXITCODE"
  }
  Write-Host "PASS $Label"
}

Write-Host "Stage 6 staging build check"
Write-Host "This script does not start servers, seed data, or deploy."

Invoke-Stage6Step -Label "API build" -Command @("pnpm", "--filter", "api", "build")
Invoke-Stage6Step -Label "API unit tests" -Command @("pnpm", "--filter", "api", "test", "--runInBand")
Invoke-Stage6Step -Label "API e2e tests" -Command @("pnpm", "--filter", "api", "test:e2e", "--runInBand")
Invoke-Stage6Step -Label "Admin Web build" -Command @("pnpm", "--filter", "admin-web", "build")
Invoke-Stage6Step -Label "Admin Web lint" -Command @("pnpm", "--filter", "admin-web", "lint")
Invoke-Stage6Step -Label "Public Web build" -Command @("pnpm", "--filter", "public-web", "build")
Invoke-Stage6Step -Label "Public Web lint" -Command @("pnpm", "--filter", "public-web", "lint")

if (Get-Command flutter -ErrorAction SilentlyContinue) {
  Write-Host ""
  Write-Host "==> Mobile flutter analyze"
  Push-Location apps\mobile
  try {
    flutter analyze
    if ($LASTEXITCODE -ne 0) {
      throw "Mobile flutter analyze failed with exit code $LASTEXITCODE"
    }
    Write-Host "PASS Mobile flutter analyze"
  } finally {
    Pop-Location
  }
} else {
  Write-Host ""
  Write-Host "SKIP Mobile flutter analyze: Flutter was not found on PATH."
}

Write-Host ""
Write-Host "PASS Stage 6 staging build check complete."
