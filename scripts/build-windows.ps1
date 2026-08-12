$ErrorActionPreference = 'Stop'

Write-Host '=== BilaScript v1.2.0 Native CVNSS4.0 - Windows build ===' -ForegroundColor Cyan

function Require-Command([string]$Name, [string]$InstallHint) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Khong tim thay '$Name'. $InstallHint"
    }
}

Require-Command 'java' 'Hay cai Temurin/OpenJDK 8 va them JAVA_HOME/PATH.'
Require-Command 'javac' 'Can JDK 8, khong chi JRE.'
Require-Command 'ant' 'Hay cai Apache Ant, vi du: choco install ant -y'

Write-Host "`n[1/7] Toolchain" -ForegroundColor Yellow
java -version
javac -version
ant -version

$javaVersion = (& java -version 2>&1 | Select-Object -First 1) -join ''
if ($javaVersion -notmatch '1\.8\.0') {
    Write-Warning "Repo legacy dang dung source/target 1.5. CI da xac minh build voi JDK 8; phien ban hien tai la: $javaVersion"
}

Write-Host "`n[2/7] Clean" -ForegroundColor Yellow
ant clean
if ($LASTEXITCODE -ne 0) { throw 'ant clean that bai' }

Write-Host "`n[3/7] Build runner" -ForegroundColor Yellow
ant babylscriptrun
if ($LASTEXITCODE -ne 0) { throw 'ant babylscriptrun that bai' }
if (-not (Test-Path 'build/babylscriptrun.jar')) { throw 'Khong tao duoc build/babylscriptrun.jar' }

Write-Host "`n[4/7] Smoke test native ---bila---" -ForegroundColor Yellow
$output = & java -jar build/babylscriptrun.jar babylrunner/sample.bila.js
$output | Tee-Object -FilePath build/runner-output-windows.txt
if (-not ($output -match 'Xin chaol BilaScript')) { throw 'Smoke test thieu: Xin chaol BilaScript' }
if (-not ($output -match 'Xin chaol CVNSS4.0')) { throw 'Smoke test thieu: Xin chaol CVNSS4.0' }
if (-not ($output -match 'Dof zail: 3')) { throw 'Smoke test native API that bai: dof_zail' }

Write-Host "`n[5/7] Kiem tra tuong thich ---cvss--- v1.0.0" -ForegroundColor Yellow
$legacy = & java -jar build/babylscriptrun.jar babylrunner/sample.cvss.js
$legacy | Tee-Object -FilePath build/legacy-output-windows.txt
if (-not ($legacy -match 'Xin chaol BilaScript')) { throw 'Legacy sample that bai' }

Write-Host "`n[6/7] Build Babyl2JS" -ForegroundColor Yellow
ant babyl2js
if ($LASTEXITCODE -ne 0) { throw 'ant babyl2js that bai' }
if (-not (Test-Path 'build/babyl2js.jar')) { throw 'Khong tao duoc build/babyl2js.jar' }

Write-Host "`n[7/7] Translate native sample -> JS + HTML" -ForegroundColor Yellow
& java -jar build/babyl2js.jar babylrunner/sample.bila.js build/sample.bila.compiled.js
if ($LASTEXITCODE -ne 0) { throw 'Dich sang JavaScript that bai' }
& java -jar build/babyl2js.jar -html babylrunner/sample.bila.js build/sample.bila.html
if ($LASTEXITCODE -ne 0) { throw 'Dich sang HTML that bai' }

$required = @(
    'build/babylscriptrun.jar',
    'build/babyl2js.jar',
    'build/runner-output-windows.txt',
    'build/legacy-output-windows.txt',
    'build/sample.bila.compiled.js',
    'build/sample.bila.html'
)
foreach ($path in $required) {
    if (-not (Test-Path $path)) { throw "Thieu artifact: $path" }
    if ((Get-Item $path).Length -eq 0) { throw "Artifact rong: $path" }
}

$compiled = Get-Content 'build/sample.bila.compiled.js' -Raw
if ($compiled -notmatch "'bila'") { throw 'Babyl2JS output thieu native namespace bila' }
if ($compiled -notmatch 'dof_zail') { throw 'Babyl2JS output thieu translated property dof_zail' }

Write-Host "`nBUILD SUCCESSFUL - BilaScript v1.2.0 Native CVNSS4.0" -ForegroundColor Green
Write-Host 'Artifacts:'
$required | ForEach-Object { Write-Host "  - $_" }
