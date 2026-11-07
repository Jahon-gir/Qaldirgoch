import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { IconArrowLeft, IconCheck, IconChevronRight, IconShieldExclamation } from '@tabler/icons-react'
import { Card } from '../components/ui/Card'
import { ProgressBar } from '../components/ui/ProgressBar'
import { AUSBILDUNG_PATH } from '../content/countries'
import { AUSBILDUNG_STEPS } from '../content/ausbildung'
import { useT } from '../i18n/I18nProvider'
import { useProgress } from '../progress/ProgressProvider'
import { writeLastPath } from '../home/lastPath'

export default function Roadmap() {
  const t = useT()
  const { statuses, summary } = useProgress()
  const last = AUSBILDUNG_STEPS.length - 1
  useEffect(() => writeLastPath('de', 'ausbildung'), []) // bosh ekrandagi "Davom etish" uchun
  return (
    <div className="space-y-3">
      <Link to="/yol/de" aria-label={t('common.back')} className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full active:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
        <IconArrowLeft size={24} aria-hidden />
      </Link>
      <div className="rounded-card bg-trust px-4 py-4 text-surface">
        <p className="text-base opacity-90">{t('roadmap.country')}</p>
        <h1 className="text-xl font-semibold">{t('roadmap.title')}</h1>
      </div>

      <Card>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-base font-semibold">{t('roadmap.progressCount', { n: summary.done, total: summary.total })}</p>
          <p className="text-base font-semibold text-success-text">{summary.percent}%</p>
        </div>
        <div className="mt-2">
          <ProgressBar value={summary.percent} tone="success" label={t('roadmap.progressLabel')} />
        </div>
      </Card>

      <Card className="px-3 pb-0 pt-3">
        <ol>
          {AUSBILDUNG_STEPS.map((step, i) => {
            const status = statuses[i]
            const done = status === 'done'
            const now = status === 'current'
            return (
              <li key={step.id}>
                <Link
                  to={`${AUSBILDUNG_PATH}/${step.id}`}
                  aria-current={now ? 'step' : undefined}
                  className="flex min-h-[52px] items-stretch gap-3 rounded-xl px-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <span className="flex flex-col items-center">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-semibold ${
                        done ? 'bg-success text-surface' : now ? 'bg-accent text-on-accent' : 'border-2 border-line bg-surface text-ink-2'
                      }`}
                    >
                      {done ? <IconCheck size={20} aria-hidden /> : step.order}
                    </span>
                    {i < last && <span aria-hidden className={`w-0.5 flex-1 ${done ? 'bg-success' : 'bg-line'}`} />}
                  </span>
                  <span className="flex flex-1 items-start gap-2 pb-4 pt-1.5">
                    <span className="flex-1">
                      <span className={`block text-base ${now ? 'font-semibold' : done ? '' : 'text-ink-2'}`}>{t(step.title)}</span>
                      {now ? (
                        <span className="block text-base font-semibold text-accent-strong">{t('roadmap.current')}</span>
                      ) : (
                        <span className="sr-only">{done ? t('roadmap.statusDone') : t('roadmap.statusNext')}</span>
                      )}
                    </span>
                    {step.warning && (
                      <span role="img" aria-label={t('roadmap.scamRisk')} className="flex h-6 w-6 shrink-0 items-center justify-center text-danger">
                        <IconShieldExclamation size={24} aria-hidden />
                      </span>
                    )}
                    <IconChevronRight size={20} className="mt-0.5 shrink-0 text-ink-3" aria-hidden />
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
      </Card>
    </div>
  )
}
