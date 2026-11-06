import { l3 } from './german/helpers'
import type { L3 } from './german/types'
import { contentOf } from './programs'

/**
 * Davlatlar va yoʻllar katalogi. Matnlar uch tilda (kirill qoʻlda yozilgan).
 * QOIDA (CLAUDE.md, 5–6): yopiq yoʻllarda raqam, muddat yoki narx yoʻq; har yoʻlda rasmiy manba va tekshirilgan sana.
 */
export type CountryId = 'de' | 'kr' | 'jp' | 'gb'
export const COUNTRY_IDS: readonly CountryId[] = ['de', 'kr', 'jp', 'gb']
export type OpenState = 'open' | 'locked'

export type Program = {
  id: string
  name: L3
  /** Bir qatorli tavsif. */
  short: L3
  /** Tabler ikonka nomi (components/countries/icons.ts da). */
  icon: string
  status: OpenState
  officialUrl: string
  checkedAt: string
  contentStatus: 'review' | 'approved'
}

export type SafetyNote = { text: L3; source: { title: string; url: string; checkedAt: string }; contentStatus: 'review' | 'approved' }

export type Country = { id: CountryId; name: L3; status: OpenState; programs: Program[]; safety?: SafetyNote }

const CHECKED_AT = '2026-11-04'
const MIG_URL = 'https://www.make-it-in-germany.com/en/for-qualified-professionals/visa/kinds-of-visa'
const base = { officialUrl: MIG_URL, checkedAt: CHECKED_AT, contentStatus: 'review' } as const

export const COUNTRIES: Country[] = [
  {
    id: 'de',
    name: l3('Germaniya', 'Германия', 'Германия'),
    status: 'open',
    programs: [
      {
        id: 'ausbildung', icon: 'tools', status: 'open', ...base,
        name: l3('Ausbildung', 'Ausbildung', 'Ausbildung'),
        short: l3('Korxonada ishlab, kasb oʻrganish', 'Корхонада ишлаб, касб ўрганиш', 'Учёба профессии с работой на предприятии')
      },
      {
        id: 'chancenkarte', icon: 'ticket', status: 'open', ...base,
        name: l3('Chancenkarte', 'Chancenkarte', 'Chancenkarte'),
        short: l3('Ish qidirish uchun karta', 'Иш қидириш учун карта', 'Карта для поиска работы')
      },
      {
        id: 'tan-oldirish', icon: 'certificate', status: 'open', ...base,
        name: l3('Malakani tan oldirish', 'Малакани тан олдириш', 'Признание квалификации'),
        short: l3('Diplomni tan oldirish, hamshiralik ham', 'Дипломни тан олдириш, ҳамширалик ҳам', 'Признание диплома, в том числе медсестёр')
      },
      {
        id: 'mutaxassis', icon: 'briefcase', status: 'open', ...base,
        name: l3('Malakali mutaxassis', 'Малакали мутахассис', 'Квалифицированный специалист'),
        short: l3('Tan olingan kasb va ish taklifi bilan', 'Тан олинган касб ва иш таклифи билан', 'С признанной профессией и предложением работы')
      },
      {
        id: 'oqish', icon: 'school', status: 'open', ...base,
        name: l3('Oʻqish', 'Ўқиш', 'Учёба'),
        short: l3('Universitetda oʻqish', 'Университетда ўқиш', 'Учёба в университете')
      },
      {
        id: 'til-kursi', icon: 'language', status: 'open', ...base,
        name: l3('Til kursi', 'Тил курси', 'Языковой курс'),
        short: l3('Germaniyada nemis tili kursi', 'Германияда немис тили курси', 'Курс немецкого языка в Германии')
      }
    ]
  },
  {
    id: 'kr',
    name: l3('Janubiy Koreya', 'Жанубий Корея', 'Южная Корея'),
    status: 'locked',
    programs: [
      {
        id: 'eps', icon: 'users-group', status: 'locked', officialUrl: 'https://gov.uz/oz/migration', checkedAt: CHECKED_AT, contentStatus: 'review',
        name: l3('EPS (E-9 viza)', 'EPS (E-9 виза)', 'EPS (виза E-9)'),
        short: l3('Davlatlararo ish dasturi', 'Давлатлараро иш дастури', 'Межгосударственная программа работы')
      }
    ],
    safety: {
      text: l3(
        'EPS davlatlararo dastur. «Tez joylashtiramiz» degan xususiy vositachilarga ishonmang.',
        'EPS давлатлараро дастур. «Тез жойлаштирамиз» деган хусусий воситачиларга ишонманг.',
        'EPS — межгосударственная программа. Не доверяйте частным посредникам, которые обещают «быстро устроить».'
      ),
      source: { title: 'gov.uz', url: 'https://gov.uz/oz/migration', checkedAt: CHECKED_AT },
      contentStatus: 'review'
    }
  },
  { id: 'jp', name: l3('Yaponiya', 'Япония', 'Япония'), status: 'locked', programs: [] },
  { id: 'gb', name: l3('Buyuk Britaniya', 'Буюк Британия', 'Великобритания'), status: 'locked', programs: [] }
]

export const countryById = (id: string): Country | undefined => COUNTRIES.find((c) => c.id === id)
export const programById = (c: Country, id: string): Program | undefined => c.programs.find((p) => p.id === id)
export const DEFAULT_COUNTRY: CountryId = 'de'

/** Profildagi tanlov: faqat ochiq davlat; notoʻgʻri yoki yopiq boʻlsa standart (Germaniya). */
export function effectiveCountry(id: unknown): CountryId {
  const c = typeof id === 'string' ? countryById(id) : undefined
  return c && c.status === 'open' ? c.id : DEFAULT_COUNTRY
}

/** Davlat sahifasidagi "Germaniyaga oʻtish" va yoʻl tafsilotidagi tugma manzillari. */
export const AUSBILDUNG_PATH = '/yol/de/ausbildung'

/** Ausbildung kirish ekrani va batafsil sahifa (yoʻl xaritasi — AUSBILDUNG_PATH oʻzida). */
export const AUSBILDUNG_INTRO_PATH = `${AUSBILDUNG_PATH}/kirish`
export const AUSBILDUNG_DETAIL_PATH = `${AUSBILDUNG_PATH}/batafsil`

/** Yoʻl kartochkasi manzili: Ausbildung — kirish ekraniga, qolgan yoʻllar — oʻz sahifasiga. */
export const programPath = (c: Country, p: Program) => (contentOf(c.id, p.id) ? `/yol/${c.id}/${p.id}/kirish` : `/yol/${c.id}/${p.id}`)
