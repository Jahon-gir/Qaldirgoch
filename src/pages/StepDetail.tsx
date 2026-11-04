import { Link, useParams } from 'react-router-dom'
import { IconAlertTriangle, IconArrowLeft, IconExternalLink, IconInfoCircle } from '@tabler/icons-react'
import { Card } from '../components/ui/Card'
import { stepById, type Source } from '../content/ausbildung'
import { useT, type TFn } from '../i18n/I18nProvider'
import { isAutoDone } from '../progress/logic'
import { useProfile } from '../profile/ProfileProvider'
import { useProgress } from '../progress/ProgressProvider'

const spaced = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
/** 2026-11-04 → 04.11.2026 */
export const formatDate = (iso: string) => iso.replace(/^(\d{4})-(\d{2})-(\d{2}).*$/, '$3.$2.$1')
/** Faqat https havolalar (kontent xatosidan javascript: va hokazo chiqmasin). */
const safeUrl = (u: string) => (/^https:\/\//i.test(u) ? u : undefined)

function Check({ id, text, checked, disabled, onToggle }: { id: string; text: string; checked: boolean; disabled?: boolean; onToggle: (id: string) => void }) {
  return (
    <li>
      <label className="flex min-h-[48px] cursor-pointer items-start gap-3 py-2">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={() => onToggle(id)}
          className="mt-0.5 h-6 w-6 shrink-0 accent-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
        <span className={`text-base ${checked ? 'text-ink-2' : ''}`}>{text}</span>
      </label>
    </li>
  )
}

function SourceRow({ s, t }: { s: Source; t: TFn }) {
  const href = safeUrl(s.url)
  return (
    <li className="py-1">
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="flex min-h-[44px] items-center gap-2 text-base font-semibold text-trust-text underline underline-offset-4">
          {s.title}
          <IconExternalLink size={18} aria-hidden />
          <span className="sr-only">{t('step.sourceOpens')}</span>
        </a>
      ) : (
        <p className="text-base font-semibold">{s.title}</p>
      )}
      <p className="text-base text-ink-2">{t('step.sourceChecked', { date: formatDate(s.checkedAt) })}</p>
    </li>
  )
}

export default function StepDetail() {
  const { stepId = '' } = useParams()
  const t = useT()
  const { onboarded } = useProfile()
  const { items, toggle } = useProgress()
  const step = stepById(stepId)

  if (!step) {
    return (
      <div className="space-y-3">
        <Link to="/yol" className="flex min-h-[44px] items-center gap-2 text-base font-semibold text-trust-text">
          <IconArrowLeft size={22} aria-hidden />
          {t('step.toRoadmap')}
        </Link>
        <p className="text-base">{t('step.notFound')}</p>
      </div>
    )
  }

  // 1 va 2-bosqich onboarding tugagani uchun avtomatik bajarilgan: vazifalari belgilangan koʻrinadi, oʻzgartirib boʻlmaydi
  const auto = isAutoDone(step, onboarded)
  const cost = step.cost
  const costText = cost ? t(cost.upTo ? 'step.costUpTo' : 'step.costValue', { amount: spaced(cost.amount) }) : null
  const durationText = step.duration ? t(step.duration) : null

  return (
    <div className="space-y-3">
      <header>
        <Link to="/yol" aria-label={t('common.back')} className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full active:bg-surface-2">
          <IconArrowLeft size={24} aria-hidden />
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{t(step.title)}</h1>
        <p className="mt-0.5 text-base text-ink-2">
          {t('step.num', { n: step.order })} · {t(step.summary)}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-base text-ink-2">{t('step.cost')}</p>
          <p className="mt-0.5 text-lg font-semibold">{costText ?? t('step.verifying')}</p>
          <p className="mt-0.5 text-base text-ink-2">{cost ? t(cost.note) : t('step.verifyingNote')}</p>
        </Card>
        <Card>
          <p className="text-base text-ink-2">{t('step.duration')}</p>
          <p className="mt-0.5 text-lg font-semibold">{durationText ?? t('step.verifying')}</p>
          {!durationText && <p className="mt-0.5 text-base text-ink-2">{t('step.verifyingNote')}</p>}
        </Card>
      </div>

      {step.facts && (
        <div className="flex gap-2 rounded-xl bg-trust-soft px-3 py-3 text-base text-trust-text">
          <IconInfoCircle size={22} className="shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">{t('step.facts')}</p>
            <ul className="mt-1 space-y-2">
              {step.facts.map((k) => (
                <li key={k}>{t(k)}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {step.tasks.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold">{t('step.tasks')}</h2>
          <ul className="mt-1">
            {step.tasks.map((x) => (
              <Check key={x.id} id={x.id} text={t(x.text)} checked={auto || x.id in items} disabled={auto} onToggle={toggle} />
            ))}
          </ul>
          {auto && <p className="mt-1 text-base text-ink-2">{t('step.autoNote')}</p>}
          {step.module && (
            <div aria-disabled="true" className="mt-2 flex min-h-[48px] items-center justify-between gap-2 rounded-xl bg-surface-2 px-3 py-2 text-base text-ink-2">
              <span>{t(step.module.label)}</span>
              {!step.module.ready && <span className="rounded-full bg-surface px-2 py-0.5 font-semibold">{t('common.soon')}</span>}
            </div>
          )}
        </Card>
      )}

      {step.documents.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold">{t('step.documents')}</h2>
          <ul className="mt-1">
            {step.documents.map((x) => (
              <Check key={x.id} id={x.id} text={t(x.text)} checked={x.id in items} onToggle={toggle} />
            ))}
          </ul>
          <p className="mt-1 text-base text-ink-2">{t('step.documentsNote')}</p>
        </Card>
      )}

      {step.warning && (
        <div className="flex gap-2 rounded-xl bg-danger-soft px-3 py-3 text-base text-danger-text">
          <IconAlertTriangle size={22} className="shrink-0" aria-hidden />
          <div>
            <h2 className="font-semibold">{t('step.warning')}</h2>
            <p className="mt-1">{t(step.warning)}</p>
          </div>
        </div>
      )}

      <Card>
        <h2 className="text-lg font-semibold">{t('step.source')}</h2>
        {step.sources.length ? (
          <ul className="mt-1">
            {step.sources.map((s) => (
              <SourceRow key={s.url} s={s} t={t} />
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-base text-ink-2">{t('step.sourcePending')}</p>
        )}
      </Card>

      <p className="px-1 text-base text-ink-2">{t('step.disclaimer')}</p>
    </div>
  )
}
