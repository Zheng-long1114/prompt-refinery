# Install into Doubao, Qwen and other chat / office apps

These products have no skill directory, cannot spawn subagents and cannot touch your disk. "Installing" therefore means **pasting the prompt from [`prompts/chat-mode.en.md`](../prompts/chat-mode.en.md) into their custom-instruction / agent-role field**. Once pasted, you have a working Prompt Refinery.

---

## Three install modes (pick the best the app supports)

| Mode | Works for | Effect |
| --- | --- | --- |
| **A. Create an agent / custom instruction** (preferred) | Doubao, Qwen, Kimi, Yuanbao, Wenxin, Spark, Feishu, DingTalk, ChatGPT, Claude | Configure once, effective in every new chat |
| **B. Paste at the start of a chat** | clients with no custom field | valid for that session; keep the prompt in a snippet manager |
| **C. Upload as an attachment** | clients that read attachments (Kimi, Doubao, Qwen, Yuanbao) | save the prompt as `prompt-refinery.txt`, upload, say "work by that file" |

Rule of thumb: **does the app have a field named agent / role / custom instructions / system prompt?** Yes → mode A. No → B or C.

---

## 1. Doubao (豆包, desktop and web)

1. Open doubao.com or the desktop app and sign in.
2. Sidebar → **Agent** (some builds: Discover → Create agent).
3. **Create agent**, fill three fields:
   - Name: `提示词精炼厂` (or `Prompt Refinery`)
   - Description: `Turns vague requests into an executable spec, then delivers the artifact`
   - **Role / persona / reply logic**: paste the block from `prompts/chat-mode.en.md`
4. Save, then open it from "My agents".
5. Verify: send "tidy up my desktop" — it should ask at most four questions with options, produce a 10-block spec, then hand you a concrete plan in the same turn.

---

## 2. Qwen (千问 / 通义千问, desktop and app)

1. Open qianwen.com or the desktop app.
2. Go to **Agents** (app: Discover → Agents; web: left sidebar).
3. **Create agent** → paste the chat-edition block into the **instructions / prompt / role** field → name it `提示词精炼厂`.
4. Save and start from "My agents".
5. Qwen tolerates long prompts well, but still paste only the core block — not the whole README.

---

## 3. Kimi

- With Kimi+ agents: create one, paste into the prompt field.
- Plain chat only: upload `prompt-refinery.txt` and say "follow the rules in this file for every request".

---

## 4. Tencent Yuanbao (腾讯元宝)

Me → **Create agent** → paste into **Settings / persona** → name and save. Yuanbao accepts reference files, so you can attach the prompt as backup.

---

## 5. ERNIE Bot (文心一言) / Baidu agent platform

- App or web: **Create agent** → paste into "persona and reply logic".
- Platform (agents.baidu.com): paste into instructions, optionally attach the scorecard as a knowledge file.

---

## 6. iFlytek Spark (讯飞星火)

**Spark agent** → new → paste into "role description / instructions" → publish. Spark is weaker at structured output; keep the final line "output in the 10 blocks" in the prompt.

---

## 7. DeepSeek web / app

No custom-instruction field:

- Mode B: keep the prompt in a text-snippet tool, paste once per session.
- Building your own client: send the chat edition as the `system` message — same effect as an agent.

---

## 8. WPS AI / WPS Lingxi

WPS AI works inside documents and has no persistent role field:

- Use **mode B**: paste at the start of the sidebar chat, have it produce the spec first, then apply the spec to the document.
- Team editions with a custom-assistant builder: use **mode A**.
- The upside: once the spec passes, WPS can batch-apply formatting directly.

---

## 9. Feishu (Lark) / DingTalk AI assistants

- Feishu: **Smart partner → Create** → paste into role settings → publish to a group or workspace.
- DingTalk: **AI assistant → Create** → paste into role/instructions → add to yourself or the team.
- Both support a greeting; set it to: `Send me a request — I refine it into a spec first, then deliver.`

---

## 10. ChatGPT / Claude (for reference)

- ChatGPT: **Custom instructions** (first box), or a GPT's Instructions field.
- Claude: **Projects → Project instructions**, including the desktop app.
- Both accept long context and files: upload `SKILL.md` plus `references/scorecard.md` as project knowledge for near-full-edition behaviour.

---

## Pitfalls

| Pitfall | Symptom | Fix |
| --- | --- | --- |
| Prompt truncated | Agent forgets the question rules | Paste only the chat-edition body, not the README or full scorecard |
| Role-play takes over | It acts like a "refinery owner" instead of running the pipeline | Add: "no role-play, just follow the procedure" |
| Mobile entry differs | Cannot find "create agent" | Create it on desktop web first, then open it in the app |
| Forgetful in new chats | Becomes a normal assistant again | Always enter through "My agents", not a fresh chat |
| Long output cut off | Spec stops at block 5 | Ask for blocks 1–5, then "continue with 6–10" |
| Skips the spec | Starts writing code or copy immediately | Append: "no artifact before the audit passes" |

---

## Acceptance test (send this)

```text
tidy up the files on my desktop
```

Passing behaviour: at most one round of questions with options and defaults → a 10-block spec with 3–6 acceptance checks → a concrete, executable plan **in the same turn**.

If it fails, patch these two lines in the prompt first: `[STAGE 3 · SELF-AUDIT (mandatory)]` and `[STAGE 4 · EXECUTE]`. Most failures come from models skipping those two stages.

---

## Want the full edition?

Chat clients cap out here: no file writes, no test runs, no independent auditor. For the real thing, install into an environment that can read `SKILL.md`:

- DSH / Claude Code / Codex / Cursor / Windsurf / Cline / Copilot / Gemini CLI / Aider / Continue / opencode
- Step-by-step: [`integrations.md`](integrations.md)