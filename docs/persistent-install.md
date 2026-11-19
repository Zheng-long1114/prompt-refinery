# Persistent install — keep the skill without keeping the folder

Dropping the bundle into `~/.dsh/skills/prompt-refinery` works only while that
directory exists. Clean it up, change machines, switch profiles, and the skill is
gone. The two methods below are **persistent**: one rides the DSH startup, the
other rides your project repository.

---

## Method B — a DSH bundle plugin (loaded at host startup)

**How it works**: the host skill registry accepts providers from plugins. `plugin/`
is such a package: it serves the skill from its own `assets/prompt-refinery/SKILL.md`
(rank 600, source `bundled`). The bundle loads at startup, so the skill exists
independently of any skills directory.

```powershell
# 1) generate assets (copies SKILL.md / references / prompts / docs into plugin/assets)
cd plugin
node scripts/build-assets.mjs

# 2) register into the desktop profile (backs up package.json)
cd ..
pwsh -File scripts/register-bundle.ps1
```

The script performs four steps:

| Step | Result |
| --- | --- |
| junction | `<profile>/node_modules/dsh-skill-prompt-refinery` → `plugin/` |
| dependency | `"dsh-skill-prompt-refinery": "link:…/plugin"` |
| bundle entry | appended to `dsh.profile.bundles` |
| self-check | lists and loads the skill, prints name / rank / chars |

**One DSH restart is required** — bundles load at startup.

Revert:

```powershell
pwsh -File scripts/register-bundle.ps1 -Revert
```

Update after editing the repo:

```bash
cd plugin && node scripts/build-assets.mjs
```

The host re-reads `SKILL.md` on every catalog discovery and every load, so a
content update needs **no restart and no re-registration**.

Use B when you clean directories often, reinstall DSH, or want one global copy
shared by every project.

---

## Method D — install into the project (travels with the code)

**How it works**: DSH scans `<project>/.dsh/skills` (rank 100) and
`<project>/.agents/skills` (rank 200). Put the skill at the project root and
anyone who clones the project gets it — and a project copy **outranks** user-level
and bundled copies.

```powershell
# clone into the current project
pwsh -File scripts/install-project.ps1 -Project . -Mode clone

# or link for live editing
pwsh -File scripts/install-project.ps1 -Project D:\code\my-app -Mode link

# highest priority (rank 100)
pwsh -File scripts/install-project.ps1 -Project . -Root .dsh/skills
```

```bash
# macOS / Linux / WSL
bash scripts/install-project.sh . --mode clone
```

Resulting layout:

```
my-app/
└── .agents/skills/prompt-refinery/
    ├── SKILL.md
    ├── references/
    ├── prompts/
    └── docs/
```

**No restart needed** — the next directory scan picks it up.

Use D when a team should share the skill, a project must pin a version
(`git checkout vX` rolls back), or a project needs its own customised
`references/scorecard.md`.

---

## Who wins: rank order

DSH takes the first match by ascending rank:

| rank | source | typical path |
| --- | --- | --- |
| 100 | project-dsh | `<project>/.dsh/skills` |
| 200 | project-agents | `<project>/.agents/skills` |
| 300 | custom | `customSkillDirs` config |
| 400 | user-dsh | `$DSH_HOME/skills` |
| 500 | user-agents | `~/.agents/skills` |
| 600 | bundled | the bundle plugin (method B) |

With **B + D** installed together: inside a project you get D's copy, outside
every project you fall back to B. Per-project customisation with a global safety
net.

---

## Verifying both

```bash
# 1. the bundle itself is valid
node scripts/validate.mjs .

# 2. the plugin loads without restarting DSH
cd plugin && node -e "import('./lib/index.js').then(async m=>{const p=[];m.apply({skills:{registerProvider:f=>p.push(f({invalidate(){}}))},logger:{info(){},warn:console.error}},{});const l=await p[0].list({});const b=await p[0].get(l.candidates[0],{});console.log(b.content.split('\n')[0])})"

# 3. the project copy is in place
ls .agents/skills/prompt-refinery/SKILL.md
```

Then send one vague request ("tidy up my desktop"). Passing behaviour: **one round
of questions with options → a 10-block spec → work starts in the same turn**.

---

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Skill missing after restart | bundle not registered, or assets not built | re-run `register-bundle.ps1` and read its self-check |
| Two entries with the same name | project copy and bundle both serve it | expected; rank decides. Remove one side to keep a single copy |
| Edited `SKILL.md` has no effect | edited the repo, not the assets | `cd plugin && node scripts/build-assets.mjs` |
| `git pull` resets the connection | unstable direct GitHub access | add `-c http.proxy=http://127.0.0.1:7897` |
| Full uninstall | — | `register-bundle.ps1 -Revert` and delete the project's `.agents/skills/prompt-refinery` |