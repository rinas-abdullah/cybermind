# Maps LOCAL_DOMAIN (default cybermind.local) to 127.0.0.1 in Windows hosts.
# Run PowerShell as Administrator:  .\scripts\register-cybermind-local-domain.ps1

$ErrorActionPreference = "Stop"
$domain = if ($env:LOCAL_DOMAIN) { $env:LOCAL_DOMAIN.Trim() } else { "cybermind.local" }
$hostsPath = Join-Path $env:SystemRoot "System32\drivers\etc\hosts"
$line = "127.0.0.1`t$domain"

if (-not (Test-Path -LiteralPath $hostsPath)) {
  Write-Error "Hosts file not found: $hostsPath"
}

$current = Get-Content -LiteralPath $hostsPath -Raw
if ($current -match [regex]::Escape($domain)) {
  Write-Host "OK: '$domain' already present in hosts."
  exit 0
}

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
  [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  Write-Error "Run this script as Administrator to edit the hosts file."
}

Add-Content -LiteralPath $hostsPath -Value "`r`n# CyberMind local domain`r`n$line`r`n"
Write-Host "Added to hosts: $line"
Write-Host "Set in .env: LOCAL_DOMAIN=$domain  and  SITE_URL=http://${domain}:<PORT>"
Write-Host "Optional: HOST=0.0.0.0  then open http://${domain}:<PORT>"
