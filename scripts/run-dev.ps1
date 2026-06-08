# scripts/run-dev.ps1
# AgriChain - Windows Dev Environment Orchestrator
#
# Usage:
#   .\scripts\run-dev.ps1                       # node + deploy + tests + frontend
#   .\scripts\run-dev.ps1 -SkipTests            # skip tests
#   .\scripts\run-dev.ps1 -SkipTests -NoFrontend

param(
    [switch]$SkipTests,
    [switch]$NoFrontend
)

$ErrorActionPreference = "Stop"

function Write-Step { param($msg) Write-Host "" ; Write-Host "  [STEP] $msg" -ForegroundColor Cyan }
function Write-Ok   { param($msg) Write-Host "  [ OK ] $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  [WARN] $msg" -ForegroundColor Yellow }
function Write-Fail { param($msg) Write-Host "  [FAIL] $msg" -ForegroundColor Red }

Write-Host ""
Write-Host "  =====================================================" -ForegroundColor Magenta
Write-Host "    AgriChain - Dev Environment Startup" -ForegroundColor Magenta
Write-Host "  =====================================================" -ForegroundColor Magenta
Write-Host ""

$Root     = Split-Path -Parent $PSScriptRoot
$Frontend = Join-Path $Root "frontend"
Set-Location $Root

# ---- 1. Check / Start Hardhat Node ----------------------
Write-Step "1. Checking Hardhat node on port 8545..."

$nodeRunning = $false
try {
    $tcp = New-Object System.Net.Sockets.TcpClient("127.0.0.1", 8545)
    $tcp.Close()
    $nodeRunning = $true
} catch { }

if ($nodeRunning) {
    Write-Warn "Port 8545 already in use - assuming Hardhat node is running"
} else {
    Write-Host "  Starting Hardhat node in new terminal window..." -ForegroundColor White
    Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/k title Hardhat Node && npx hardhat node" `
        -WorkingDirectory $Root
    Write-Host "  Waiting for node to start (5 seconds)..."
    Start-Sleep -Seconds 5

    $attempts = 0
    $nodeUp   = $false
    while ($attempts -lt 10) {
        try {
            $tcp2 = New-Object System.Net.Sockets.TcpClient("127.0.0.1", 8545)
            $tcp2.Close()
            $nodeUp = $true
            break
        } catch { }
        $attempts++
        Start-Sleep -Seconds 2
    }

    if ($nodeUp) {
        Write-Ok "Hardhat node is up at http://127.0.0.1:8545"
    } else {
        Write-Fail "Hardhat node did not start. Run manually: npx hardhat node"
        exit 1
    }
}

# ---- 2. Compile -----------------------------------------
Write-Step "2. Compiling contracts..."
& npx hardhat compile
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Compilation failed"
    exit 1
}
Write-Ok "Compilation successful"

# ---- 3. Deploy ------------------------------------------
Write-Step "3. Deploying to localhost..."
& npm run deploy:local
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Deployment failed"
    exit 1
}
Write-Ok "Deployment successful"

# ---- 4. Unit Tests --------------------------------------
if (-not $SkipTests) {
    Write-Step "4. Running unit tests (test/AgriChain.test.js)..."
    & npx hardhat test
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "Unit tests failed"
        exit 1
    }
    Write-Ok "All unit tests passed"

    # ---- 5. Integration Tests ----------------------------
    Write-Step "5. Running full integration tests (scripts/test-full.js)..."
    & npx hardhat run scripts/test-full.js --network localhost
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "Integration tests failed - review output above"
        exit 1
    }
    Write-Ok "All integration tests passed"
} else {
    Write-Warn "Skipping tests (-SkipTests flag set)"
}

# ---- 6. Frontend ----------------------------------------
if (-not $NoFrontend) {
    Write-Step "6. Starting frontend dev server..."

    $nmPath = Join-Path $Frontend "node_modules"
    if (-not (Test-Path $nmPath)) {
        Write-Host "  Installing frontend dependencies..." -ForegroundColor White
        & npm install --prefix $Frontend
        if ($LASTEXITCODE -ne 0) {
            Write-Fail "Frontend npm install failed"
            exit 1
        }
    }

    Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/k title AgriChain Frontend && cd /d `"$Frontend`" && npm run dev" `
        -WorkingDirectory $Frontend

    Start-Sleep -Seconds 4

    $frontendUp = $false
    try {
        $tcpF = New-Object System.Net.Sockets.TcpClient("127.0.0.1", 3000)
        $tcpF.Close()
        $frontendUp = $true
    } catch { }

    if ($frontendUp) {
        Write-Ok "Frontend running at http://localhost:3000"
        try {
            Start-Process "http://localhost:3000"
            Write-Ok "Browser opened"
        } catch {
            Write-Warn "Could not auto-open browser - navigate to http://localhost:3000"
        }
    } else {
        Write-Warn "Frontend window opened (Vite may still be starting - check its terminal)"
    }
} else {
    Write-Warn "Skipping frontend (-NoFrontend flag set)"
}

# ---- Summary --------------------------------------------
Write-Host ""
Write-Host "  =====================================================" -ForegroundColor Magenta
Write-Host "    AgriChain Dev Environment Ready" -ForegroundColor Magenta
Write-Host "  =====================================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "    Hardhat Node  : http://127.0.0.1:8545" -ForegroundColor White
if (-not $NoFrontend) {
    Write-Host "    Frontend      : http://localhost:3000" -ForegroundColor White
}
Write-Host ""
Write-Host "    MetaMask Setup:" -ForegroundColor White
Write-Host "      Network  : Hardhat Localhost" -ForegroundColor Gray
Write-Host "      RPC URL  : http://127.0.0.1:8545" -ForegroundColor Gray
Write-Host "      Chain ID : 31337" -ForegroundColor Gray
Write-Host "      Currency : ETH" -ForegroundColor Gray
Write-Host ""
Write-Host "    Test Accounts (import private key from Hardhat node output):" -ForegroundColor White
Write-Host "      #0 Admin       : 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" -ForegroundColor Gray
Write-Host "      #1 Petani 1    : 0x70997970C51812dc3A010C7d01b50e0d17dc79C8" -ForegroundColor Gray
Write-Host "      #2 Auditor     : 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" -ForegroundColor Gray
Write-Host "      #3 Distributor : 0x90F79bf6EB2c4f870365E785982E1f101E93b906" -ForegroundColor Gray
Write-Host "      #4 Petani 2    : 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65" -ForegroundColor Gray
Write-Host "      #5 Distributor2: 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc" -ForegroundColor Gray
Write-Host ""
Write-Host "    Press Ctrl+C to exit." -ForegroundColor DarkGray
Write-Host ""

try {
    while ($true) { Start-Sleep -Seconds 60 }
} catch { }
