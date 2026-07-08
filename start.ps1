# =====================================================================
#  Energy Coach — démarrage du serveur (à lancer après un redémarrage)
#  Clic droit sur ce fichier > "Exécuter avec PowerShell"
#  ou dans un terminal : powershell -ExecutionPolicy Bypass -File .\start.ps1
# =====================================================================

# Se placer dans le dossier du projet (dossier de ce script)
Set-Location -Path $PSScriptRoot

Write-Host "Energy Coach - preparation..." -ForegroundColor Green

# S'assurer que la base SQL et le client Prisma sont prets (idempotent)
npx prisma migrate deploy | Out-Null
npx prisma generate | Out-Null

# Ouvrir le navigateur sur l'application
Start-Process "http://localhost:3000"

Write-Host "Serveur en cours de demarrage sur http://localhost:3000 ..." -ForegroundColor Green
Write-Host "(Laissez cette fenetre ouverte. Fermez-la ou Ctrl+C pour arreter le serveur.)" -ForegroundColor DarkGray

# Lancer le serveur de developpement
npm run dev
