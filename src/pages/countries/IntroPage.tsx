import { Link } from 'react-router-dom'
import { IconAlertTriangle, IconBook2, IconBriefcase, IconCertificate, IconClockHour4, IconCoinEuro, IconContract, IconFileCheck, IconFileText, IconInfoCircle, IconLanguage, IconSchool, IconShieldCheck, IconShieldExclamation, type Icon } from '@tabler/icons-react'
import { Overlap, SourceLine, TrustHeader } from '../../components/countries/parts'
import { Card } from '../../components/ui/Card'
import type { Country, Program } from '../../content/countries'
import { AUSBILDUNG_STEPS, stepById } from '../../content/ausbildung'
import { sourceSummary, type NeedIcon, type ProgramContent } from '../../content/programs'
import { useI18n } from '../../i18n/I18nProvider'
import { hasStarted } from '../../progress/logic'
import { useProgress } from '../../progress/ProgressProvider'
import { ProgramCta } from './ProgramCta'
import { payByYear } from './intro'

export const NEED_ICONS: Record<NeedIcon, Icon> = {
  language: IconLanguage,
  'coin-euro': IconCoinEuro,
  contract: IconContract,
  certificate: IconCertificate,
  'file-text': IconFileText,
  'file-check': IconFileCheck,
  briefcase: IconBriefcase,
  school: IconSchool,
  clock: IconClockHour4,
  'shield-check': IconShieldCheck
}

function Need({ Ic, title, text }: { Ic: Icon; title: string; text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-trust-soft text-trust-text">
        <Ic size={24} aria-hidden />
      </span>
      <span className="min-w-0 flex-1 pt-0.5">
        <span className="block text-base font-semibold">{title}</span>
        <span className="block break-words text-base text-ink-2">{text}</span>
      </span>
    </li>
  )
}

/** Yoʻl kirish ekrani (shablon): nima bu, nima kerak, xavf. Matn va manbalar ProgramContent dan; yangi fakt yoʻq. */
export default function IntroPage({ country, program, content }: { country: Country; program: Program; content: ProgramContent }) {
  const { lang, t } = useI18n()
  const { items } = useProgress()
  const started = hasStarted(items)
  const pay = payByYear(t('step.yol.f3'))
  // Ausbildung: "Bu nima" dagi raqamlar step.yol.f3 dan, talab — AUSBILDUNG_STEPS dan (bitta manba)
  const vars = { y1: pay[1] ?? '', y3: pay[3] ?? '', amount: stepById('yol')?.cost?.amount ?? '' }
  const what = content.what === 'intro.what' && !(pay[1] && pay[3]) ? t('step.yol.f3') : t(content.what, vars)
  const src = sourceSummary(content)
  return (
    <div>
      <TrustHeader back={{ to: `/yol/${country.id}`, text: country.name[lang] }}>
        <h1 className="text-2xl font-medium">{program.name[lang]}</h1>
        <p className="mt-2 text-base opacity-90">{program.short[lang]}</p>
      </TrustHeader>

      <Overlap>
        <Card>
          <h2 className="text-lg font-semibold">{t('intro.whatTitle')}</h2>
          <p className="mt-1 text-base">{what}</p>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">{t('intro.needTitle')}</h2>
          <ul className="mt-3 space-y-3">
            {content.needs.map((n) => (
              <Need key={n.title} Ic={NEED_ICONS[n.icon]} title={t(n.title)} text={t(n.text, vars)} />
            ))}
          </ul>
        </Card>

        {content.notice && (
          <div className="flex gap-2 rounded-xl bg-warn-soft px-3 py-3 text-base text-warn-text">
            <IconAlertTriangle size={22} className="mt-0.5 shrink-0" aria-hidden />
            <div>
              <p className="font-semibold">{t('step.warning')}</p>
              <p className="mt-1">{t(content.notice)}</p>
            </div>
          </div>
        )}

        {content.roadmap && (
          <Card>
            <h2 className="text-lg font-semibold">{t('intro.howTitle')}</h2>
            <div className="mt-2 flex items-center gap-3">
              <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-trust-soft text-xl font-bold text-trust-text">
                {AUSBILDUNG_STEPS.length}
              </span>
              <p className="min-w-0 flex-1 text-base">
                <span className="sr-only">{AUSBILDUNG_STEPS.length} </span>
                {t('intro.how')}
              </p>
            </div>
            <Link
              to={`/yol/${country.id}/${program.id}/batafsil`}
              className="mt-3 flex min-h-[48px] items-center justify-center gap-2 rounded-btn border-2 border-head bg-surface px-4 text-base font-semibold text-trust-text active:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <IconBook2 size={22} aria-hidden />
              {t('intro.readMore')}
            </Link>
          </Card>
        )}

        <div className="flex gap-2 rounded-xl bg-danger-soft px-3 py-3 text-base text-danger-text">
          <IconShieldExclamation size={22} className="mt-0.5 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">{t('roadmap.scamRisk')}</p>
            <p className="mt-1">{t(content.warning)}</p>
          </div>
        </div>

        {!content.roadmap && (
          <Link
            to={`/yol/${country.id}/${program.id}/batafsil`}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-btn border-2 border-head bg-surface px-4 text-base font-semibold text-trust-text active:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <IconBook2 size={22} aria-hidden />
            {t('intro.readMore')}
          </Link>
        )}

        <p className="flex gap-2 px-1 text-base text-ink-2" data-testid="source">
          <IconInfoCircle size={20} className="mt-0.5 shrink-0" aria-hidden />
          <span>
            <SourceLine text={t('countries.source', { name: src.names, date: src.date })} />
          </span>
        </p>

        <ProgramCta content={content} continueLabel={started} />
      </Overlap>
    </div>
  )
}
