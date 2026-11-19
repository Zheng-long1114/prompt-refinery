/**
 * Bundled prompt-refinery skill provider.
 *
 * The host reads the skill body from ./assets/prompt-refinery/SKILL.md on every
 * catalog discovery and every load, so editing the file needs no repackage and
 * no restart. Registering here instead of relying on the skills directory makes
 * the skill part of the deployment: it appears in every session and every agent
 * preset that shares the host skill registry.
 */

import { readFile, stat } from 'node:fs/promises'
import { isAbsolute, join, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Skill folder name inside the assets root. */
const SKILL_NAME = 'prompt-refinery'
/** Rank used by other bundled providers (see dsh-skill BUNDLED_SKILL_RANK). */
const BUNDLED_SKILL_RANK = 600
/** Assets root; `assetRoot` config can point somewhere else. */
const DEFAULT_ASSET_ROOT = fileURLToPath(new URL('../assets/', import.meta.url))

/** Cordis plugin identity. */
export const name = 'skill-prompt-refinery'
/** Registry this plugin contributes to. */
export const inject = ['skills']

/**
 * Pull `description` out of the YAML frontmatter without a YAML dependency.
 * The description must be a single-line scalar (quoted or plain).
 * @param {string} raw file contents
 * @param {string} path file path, for error messages
 * @returns {{ description: string, content: string }}
 */
export function parseSkill(raw, path) {
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(raw)
  if (frontmatter?.[1] === undefined) {
    throw new Error(`skill-prompt-refinery: ${path} has no YAML frontmatter`)
  }
  const line = /(?:^|\r?\n)description:[ \t]*(.+?)[ \t]*(?:\r?\n|$)/u.exec(frontmatter[1])
  if (line?.[1] === undefined) {
    throw new Error(`skill-prompt-refinery: ${path} has no description`)
  }
  let description = line[1].trim()
  if (
    (description.startsWith('"') && description.endsWith('"'))
    || (description.startsWith("'") && description.endsWith("'"))
  ) {
    description = description.slice(1, -1)
  }
  if (description.length === 0) {
    throw new Error(`skill-prompt-refinery: ${path} has an empty description`)
  }
  return { description, content: raw.slice(frontmatter[0].length).trim() }
}

/**
 * Register the prompt-refinery skill on the host skill registry.
 * @param {import('@deepseek-ai/cordis').Context} ctx host context carrying `skills`
 * @param {{ assetRoot?: string }} [config] optional asset root override
 */
export function apply(ctx, config = {}) {
  const assetRoot = config.assetRoot ?? DEFAULT_ASSET_ROOT
  if (!isAbsolute(assetRoot)) {
    throw new Error('skill-prompt-refinery: assetRoot must be an absolute directory')
  }
  const directory = join(assetRoot, SKILL_NAME)
  const locator = join(directory, 'SKILL.md')
  let warned = false

  /** @returns {Promise<{kind:'loaded',description:string,content:string}|{kind:'failed',error:unknown}>} */
  async function readSkill(signal) {
    let raw
    try {
      raw = await readFile(locator, { encoding: 'utf8', signal })
    } catch (error) {
      if (signal?.aborted === true) throw error
      if (!warned) {
        warned = true
        ctx.logger?.warn?.(`skill-prompt-refinery: cannot read ${locator}: ${String(error)}`)
      }
      return { kind: 'failed', error }
    }
    warned = false
    return { kind: 'loaded', ...parseSkill(raw, locator) }
  }

  ctx.skills.registerProvider((control) => ({
    name: 'prompt-refinery-bundled',

    async list(options) {
      const read = await readSkill(options?.signal)
      if (read.kind === 'failed') {
        // A missing bundle is confirmed-empty state, not an incomplete scan.
        return { candidates: [], complete: true }
      }
      return {
        candidates: [
          {
            name: SKILL_NAME,
            description: read.description,
            invocation: { modelInvocable: true, userInvocable: true },
            provider: 'prompt-refinery-bundled',
            source: 'bundled',
            rank: BUNDLED_SKILL_RANK,
            resourceBase: { kind: 'directory', path: directory.split(sep).join('/') },
            locator,
          },
        ],
        complete: true,
      }
    },

    async get(candidate, options) {
      const { rank: _rank, locator: _locator, ...summary } = candidate
      const read = await readSkill(options?.signal)
      if (read.kind === 'failed') {
        control.invalidate()
        return undefined
      }
      return { ...summary, content: read.content }
    },
  }))

  ctx.logger?.info?.(`skill-prompt-refinery: serving ${locator}`)
  return { directory }
}

/** Exposed for diagnostics: whether the packaged asset tree is present. */
export async function assetStatus() {
  try {
    const info = await stat(join(DEFAULT_ASSET_ROOT, SKILL_NAME, 'SKILL.md'))
    return { ok: true, bytes: info.size, root: DEFAULT_ASSET_ROOT }
  } catch (error) {
    return { ok: false, error: String(error), root: DEFAULT_ASSET_ROOT }
  }
}