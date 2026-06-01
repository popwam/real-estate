param()

$ErrorActionPreference = "Stop"

$requiredEnv = @(
  "STAGING_API_URL",
  "STAGING_ADMIN_WEB_URL",
  "STAGING_PUBLIC_WEB_URL",
  "STAGING_PLATFORM_EMAIL",
  "STAGING_PLATFORM_PASSWORD",
  "STAGING_DEVELOPER_EMAIL",
  "STAGING_DEVELOPER_PASSWORD",
  "STAGING_BROKERAGE_EMAIL",
  "STAGING_BROKERAGE_PASSWORD",
  "STAGING_BROKER_EMAIL",
  "STAGING_BROKER_PASSWORD"
)

$missing = @()
foreach ($name in $requiredEnv) {
  if (-not [Environment]::GetEnvironmentVariable($name)) {
    $missing += $name
  }
}

if ($missing.Count -gt 0) {
  Write-Host "FAIL staging smoke missing required environment variables:"
  foreach ($name in $missing) {
    Write-Host " - $name"
  }
  Write-Host "No requests were sent. See STAGE3_STAGING_SMOKE.md for setup."
  exit 1
}

$ApiUrl = $env:STAGING_API_URL.TrimEnd("/")
$AdminUrl = $env:STAGING_ADMIN_WEB_URL.TrimEnd("/")
$PublicUrl = $env:STAGING_PUBLIC_WEB_URL.TrimEnd("/")

function New-SmokeRequestId {
  return "staging-smoke-{0}-{1}" -f ([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()), ([Guid]::NewGuid().ToString("N").Substring(0, 12))
}

function Convert-Body {
  param([string]$Text)

  if (-not $Text) {
    return $null
  }

  try {
    return $Text | ConvertFrom-Json
  } catch {
    return $Text
  }
}

function Invoke-SmokeJson {
  param(
    [string]$Method,
    [string]$Url,
    [object]$Body = $null,
    [string]$Token = ""
  )

  $requestId = New-SmokeRequestId
  $headers = @{
    Accept = "application/json"
    "x-request-id" = $requestId
  }

  if ($Token) {
    $headers.Authorization = "Bearer $Token"
  }

  try {
    $args = @{
      Method = $Method
      Uri = $Url
      Headers = $headers
      UseBasicParsing = $true
    }

    if ($null -ne $Body) {
      $args.ContentType = "application/json"
      $args.Body = ($Body | ConvertTo-Json -Depth 8)
    }

    $response = Invoke-WebRequest @args
    return [pscustomobject]@{
      StatusCode = [int]$response.StatusCode
      Headers = $response.Headers
      Body = Convert-Body $response.Content
      RequestId = $response.Headers["x-request-id"]
      SentRequestId = $requestId
    }
  } catch {
    $response = $_.Exception.Response
    $statusCode = if ($response) { [int]$response.StatusCode } else { 0 }
    $responseRequestId = $null
    if ($response -and $response.Headers) {
      $responseRequestId = $response.Headers["x-request-id"]
    }
    $failureRequestId = $responseRequestId
    if (-not $failureRequestId) {
      $failureRequestId = $requestId
    }
    Write-Host "FAIL $Method $Url -> HTTP $statusCode requestId=$failureRequestId"
    throw
  }
}

function Invoke-SmokePage {
  param([string]$Url)

  try {
    $response = Invoke-WebRequest -Method "Get" -Uri $Url -UseBasicParsing -Headers @{
      "x-request-id" = New-SmokeRequestId
    }
    if ([int]$response.StatusCode -lt 200 -or [int]$response.StatusCode -gt 399) {
      throw "Unexpected status $($response.StatusCode)"
    }
    return [int]$response.StatusCode
  } catch {
    Write-Host "FAIL GET $Url"
    throw
  }
}

function Assert-Ok {
  param(
    [object]$Response,
    [string]$Label
  )

  if ($Response.StatusCode -lt 200 -or $Response.StatusCode -gt 299) {
    throw "$Label returned HTTP $($Response.StatusCode)"
  }
}

function Test-Login {
  param(
    [string]$Label,
    [string]$Email,
    [string]$Password
  )

  $session = Invoke-SmokeJson -Method "Post" -Url "$ApiUrl/auth/login" -Body @{
    email = $Email
    password = $Password
  }
  Assert-Ok -Response $session -Label "$Label login"

  if (-not $session.Body.accessToken) {
    throw "$Label login did not return an access token."
  }

  $me = Invoke-SmokeJson -Method "Get" -Url "$ApiUrl/auth/me" -Token $session.Body.accessToken
  Assert-Ok -Response $me -Label "$Label auth/me"

  Write-Host "PASS $Label login/auth-me -> $($me.Body.user.email) / $($me.Body.organization.type) requestId=$($me.RequestId)"
  return $session.Body.accessToken
}

Write-Host "Stage 3 staging smoke"
Write-Host "API: $ApiUrl"
Write-Host "Admin Web: $AdminUrl"
Write-Host "Public Web: $PublicUrl"

$health = Invoke-SmokeJson -Method "Get" -Url "$ApiUrl/health"
Assert-Ok -Response $health -Label "API health"
if (-not $health.RequestId) {
  throw "API health response did not include x-request-id."
}
Write-Host "PASS API health -> requestId=$($health.RequestId)"

$platformToken = Test-Login -Label "Platform" -Email $env:STAGING_PLATFORM_EMAIL -Password $env:STAGING_PLATFORM_PASSWORD
$developerToken = Test-Login -Label "Developer" -Email $env:STAGING_DEVELOPER_EMAIL -Password $env:STAGING_DEVELOPER_PASSWORD
$brokerageToken = Test-Login -Label "Brokerage" -Email $env:STAGING_BROKERAGE_EMAIL -Password $env:STAGING_BROKERAGE_PASSWORD
$brokerToken = Test-Login -Label "Broker" -Email $env:STAGING_BROKER_EMAIL -Password $env:STAGING_BROKER_PASSWORD

$marketplace = Invoke-SmokeJson -Method "Get" -Url "$ApiUrl/marketplace/projects" -Token $brokerToken
Assert-Ok -Response $marketplace -Label "Broker marketplace projects"
$marketplaceCount = ($marketplace.Body | Measure-Object).Count
Write-Host "PASS broker marketplace projects reachable -> $marketplaceCount item(s) requestId=$($marketplace.RequestId)"

$publicProjects = Invoke-SmokeJson -Method "Get" -Url "$ApiUrl/public/projects"
Assert-Ok -Response $publicProjects -Label "Public projects API"
$publicProjectCount = ($publicProjects.Body | Measure-Object).Count
Write-Host "PASS public projects API reachable -> $publicProjectCount item(s) requestId=$($publicProjects.RequestId)"

if ($env:STAGING_PUBLIC_PROJECT_SLUG) {
  $project = Invoke-SmokeJson -Method "Get" -Url "$ApiUrl/public/projects/$($env:STAGING_PUBLIC_PROJECT_SLUG)"
  Assert-Ok -Response $project -Label "Public project detail API"
  Write-Host "PASS public project detail API -> $env:STAGING_PUBLIC_PROJECT_SLUG requestId=$($project.RequestId)"
}

if ($env:STAGING_CONVERSATION_TOKEN) {
  $conversation = Invoke-SmokeJson -Method "Get" -Url "$ApiUrl/conversations/by-token/$($env:STAGING_CONVERSATION_TOKEN)"
  Assert-Ok -Response $conversation -Label "Public conversation token API"
  Write-Host "PASS public conversation token API reachable -> requestId=$($conversation.RequestId)"
}

$adminStatus = Invoke-SmokePage -Url "$AdminUrl/login"
Write-Host "PASS Admin Web login page -> HTTP $adminStatus"

$publicProjectsUrl = "$PublicUrl/projects"
$publicStatus = Invoke-SmokePage -Url $publicProjectsUrl
Write-Host "PASS Public Web projects page -> HTTP $publicStatus"

Write-Host "PASS staging smoke completed"
Write-Host "Tokens and passwords were not printed."

$null = $platformToken
$null = $developerToken
$null = $brokerageToken
