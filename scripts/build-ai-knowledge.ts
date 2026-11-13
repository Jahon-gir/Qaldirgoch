/**
 * AI maslahatchi bilim bazasi: ilovadagi TASDIQLANGAN, manbasi bor matnlardan parchalar yasaydi
 * (Ausbildung bosqichlari, Germaniya yoʻllari, xavfsizlik). Natija: supabase/functions/ai-ask/knowledge.json.
 * Ishga tushirish: npm run ai:knowledge  (kontent oʻzgarsa qayta yasang; test farqni ushlaydi).
 * Manbasi yoʻq bosqichlar (1, 4, 6, 9) kirmaydi — AI faqat manbali faktdan javob beradi.
 */
import { AUSBILDUNG_STEPS, type Source } from '../src/content/ausbildung'
import { PROGRAM_CONTENT } from '../src/content/programs'
import { HOTLINE } from '../src/safety/hotline'
import { uz, type Key } from '../src/i18n/uz'
import { ru } from '../src/i18n/ru'

/** country — qaysi davlatga tegishli (ISO kodi); umumiy parchada yoʻq. */
export type Chunk = { id: string; country?: string; title: string; uz: string; ru: string; sources: Source[] }

const ok = (k: Key) => !uz[k].includes('{') && !ru[k].includes('{')
const join = (keys: Key[], d: Record<Key, string>) => keys.filter(ok).map((k) => d[k]).join('\n')

const PROGRAM_TITLES: Record<string, string> = {
  'de/ausbildung': 'Germaniya: Ausbildung (kasbiy taʼlim)',
  'de/chancenkarte': 'Germaniya: Chancenkarte (imkoniyat kartasi)',
  'de/tan-oldirish': 'Germaniya: malakani tan oldirish',
  'de/mutaxassis': 'Germaniya: malakali mutaxassis',
  'de/oqish': 'Germaniya: oʻqish',
  'de/til-kursi': 'Germaniya: til kursi'
}

export function buildKnowledge(): Chunk[] {
  const out: Chunk[] = []
  for (const s of AUSBILDUNG_STEPS) {
    if (!s.sources.length) continue
    const keys: Key[] = [s.title, s.summary, ...s.tasks.map((x) => x.text), ...s.documents.map((x) => x.text), ...(s.facts ?? []), ...(s.warning ? [s.warning] : [])]
    out.push({ id: `ausbildung-${s.id}`, country: 'de', title: `Ausbildung, ${s.order}-bosqich: ${uz[s.title]}`, uz: join(keys, uz), ru: join(keys, ru), sources: s.sources })
  }
  for (const [id, c] of Object.entries(PROGRAM_CONTENT)) {
    if (!c.sources.length) continue
    const keys: Key[] = [c.what, ...c.needs.flatMap((n) => [n.title, n.text]), ...(c.notice ? [c.notice] : []), c.warning]
    for (const d of c.detail) keys.push(d.title, ...d.items, ...(d.blocks ?? []).flatMap((b) => [...(b.sub ? [b.sub] : []), ...b.keys]), ...(d.callout ? [d.callout] : []))
    const uniq = [...new Set(keys)]
    out.push({ id: `yol-${id.replace('/', '-')}`, country: id.split('/')[0], title: PROGRAM_TITLES[id] ?? id, uz: join(uniq, uz), ru: join(uniq, ru), sources: c.sources })
  }
  const agencyKeys: Key[] = ['safety.agency.desc', 'safety.found.note', 'safety.nf.body', 'safety.nf.before', 'safety.nf.s1', 'safety.nf.s2', 'safety.nf.s3', 'safety.hotline.title', 'safety.disclaimer']
  out.push({
    id: 'xavfsizlik-agentlik',
    title: 'Xavfsizlik: agentlikni tekshirish va ishonch telefoni 1282',
    uz: join(agencyKeys, uz) + '\nIlovada: Xavfsizlik → Agentlikni tekshiring.',
    ru: join(agencyKeys, ru),
    sources: [
      { title: 'Migratsiya agentligi: xususiy bandlik agentliklari reestri', url: 'https://gov.uz/oz/migration/activity_page/xususiy-bandlik-agentliklari_', checkedAt: '2026-11-07' },
      { title: 'Migratsiya agentligi: aloqa', url: HOTLINE.sourceUrl, checkedAt: HOTLINE.checked }
    ]
  })
  return out
}

// To'g'ridan-to'g'ri ishga tushirilganda faylga yozadi
if (process.argv[1]?.includes('build-ai-knowledge')) {
  const { writeFileSync } = await import('node:fs')
  const k = buildKnowledge()
  writeFileSync('supabase/functions/ai-ask/knowledge.json', JSON.stringify(k, null, 1) + '\n')
  console.log(`${k.length} parcha, ${JSON.stringify(k).length} belgi`)
}
