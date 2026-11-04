import { Link } from 'react-router-dom'
import { IconChevronRight, IconLock } from '@tabler/icons-react'
import { Flag } from '../../components/countries/Flag'
import { Overlap, TrustHeader } from '../../components/countries/parts'
import { COUNTRIES } from '../../content/countries'
import { useI18n } from '../../i18n/I18nProvider'
import { useProfile } from '../../profile/ProfileProvider'

export default function Countries() {
  const { lang, t } = useI18n()
  const { selectCountry } = useProfile()
  return (
    <div>
      <TrustHeader>
        <p className="text-base opacity-90">{t('app.name')}</p>
        <h1 className="text-2xl font-medium">{t('countries.title')}</h1>
        <p className="mt-1 text-base opacity-90">{t('countries.subtitle')}</p>
      </TrustHeader>
      <Overlap>
        <ul aria-label={t('countries.list')} className="space-y-2">
          {COUNTRIES.map((c) => {
            const open = c.status === 'open'
            return (
              <li key={c.id}>
                <Link
                  to={`/yol/${c.id}`}
                  // Faqat ochiq davlat tanlanadi; yopiqni bosish sahifani ochadi, tanlovni oʻzgartirmaydi
                  onClick={() => open && selectCountry(c.id)}
                  className={`flex min-h-[64px] items-center gap-3 rounded-card border-[1.5px] px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    open ? 'border-accent bg-surface' : 'border-transparent bg-surface-2 text-ink-2'
                  }`}
                >
                  <Flag id={c.id} dim={!open} />
                  <span className="flex-1 text-lg font-medium">{c.name[lang]}</span>
                  {open ? (
                    <>
                      <span className="rounded-full bg-success-soft px-2.5 py-1 text-sm font-semibold text-success-text">{t('countries.open')}</span>
                      <IconChevronRight size={20} className="shrink-0 text-ink-3" aria-hidden />
                    </>
                  ) : (
                    <>
                      <IconLock size={20} className="shrink-0" aria-hidden />
                      <span className="sr-only">{t('countries.locked')}</span>
                    </>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </Overlap>
    </div>
  )
}
