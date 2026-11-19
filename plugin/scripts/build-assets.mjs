// Generate plugin/assets/prompt-refinery from the repository root.
//
// The DSH host re-reads SKILL.md on every catalog discovery and every load, so
// refreshing the assets is enough to ship an update — no repackage, no restart.
// Assets are generated (not committed): run this before registering or updating.
import { cpSync, existsSync, mkdirSync, rmSync, readFileSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const pluginDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const repoDir = join(pluginDir, '..')
const assetsDir = join(pluginDir, 'assets', 'prompt-refinery')

const FILES = ['SKILL.md']
const DIRS = ['references', 'prompts', 'docs']

if (!existsSync(join(repoDir, 'SKILL.md'))) {
  console.error(`SKILL.md not found in ${repoDir}`)
  process.exit(1)
}

rmSync(join(pluginDir, 'assets'), { recursive: true, force: true })
mkdirSync(assetsDir, { recursive: true })

for (const f of FILES) cpSync(join(repoDir, f), join(assetsDir, f))
for (const d of DIRS) {
  const src = join(repoDir, d)
  if (existsSync(src)) cpSync(src, join(assetsDir, d), { recursive: true })
}

const skill = join(assetsDir, 'SKILL.md')
const text = readFileSync(skill, 'utf8')
if (!/^---/.test(text) || !/^name:\s*prompt-refinery\s*$/m.test(text)) {
  console.error('generated SKILL.md does not look like the prompt-refinery skill')
  process.exit(1)
}

console.log('assets generated:', assetsDir)
console.log('  SKILL.md', statSync(skill).size, 'bytes')
for (const d of DIRS) {
  const p = join(assetsDir, d)
  if (!existsSync(p)) continue
  console.log(`  ${d}/`, 'present')
}