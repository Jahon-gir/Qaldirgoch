import { useState } from 'react'
import { Link } from 'react-router-dom'
import { IconSettings } from '@tabler/icons-react'
import { Logo } from '../components/Logo'
import { AUSBILDUNG_PATH, COUNTRIES, countryById, programById, programPath } from '../content/countries'
import { readLastPath, type LastPath } from '../home/lastPath'
import { WorldMap } from '../home/WorldMap'
import { useI18n } from '../i18n/I18nProvider'
import { useProfile } from '../profile/ProfileProvider'
import { hasStarted } from '../progress/logic'
import { useProgress } from '../progress/ProgressProvider'

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

/** Oxirgi yoʻl; u boʻlmasa, lekin progress bor boʻlsa — Ausbildung (hozircha qadamlar faqat unda). */
function useContinue(): LastPath | null {
  const { items } = useProgress()
  const [last] = useState(readLastPath)
  if (last) return last
  if (!hasStarted(items)) return null
  const de = countryById('de')!
  return { country: de, program: programById(de, 'ausbildung')! }
}

export default function Home() {
  const { lang, t } = useI18n()
  const { selectCountry } = useProfile()
  const { summary } = useProgress()
  const cont = useContinue()
  const isAusbildung = cont?.country.id === 'de' && cont.program.id === 'ausbildung'

  return (
    <div className="space-y-4">
      {/* Hero: har ikkala rejimda qora */}
      <section className="-mx-4 -mt-[max(1rem,env(safe-area-inset-top))] rounded-b-[24px] bg-[#0B0E14] px-4 pb-5 pt-[max(1rem,env(safe-area-inset-top))] text-white">
        <div className="flex items-center justify-between">
          <Logo size={30} />
          <Link to="/sozlamalar" aria-label={t('home.settings')} className={`-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-[#C9CED8] ${focusRing} focus-visible:outline-white`}>
            <IconSettings size={22} aria-hidden />
          </Link>
        </div>
        <div className="mt-2">
          <WorldMap label={t('home.mapUz')} />
        </div>
        <h1 className="mt-3 text-[21px] font-semibold leading-snug">{t('home.hero')}</h1>
      </section>

      {cont && (
        <Link
          to={isAusbildung ? AUSBILDUNG_PATH : programPath(cont.country, cont.program)}
          className={`flex min-h-[56px] flex-col justify-center rounded-card bg-[#D85A30] px-4 py-3 text-white ${focusRing} focus-visible:outline-[#D85A30]`}
        >
          <span className="text-base">{t('common.continue')}</span>
          <span className="text-lg font-semibold">
            {cont.country.name[lang]} · {cont.program.name[lang]}
            {isAusbildung && ` · ${summary.done}/${summary.total}`}
          </span>
        </Link>
      )}

      <section aria-labelledby="home-countries">
        <h2 id="home-countries" className="mb-2 text-lg font-semibold">
          {t('home.whichCountry')}
        </h2>
        <ul className="grid grid-cols-2 gap-2">
          {COUNTRIES.map((c) => {
            const open = c.status === 'open'
            const openPaths = c.programs.filter((p) => p.status === 'open').length
            return (
              <li key={c.id}>
                <Link
                  to={`/yol/${c.id}`}
                  // Countries sahifasidagidek: faqat ochiq davlat tanlanadi
                  onClick={() => open && selectCountry(c.id)}
                  className={`flex h-full min-h-[44px] flex-col gap-2 rounded-card border-[1.5px] p-3 ${focusRing} focus-visible:outline-accent ${
                    open ? 'border-accent bg-surface' : 'border-transparent bg-surface-2'
                  }`}
                >
                  <span
                    aria-hidden
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-base font-bold ${open ? 'bg-accent-soft text-accent-strong' : 'bg-surface text-ink-3'}`}
                  >
                    {c.id.toUpperCase()}
                  </span>
                  <span className={`text-base font-semibold leading-tight ${open ? '' : 'text-ink-2'}`}>{c.name[lang]}</span>
                  <span className={`text-base ${open ? 'font-semibold text-success-text' : 'text-ink-2'}`}>
                    {open ? t('home.openPaths', { n: openPaths }) : t('common.soon')}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      <Link to="/xavfsizlik/agentlik" className={`block rounded-card bg-trust px-4 py-4 text-surface ${focusRing} focus-visible:outline-trust`}>
        <span className="block text-base opacity-90">{t('home.anyCountry')}</span>
        <span className="block text-lg font-semibold">{t('home.checkAgency')}</span>
      </Link>
    </div>
  )
}
