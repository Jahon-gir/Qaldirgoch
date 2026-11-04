import { useState } from 'react'
import { IconArrowLeft } from '@tabler/icons-react'
import { Button } from '../../components/ui/Button'
import { OptionCard } from '../../components/ui/OptionCard'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { useT } from '../../i18n/I18nProvider'
import { QUESTIONS, qKey, type Answers } from '../../profile/questions'

export function QuestionStep({
  index,
  draft,
  onChange,
  onBack,
  onNext
}: {
  index: number
  draft: Partial<Answers>
  onChange: (patch: Partial<Answers>) => void
  onBack: () => void
  onNext: () => void
}) {
  const t = useT()
  const q = QUESTIONS[index]
  const total = QUESTIONS.length
  const value = draft[q.id]
  const [error, setError] = useState(false)
  const titleId = `q-${q.id}`

  const next = () => {
    if (!value || !q.options.includes(value)) return setError(true)
    onNext()
  }

  return (
    <>
      <div className="flex min-h-[56px] items-center gap-3">
        <button type="button" onClick={onBack} aria-label={t('common.back')} className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-surface-2">
          <IconArrowLeft size={24} aria-hidden />
        </button>
        <div className="flex-1">
          <ProgressBar value={((index + 1) / total) * 100} label={t('q.progress')} />
        </div>
        <span className="min-w-[2.5rem] text-right text-sm font-medium text-ink-2" aria-hidden>
          {index + 1}/{total}
        </span>
      </div>

      <h1 id={titleId} className="mt-4 text-lg font-semibold">
        <span className="sr-only">
          {index + 1}/{total}.{' '}
        </span>
        {t(qKey(q, 'title'))}
      </h1>
      {q.hint && <p className="mt-1 text-sm text-ink-2">{t(qKey(q, 'hint'))}</p>}

      <div role="radiogroup" aria-labelledby={titleId} className="mt-4 space-y-2">
        {q.options.map((o) => (
          <OptionCard
            key={o}
            soft
            selected={value === o}
            onClick={() => {
              setError(false)
              onChange({ [q.id]: o } as Partial<Answers>)
            }}
          >
            {t(qKey(q, o))}
          </OptionCard>
        ))}
      </div>

      {q.id === 'profession' && value === 'other' && (
        <input
          type="text"
          maxLength={60}
          value={draft.professionOther ?? ''}
          onChange={(e) => onChange({ professionOther: e.target.value })}
          placeholder={t('q.otherPlaceholder')}
          aria-label={t('q.otherPlaceholder')}
          className="mt-2 min-h-[44px] w-full rounded-btn border border-line bg-surface px-4 py-2.5 text-base text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-danger">
          {t('q.required')}
        </p>
      )}

      <div className="mt-auto pt-6">
        <Button onClick={next}>
          {t('common.next')}
        </Button>
      </div>
    </>
  )
}
