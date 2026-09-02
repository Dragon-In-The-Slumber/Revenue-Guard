# Switch to the directory where this script is located
Set-Location -LiteralPath $PSScriptRoot

Write-Host "Building and Starting entire backend via Docker (Bypassing local Windows Python completely)..."
docker-compose up -d --build
Start-Sleep -Seconds 5

# Start Next.js Dashboard (Terminal 1)
Start-Process powershell -WorkingDirectory "$PSScriptRoot\dashboard" -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host "All services have been launched!"
Write-Host "API: http://localhost:8000"
Write-Host "Dashboard: http://localhost:3000"
