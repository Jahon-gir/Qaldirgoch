import { Link } from 'react-router-dom'
import { IconChevronRight, IconClockHour4, IconLock, IconShieldCheck } from '@tabler/icons-react'
import { Flag } from '../../components/countries/Flag'
import { PROGRAM_ICONS } from '../../components/countries/icons'
import { Overlap, SourceLine, TrustHeader, safeUrl } from '../../components/countries/parts'
import type { Country } from '../../content/countries'
import { useI18n } from '../../i18n/I18nProvider'

export default function CountryPage({ country }: { country: Country }) {
  const { lang, t } = useI18n()
  const open = country.status === 'open'
  const safety = country.safety
  return (
    <div>
      <TrustHeader back={{ to: '/yol', label: 'countries.all' }}>
        <div className="flex items-center gap-3">
          <Flag id={country.id} />
          <h1 className="text-2xl font-medium">{country.name[lang]}</h1>
        </div>
        <p className="mt-2 text-base opacity-90">{open ? t('countries.pickProgram') : t('countries.nextVersion')}</p>
      </TrustHeader>

      <Overlap>
        {country.programs.length > 0 && (
          <ul aria-label={t('countries.programs')} className="space-y-2">
            {country.programs.map((p) => {
              const Icon = PROGRAM_ICONS[p.icon]
              const pOpen = p.status === 'open'
              return (
                <li key={p.id}>
                  <Link
                    to={`/yol/${country.id}/${p.id}`}
                    className={`flex min-h-[64px] items-center gap-3 rounded-card px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                      pOpen ? 'border-[1.5px] border-accent bg-surface' : 'border-[1.5px] border-dashed border-line bg-surface-2 text-ink-2'
                    }`}
                  >
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${pOpen ? 'bg-accent-soft text-accent-strong' : 'bg-surface text-ink-2'}`}>{Icon && <Icon size={24} aria-hidden />}</span>
                    <span className="flex-1">
                      <span className={`block text-base font-semibold ${pOpen ? 'text-ink' : ''}`}>{p.name[lang]}</span>
                      <span className="block text-base">{p.short[lang]}</span>
                    </span>
                    {pOpen ? (
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
        )}

        {!open && country.programs.length > 0 && (
          <div className="flex gap-2 rounded-xl bg-surface-2 px-3 py-3 text-base text-ink-2">
            <IconClockHour4 size={22} className="shrink-0" aria-hidden />
            <p>{t('countries.pending')}</p>
          </div>
        )}

        {safety && (
          <section aria-labelledby="safety-title" className="rounded-xl bg-trust-soft px-3 py-3 text-base text-trust-text">
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

      </Overlap>
    </div>
  )
}
