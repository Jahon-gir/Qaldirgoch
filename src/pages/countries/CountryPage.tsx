import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { IconAlertTriangle, IconArrowLeft, IconChevronRight, IconLock, IconShieldCheck } from '@tabler/icons-react'
import { FlagBand } from '../../components/countries/Flag'
import { PROGRAM_ICONS } from '../../components/countries/icons'
import { SourceLine, safeUrl } from '../../components/countries/parts'
import { useEnterAnimation } from '../../home/flight'
import { programPath, type Country } from '../../content/countries'
import { useI18n } from '../../i18n/I18nProvider'

export default function CountryPage({ country }: { country: Country }) {
  const { lang, t } = useI18n()
  const open = country.status === 'open'
  const safety = country.safety
  const root = useRef<HTMLDivElement>(null)
  useEnterAnimation(root) // bosh ekrandan uchib kelinganda elementlar bittadan chiqadi
  return (
    <div ref={root}>
      <div data-enter className="relative -mx-4 -mt-[max(1rem,env(safe-area-inset-top))]">
        <FlagBand id={country.id} />
        <Link
          to="/yol"
          aria-label={t('countries.all')}
          className="absolute left-3 top-[max(0.75rem,env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <IconArrowLeft size={24} aria-hidden />
        </Link>
      </div>
      <header data-enter className="mt-4">
        <h1 className="text-[26px] font-semibold leading-tight">{country.name[lang]}</h1>
        <p className="mt-1 text-base text-ink-2">{open ? t('countries.pickProgram') : t('countries.nextVersion')}</p>
      </header>

      <div className="mt-4 space-y-2">
        {country.programs.length > 0 && (
          <ul aria-label={t('countries.programs')} className="space-y-2">
            {country.programs.map((p) => {
              const Icon = PROGRAM_ICONS[p.icon]
              const pOpen = p.status === 'open'
              return (
                <li key={p.id} data-enter>
                  {pOpen ? (
                    <Link
                      to={programPath(country, p)}
                      className="flex min-h-[64px] items-center gap-3 rounded-card border-[1.5px] border-accent bg-surface px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong">{Icon && <Icon size={24} aria-hidden />}</span>
                      <span className="flex-1">
                        <span className="block text-base font-semibold text-ink">{p.name[lang]}</span>
                        <span className="block text-base">{p.short[lang]}</span>
                      </span>
                      <span className="rounded-full bg-success-soft px-2.5 py-1 text-sm font-semibold text-success-text">{t('countries.open')}</span>
                      <IconChevronRight size={20} className="shrink-0 text-ink-3" aria-hidden />
                    </Link>
                  ) : (
                    // Yopiq yoʻl: bosilmaydi (havola emas), sokin koʻrinish, hover/active effekti yoʻq
                    <div className="flex min-h-[64px] items-center gap-3 rounded-card border-[1.5px] border-dashed border-line bg-surface-2 px-3 py-2 text-ink-2">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-ink-2">{Icon && <Icon size={24} aria-hidden />}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-base font-semibold">{p.name[lang]}</span>
                        <span className="block text-base">{p.short[lang]}</span>
                      </span>
                      <span className="shrink-0 rounded-full bg-surface px-2.5 py-1 text-sm font-semibold">{t('countries.soonBadge')}</span>
                      <IconLock size={20} className="shrink-0" aria-hidden />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {!open && (
          <div data-enter className="flex gap-2 rounded-xl bg-warn-soft px-3 py-3 text-base text-warn-text">
            <IconAlertTriangle size={22} className="shrink-0" aria-hidden />
            <div>
              <p>{t('countries.lockedWarning')}</p>
              <Link to="/xavfsizlik/agentlik" className="inline-flex min-h-[44px] items-center font-semibold underline underline-offset-4">
                {t('countries.checkAgency')}
              </Link>
            </div>
          </div>
        )}

        {safety && (
          <section data-enter aria-labelledby="safety-title" className="rounded-xl bg-trust-soft px-3 py-3 text-base text-trust-text">
            <div className="flex items-center justify-between gap-2">
              <h2 id="safety-title" className="flex items-center gap-2 font-semibold">
                <IconShieldCheck size={22} aria-hidden />
                {t('countries.safety')}
              </h2>
              {safety.contentStatus === 'review' && <span className="rounded-full bg-surface px-2.5 py-1 text-sm font-semibold">{t('step.verifying')}</span>}
            </div>
            <p className="mt-1">{safety.text[lang]}</p>
            <p className="mt-2">
              {safeUrl(safety.source.url) ? (
                <a href={safeUrl(safety.source.url)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center font-semibold underline underline-offset-4">
                  <span>
                    <SourceLine text={t('countries.source', { name: safety.source.title, date: safety.source.checkedAt })} />
                  </span>
                  <span className="sr-only">{t('step.sourceOpens')}</span>
                </a>
              ) : (
                t('countries.source', { name: safety.source.title, date: safety.source.checkedAt })
              )}
            </p>
          </section>
        )}
      </div>
    </div>
  )
}
