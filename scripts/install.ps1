<#
.SYNOPSIS
  Install the prompt-refinery skill into this machine's DSH home.

.DESCRIPTION
  dsh-skill-filesystem scans these roots (lower rank number wins):
    <project>/.dsh/skills -> <project>/.agents/skills -> customSkillDirs
    -> $DSH_HOME/skills -> $HOME/.agents/skills
  Installing into $DSH_HOME/skills is user level: every session and every
  agent preset sees it, and no restart is needed because the root is watched.

.PARAMETER Source
  Bundle directory. Defaults to this repository root (the repo IS the bundle).

.PARAMETER VerifyOnly
  Validate the installed copy only; do not sync.

.EXAMPLE
  powershell -File .\scripts\install.ps1
  powershell -File .\scripts\install.ps1 -VerifyOnly
#>
[CmdletBinding()]
param(
  [string]$Source,
  [switch]$VerifyOnly
)

$ErrorActionPreference = 'Stop'
$name = 'prompt-refinery'
$dshHome = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $HOME '.dsh' }
$target = Join-Path $dshHome "skills\$name"
if (-not $Source) { $Source = Split-Path $PSScriptRoot -Parent }

function Test-Bundle([string]$dir) {
  $skill = Join-Path $dir 'SKILL.md'
  if (-not (Test-Path $skill)) { throw "missing SKILL.md under: $dir" }
  $text = [System.IO.File]::ReadAllText($skill, [System.Text.Encoding]::UTF8)
  $lines = $text -split "`r?`n"
  if ($lines[0] -ne '---') { throw 'frontmatter must start with ---' }
  $end = -1
  for ($i = 1; $i -lt $lines.Count; $i++) { if ($lines[$i] -eq '---') { $end = $i; break } }
  if ($end -lt 0) { throw 'frontmatter is not closed' }
  $head = ($lines[1..($end - 1)] -join "`n")
  if ($head -notmatch '(?m)^name:\s*prompt-refinery\s*$') { throw 'name must be exactly: prompt-refinery' }
  $descLine = ($head -split "`n" | Where-Object { $_ -match '^description:' } | Select-Object -First 1)
  if (-not $descLine) { throw 'description is missing' }
  $descVal = $descLine.Substring(12).Trim().Trim('"')
  if ($descVal.Length -gt 500) { throw "description exceeds 500 chars (got $($descVal.Length))" }
  $quoted = $head -match '(?m)^description:\s*"'
  if (-not $quoted -and $descVal.Contains(': ')) {
    throw 'plain-scalar description contains ": " -> YAML parse error; wrap it in double quotes'
  }
  $refs = [regex]::Matches($text, 'references/[a-z0-9-]+\.md') | ForEach-Object { $_.Value } | Sort-Object -Unique
  foreach ($r in $refs) {
    if (-not (Test-Path (Join-Path $dir $r))) { throw "SKILL.md references a missing file: $r" }
  }
  New-Object psobject -Property ([ordered]@{
      Name       = $name
      Dir        = $dir
      SkillBytes = (Get-Item $skill).Length
      DescChars  = $descVal.Length
      Files      = (Get-ChildItem $dir -Recurse -File).Count
      References = ($refs -join ', ')
    })
}

Write-Host "DSH_HOME  = $dshHome"
Write-Host "source    = $Source"

if (-not $VerifyOnly) {
  if (-not (Test-Path $Source)) { throw "source bundle not found: $Source" }
  New-Item -ItemType Directory -Force -Path (Split-Path $target) | Out-Null
  if (Test-Path $target) {
    $bakRoot = Join-Path $dshHome 'skill-backups'
    New-Item -ItemType Directory -Force -Path $bakRoot | Out-Null
    $bak = Join-Path $bakRoot ("$name.bak-" + (Get-Date -Format 'yyyyMMdd-HHmmss'))
    Copy-Item $target $bak -Recurse -Force
    Write-Host "previous copy backed up to: $bak"
    Copy-Item (Join-Path $Source 'SKILL.md') $target -Force
    Copy-Item (Join-Path $Source 'references') $target -Recurse -Force
    foreach ($extra in @('prompts', 'docs')) {
      $p = Join-Path $Source $extra
      if (Test-Path $p) {
        $dest = Join-Path $target $extra
        if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
        Copy-Item $p $dest -Recurse -Force
      }
    }
  } else {
    New-Item -ItemType Directory -Force -Path $target | Out-Null
    Copy-Item (Join-Path $Source 'SKILL.md') $target -Force
    Copy-Item (Join-Path $Source 'references') $target -Recurse -Force
    foreach ($extra in @('prompts', 'docs')) {
      $p = Join-Path $Source $extra
      if (Test-Path $p) { Copy-Item $p (Join-Path $target $extra) -Recurse -Force }
    }
  }
  Write-Host "installed to = $target"
} else {
  Write-Host "verify only, target = $target"
}

$info = Test-Bundle $target
Write-Host ''
Write-Host 'VALIDATION: PASS'
$info | Format-List | Out-String | Write-Host
Write-Host 'Takes effect without restart: the skills root is watched.'
Write-Host 'Manual invoke: type /prompt-refinery in the composer.'