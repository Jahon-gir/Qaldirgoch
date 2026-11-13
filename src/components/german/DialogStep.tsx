import { useRef, useState } from 'react'
import { IconCheck, IconMessages, IconX } from '@tabler/icons-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { useI18n } from '../../i18n/I18nProvider'
import { useFeedback } from '../../ui/useFeedback'
import type { DialogExercise } from '../../content/german'
import { useCourse } from '../../lang/CourseContext'
import { dialogOutcome, type Outcome } from '../../german/logic'
import { ListenIcon, NoVoice, type Speech } from './Listen'

/**
 * Qisqa ish dialogi (0.17.0). 1-qism: replikalar — birinchi soʻzlovchi chapda, qolganlar oʻngda (chat kabi),
 * har birida tinglash tugmasi va tarjima (yashirsa boʻladi). 2-qism (check boʻlsa): savol replikasi va 3 variant.
 */
export function DialogStep({ ex, speech, onDone }: { ex: DialogExercise; speech: Speech; onDone: (o: Outcome) => void }) {
  const { lang, t } = useI18n()
  const cl = useCourse().id
  const fx = useFeedback()
  const refs = useRef<Record<number, HTMLButtonElement | null>>({})
  const [phase, setPhase] = useState<'read' | 'check'>('read')
  const [showTr, setShowTr] = useState(true)
  const [picked, setPicked] = useState<number | null>(null)
  const first = ex.lines[0]?.speaker.uz

  if (phase === 'read') {
    return (
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
            <IconMessages size={22} aria-hidden />
          </span>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{t('dialog.title')}</h2>
            <p className="text-base text-ink-2">{t('dialog.hint')}</p>
          </div>
        </div>
        {!speech.canSpeak() && <NoVoice />}
        <ol className="space-y-2">
          {ex.lines.map((l, i) => {
            const left = l.speaker.uz === first
            return (
              <li key={i} className={`flex ${left ? 'justify-start' : 'justify-end'}`}>
                <div className={`flex max-w-[88%] items-start gap-2 rounded-2xl border px-3 py-2 ${left ? 'rounded-tl-sm border-line bg-surface' : 'rounded-tr-sm border-transparent bg-accent-soft'}`}>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-ink-2">{l.speaker[lang]}</p>
                    <p lang={cl} className="break-words text-lg font-semibold leading-snug">
                      {l.text}
                    </p>
                    {showTr && <p className="mt-0.5 text-base text-ink-2">{l.tr[lang]}</p>}
                  </div>
                  <ListenIcon speech={speech} text={l.text} />
                </div>
              </li>
            )
          })}
        </ol>
        <button
          type="button"
          onClick={() => setShowTr((v) => !v)}
          aria-pressed={!showTr}
          className="min-h-[44px] self-center rounded-full px-4 text-base font-semibold text-accent-strong active:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          {showTr ? t('dialog.hideTr') : t('dialog.showTr')}
        </button>
        <div className="sticky bottom-0 -mx-4 mt-auto bg-bg px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <Button onClick={() => (ex.check ? setPhase('check') : onDone(dialogOutcome(ex)))}>{t('common.continue')}</Button>
        </div>
      </div>
    )
  }

  const check = ex.check!
  const q = ex.lines[check.ask]
  const right = ex.lines[check.answer]
  const answered = picked !== null
  const ok = picked === check.answer
  return (
    <div className="flex flex-1 flex-col gap-4">
      <p className="text-base text-ink-2">{t('dialog.check')}</p>
      <Card>
        <p className="text-base font-semibold text-ink-2">{t('dialog.says', { who: q.speaker[lang] })}</p>
        <div className="flex items-start gap-2">
          <p lang={cl} className="flex-1 text-xl font-semibold leading-relaxed">
            {q.text}
          </p>
          <ListenIcon speech={speech} text={q.text} />
        </div>
        <p className="mt-1 text-base text-ink-2">{q.tr[lang]}</p>
      </Card>
      <p className="text-base font-semibold text-ink-2">{t('dialog.says', { who: right.speaker[lang] })}</p>
      <div className="-mt-2 space-y-2" role="group" aria-label={t('dialog.check')}>
        {check.options.map((idx) => {
          const chosen = picked === idx
          const isRight = idx === check.answer
          const state = !answered ? 'idle' : isRight ? 'right' : chosen ? 'wrong' : 'dim'
          const cls = {
            idle: 'border-line bg-surface active:bg-surface-2',
            right: 'border-success bg-success-soft text-success-text',
            wrong: 'border-danger bg-danger-soft text-danger-text',
            dim: 'border-line bg-surface text-ink-3'
          }[state]
          return (
            <button
              key={idx}
              ref={(el) => {
                refs.current[idx] = el
              }}
              type="button"
              lang={cl}
              disabled={answered}
              onClick={() => {
                setPicked(idx)
                if (isRight) fx.right(refs.current[idx])
                else fx.wrong()
              }}
              className={`flex min-h-[48px] w-full items-center justify-between gap-3 rounded-btn border-2 px-4 py-2 text-left text-lg font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${cls} ${chosen ? (isRight ? 'fx-pop' : 'fx-shake') : ''}`}
            >
              {ex.lines[idx].text}
              {state === 'right' && <IconCheck size={24} className="shrink-0" aria-label={t('german.right')} />}
              {state === 'wrong' && <IconX size={24} className="shrink-0" aria-label={t('german.wrong')} />}
            </button>
          )
        })}
      </div>
      <div aria-live="polite">
        {answered && (
          <div className={`rounded-xl px-4 py-3 ${ok ? 'bg-success-soft text-success-text' : 'bg-danger-soft text-danger-text'}`}>
            <p className="flex items-center gap-2 text-base font-semibold">
              {ok ? <IconCheck size={20} aria-hidden /> : <IconX size={20} aria-hidden />}
              {ok ? t('german.right') : t('german.wrong')}
            </p>
            <p className="mt-1 text-base">
              «<span lang={cl}>{right.text}</span>» — {right.tr[lang]}
            </p>
          </div>
        )}
      </div>
      <div className="sticky bottom-0 -mx-4 mt-auto bg-bg px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <Button disabled={!answered} onClick={() => picked !== null && onDone(dialogOutcome(ex, picked))}>
          {t('common.continue')}
        </Button>
      </div>
    </div>
  )
}
