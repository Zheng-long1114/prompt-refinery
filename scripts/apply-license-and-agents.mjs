// Apply the MIT license statement + multi-agent integration table to every
// README. Structure-preserving: the same edits land in all 12 files so
// check-i18n.mjs still reports parity.
// Idempotent: re-running detects the marker and skips.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const BADGE =
  '[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) [![Agents](https://img.shields.io/badge/agents-DSH%20%C2%B7%20Claude%20Code%20%C2%B7%20Codex%20%C2%B7%20Cursor%20%C2%B7%20more-blue.svg)](docs/integrations.md)'

const ROWS = [
  ['DSH (DeepSeek Harness)', '`$DSH_HOME/skills/prompt-refinery`', 'auto + `/prompt-refinery`'],
  ['Claude Code', '`~/.claude/skills/prompt-refinery`', 'auto + `/prompt-refinery`'],
  ['Codex CLI', '`~/.codex/prompt-refinery` + `AGENTS.md`', 'instruction file'],
  ['Cursor', '`.cursor/rules/prompt-refinery.mdc`', '`alwaysApply: true`'],
  ['Windsurf', '`.windsurf/rules/prompt-refinery.md`', '`trigger: always_on`'],
  ['Cline / Roo Code', '`.clinerules/prompt-refinery.md`', 'always on'],
  ['GitHub Copilot', '`.github/instructions/prompt-refinery.instructions.md`', '`applyTo: "**"`'],
  ['Gemini CLI', '`GEMINI.md` + bundle', 'instruction file'],
  ['Aider', '`CONVENTIONS.md`', '`--read CONVENTIONS.md`'],
  ['Continue', '.continue/rules/prompt-refinery.md', 'auto'],
  ['opencode', '`AGENTS.md`', 'instruction file'],
  ['Any other runner', 'anywhere readable', 'one pointer line'],
]

const T = {
  en: {
    h: '### Other agents',
    intro:
      'The skill is runner-neutral: it needs only three capabilities — **spawn subagents, ask the user, read and write files**. Where a runner has no native skill support, add a one-line pointer to its instruction file.',
    th: ['Agent', 'Where to install', 'How it triggers'],
    foot: 'Full step-by-step for each runner: [docs/integrations.md](docs/integrations.md).',
    lic:
      'Released under the [MIT License](LICENSE) — free to use, modify and redistribute, including commercially; keep the copyright and permission notice.\n\nCopyright (c) 2026 YG',
  },
  'zh-CN': {
    h: '### 其他 Agent',
    intro:
      '本 skill 与 runner 无关：只需要三种能力——**派子智能体、向用户提问、读写文件**。若某个 runner 没有原生 skill 支持，在它的指令文件里加一行指针即可。',
    th: ['Agent', '安装位置', '触发方式'],
    foot: '每个 runner 的完整步骤见 [docs/integrations.zh-CN.md](docs/integrations.zh-CN.md)。',
    lic:
      '以 [MIT 许可证](LICENSE) 发布：可商用、可修改、可再分发，保留版权声明与许可声明即可。\n\nCopyright (c) 2026 YG',
  },
  'zh-TW': {
    h: '### 其他 Agent',
    intro:
      '本 skill 與 runner 無關：只需要三種能力——**派子智慧體、向使用者提問、讀寫檔案**。若某個 runner 沒有原生 skill 支援，在它的指令檔案加一行指標即可。',
    th: ['Agent', '安裝位置', '觸發方式'],
    foot: '每個 runner 的完整步驟見 [docs/integrations.zh-CN.md](docs/integrations.zh-CN.md)。',
    lic:
      '以 [MIT 授權](LICENSE) 發布：可商用、可修改、可再散布，保留版權聲明與授權聲明即可。\n\nCopyright (c) 2026 YG',
  },
  ja: {
    h: '### 他のエージェント',
    intro:
      '本スキルはランナー非依存です。必要なのは三つだけ——**サブエージェントの起動、ユーザーへの質問、ファイルの読み書き**。ネイティブなスキル機構がない場合は、そのランナーの指示ファイルに一行のポインタを足すだけです。',
    th: ['エージェント', 'インストール先', '起動方法'],
    foot: '各ランナーの詳細手順は [docs/integrations.md](docs/integrations.md)。',
    lic:
      '本プロジェクトは [MIT ライセンス](LICENSE) で公開されています。商用利用・改変・再配布は自由ですが、著作権表示と許諾表示は保持してください。\n\nCopyright (c) 2026 YG',
  },
  ko: {
    h: '### 다른 에이전트',
    intro:
      '이 스킬은 러너에 독립적입니다. 필요한 능력은 세 가지뿐입니다 — **서브에이전트 실행, 사용자에게 질문, 파일 읽기·쓰기**. 네이티브 스킬 지원이 없는 러너라면 지시 파일에 한 줄 포인터만 추가하면 됩니다.',
    th: ['에이전트', '설치 위치', '트리거 방식'],
    foot: '러너별 전체 절차는 [docs/integrations.md](docs/integrations.md) 참고.',
    lic:
      '본 프로젝트는 [MIT 라이선스](LICENSE)로 배포됩니다. 상업적 사용·수정·재배포가 자유이며, 저작권 및 허가 고지는 유지해야 합니다.\n\nCopyright (c) 2026 YG',
  },
  ar: {
    h: '### وكلاء آخرون',
    intro:
      'هذه المهارة مستقلة عن المشغّل: تحتاج إلى ثلاث قدرات فقط — **تشغيل وكيل فرعي، سؤال المستخدم، وقراءة الملفات وكتابتها**. وإذا لم يدعم المشغّل المهارات أصلاً، أضف سطر إشارة واحدًا إلى ملف تعليماته.',
    th: ['الوكيل', 'موضع التثبيت', 'طريقة التفعيل'],
    foot: 'الخطوات الكاملة لكل مشغّل: [docs/integrations.md](docs/integrations.md).',
    lic:
      'يُصدر هذا المشروع بموجب [رخصة MIT](LICENSE): الاستخدام التجاري والتعديل وإعادة التوزيع مسموحة، مع الإبقاء على إشعار حقوق النشر والإذن.\n\nCopyright (c) 2026 YG',
  },
  es: {
    h: '### Otros agentes',
    intro:
      'La skill es independiente del runner: solo necesita tres capacidades — **lanzar subagentes, preguntar al usuario y leer/escribir archivos**. Si un runner no tiene soporte nativo de skills, añade una línea de puntero a su archivo de instrucciones.',
    th: ['Agente', 'Dónde instalar', 'Cómo se activa'],
    foot: 'Pasos completos por runner: [docs/integrations.md](docs/integrations.md).',
    lic:
      'Publicado bajo la [licencia MIT](LICENSE): uso comercial, modificación y redistribución libres, conservando el aviso de copyright y de permiso.\n\nCopyright (c) 2026 YG',
  },
  fr: {
    h: '### Autres agents',
    intro:
      'La skill est indépendante du runner : elle ne requiert que trois capacités — **lancer des sous-agents, interroger l’utilisateur, lire et écrire des fichiers**. Si un runner n’a pas de support natif, ajoutez une ligne de pointeur dans son fichier d’instructions.',
    th: ['Agent', 'Où installer', 'Comment il se déclenche'],
    foot: 'Étapes détaillées par runner : [docs/integrations.md](docs/integrations.md).',
    lic:
      'Publié sous [licence MIT](LICENSE) : usage commercial, modification et redistribution libres, à condition de conserver la mention de copyright et la licence.\n\nCopyright (c) 2026 YG',
  },
  de: {
    h: '### Weitere Agenten',
    intro:
      'Der Skill ist runner-neutral: Er braucht nur drei Fähigkeiten — **Subagenten starten, den Nutzer fragen, Dateien lesen und schreiben**. Fehlt einem Runner native Skill-Unterstützung, genügt eine Zeigerzeile in seiner Instruktionsdatei.',
    th: ['Agent', 'Installationsort', 'Auslösung'],
    foot: 'Vollständige Schritte je Runner: [docs/integrations.md](docs/integrations.md).',
    lic:
      'Veröffentlicht unter der [MIT-Lizenz](LICENSE): kommerzielle Nutzung, Änderung und Weitergabe sind frei, solange Copyright- und Lizenzhinweis erhalten bleiben.\n\nCopyright (c) 2026 YG',
  },
  'pt-BR': {
    h: '### Outros agentes',
    intro:
      'A skill é independente do runner: precisa apenas de três capacidades — **disparar subagentes, perguntar ao usuário e ler/escrever arquivos**. Se o runner não tiver suporte nativo a skills, basta uma linha de ponteiro no arquivo de instruções dele.',
    th: ['Agente', 'Onde instalar', 'Como é acionado'],
    foot: 'Passo a passo completo por runner: [docs/integrations.md](docs/integrations.md).',
    lic:
      'Publicado sob a [licença MIT](LICENSE): uso comercial, modificação e redistribuição livres, mantendo o aviso de copyright e de permissão.\n\nCopyright (c) 2026 YG',
  },
  ru: {
    h: '### Другие агенты',
    intro:
      'Навык не зависит от раннера: нужны всего три возможности — **запуск субагента, вопрос пользователю, чтение и запись файлов**. Если раннер не поддерживает навыки нативно, достаточно одной строки-указателя в его файле инструкций.',
    th: ['Агент', 'Куда устанавливать', 'Как срабатывает'],
    foot: 'Полные шаги по каждому раннеру: [docs/integrations.md](docs/integrations.md).',
    lic:
      'Проект распространяется по [лицензии MIT](LICENSE): коммерческое использование, изменение и распространение разрешены при сохранении уведомления об авторских правах и лицензии.\n\nCopyright (c) 2026 YG',
  },
  hi: {
    h: '### अन्य एजेंट',
    intro:
      'यह स्किल रनर-निरपेक्ष है: इसे केवल तीन क्षमताएँ चाहिए — **सबएजेंट चलाना, उपयोगकर्ता से पूछना, फ़ाइलें पढ़ना और लिखना**। यदि किसी रनर में मूल स्किल समर्थन नहीं है, तो उसकी निर्देश फ़ाइल में एक पंक्ति का संकेत जोड़ दें।',
    th: ['एजेंट', 'कहाँ इंस्टॉल करें', 'कैसे ट्रिगर होता है'],
    foot: 'प्रत्येक रनर के पूरे चरण: [docs/integrations.md](docs/integrations.md)।',
    lic:
      'यह परियोजना [MIT लाइसेंस](LICENSE) के अंतर्गत जारी है: व्यावसायिक उपयोग, संशोधन और पुनर्वितरण मुक्त है, बशर्ते कॉपीराइट और अनुमति सूचना बनी रहे।\n\nCopyright (c) 2026 YG',
  },
}

const buildSection = (t) => {
  const head = `| ${t.th[0]} | ${t.th[1]} | ${t.th[2]} |\n| --- | --- | --- |`
  const body = ROWS.map((r) => `| ${r[0]} | ${r[1]} | ${r[2]} |`).join('\n')
  return `${t.h}\n\n${t.intro}\n\n${head}\n${body}\n\n${t.foot}\n`
}

const files = [
  { path: join(root, 'README.md'), tag: 'en' },
  ...readdirSync(join(root, 'i18n'))
    .filter((f) => /^README\.[A-Za-z-]+\.md$/.test(f))
    .map((f) => ({ path: join(root, 'i18n', f), tag: f.replace(/^README\.|\.md$/g, '') })),
]

let changed = 0
for (const { path, tag } of files) {
  const t = T[tag]
  if (!t) { console.log('skip', path); continue }
  let lines = readFileSync(path, 'utf8').replace(/\r\n/g, '\n').split('\n')
  const before = lines.join('\n')

  // 1. badges right under the switcher
  if (!lines.some((l) => l.includes('img.shields.io'))) {
    const sw = lines.findIndex((l) => l.startsWith('**🌐**'))
    if (sw >= 0) lines.splice(sw + 1, 0, '', BADGE)
  }

  // 2. replace the "Other runners" section: last ### inside the 2nd ## block
  const h2 = lines.reduce((acc, l, i) => (l.startsWith('## ') ? [...acc, i] : acc), [])
  if (h2.length >= 3) {
    const start = h2[1]
    const end = h2[2]
    let lastH3 = -1
    for (let i = start; i < end; i++) if (lines[i].startsWith('### ')) lastH3 = i
    if (lastH3 >= 0) {
      const block = buildSection(t).split('\n')
      lines.splice(lastH3, end - lastH3 - 1, ...block)
    }
  }

  // 3. docs/ row in the layout tree
  if (!lines.some((l) => /── docs\/|├── docs\//.test(l))) {
    const i18nRow = lines.findIndex((l) => /── i18n\//.test(l))
    if (i18nRow >= 0) {
      const indent = lines[i18nRow].match(/^\s*/)[0]
      lines.splice(i18nRow + 1, 0, `${indent}├── docs/                       # per-runner integration guides (en, zh-CN)`)
    }
  }

  // 4. License section body
  const licIdx = lines.reduce((acc, l, i) => (l.startsWith('## License') ? i : acc), -1)
  if (licIdx >= 0) lines = lines.slice(0, licIdx).concat(['## License', '', ...t.lic.split('\n')])

  const after = lines.join('\n') + '\n'
  if (after !== before) {
    writeFileSync(path, after, 'utf8')
    changed++
    console.log('patch', path.slice(root.length + 1))
  } else {
    console.log('ok   ', path.slice(root.length + 1))
  }
}
console.log(`\n${changed} file(s) updated`)