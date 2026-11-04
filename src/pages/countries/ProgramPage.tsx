import { Link } from 'react-router-dom'
import { IconArrowLeft, IconClockHour4, IconExternalLink } from '@tabler/icons-react'
import { PROGRAM_ICONS } from '../../components/countries/icons'
import { SourceLine, hostOf, safeUrl } from '../../components/countries/parts'
import { AUSBILDUNG_PATH, type Country, type Program } from '../../content/countries'
import { useI18n } from '../../i18n/I18nProvider'

/** Yopiq yoʻl tafsiloti: roʻyxatdagi maʼlumotdan boshqa fakt yoʻq. */
export default function ProgramPage({ country, program }: { country: Country; program: Program }) {
  const { lang, t } = useI18n()
  const Icon = PROGRAM_ICONS[program.icon]
  const href = safeUrl(program.officialUrl)
  const source = t('countries.source', { name: hostOf(program.officialUrl), date: program.checkedAt })
  const toDe = country.id === 'de'
  return (
    <div className="space-y-3">
      <Link to={`/yol/${country.id}`} aria-label={t('common.back')} className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full active:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
        <IconArrowLeft size={24} aria-hidden />
      </Link>
      <header className="flex items-center gap-3">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink-2">{Icon && <Icon size={28} aria-hidden />}</span>
        <div>
          <h1 className="text-2xl font-semibold">{program.name[lang]}</h1>
          <p className="text-base text-ink-2">{program.short[lang]}</p>
        </div>
      </header>

      <div className="rounded-xl bg-surface-2 px-3 py-3 text-base text-ink-2">
        <p className="flex items-center gap-2 font-semibold text-ink">
          <IconClockHour4 size={22} aria-hidden />
          {t('countries.laterTitle')}
          {program.contentStatus === 'review' && <span className="rounded-full bg-surface px-2.5 py-0.5 text-sm font-semibold">{t('step.verifying')}</span>}
        </p>
        <p className="mt-1">{t('countries.laterText')}</p>
      </div>

      {href && (
        <a href={href} target="_blank" rel="noopener noreferrer" className="flex min-h-[48px] items-center justify-center gap-2 rounded-btn border-2 border-accent bg-surface px-4 text-base font-semibold text-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          {t('countries.openOfficial')}
          <IconExternalLink size={20} aria-hidden />
          <span className="sr-only">{t('step.sourceOpens')}</span>
        </a>
      )}
      <p className="text-base text-ink-2" data-testid="source">
        <SourceLine text={source} />
      </p>

      <Link to={toDe ? AUSBILDUNG_PATH : '/yol/de'} className="flex min-h-[48px] items-center justify-center rounded-btn bg-accent px-4 text-base font-semibold text-on-accent active:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
        {toDe ? t('countries.goAusbildung') : t('countries.goDe')}
      </Link>
    </div>
  )
}
