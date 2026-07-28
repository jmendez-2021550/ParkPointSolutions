$root = $PSScriptRoot

$services = @(
    @{ name = "ApiGateway";     dir = "$root\Backend\ApiGateway" },
    @{ name = "AuthService";    dir = "$root\Backend\AuthService" },
    @{ name = "ParkingService"; dir = "$root\Backend\ParkingService" },
    @{ name = "PricingService"; dir = "$root\Backend\PricingService" },
    @{ name = "FavoritesService"; dir = "$root\Backend\FavoritesService" },
    @{ name = "ReportsService"; dir = "$root\Backend\ReportsService" }
)

foreach ($svc in $services) {
    Write-Host "Iniciando $($svc.name) en $($svc.dir) ..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$($svc.dir)'; Write-Host '$($svc.name) iniciando...' -ForegroundColor Green; node index.js" -WindowStyle Normal
    Start-Sleep -Milliseconds 800
}

Write-Host ""
Write-Host "Todos los servicios han sido iniciados en ventanas separadas." -ForegroundColor Green
Write-Host "Puertos: Gateway=4000  Auth=4001  Parking=4002  Pricing=4003  Favorites=4004  Reports=4005" -ForegroundColor Yellow
