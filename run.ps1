param(
  [int]$Port = 8000
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

function Test-Command($Name) {
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Get-UsablePythonCommand {
  $candidates = @(
    (Join-Path $env:LOCALAPPDATA "Programs\Python\Python312\python.exe"),
    (Join-Path $env:LOCALAPPDATA "Programs\Python\Python311\python.exe"),
    (Join-Path $env:LOCALAPPDATA "Programs\Python\Python310\python.exe"),
    "py",
    "python",
    "python3"
  )

  foreach ($candidate in $candidates) {
    $command = Get-Command $candidate -ErrorAction SilentlyContinue
    if (-not $command) {
      continue
    }

    try {
      $version = & $command.Source --version 2>&1
      if ($LASTEXITCODE -eq 0 -and "$version" -match "Python 3") {
        return $command.Source
      }
    } catch {
      continue
    }
  }

  return $null
}

Write-Host "ILAW Teacher Studio"
Write-Host "Project: $Root"

$PythonCommand = Get-UsablePythonCommand
if ($PythonCommand) {
  Write-Host "Starting local server with Python: $PythonCommand"
  Write-Host "Open: http://localhost:$Port"
  $env:PORT = "$Port"
  Start-Process "http://localhost:$Port"
  & $PythonCommand server.py
  exit
}

Write-Host "Python was not found. Opening index.html directly instead."
Start-Process (Join-Path $Root "index.html")
