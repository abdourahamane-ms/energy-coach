# Energy Coach - demarrage local complet avec Ollama
# Utilisation :
#   powershell -ExecutionPolicy Bypass -File .\start-complet.ps1
# Option :
#   powershell -ExecutionPolicy Bypass -File .\start-complet.ps1 -Rebuild

param(
    [switch]$Rebuild,
    [switch]$Dev
)

$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

function Info($message) {
    Write-Host "[OK] $message" -ForegroundColor Green
}

function Step($message) {
    Write-Host ""
    Write-Host "==> $message" -ForegroundColor Cyan
}

function Warn($message) {
    Write-Host "[ATTENTION] $message" -ForegroundColor Yellow
}

function Stop-WithMessage($message) {
    Write-Host "[ERREUR] $message" -ForegroundColor Red
    exit 1
}

function Get-DotEnvValue($key, $fallback) {
    $envPath = Join-Path $PSScriptRoot ".env"
    if (-not (Test-Path -LiteralPath $envPath)) {
        return $fallback
    }

    $line = Get-Content -LiteralPath $envPath |
        Where-Object { $_ -match "^\s*$([regex]::Escape($key))\s*=" } |
        Select-Object -First 1

    if (-not $line) {
        return $fallback
    }

    $value = ($line -replace "^\s*$([regex]::Escape($key))\s*=\s*", "").Trim()
    $value = $value.Trim('"').Trim("'")
    if ([string]::IsNullOrWhiteSpace($value)) {
        return $fallback
    }
    return $value
}

function Test-LocalPortFree($port) {
    try {
        $existing = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if ($existing) {
            return $false
        }
    } catch {
        # Fallback below when Get-NetTCPConnection is unavailable.
    }

    $listener = $null
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $port)
        $listener.Start()
        return $true
    } catch {
        return $false
    } finally {
        if ($listener) {
            $listener.Stop()
        }
    }
}

function Get-FreePort($startPort) {
    for ($port = $startPort; $port -le ($startPort + 20); $port++) {
        if (Test-LocalPortFree $port) {
            return $port
        }
    }
    Stop-WithMessage "Aucun port libre trouve entre $startPort et $($startPort + 20). Ferme les anciens serveurs puis relance."
}

function Test-OllamaReady($baseUrl) {
    try {
        Invoke-RestMethod -Uri "$baseUrl/api/tags" -Method Get -TimeoutSec 2 | Out-Null
        return $true
    } catch {
        return $false
    }
}

function Ensure-Command($name, $installHint) {
    $cmd = Get-Command $name -ErrorAction SilentlyContinue
    if (-not $cmd) {
        Stop-WithMessage "$name est introuvable. $installHint"
    }
    return $cmd.Source
}

Step "Verification du dossier projet"
if (-not (Test-Path -LiteralPath "package.json")) {
    Stop-WithMessage "package.json est introuvable. Lance ce script depuis le dossier energy-coach."
}
if (-not (Test-Path -LiteralPath "prisma\schema.prisma")) {
    Stop-WithMessage "prisma\schema.prisma est introuvable."
}
Info "Projet detecte : $PSScriptRoot"

Step "Verification de .env"
if (-not (Test-Path -LiteralPath ".env")) {
    $secret = ([guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N"))
    @"
DATABASE_URL="file:./dev.db"
SESSION_SECRET="$secret"
OLLAMA_URL="http://127.0.0.1:11434"
OLLAMA_MODEL="gemma3:4b"
"@ | Set-Content -LiteralPath ".env" -Encoding UTF8
    Info ".env cree automatiquement pour le local"
} else {
    Info ".env trouve"
}

$ollamaUrl = (Get-DotEnvValue "OLLAMA_URL" "http://127.0.0.1:11434").TrimEnd("/")
$ollamaModel = Get-DotEnvValue "OLLAMA_MODEL" "gemma3:4b"

Step "Verification de Node.js et npm"
Ensure-Command "node" "Installe Node.js 20.9+ puis relance." | Out-Null
Ensure-Command "npm" "Installe Node.js avec npm puis relance." | Out-Null
Info "Node.js et npm disponibles"

Step "Verification des dependances npm"
if (-not (Test-Path -LiteralPath "node_modules")) {
    Warn "node_modules absent : installation des dependances..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Stop-WithMessage "npm install a echoue."
    }
} else {
    Info "node_modules deja present"
}

Step "Demarrage et verification d'Ollama"
$ollamaExe = Ensure-Command "ollama" "Installe Ollama depuis https://ollama.com/download puis relance."

if (-not (Test-OllamaReady $ollamaUrl)) {
    Warn "Ollama ne repond pas encore. Demarrage en arriere-plan..."
    Start-Process -FilePath $ollamaExe -ArgumentList "serve" -WindowStyle Hidden | Out-Null

    $ready = $false
    for ($i = 1; $i -le 30; $i++) {
        Start-Sleep -Seconds 1
        if (Test-OllamaReady $ollamaUrl) {
            $ready = $true
            break
        }
    }

    if (-not $ready) {
        Stop-WithMessage "Ollama n'a pas demarre sur $ollamaUrl. Ouvre un terminal et teste : ollama serve"
    }
}
Info "Ollama actif sur $ollamaUrl"

Step "Verification du modele Ollama : $ollamaModel"
$tags = Invoke-RestMethod -Uri "$ollamaUrl/api/tags" -Method Get -TimeoutSec 10
$models = @($tags.models | ForEach-Object { $_.name })
if ($models -notcontains $ollamaModel) {
    Warn "Modele $ollamaModel absent. Telechargement..."
    ollama pull $ollamaModel
    if ($LASTEXITCODE -ne 0) {
        Stop-WithMessage "Impossible de telecharger le modele $ollamaModel."
    }
} else {
    Info "Modele deja installe : $ollamaModel"
}

Step "Preparation Prisma et base SQLite"
$dbPath = Join-Path $PSScriptRoot "prisma\dev.db"
$dbExistsBefore = Test-Path -LiteralPath $dbPath
$prismaClientIndex = Join-Path $PSScriptRoot "node_modules\.prisma\client\index.js"
$prismaQueryEngine = Join-Path $PSScriptRoot "node_modules\.prisma\client\query_engine-windows.dll.node"
$prismaClientReady = (Test-Path -LiteralPath $prismaClientIndex) -and (Test-Path -LiteralPath $prismaQueryEngine)

npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    Stop-WithMessage "Les migrations Prisma ont echoue."
}

if ($prismaClientReady -and -not $Rebuild) {
    Info "Client Prisma deja present"
} else {
    npx prisma generate
    if ($LASTEXITCODE -ne 0) {
        $prismaClientReadyAfterFailure = (Test-Path -LiteralPath $prismaClientIndex) -and (Test-Path -LiteralPath $prismaQueryEngine)
        if ($prismaClientReadyAfterFailure) {
            Warn "Prisma generate a echoue, probablement car un serveur local utilise deja le client. Client existant conserve."
        } else {
            Stop-WithMessage "La generation Prisma a echoue."
        }
    }
}

if (-not $dbExistsBefore) {
    Warn "Base SQLite nouvelle : lancement du seed..."
    npm run db:seed
    if ($LASTEXITCODE -ne 0) {
        Stop-WithMessage "Le seed de la base a echoue."
    }
} else {
    Info "Base SQLite deja presente"
}

Step "Verification des QR codes de demonstration"
$qrDir = Join-Path $PSScriptRoot "public\qrcodes"
$hasQr = (Test-Path -LiteralPath $qrDir) -and ((Get-ChildItem -LiteralPath $qrDir -Filter "*.png" -ErrorAction SilentlyContinue | Measure-Object).Count -gt 0)
if (-not $hasQr) {
    npm run qrcodes
    if ($LASTEXITCODE -ne 0) {
        Stop-WithMessage "La generation des QR codes a echoue."
    }
} else {
    Info "QR codes deja presents"
}

$port = Get-FreePort 3000
$url = "http://localhost:$port"

if ($Dev) {
    Step "Demarrage en mode developpement"
    Start-Process $url
    Write-Host ""
    Write-Host "Energy Coach est lance sur $url" -ForegroundColor Green
    Write-Host "Ollama est actif sur $ollamaUrl avec le modele $ollamaModel" -ForegroundColor Green
    Write-Host "Laisse cette fenetre ouverte. Ctrl+C pour arreter." -ForegroundColor DarkGray
    npm run dev -- -p $port
    exit $LASTEXITCODE
}

Step "Verification du build de production"
if ($Rebuild -or -not (Test-Path -LiteralPath ".next\BUILD_ID")) {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Stop-WithMessage "Le build Next.js a echoue."
    }
} else {
    Info "Build de production deja present"
}

Step "Demarrage du serveur Energy Coach"
Start-Process $url
Write-Host ""
Write-Host "Energy Coach est lance sur $url" -ForegroundColor Green
Write-Host "Ollama est actif sur $ollamaUrl avec le modele $ollamaModel" -ForegroundColor Green
Write-Host "Laisse cette fenetre ouverte. Ctrl+C pour arreter." -ForegroundColor DarkGray
npm run start -- -p $port
exit $LASTEXITCODE
