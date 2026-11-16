# 接入指南 — 在其他 Agent 里运行 prompt-refinery

本 skill 与宿主无关，只依赖三种能力：

1. **派发子智能体**（独立上下文）——用于精炼者与审计者；
2. **向用户提问并给选项**——每轮阻塞缺口只问一次；
3. **读写文件**——加载 references、落盘规格。

三者齐备的 runner 可以直接使用 `SKILL.md`。若某个 runner 没有原生 skill 发现机制，就给它已有的指令文件加**一行指针**——整个集成就这么点内容。

---

## 速查表

| Agent | 安装位置 | 触发方式 |
| --- | --- | --- |
| DSH（DeepSeek Harness） | `$DSH_HOME/skills/prompt-refinery`（默认 `~/.dsh/skills/`） | 自动发现 + `/prompt-refinery` |
| Claude Code | `~/.claude/skills/prompt-refinery/`（或 `<repo>/.claude/skills/`） | 自动发现 + `/prompt-refinery` |
| Codex CLI | `~/.codex/prompt-refinery/` + `~/.codex/AGENTS.md` 指针 | 指令文件 |
| Cursor | `<repo>/.cursor/rules/prompt-refinery.mdc` | `alwaysApply: true` |
| Windsurf | `<repo>/.windsurf/rules/prompt-refinery.md` | `trigger: always_on` |
| Cline / Roo Code | `<repo>/.clinerules/prompt-refinery.md` | 常驻生效 |
| GitHub Copilot（VS Code） | `<repo>/.github/instructions/prompt-refinery.instructions.md` | `applyTo: "**"` |
| Gemini CLI | `<repo>/GEMINI.md` + 仓库内置 bundle | 指令文件 |
| Aider | `<repo>/CONVENTIONS.md` | `--read CONVENTIONS.md` |
| Continue | `<repo>/.continue/rules/prompt-refinery.md` | 规则目录自动加载 |
| opencode | `<repo>/AGENTS.md` | 指令文件 |
| 其他任意 | 任意可读路径 | 在它的指令文件里加一行指针 |

---

## 1. DSH（DeepSeek Harness）

```bash
git clone https://github.com/Zheng-long1114/prompt-refinery.git ~/.dsh/skills/prompt-refinery
```

或者用脚本（带备份与校验）：

```powershell
pwsh -File scripts/install.ps1        # Windows
```
```bash
bash scripts/install.sh               # macOS / Linux / WSL
```

- 扫描顺序：`<project>/.dsh/skills` → `<project>/.agents/skills` → 自定义目录 → `$DSH_HOME/skills` → `~/.agents/skills`。
- 装在用户级：所有会话、所有 agent preset 都可见。
- 目录被 watch：装完或改完**不用重启**。
- 手动调用：`/prompt-refinery`。

---

## 2. Claude Code

个人级（所有项目可用）：

```bash
mkdir -p ~/.claude/skills
git clone https://github.com/Zheng-long1114/prompt-refinery.git ~/.claude/skills/prompt-refinery
```

项目级（跟仓库一起提交给团队）：

```bash
mkdir -p .claude/skills
git clone https://github.com/Zheng-long1114/prompt-refinery.git .claude/skills/prompt-refinery
```

- frontmatter 的 `name` + `description` 决定能否被发现，`user-invocable: true` 打开 `/prompt-refinery`。
- `references/` 必须与 `SKILL.md` 同级保留——正文会按需读取其中文件。
- 若你的版本不自动发现，在 `CLAUDE.md` 加一行：

```markdown
## Prompt pipeline
For any substantive request, first read `~/.claude/skills/prompt-refinery/SKILL.md` and follow it end to end before acting.
```

---

## 3. Codex CLI

Codex 读 `AGENTS.md`。把 bundle 放到固定位置，再指过去：

```bash
mkdir -p ~/.codex/prompt-refinery
git clone https://github.com/Zheng-long1114/prompt-refinery.git ~/.codex/prompt-refinery
```

`~/.codex/AGENTS.md`（全局）或 `<repo>/AGENTS.md`（项目级）：

```markdown
## Prompt pipeline (prompt-refinery)
Before acting on any substantive request:
1. Read `~/.codex/prompt-refinery/SKILL.md`.
2. Follow its state machine: refine → audit → ask → loop → execute.
3. Load `references/` files only when SKILL.md tells you to.
Never skip the audit step; never end at the spec without producing the artifact.
```

如果你的 Codex 版本不支持派发子智能体：把精炼与审计拆成两遍显式执行，标注 `SELF_REFINED` / `SELF_AUDITED`，评分卡照用。

---

## 4. Cursor

```bash
mkdir -p .cursor/rules
git clone https://github.com/Zheng-long1114/prompt-refinery.git .cursor/prompt-refinery
```

`.cursor/rules/prompt-refinery.mdc`：

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

`.windsurf/rules/prompt-refinery.md`：

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

`.clinerules/prompt-refinery.md`：

```markdown
When the user sends any substantive request, first read
`.clinerules/prompt-refinery/SKILL.md` and follow it as an operating procedure.
Ask at most one round of blocking questions, then execute.
```

---

## 7. GitHub Copilot（VS Code）

```bash
mkdir -p .github/instructions
git clone https://github.com/Zheng-long1114/prompt-refinery.git .github/prompt-refinery
```

`.github/instructions/prompt-refinery.instructions.md`：

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

仓库根 `GEMINI.md`：

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

`CONVENTIONS.md`：

```markdown
## Prompt pipeline
For substantive requests, read `.aider/prompt-refinery/SKILL.md` first and follow
its refine → audit → ask → loop → execute sequence.
```

启动时加载：

```bash
aider --read CONVENTIONS.md
```

---

## 10. Continue

```bash
mkdir -p .continue/rules
git clone https://github.com/Zheng-long1114/prompt-refinery.git .continue/prompt-refinery
```

`.continue/rules/prompt-refinery.md`：

```markdown
---
name: prompt-refinery
alwaysApply: true
---

Read `.continue/prompt-refinery/SKILL.md` and follow its pipeline for every
substantive request.
```

---

## 11. opencode / 其他读 `AGENTS.md` 的 runner

```bash
git clone https://github.com/Zheng-long1114/prompt-refinery.git .agents/prompt-refinery
```

在 `AGENTS.md` 追加：

```markdown
## Prompt pipeline
Read `.agents/prompt-refinery/SKILL.md` at the start of every substantive task
and follow it end to end, including the audit gate and the ask-once rule.
```

---

## 通用指针（复制粘贴即可）

任何读项目指令文件的 runner 都能用这一段。整份集成就这一块，其余都在 bundle 里。

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

## 能力缺失时怎么降级

| 缺什么 | 怎么办 |
| --- | --- |
| 不能派子智能体 | 把精炼与审计拆成同一会话里的两遍显式执行，标注 `SELF_REFINED` / `SELF_AUDITED`，评分卡照用 |
| 没有结构化提问工具 | 用纯文本一次问完：一条消息、最多四问、每题带选项与默认值；用户跳过就按默认继续 |
| 不能写文件 | 规格留在会话里，用一个 fenced block 完整输出；`DONE_WHEN` 照样抽取 |
| 上下文不够 | 先读 `references/scorecard.md`，再读 `output-contract.md`，`examples.md` 只在遇到歧义时加载 |

---

## 装完之后怎么验

```bash
node scripts/validate.mjs .          # bundle 可被加载（frontmatter + 引用）
node scripts/check-i18n.mjs          # 译文结构仍与英文一致
```

然后发一句模糊请求（例如「帮我整理下桌面」），确认 agent：

1. 最多问一轮、且带选项；
2. 产出的规格有 10 个区块、3–6 条验收；
3. 规格通过后**同一回合**就开始干活。