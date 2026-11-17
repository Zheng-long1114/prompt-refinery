#!/usr/bin/env node
// Translation parity check.
//
// Two levels of signal:
//   FAIL  structural damage in a translation (unbalanced fences, wrong column
//         count where a table exists, missing H1 or switcher, headings out of
//         the source order, stray headings the source does not have)
//   WARN  a translation lags the English source (fewer sections / tables /
//         fences). Lag is allowed — translations are maintained asynchronously —
//         but it is always reported so nobody mistakes it for up-to-date.
//
// usage: node scripts/check-i18n.mjs [--strict]
//   --strict turns lag into a failure (use before a release).
// exit 0 = no structural damage, 1 = damage (or lag with --strict)

import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const strict = process.argv.includes('--strict')
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const i18nDir = join(root, 'i18n')
const source = readFileSync(join(root, 'README.md'), 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')

function fingerprint(text) {
  const lines = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').split('\n')
  const headings = []
  let fences = 0
  let inFence = false
  const tables = []
  let current = null

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
    if (/^\s*\|.*\|\s*$/.test(line)) {
      const cells = line.trim().replace(/^\||\|$/g, '').split('|').length
      if (!current) { current = []; tables.push(current) }
      current.push(cells)
    } else current = null
  }
  return { headings, fences, tables }
}

const want = fingerprint(source)
const files = existsSync(i18nDir)
  ? readdirSync(i18nDir).filter((f) => /^README\.[A-Za-z-]+\.md$/.test(f)).sort()
  : []

const problems = []
const lags = []
const rows = []

for (const name of files) {
  const text = readFileSync(join(i18nDir, name), 'utf8').replace(/\r\n/g, '\n')
  const got = fingerprint(text)
  const head = text.split('\n').slice(0, 8).join('\n')

  if (!/^#\s+prompt-refinery/m.test(head)) problems.push(`${name}: H1 "# prompt-refinery" missing near the top`)
  if (!text.includes('**🌐**')) problems.push(`${name}: language switcher line missing`)
  if (got.fences % 2 !== 0) problems.push(`${name}: unbalanced code fences (${got.fences})`)

  // headings must follow the source order; missing allowed, extra not
  let j = 0
  for (const level of got.headings) {
    const at = want.headings.indexOf(level, j)
    if (at < 0) { problems.push(`${name}: heading level ${level} is out of source order or does not exist in the source`); break }
    j = at + 1
  }

  // table shapes: every table width must exist somewhere in the source, and
  // every row inside one table must agree on the width (catches broken pipes)
  const widths = new Set(want.tables.map((t) => t[0]))
  got.tables.forEach((t, i) => {
    const w = t[0]
    if (!widths.has(w)) problems.push(`${name}: table #${i + 1} has ${w} columns, no source table uses that width`)
    const bad = t.find((c) => c !== w)
    if (bad !== undefined) problems.push(`${name}: table #${i + 1} mixes ${w}- and ${bad}-column rows`)
  })

  const behind =
    want.headings.length - got.headings.length ||
    want.tables.length - got.tables.length ||
    want.fences - got.fences
  const state = behind > 0 ? 'LAG ' : 'ok  '
  if (behind > 0) lags.push(`${name} (headings ${got.headings.length}/${want.headings.length}, tables ${got.tables.length}/${want.tables.length}, fences ${got.fences}/${want.fences})`)
  rows.push(`${state} ${name.padEnd(22)} headings ${String(got.headings.length).padStart(2)}  fences ${String(got.fences).padStart(2)}  tables ${got.tables.length}`)
}

console.log(`reference: README.md   headings ${want.headings.length}  fences ${want.fences}  tables ${want.tables.length}\n`)
for (const r of rows) console.log(r)

if (lags.length) {
  console.log(`\nLAG: ${lags.length} translation(s) behind the English source (allowed, not up to date):`)
  for (const l of lags) console.log('  - ' + l)
  if (strict) console.log('  --strict is on, so this fails the check.')
}

if (problems.length) {
  console.log('\nBROKEN:')
  for (const p of problems) console.log('  - ' + p)
}

if (problems.length || (strict && lags.length)) {
  console.log('\nRESULT: FAIL')
  process.exit(1)
}
console.log(`\nRESULT: OK — ${files.length} translations, no structural damage${lags.length ? ', some lagging' : ', all current'}`)