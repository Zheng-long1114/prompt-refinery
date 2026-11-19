<#
.SYNOPSIS
  Install prompt-refinery into a project as a committed skill (project-level, follows the repo).

.DESCRIPTION
  Writes the skill to <project>/.agents/skills/prompt-refinery so anyone who
  clones the project gets it. DSH scans that root before the user roots, so the
  project copy wins over a user-level or bundled copy.

  Modes:
    clone  - git clone from GitHub (keeps .git, update with git pull)
    copy   - copy from a local checkout (no .git)
    link   - directory junction to a local checkout (edits apply immediately)

.PARAMETER Project
  Project root. Default: current directory.

.PARAMETER Mode
  clone (default) | copy | link.

.PARAMETER Source
  Local checkout used by copy/link. Default: this repository.

.PARAMETER Root
  Skill root inside the project. Default: .agents/skills (use .dsh/skills for the
  highest-priority project root).

.EXAMPLE
  pwsh -File scripts/install-project.ps1 -Project D:\code\my-app -Mode link
#>
[CmdletBinding()]
param(
  [string]$Project = (Get-Location).Path,
  [ValidateSet('clone', 'copy', 'link')]
  [string]$Mode = 'clone',
  [string]$Source,
  [string]$Root = '.agents/skills'
)

$ErrorActionPreference = 'Stop'
$name = 'prompt-refinery'
$repoUrl = 'https://github.com/Zheng-long1114/prompt-refinery.git'
if (-not $Source) { $Source = Split-Path $PSScriptRoot -Parent }
$target = Join-Path (Join-Path $Project $Root) $name

if (-not (Test-Path $Project)) { throw "project not found: $Project" }
New-Item -ItemType Directory -Force -Path (Split-Path $target) | Out-Null

if (Test-Path $target) {
  Write-Host "already present: $target"
  Write-Host 'update with: git -C <target> pull   (clone mode)'
} else {
  switch ($Mode) {
    'clone' {
      $proxy = if ($env:HTTPS_PROXY) { $env:HTTPS_PROXY } else { 'http://127.0.0.1:7897' }
      git -c http.proxy=$proxy clone -q $repoUrl $target
      Write-Host "cloned  : $target"
    }
    'copy' {
      Copy-Item $Source $target -Recurse -Force
      Remove-Item (Join-Path $target '.git') -Recurse -Force -ErrorAction SilentlyContinue
      Write-Host "copied  : $target"
    }
    'link' {
      cmd /c mklink /J "$target" "$Source" | Out-Null
      Write-Host "linked  : $target -> $Source"
    }
  }
}

$skill = Join-Path $target 'SKILL.md'
if (-not (Test-Path $skill)) { throw "install failed, no SKILL.md at $skill" }
$bytes = (Get-Item $skill).Length
$files = (Get-ChildItem $target -Recurse -File | Where-Object { $_.FullName -notlike "*\.git\*" }).Count
Write-Host ''
Write-Host "installed: $target"
Write-Host "  SKILL.md $bytes bytes, $files files"
Write-Host "  scanned as project root rank 200 (root '.agents/skills') or 100 (root '.dsh/skills')"
Write-Host '  takes effect on the next catalog lookup - no restart needed'