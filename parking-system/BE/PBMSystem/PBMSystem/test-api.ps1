$base = "https://localhost:53568"
$dbPath = "$PSScriptRoot\PBMSystem.API\pbmsystem_dev.db"

function Invoke-Api($Method, $Uri, $Body = $null, $Token = $null) {
    $args = @("-sk", "-w", "`n%{http_code}", "-X", $Method, "$base$Uri", "-H", "Content-Type: application/json")
    if ($Token) { $args += @("-H", "Authorization: Bearer $Token") }
    if ($Body) { $args += @("-d", ($Body | ConvertTo-Json -Compress -Depth 5)) }
    $out = & curl.exe @args
    $lines = $out -split "`n"
    $code = [int]$lines[-1]
    $raw = ($lines[0..($lines.Length - 2)] -join "`n")
    $json = if ($raw) { $raw | ConvertFrom-Json } else { $null }
    return @{ Code = $code; Json = $json }
}

function Log-Test($name, $pass, $detail) {
    $status = if ($pass) { "PASS" } else { "FAIL" }
    Write-Output "[$status] $name - $detail"
    return $pass
}

$passed = 0
$failed = 0
function T($name, $pass, $detail) {
    if (Log-Test $name $pass $detail) { $script:passed++ } else { $script:failed++ }
}

$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$email = "apitest$ts@example.com"
$user = "apitest$ts"
$pass = "TestPass123!"

$sw = curl.exe -sk -o NUL -w "%{http_code}" "$base/swagger/v1/swagger.json"
T "Swagger JSON" ($sw -eq "200") "HTTP $sw"

$ui = curl.exe -sk -o NUL -w "%{http_code}" "$base/swagger/index.html"
T "Swagger UI" ($ui -eq "200") "HTTP $ui"

$r = Invoke-Api POST "/api/auth/register/send-otp" @{ email = $email }
$otp = $r.Json.data.otpCode
T "POST /api/auth/register/send-otp" ($r.Json.success -and $otp) "HTTP $($r.Code) otp=$otp msg=$($r.Json.message)"

$r = Invoke-Api POST "/api/auth/register/verify" @{
    email = $email; otp = $otp; username = $user; password = $pass
    firstName = "Api"; lastName = "Test"
}
$access = $r.Json.data.accessToken
$refresh = $r.Json.data.refreshToken
$userId = $r.Json.data.user.id
T "POST /api/auth/register/verify" ($r.Json.success -and $access) "HTTP $($r.Code) role=$($r.Json.data.user.role)"

$r = Invoke-Api GET "/api/auth/me" -Token $access
T "GET /api/auth/me" ($r.Json.success) "HTTP $($r.Code)"

$r = Invoke-Api PUT "/api/auth/profile" @{
    firstName = "Api"; lastName = "Test"; phoneNumber = "+84901111111"; address = "123 Test St"
} -Token $access
T "PUT /api/auth/profile" ($r.Json.success -and $r.Json.data.phoneNumber) "HTTP $($r.Code)"

$r = Invoke-Api POST "/api/auth/refresh" @{ refreshToken = $refresh }
$access2 = $r.Json.data.accessToken
$refresh2 = $r.Json.data.refreshToken
T "POST /api/auth/refresh" ($r.Json.success) "HTTP $($r.Code)"

$r = Invoke-Api POST "/api/auth/login" @{ emailOrUsername = $email; password = $pass }
T "POST /api/auth/login" ($r.Json.success) "HTTP $($r.Code)"

$newPass = "NewTestPass456!"
$r = Invoke-Api POST "/api/auth/password/change" @{
    currentPassword = $pass; newPassword = $newPass
} -Token $access2
$pass = $newPass
T "POST /api/auth/password/change" ($r.Json.success) "HTTP $($r.Code)"

$r = Invoke-Api POST "/api/auth/login" @{ emailOrUsername = $email; password = $pass }
$access = $r.Json.data.accessToken
$refresh = $r.Json.data.refreshToken
T "POST /api/auth/login (new password)" ($r.Json.success) "HTTP $($r.Code)"

$r = Invoke-Api POST "/api/auth/password/forgot" @{ email = $email }
$otpReset = $r.Json.data.otpCode
T "POST /api/auth/password/forgot" ($r.Json.success -and $otpReset) "HTTP $($r.Code) otp=$otpReset"

$pass2 = "ResetPass789!"
$r = Invoke-Api POST "/api/auth/password/reset" @{
    email = $email; otp = $otpReset; newPassword = $pass2
}
$pass = $pass2
T "POST /api/auth/password/reset" ($r.Json.success) "HTTP $($r.Code)"

$r = Invoke-Api POST "/api/auth/login" @{ emailOrUsername = $email; password = $pass }
$access = $r.Json.data.accessToken
$refresh = $r.Json.data.refreshToken
T "POST /api/auth/login (after reset)" ($r.Json.success) "HTTP $($r.Code)"

$r = Invoke-Api POST "/api/auth/revoke" @{ refreshToken = $refresh } -Token $access
T "POST /api/auth/revoke" ($r.Json.success) "HTTP $($r.Code)"

$r = Invoke-Api POST "/api/auth/refresh" @{ refreshToken = $refresh }
T "POST /api/auth/refresh (revoked)" (-not $r.Json.success) "HTTP $($r.Code) msg=$($r.Json.message)"

$r = Invoke-Api POST "/api/auth/login" @{ emailOrUsername = $email; password = $pass }
$access = $r.Json.data.accessToken
T "POST /api/auth/login" ($r.Json.success) "HTTP $($r.Code)"

$codeUser = (curl.exe -sk -o NUL -w "%{http_code}" -H "Authorization: Bearer $access" "$base/api/users")
T "GET /api/users as User" ($codeUser -eq "403") "HTTP $codeUser (expect 403)"

# Promote to Admin
$promoteTool = Join-Path $PSScriptRoot "tools\PromoteAdmin\PromoteAdmin.csproj"
$rows = (dotnet run --project $promoteTool -- $dbPath $email 2>&1 | Select-Object -Last 1).ToString().Trim()
T "Bootstrap Admin (SQL)" ($rows -eq "1") "updated $rows row(s)"

$r = Invoke-Api POST "/api/auth/login" @{ emailOrUsername = $email; password = $pass }
$adminToken = $r.Json.data.accessToken
T "POST /api/auth/login as Admin" ($r.Json.data.user.role -eq "Admin") "role=$($r.Json.data.user.role)"

$r = Invoke-Api GET "/api/users" -Token $adminToken
$cnt = @($r.Json.data).Count
T "GET /api/users as Admin" ($r.Json.success -and $cnt -ge 1) "HTTP $($r.Code) count=$cnt"

$r = Invoke-Api PUT "/api/users/$userId" @{
    firstName = "Api"; lastName = "Staff"; phoneNumber = "+84903333333"
    address = "789 Staff Rd"; role = "Staff"; status = "Active"
} -Token $adminToken
T "PUT /api/users/{id}" ($r.Json.success -and $r.Json.data.role -eq "Staff") "HTTP $($r.Code) role=$($r.Json.data.role)"

$r = Invoke-Api POST "/api/auth/google" @{ idToken = "invalid-token" }
T "POST /api/auth/google (invalid)" (-not $r.Json.success) "HTTP $($r.Code) msg=$($r.Json.message)"

$r1 = Invoke-Api POST "/api/auth/register/send-otp" @{ email = "cool$ts@example.com" }
$r2 = Invoke-Api POST "/api/auth/register/send-otp" @{ email = "cool$ts@example.com" }
T "OTP 60s cooldown" ($r1.Json.success -and -not $r2.Json.success) "2nd msg=$($r2.Json.message)"

Write-Output "`n=== Summary: $passed passed, $failed failed ==="
exit $failed
