#!/usr/bin/env node
// Check that every i18n/README.<tag>.md keeps the structure of the English
// README: same heading sequence, same table shapes, balanced code fences, and
// the shared language switcher line. No dependencies.
//
// usage: node scripts/check-i18n.mjs
// exit 0 = all good, exit 1 = drift found

import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const i18nDir = join(root, 'i18n')
const source = readFileSync(join(root, 'README.md'), 'utf8')

const normalize = (t) => t.replace(/\r\n/g, '\n').replace(/^\uFEFF/, '')

// Structural fingerprint: heading levels in order, fence count, and per-table
// (row, column) shape. Text itself is free to be translated.
function fingerprint(text) {
  const lines = normalize(text).split('\n')
  const headings = []
  let fences = 0
  const tables = []
  let current = null
  let inFence = false

  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence
      fences++
      continue
    }
    if (inFence) continue
    const h = /^(#{1,6})\s+/.exec(line)
    if (h) {
      headings.push(h[1].length)
      current = null
      continue
    }
    const isRow = /^\s*\|.*\|\s*$/.test(line)
    if (isRow) {
      const cells = line.trim().replace(/^\||\|$/g, '').split('|').length
      if (!current) {
        current = []
        tables.push(current)
      }
      current.push(cells)
    } else {
      current = null
    }
  }
  return { headings, fences, tables }
}

const want = fingerprint(source)
const problems = []
const checked = []

if (!existsSync(i18nDir)) {
  console.log('no i18n/ directory - nothing to check')
  process.exit(0)
}

const files = readdirSync(i18nDir).filter((f) => /^README\.[A-Za-z-]+\.md$/.test(f)).sort()

for (const name of files) {
  const path = join(i18nDir, name)
  const text = normalize(readFileSync(path, 'utf8'))
  const got = fingerprint(text)
  const tag = name.replace(/^README\.|\.md$/g, '')

  if (!text.startsWith('# prompt-refinery')) problems.push(`${name}: line 1 must be "# prompt-refinery"`)
  if (!text.includes('**🌐**')) problems.push(`${name}: missing language switcher line`)
  if (got.fences !== want.fences) problems.push(`${name}: code fences ${got.fences} != ${want.fences}`)

  const a = want.headings.join(',')
  const b = got.headings.join(',')
  if (a !== b) problems.push(`${name}: heading levels differ\n      want ${a}\n      got  ${b}`)

  if (got.tables.length !== want.tables.length) {
    problems.push(`${name}: tables ${got.tables.length} != ${want.tables.length}`)
  } else {
    want.tables.forEach((t, i) => {
      const g = got.tables[i]
      if (g.length !== t.length) {
        problems.push(`${name}: table #${i + 1} rows ${g.length} != ${t.length}`)
      } else {
        t.forEach((cols, r) => {
          if (g[r] !== cols) problems.push(`${name}: table #${i + 1} row ${r + 1} columns ${g[r]} != ${cols}`)
        })
      }
    })
  }

  checked.push(`${name.padEnd(22)} headings ${String(got.headings.length).padStart(3)}  fences ${String(got.fences).padStart(3)}  tables ${got.tables.length}  bytes ${text.length}`)
}

console.log(`reference: README.md  headings ${want.headings.length}  fences ${want.fences}  tables ${want.tables.length}\n`)
for (const line of checked) console.log('ok   ' + line)

if (problems.length) {
  console.log('\nDRIFT:')
  for (const p of problems) console.log('  - ' + p)
  process.exit(1)
}
console.log(`\nOK: ${files.length} translations match the English structure`)