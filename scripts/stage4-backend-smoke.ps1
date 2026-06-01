param(
  [string]$ApiUrl = $env:STAGE4_API_URL,
  [string]$DeveloperEmail = $env:STAGE4_DEVELOPER_EMAIL,
  [string]$DeveloperPassword = $env:STAGE4_DEVELOPER_PASSWORD,
  [string]$PlatformEmail = $env:STAGE4_PLATFORM_EMAIL,
  [string]$PlatformPassword = $env:STAGE4_PLATFORM_PASSWORD
)

$ErrorActionPreference = "Stop"

if (-not $ApiUrl) {
  $ApiUrl = "http://localhost:3000"
}
$ApiUrl = $ApiUrl.TrimEnd("/")

function Get-HeaderValue {
  param(
    [object]$Headers,
    [string]$Name
  )

  if (-not $Headers) {
    return $null
  }
  foreach ($key in $Headers.Keys) {
    if ($key -ieq $Name) {
      $value = $Headers[$key]
      if ($value -is [array]) {
        return $value[0]
      }
      return $value
    }
  }
  return $null
}

function Format-SmokeFailure {
  param(
    [string]$Path,
    [object]$ErrorRecord
  )

  $response = $ErrorRecord.Exception.Response
  if ($response) {
    $statusCode = [int]$response.StatusCode
    $requestId = Get-HeaderValue -Headers $response.Headers -Name "x-request-id"
    if (-not $requestId) {
      $requestId = Get-HeaderValue -Headers $response.Headers -Name "x-correlation-id"
    }
    if ($requestId) {
      return "$Path failed with HTTP $statusCode requestId=$requestId"
    }
    return "$Path failed with HTTP $statusCode"
  }

  return "$Path failed: $($ErrorRecord.Exception.Message)"
}

function Invoke-Json {
  param(
    [string]$Method,
    [string]$Path,
    [hashtable]$Headers = @{},
    [object]$Body = $null
  )

  $params = @{
    Method = $Method
    Uri = "$ApiUrl$Path"
    Headers = $Headers
    ContentType = "application/json"
  }
  if ($null -ne $Body) {
    $params.Body = ($Body | ConvertTo-Json -Depth 10)
  }

  try {
    Invoke-RestMethod @params
  } catch {
    throw (Format-SmokeFailure -Path $Path -ErrorRecord $_)
  }
}

function Invoke-Web {
  param(
    [string]$Method,
    [string]$Path,
    [hashtable]$Headers = @{}
  )

  try {
    Invoke-WebRequest -Method $Method -Uri "$ApiUrl$Path" -Headers $Headers
  } catch {
    throw (Format-SmokeFailure -Path $Path -ErrorRecord $_)
  }
}

function Assert-CredentialPair {
  param(
    [string]$Email,
    [string]$Password,
    [string]$Label
  )

  if (($Email -and -not $Password) -or ($Password -and -not $Email)) {
    throw "$Label credentials are incomplete. Provide both email and password, or neither for partial smoke."
  }
}

function Login {
  param(
    [string]$Email,
    [string]$Password,
    [string]$Label
  )

  if (-not $Email -and -not $Password) {
    Write-Host "Skipping $Label authenticated checks: no credentials supplied."
    return $null
  }

  $response = Invoke-Json -Method "POST" -Path "/auth/login" -Body @{ email = $Email; password = $Password }
  Write-Host "$Label login: OK"
  return $response.accessToken
}

function Check-Endpoint {
  param(
    [string]$Path,
    [string]$Token,
    [string]$Label
  )

  if (-not $Token) {
    Write-Host "Skipping $Path for $Label: no token."
    return
  }

  Invoke-Json -Method "GET" -Path $Path -Headers @{ Authorization = "Bearer $Token" } | Out-Null
  Write-Host "$Label $Path: OK"
}

function Check-TextEndpoint {
  param(
    [string]$Path,
    [string]$Token,
    [string]$Label
  )

  if (-not $Token) {
    Write-Host "Skipping $Path for $Label: no token."
    return
  }

  Invoke-Web -Method "GET" -Path $Path -Headers @{ Authorization = "Bearer $Token" } | Out-Null
  Write-Host "$Label $Path: OK"
}

function Check-RateLimitHeaders {
  param(
    [string]$Path,
    [string]$Token,
    [string]$Label
  )

  if (-not $Token) {
    Write-Host "Skipping rate-limit header check for $Label $Path: no token."
    return
  }

  $response = Invoke-Web -Method "GET" -Path $Path -Headers @{ Authorization = "Bearer $Token" }
  $limit = Get-HeaderValue -Headers $response.Headers -Name "x-rate-limit-limit"
  $remaining = Get-HeaderValue -Headers $response.Headers -Name "x-rate-limit-remaining"
  $reset = Get-HeaderValue -Headers $response.Headers -Name "x-rate-limit-reset"
  if (-not $limit -or -not $remaining -or -not $reset) {
    throw "Missing rate-limit headers for $Path"
  }
  Write-Host "$Label $Path rate-limit headers: OK"
}

Write-Host "Stage 4 backend smoke against $ApiUrl"

Assert-CredentialPair -Email $DeveloperEmail -Password $DeveloperPassword -Label "Developer"
Assert-CredentialPair -Email $PlatformEmail -Password $PlatformPassword -Label "Platform"

Invoke-Json -Method "GET" -Path "/health" | Out-Null
Write-Host "API /health: OK"

$developerToken = Login -Email $DeveloperEmail -Password $DeveloperPassword -Label "Developer"
$platformToken = Login -Email $PlatformEmail -Password $PlatformPassword -Label "Platform"

foreach ($path in @(
  "/operations/summary",
  "/hr/summary",
  "/accounting/summary",
  "/legal/summary",
  "/ads/summary",
  "/cameras/summary",
  "/operations/reports/overview",
  "/accounting/reports/cashflow",
  "/operations/activities",
  "/hr/export/employees?format=json&limit=5"
)) {
  Check-Endpoint -Path $path -Token $developerToken -Label "Developer"
}

Check-TextEndpoint -Path "/hr/export/employees?format=csv&limit=5" -Token $developerToken -Label "Developer"
Check-RateLimitHeaders -Path "/operations/reports/overview" -Token $developerToken -Label "Developer report"
Check-RateLimitHeaders -Path "/hr/export/employees?format=json&limit=5" -Token $developerToken -Label "Developer export"

Check-Endpoint -Path "/operations/summary" -Token $platformToken -Label "Platform"
Check-Endpoint -Path "/operations/reports/overview" -Token $platformToken -Label "Platform"
Check-Endpoint -Path "/operations/activities" -Token $platformToken -Label "Platform"

Write-Host "Stage 4 backend smoke complete."
