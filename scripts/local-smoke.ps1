param(
  [string]$ApiUrl = "http://localhost:3000",
  [string]$AdminUrl = "http://127.0.0.1:3203/login"
)

$ErrorActionPreference = "Stop"

function Invoke-Json {
  param(
    [string]$Method,
    [string]$Url,
    [object]$Body = $null,
    [string]$Token = ""
  )

  $headers = @{ Accept = "application/json" }
  if ($Token) {
    $headers.Authorization = "Bearer $Token"
  }

  if ($null -ne $Body) {
    return Invoke-RestMethod -Method $Method -Uri $Url -Headers $headers -ContentType "application/json" -Body ($Body | ConvertTo-Json -Depth 8)
  }

  return Invoke-RestMethod -Method $Method -Uri $Url -Headers $headers
}

function Test-Login {
  param(
    [string]$Label,
    [string]$Email,
    [string]$Password
  )

  $session = Invoke-Json -Method "Post" -Url "$ApiUrl/auth/login" -Body @{
    email = $Email
    password = $Password
  }

  if (-not $session.accessToken) {
    throw "$Label login did not return an access token."
  }

  $me = Invoke-Json -Method "Get" -Url "$ApiUrl/auth/me" -Token $session.accessToken
  Write-Host "PASS $Label login -> $($me.user.email) / $($me.organization.type) / $($me.user.role)"

  return $session.accessToken
}

Write-Host "Checking API health at $ApiUrl/health"
$health = Invoke-Json -Method "Get" -Url "$ApiUrl/health"
$healthStatus = $health.status
if (-not $healthStatus) {
  $healthStatus = $health
}
Write-Host "PASS API health -> $healthStatus"

$platformToken = Test-Login -Label "Platform" -Email "ceo@popwam.com" -Password "30@@mmMM"
$developerToken = Test-Login -Label "Developer" -Email "developer.demo@popwam.local" -Password "Demo@123456"
$brokerageToken = Test-Login -Label "Brokerage" -Email "brokerage.demo@popwam.local" -Password "Demo@123456"
$brokerToken = Test-Login -Label "Broker" -Email "broker.demo@popwam.local" -Password "Demo@123456"

$projects = Invoke-Json -Method "Get" -Url "$ApiUrl/marketplace/projects" -Token $brokerToken
if (($projects | Measure-Object).Count -lt 1) {
  throw "Broker marketplace project list is empty."
}
Write-Host "PASS broker marketplace projects -> $(($projects | Measure-Object).Count) project(s)"

if ($env:NEXT_PUBLIC_API_BASE_URL) {
  Write-Host "PASS Admin env canonical NEXT_PUBLIC_API_BASE_URL=$env:NEXT_PUBLIC_API_BASE_URL"
} elseif ($env:NEXT_PUBLIC_API_URL) {
  Write-Host "WARN Admin env uses legacy NEXT_PUBLIC_API_URL=$env:NEXT_PUBLIC_API_URL"
} else {
  Write-Host "INFO Admin env not present in this shell; admin-web falls back to http://localhost:3000"
}

Write-Host "Admin login route for browser smoke: $AdminUrl"
Write-Host "PASS local smoke completed"
