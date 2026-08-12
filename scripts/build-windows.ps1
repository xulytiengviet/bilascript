$ErrorActionPreference = 'Stop'

Write-Host '=== BilaScript CVNSS4.0 - Windows build ===' -ForegroundColor Cyan

function Require-Command([string]$Name, [string]$InstallHint) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Khong tim thay '$Name'. $InstallHint"
    }
}

Require-Command 'java' 'Hay cai Temurin/OpenJDK 8 va them JAVA_HOME/PATH.'
Require-Command 'javac' 'Can JDK 8, khong chi JRE.'
Require-Command 'ant' 'Hay cai Apache Ant, vi du: choco install ant -y'

Write-Host "`n[1/6] Toolchain" -ForegroundColor Yellow
java -version
javac -version
ant -version

$javaVersion = (& java -version 2>&1 | Select-Object -First 1) -join ''
if ($javaVersion -notmatch '1\.8\.0') {
    Write-Warning "Repo legacy dang dung source/target 1.5. CI da xac minh voi JDK 8; phien ban hien tai la: $javaVersion"
}

Write-Host "`n[2/6] Clean" -ForegroundColor Yellow
ant clean
if ($LASTEXITCODE -ne 0) { throw 'ant clean that bai' }

Write-Host "`n[3/6] Build runner" -ForegroundColor Yellow
ant babylscriptrun
if ($LASTEXITCODE -ne 0) { throw 'ant babylscriptrun that bai' }
if (-not (Test-Path 'build/babylscriptrun.jar')) { throw 'Khong tao duoc build/babylscriptrun.jar' }

Write-Host "`n[4/6] Smoke test CVNSS4.0" -ForegroundColor Yellow
$output = & java -jar build/babylscriptrun.jar babylrunner/sample.cvss.js
$output | Tee-Object -FilePath build/runner-output-windows.txt
if (-not ($output -match 'Xin chaol BilaScript')) { throw 'Smoke test thieu: Xin chaol BilaScript' }
if (-not ($output -match 'Xin chaol CVNSS4.0')) { throw 'Smoke test thieu: Xin chaol CVNSS4.0' }

Write-Host "`n[5/6] Build Babyl2JS" -ForegroundColor Yellow
ant babyl2js
if ($LASTEXITCODE -ne 0) { throw 'ant babyl2js that bai' }
if (-not (Test-Path 'build/babyl2js.jar')) { throw 'Khong tao duoc build/babyl2js.jar' }

Write-Host "`n[6/6] Translate sample -> JS + HTML" -ForegroundColor Yellow
& java -jar build/babyl2js.jar babylrunner/sample.cvss.js build/sample.cvss.compiled.js
if ($LASTEXITCODE -ne 0) { throw 'Dich sang JavaScript that bai' }
& java -jar build/babyl2js.jar -html babylrunner/sample.cvss.js build/sample.cvss.html
if ($LASTEXITCODE -ne 0) { throw 'Dich sang HTML that bai' }

$required = @(
    'build/babylscriptrun.jar',
    'build/babyl2js.jar',
    'build/runner-output-windows.txt',
    'build/sample.cvss.compiled.js',
    'build/sample.cvss.html'
)
foreach ($path in $required) {
    if (-not (Test-Path $path)) { throw "Thieu artifact: $path" }
    if ((Get-Item $path).Length -eq 0) { throw "Artifact rong: $path" }
}

Write-Host "`nBUILD SUCCESSFUL - BilaScript CVNSS4.0" -ForegroundColor Green
Write-Host 'Artifacts:'
$required | ForEach-Object { Write-Host "  - $_" }
