#!/usr/bin/env node
// Validate a prompt-refinery skill bundle the same way dsh-skill-filesystem
// does, without external dependencies.
//
// usage: node scripts/validate.mjs [skillDir]
// exit 0 = PASS, exit 1 = FAIL

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const dir = resolve(process.argv[2] ?? '.')
const skillFile = join(dir, 'SKILL.md')
const report = []
let ok = true

const fail = (m) => { ok = false; report.push(`FAIL  ${m}`) }
const pass = (m) => report.push(`ok    ${m}`)

if (!existsSync(skillFile)) {
  fail('SKILL.md not found')
} else {
  const text = readFileSync(skillFile, 'utf8')
  const lines = text.split(/\r?\n/)

  if (lines[0] !== '---') fail('frontmatter must start with --- on line 1')
  else {
    pass('frontmatter block opened')
    let end = -1
    for (let i = 1; i < lines.length; i++) if (lines[i] === '---') { end = i; break }
    if (end < 0) fail('frontmatter is not closed with ---')
    else {
      const head = lines.slice(1, end)
      const key = (k) => {
        const line = head.find((l) => l.startsWith(`${k}:`))
        return line === undefined ? undefined : line.slice(k.length + 1).trim()
      }

      const name = key('name')
      if (!name) fail('name is missing')
      else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) fail(`name is not kebab-case: ${name}`)
      else pass(`name ok: ${name}`)

      const rawDesc = key('description')
      if (!rawDesc) fail('description is missing')
      else {
        const quoted = rawDesc.startsWith('"') || rawDesc.startsWith("'")
        const body = rawDesc.replace(/^["']|["']$/g, '')
        if (body.length > 500) fail(`description exceeds 500 chars (got ${body.length})`)
        else pass(`description length ${body.length} <= 500`)
        if (!quoted && body.includes(': ')) {
          fail('plain-scalar description contains ": " -> YAML parse error; wrap it in quotes')
        } else if (!quoted) {
          pass('description is a valid plain scalar')
        }
      }

      const inv = key('user-invocable')
      if (inv !== undefined) {
        if (!/^(true|false)$/.test(inv)) fail(`user-invocable must be true or false (got ${inv})`)
        else pass(`user-invocable = ${inv}`)
      }
    }
  }

  const refs = [...new Set([...text.matchAll(/references\/[a-z0-9-]+\.md/g)].map((m) => m[0]))]
  for (const r of refs) {
    if (existsSync(join(dir, r))) pass(`referenced file exists: ${r}`)
    else fail(`referenced file missing: ${r}`)
  }
  if (refs.length === 0) report.push('note  SKILL.md references no sub-files')

  const files = []
  const walk = (p) => {
    for (const e of readdirSync(p, { withFileTypes: true })) {
      const q = join(p, e.name)
      if (e.isDirectory()) walk(q)
      else files.push(q)
    }
  }
  walk(dir)
  report.push(`info  bundle files: ${files.length}`)
}

console.log(report.join('\n'))
console.log(ok ? '\nVALIDATION: PASS' : '\nVALIDATION: FAIL')
process.exit(ok ? 0 : 1)