# 常装：让 DSH 每次都自动带上这个技能

`~/.dsh/skills/prompt-refinery` 这种"放一个目录"的装法有个前提：**那个目录得一直在**。清理目录、换机器、换 profile，技能就消失了。

下面两种是"常装"——一种挂在 DSH 启动流程上，一种挂在项目仓库上。

---

## 方案 B：装成 DSH bundle 插件（随宿主启动加载）

**原理**：DSH 的技能注册表允许插件注册 provider。`plugin/` 就是一个这样的包，它从自己的 `assets/prompt-refinery/SKILL.md` 提供技能（rank 600，source = bundled）。宿主启动时加载 bundle，技能就一直在，**跟技能目录没关系**。

```powershell
# 1) 生成资源（把根目录的 SKILL.md / references / prompts / docs 复制进 plugin/assets）
cd plugin
node scripts/build-assets.mjs

# 2) 注册到 desktop profile（会备份 package.json）
cd ..
pwsh -File scripts/register-bundle.ps1
```

脚本做四件事：

| 步骤 | 结果 |
| --- | --- |
| 建目录联接 | `<profile>/node_modules/dsh-skill-prompt-refinery` → `plugin/` |
| 写入依赖 | `"dsh-skill-prompt-refinery": "link:…/plugin"` |
| 写入 bundle | `dsh.profile.bundles` 末尾追加 `dsh-skill-prompt-refinery` |
| 自检 | 列出并加载技能，打印 name / rank / chars |

**需要重启一次 DSH**：bundle 在启动时加载。

撤销：

```powershell
pwsh -File scripts/register-bundle.ps1 -Revert
```

更新（改完仓库内容后）：

```bash
cd plugin && node scripts/build-assets.mjs
```

宿主每次发现技能都会重读 `SKILL.md`，所以**换内容不用重启、不用重新注册**。

### 什么时候该用 B

- 你经常清理目录、重装 DSH、换 profile
- 想让技能变成本机"基础设施"的一部分
- 想给多个项目共用一份（bundle 是全局的）

---

## 方案 D：装进项目仓库（跟着代码走）

**原理**：DSH 会扫描 `<project>/.dsh/skills`（rank 100）和 `<project>/.agents/skills`（rank 200）。放进项目根，谁 clone 谁就有，且**项目副本优先级高于用户级和 bundle**。

```powershell
# Windows：把技能 clone 进当前项目
pwsh -File scripts/install-project.ps1 -Project . -Mode clone

# 或者用联接（开发时改一处立刻生效）
pwsh -File scripts/install-project.ps1 -Project D:\code\my-app -Mode link

# 想拿最高优先级（rank 100）
pwsh -File scripts/install-project.ps1 -Project . -Root .dsh/skills
```

```bash
# macOS / Linux / WSL
bash scripts/install-project.sh . --mode clone
```

安装后的结构：

```
my-app/
└── .agents/skills/prompt-refinery/
    ├── SKILL.md
    ├── references/
    ├── prompts/
    └── docs/
```

**不需要重启**：下一次目录扫描就能看到。

### 什么时候该用 D

- 团队项目：技能跟着仓库走，新人 clone 就能用
- 一个项目要锁定某个版本（`git checkout vX` 即可回退）
- 想给项目单独定制（改 `references/scorecard.md` 不影响别的项目）

---

## 优先级：谁赢

DSH 按 rank 数字从小到大取第一个匹配项：

| rank | 来源 | 典型路径 |
| --- | --- | --- |
| 100 | project-dsh | `<project>/.dsh/skills` |
| 200 | project-agents | `<project>/.agents/skills` |
| 300 | custom | `customSkillDirs` 配置 |
| 400 | user-dsh | `$DSH_HOME/skills` |
| 500 | user-agents | `~/.agents/skills` |
| 600 | bundled | bundle 插件（方案 B） |

所以 **B + D 同时装**时：项目里用 D 的版本，项目外落到 B 的版本。这正好是"每个项目可定制，全局有兜底"。

---

## 两条都装完的自检

```bash
# 1. 技能包本身合法
node scripts/validate.mjs .

# 2. bundle 能被加载（不重启也能验）
cd plugin && node -e "import('./lib/index.js').then(async m=>{const p=[];m.apply({skills:{registerProvider:f=>p.push(f({invalidate(){}}))},logger:{info(){},warn:console.error}},{});const l=await p[0].list({});const b=await p[0].get(l.candidates[0],{});console.log(b.content.split('\n')[0])})"

# 3. 项目副本在位
ls .agents/skills/prompt-refinery/SKILL.md
```

然后在 DSH 里发一句模糊请求（例如「帮我整理下桌面」），合格表现：**只问一轮带选项的问题 → 给出 10 区块规格 → 同回合直接开工**。

---

## 常见问题

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 重启后技能没出现 | bundle 未注册或 assets 未生成 | 重跑 `register-bundle.ps1`，看自检输出 |
| 出现两个同名条目 | 项目副本 + bundle 同时提供 | 正常，rank 决定命中哪个；想只留一个就删另一边 |
| 改了 SKILL.md 不生效 | 改的是仓库、没同步到 assets | `cd plugin && node scripts/build-assets.mjs` |
| `git pull` 报连接被重置 | GitHub 直连不稳 | 加 `-c http.proxy=http://127.0.0.1:7897` |
| 想彻底卸载 | — | `register-bundle.ps1 -Revert` + 删掉项目的 `.agents/skills/prompt-refinery` |