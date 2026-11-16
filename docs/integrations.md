# Integrations — running prompt-refinery in other agents

The skill is **runner-neutral**. It needs exactly three capabilities from the host:

1. **spawn a subagent** (isolated context) — used for the refiner and the auditor;
2. **ask the user a question with options** — used once per blocking-gap round;
3. **read and write files** — used to load the references and to persist the spec.

If a runner has all three, `SKILL.md` works as-is. If it lacks native skill discovery, add a **one-line pointer** to whatever instruction file that runner already reads. The pointer is the whole integration.

---

## Quick matrix

| Agent | Install location | Trigger |
| --- | --- | --- |
| DSH (DeepSeek Harness) | `$DSH_HOME/skills/prompt-refinery` (default `~/.dsh/skills/`) | auto-discovered + `/prompt-refinery` |
| Claude Code | `~/.claude/skills/prompt-refinery/` (or `<repo>/.claude/skills/`) | auto-discovered + `/prompt-refinery` |
| Codex CLI | `~/.codex/prompt-refinery/` + `~/.codex/AGENTS.md` pointer | instruction file |
| Cursor | `<repo>/.cursor/rules/prompt-refinery.mdc` | `alwaysApply: true` |
| Windsurf | `<repo>/.windsurf/rules/prompt-refinery.md` | `trigger: always_on` |
| Cline / Roo Code | `<repo>/.clinerules/prompt-refinery.md` | always active |
| GitHub Copilot (VS Code) | `<repo>/.github/instructions/prompt-refinery.instructions.md` | `applyTo: "**"` |
| Gemini CLI | `<repo>/GEMINI.md` + bundle in repo | instruction file |
| Aider | `<repo>/CONVENTIONS.md` | `--read CONVENTIONS.md` |
| Continue | `<repo>/.continue/rules/prompt-refinery.md` | auto (rules dir) |
| opencode | `<repo>/AGENTS.md` | instruction file |
| Any other | anywhere readable | one pointer line in its instruction file |

---

## 1. DSH (DeepSeek Harness)

```bash
git clone https://github.com/Zheng-long1114/prompt-refinery.git ~/.dsh/skills/prompt-refinery
```

or, with backup and validation:

```powershell
pwsh -File scripts/install.ps1        # Windows
```
```bash
bash scripts/install.sh               # macOS / Linux / WSL
```

- Roots scanned: `<project>/.dsh/skills` → `<project>/.agents/skills` → custom dirs → `$DSH_HOME/skills` → `~/.agents/skills`.
- Installed at user level, every session and every agent preset sees it.
- The root is watched: **no restart** after install or edit.
- Manual invoke: `/prompt-refinery`.

---

## 2. Claude Code

Personal (all projects):

```bash
mkdir -p ~/.claude/skills
git clone https://github.com/Zheng-long1114/prompt-refinery.git ~/.claude/skills/prompt-refinery
```

Per project (committed with the repo):

```bash
mkdir -p .claude/skills
git clone https://github.com/Zheng-long1114/prompt-refinery.git .claude/skills/prompt-refinery
```

- Frontmatter `name` + `description` drive discovery; `user-invocable: true` enables `/prompt-refinery`.
- Keep `references/` next to `SKILL.md` — the body links to those files and the agent reads them on demand.
- If your Claude Code build does not auto-discover, add one line to `CLAUDE.md`:

```markdown
## Prompt pipeline
For any substantive request, first read `~/.claude/skills/prompt-refinery/SKILL.md` and follow it end to end before acting.
```

---

## 3. Codex CLI

Codex reads `AGENTS.md`. Install the bundle anywhere stable, then point at it:

```bash
mkdir -p ~/.codex/prompt-refinery
git clone https://github.com/Zheng-long1114/prompt-refinery.git ~/.codex/prompt-refinery
```

`~/.codex/AGENTS.md` (global) or `<repo>/AGENTS.md` (project):

```markdown
## Prompt pipeline (prompt-refinery)
Before acting on any substantive request:
1. Read `~/.codex/prompt-refinery/SKILL.md`.
2. Follow its state machine: refine → audit → ask → loop → execute.
3. Load `references/` files only when SKILL.md tells you to.
Never skip the audit step; never end at the spec without producing the artifact.
```

Codex supports subagents through delegation; if your build does not, run the refiner and auditor yourself as two separate passes and say so in one line — the scorecard still applies.

---

## 4. Cursor

```bash
mkdir -p .cursor/rules
git clone https://github.com/Zheng-long1114/prompt-refinery.git .cursor/prompt-refinery
```

`.cursor/rules/prompt-refinery.mdc`:

```markdown
---
description: Prompt refinery pipeline — refine, audit, ask, loop, then execute
alwaysApply: true
---

For every substantive user request, read `.cursor/prompt-refinery/SKILL.md`
and follow it exactly: capture facts, refine into the 10-block spec, audit it
against `references/scorecard.md`, ask only blocking gaps, loop until the spec
scores ≥85, then produce the deliverable in the same turn.
```

---

## 5. Windsurf

```bash
mkdir -p .windsurf/rules
git clone https://github.com/Zheng-long1114/prompt-refinery.git .windsurf/prompt-refinery
```

`.windsurf/rules/prompt-refinery.md`:

```markdown
---
trigger: always_on
description: Prompt refinery pipeline
---

Read `.windsurf/prompt-refinery/SKILL.md` before acting on any substantive
request and follow its state machine end to end. The audit gate in
`references/scorecard.md` is mandatory; do not stop at the spec.
```

---

## 6. Cline / Roo Code

```bash
mkdir -p .clinerules
git clone https://github.com/Zheng-long1114/prompt-refinery.git .clinerules/prompt-refinery
```

`.clinerules/prompt-refinery.md`:

```markdown
When the user sends any substantive request, first read
`.clinerules/prompt-refinery/SKILL.md` and follow it as an operating procedure.
Ask at most one round of blocking questions, then execute.
```

Cline has no native subagent spawn in plain mode: use separate tasks (or the
subagent tool when the build exposes it) for the refiner and auditor passes.

---

## 7. GitHub Copilot (VS Code)

```bash
mkdir -p .github/instructions
git clone https://github.com/Zheng-long1114/prompt-refinery.git .github/prompt-refinery
```

`.github/instructions/prompt-refinery.instructions.md`:

```markdown
---
applyTo: "**"
---

For substantive requests, read `.github/prompt-refinery/SKILL.md` and follow its
pipeline: refine → audit (references/scorecard.md) → ask blocking gaps → loop → execute.
```

---

## 8. Gemini CLI

```bash
git clone https://github.com/Zheng-long1114/prompt-refinery.git .gemini/prompt-refinery
```

`GEMINI.md` at the repo root:

```markdown
## Prompt pipeline
Before executing any non-trivial request, read `.gemini/prompt-refinery/SKILL.md`
and follow it. Audit with `references/scorecard.md`; do not stop at the spec.
```

---

## 9. Aider

```bash
git clone https://github.com/Zheng-long1114/prompt-refinery.git .aider/prompt-refinery
```

`CONVENTIONS.md`:

```markdown
## Prompt pipeline
For substantive requests, read `.aider/prompt-refinery/SKILL.md` first and follow
its refine → audit → ask → loop → execute sequence.
```

Run Aider with the file loaded:

```bash
aider --read CONVENTIONS.md
```

---

## 10. Continue

```bash
mkdir -p .continue/rules
git clone https://github.com/Zheng-long1114/prompt-refinery.git .continue/prompt-refinery
```

`.continue/rules/prompt-refinery.md`:

```markdown
---
name: prompt-refinery
alwaysApply: true
---

Read `.continue/prompt-refinery/SKILL.md` and follow its pipeline for every
substantive request.
```

---

## 11. opencode / other `AGENTS.md` runners

```bash
git clone https://github.com/Zheng-long1114/prompt-refinery.git .agents/prompt-refinery
```

Append to `AGENTS.md`:

```markdown
## Prompt pipeline
Read `.agents/prompt-refinery/SKILL.md` at the start of every substantive task
and follow it end to end, including the audit gate and the ask-once rule.
```

---

## The universal pointer

Any runner that reads a project instruction file accepts this block. It is the
whole integration — everything else lives in the bundle.

```markdown
## Prompt pipeline (mandatory)
1. Locate the prompt-refinery bundle (path: <FILL IN>).
2. Read `SKILL.md` and follow its state machine:
   CAPTURE → REFINE → AUDIT → (ASK | LOOP) → HANDOFF → execute.
3. Gate: do not deliver until the spec scores ≥85 on `references/scorecard.md`
   with every dimension ≥60%, or the 4-round cap is reached.
4. Ask at most one round of blocking questions; defaults are pre-filled.
5. Never finish a turn with only a spec — produce the artifact.
6. Do not load prompt-refinery recursively from inside a subagent.
```

---

## Capability fallbacks

| Missing capability | What to do |
| --- | --- |
| No subagent spawn | Run refine and audit as two explicit passes in the same conversation, label them `SELF_REFINED` / `SELF_AUDITED`, and keep the same scorecard. |
| No structured question tool | Ask in plain text: one message, at most four questions, each with options and a default, then continue on the default if the user skips. |
| No file writes | Keep the spec in the conversation and print it as one fenced block; still extract `DONE_WHEN`. |
| No long context | Read `references/scorecard.md` first, then `output-contract.md`; load `examples.md` only when a case is ambiguous. |

---

## Verifying an installation

```bash
node scripts/validate.mjs .          # bundle is loadable (frontmatter + references)
node scripts/check-i18n.mjs          # translations still match the English structure
```

Then send one vague request ("tidy up my desktop") and confirm the agent:
1. asks at most one round of questions with options;
2. produces a spec with 10 blocks and 3–6 acceptance checks;
3. starts working in the same turn after the spec passes.