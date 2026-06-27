param(
  [int]$Port = 8000
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

function Test-Command($Name) {
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

Write-Host "ILAW Teacher Studio"
Write-Host "Project: $Root"

if (Test-Command "py") {
  Write-Host "Starting local server with Python launcher..."
  Write-Host "Open: http://localhost:$Port"
  Start-Process "http://localhost:$Port"
  py -3 -m http.server $Port
  exit
}

if (Test-Command "python") {
  Write-Host "Starting local server with Python..."
  Write-Host "Open: http://localhost:$Port"
  Start-Process "http://localhost:$Port"
  python -m http.server $Port
  exit
}

if (Test-Command "python3") {
  Write-Host "Starting local server with Python 3..."
  Write-Host "Open: http://localhost:$Port"
  Start-Process "http://localhost:$Port"
  python3 -m http.server $Port
  exit
}

Write-Host "Python was not found. Opening index.html directly instead."
Start-Process (Join-Path $Root "index.html")
