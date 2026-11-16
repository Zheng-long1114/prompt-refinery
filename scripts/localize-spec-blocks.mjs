// Localize the SPEC block-name list (kept in one inline-code line) in every
// translation so all READMEs read naturally in their own language.
// The identifiers (TBD, SPEC, GAP[]) stay as-is, only human-readable block
// names are translated. Idempotent.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const i18n = join(root, 'i18n')

const EN =
  '`Goal / Deliverables / Audience and tone / Inputs and evidence / Boundaries and prohibitions / Steps / Output specification / Quality and acceptance / Assumptions and open items / Optional extras`'

const MAP = {
  'zh-CN': '`目标 / 交付物 / 受众与语气 / 输入与事实依据 / 边界与禁止项 / 执行步骤 / 输出规格 / 质量标准与验收 / 假设与待确认 / 额外可选`',
  'zh-TW': '`目標 / 交付物 / 受眾與語氣 / 輸入與事實依據 / 邊界與禁止項 / 執行步驟 / 輸出規格 / 品質標準與驗收 / 假設與待確認 / 額外可選`',
  ja: '`目標 / 成果物 / 想定読者とトーン / 入力と根拠 / 境界と禁止事項 / 手順 / 出力仕様 / 品質と受け入れ基準 / 前提と未確定事項 / 任意の追加項目`',
  ko: '`목표 / 산출물 / 대상과 어조 / 입력과 근거 / 경계와 금지 사항 / 단계 / 출력 사양 / 품질과 수용 기준 / 가정과 미결 항목 / 선택적 추가 항목`',
  ar: '`الهدف / المخرجات / الجمهور والنبرة / المدخلات والأدلة / الحدود والمحظورات / الخطوات / مواصفات المخرجات / الجودة والقبول / الافتراضات والبنود المفتوحة / إضافات اختيارية`',
  es: '`Objetivo / Entregables / Audiencia y tono / Entradas y evidencia / Límites y prohibiciones / Pasos / Especificación de salida / Calidad y aceptación / Supuestos y pendientes / Extras opcionales`',
  fr: '`Objectif / Livrables / Public et ton / Entrées et éléments de preuve / Limites et interdictions / Étapes / Spécification de sortie / Qualité et acceptation / Hypothèses et points ouverts / Extras facultatifs`',
  de: '`Ziel / Lieferobjekte / Zielgruppe und Ton / Eingaben und Belege / Grenzen und Verbote / Schritte / Ausgabespezifikation / Qualität und Abnahme / Annahmen und offene Punkte / Optionale Extras`',
  'pt-BR': '`Objetivo / Entregáveis / Público e tom / Entradas e evidências / Limites e proibições / Etapas / Especificação de saída / Qualidade e aceitação / Premissas e pendências / Extras opcionais`',
  ru: '`Цель / Результаты / Аудитория и тон / Входные данные и доказательства / Границы и запреты / Шаги / Спецификация вывода / Качество и приёмка / Допущения и открытые вопросы / Необязательные дополнения`',
  hi: '`लक्ष्य / डिलीवरेबल्स / दर्शक और लहजा / इनपुट और प्रमाण / सीमाएँ और निषेध / चरण / आउटपुट विनिर्देश / गुणवत्ता और स्वीकृति / मान्यताएँ और खुले मुद्दे / वैकल्पिक अतिरिक्त`',
}

let changed = 0
for (const file of readdirSync(i18n).filter((f) => /^README\.[A-Za-z-]+\.md$/.test(f))) {
  const tag = file.replace(/^README\.|\.md$/g, '')
  const target = MAP[tag]
  if (!target) {
    console.log(`skip  ${file} (no mapping)`)
    continue
  }
  const path = join(i18n, file)
  let text = readFileSync(path, 'utf8')
  if (text.includes(EN)) {
    text = text.replace(EN, target)
    writeFileSync(path, text, 'utf8')
    changed++
    console.log(`patch ${file}`)
  } else if (text.includes(target)) {
    console.log(`ok    ${file} (already localized)`)
  } else {
    console.log(`WARN  ${file} (block list line not found in either form)`)
  }
}
console.log(`\n${changed} file(s) patched`)