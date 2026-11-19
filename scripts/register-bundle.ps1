<#
.SYNOPSIS
  Register prompt-refinery as a DSH bundle plugin (persistent install, loads at host startup).

.DESCRIPTION
  The skills directory is scanned at runtime: delete or move it and the skill is
  gone. A bundle is part of the deployment - the host loads it at startup and the
  skill is served from packaged assets, so it survives directory cleanup, profile
  switching and reinstalls.

  What it does:
    1. junction <profile>/node_modules/dsh-skill-prompt-refinery -> this package
    2. add "dsh-skill-prompt-refinery": "link:..." to the profile dependencies
    3. append it to dsh.profile.bundles
    4. run a module self-check that lists and loads the skill

  Requires one DSH restart to take effect. -Revert undoes everything.

.PARAMETER Profile
  DSH profile name (default $env:DSH_PROFILE or 'desktop').

.PARAMETER PackageDir
  The bundle package (default ../plugin relative to this script).

.PARAMETER Revert
  Remove the registration.
#>
[CmdletBinding()]
param(
  [string]$Profile = $(if ($env:DSH_PROFILE) { $env:DSH_PROFILE } else { 'desktop' }),
  [string]$PackageDir,
  [switch]$Revert
)

$ErrorActionPreference = 'Stop'
$dshHome = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $HOME '.dsh' }
$profileDir = Join-Path $dshHome "profiles\$Profile"
$pkgName = 'dsh-skill-prompt-refinery'
if (-not $PackageDir) { $PackageDir = Join-Path (Split-Path $PSScriptRoot -Parent) 'plugin' }
$linkPath = Join-Path $profileDir "node_modules\$pkgName"
$pkgJson = Join-Path $profileDir 'package.json'

if (-not (Test-Path $pkgJson)) { throw "profile package.json not found: $pkgJson" }
$json = Get-Content $pkgJson -Raw | ConvertFrom-Json

function Save-Json($obj, $path) {
  $bak = "$path.bak-" + (Get-Date -Format 'yyyyMMdd-HHmmss')
  Copy-Item $path $bak -Force
  Write-Host "backup   : $bak"
  ($obj | ConvertTo-Json -Depth 20) | Set-Content -Path $path -Encoding utf8
}

if ($Revert) {
  if (Test-Path $linkPath) { cmd /c rmdir "$linkPath" 2>&1 | Out-Null; Write-Host "junction removed: $linkPath" }
  if ($json.dependencies.PSObject.Properties.Name -contains $pkgName) {
    $json.dependencies.PSObject.Properties.Remove($pkgName)
  }
  $json.dsh.profile.bundles = @($json.dsh.profile.bundles | Where-Object { $_ -ne $pkgName })
  Save-Json $json $pkgJson
  Write-Host 'reverted. Restart DSH to unload the bundle.'
  return
}

if (-not (Test-Path (Join-Path $PackageDir 'package.json'))) { throw "bundle package not found: $PackageDir" }

# assets are generated, never committed
Push-Location $PackageDir
try {
  node scripts/build-assets.mjs 2>&1 | ForEach-Object { "  $_" }
} finally { Pop-Location }

if (-not (Test-Path $linkPath)) {
  New-Item -ItemType Directory -Force -Path (Split-Path $linkPath -Parent) | Out-Null
  cmd /c mklink /J "$linkPath" "$PackageDir" | Out-Null
  Write-Host "junction : $linkPath -> $PackageDir"
} else { Write-Host 'junction : already present' }

if (-not ($json.dependencies.PSObject.Properties.Name -contains $pkgName)) {
  $normalized = ($PackageDir -replace '\\', '/')
  $json.dependencies | Add-Member -NotePropertyName $pkgName -NotePropertyValue "link:$normalized"
  Write-Host "dependency: link:$normalized"
}
if (@($json.dsh.profile.bundles) -notcontains $pkgName) {
  $json.dsh.profile.bundles = @(@($json.dsh.profile.bundles) + $pkgName)
  Write-Host 'bundle   : entry added'
}
Save-Json $json $pkgJson

Write-Host ''
Write-Host 'module self-check:'
Push-Location $PackageDir
try {
  node -e "import('./lib/index.js').then(async m=>{const ps=[];m.apply({skills:{registerProvider:f=>ps.push(f({invalidate(){}}))},logger:{info(){},warn:console.error}},{});const p=ps[0];const l=await p.list({});const c=l.candidates[0];const b=await p.get(c,{});console.log('name='+c.name);console.log('rank='+c.rank);console.log('chars='+b.content.length);console.log('h1='+b.content.split('\n')[0])})" 2>&1 | ForEach-Object { "  $_" }
} finally { Pop-Location }

Write-Host ''
Write-Host 'Registered. Restart DSH once: the bundle loads at startup.'