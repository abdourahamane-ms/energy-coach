# =====================================================================
#  Energy Coach — demarrage du serveur (a lancer apres un redemarrage)
#  Clic droit sur ce fichier > "Executer avec PowerShell"
#  ou dans un terminal : powershell -ExecutionPolicy Bypass -File .\start.ps1
#
#  Utilise le BUILD DE PRODUCTION (stable et rapide) plutot que le mode dev.
#  Pour forcer une reconstruction apres une modification du code :
#     Remove-Item -Recurse -Force .next ; puis relancer ce script.
# =====================================================================

Set-Location -Path $PSScriptRoot

Write-Host "Energy Coach - preparation..." -ForegroundColor Green

# Base SQL + client Prisma (idempotent)
npx prisma migrate deploy | Out-Null
npx prisma generate | Out-Null

# Construire l'application si aucun build de production n'existe encore
if (-not (Test-Path ".next\BUILD_ID")) {
    Write-Host "Construction de l'application (premiere fois, ~1 min)..." -ForegroundColor Yellow
    npm run build
}

# Ouvrir le navigateur
Start-Process "http://localhost:3000"

Write-Host "Serveur demarre sur http://localhost:3000" -ForegroundColor Green
Write-Host "(Laissez cette fenetre ouverte. Ctrl+C pour arreter.)" -ForegroundColor DarkGray

# Lancer le serveur de production
npm run start
