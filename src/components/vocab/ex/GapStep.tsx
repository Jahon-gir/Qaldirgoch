import { useMemo, useRef, useState } from 'react'
import { IconCheck, IconVolume, IconX } from '@tabler/icons-react'
import { fullSentence, type GapItem } from '../../../content/german/gaps'
import { useI18n } from '../../../i18n/I18nProvider'
import { useFeedback } from '../../../ui/useFeedback'
import type { Speech } from '../../german/Listen'
import { ContinueFooter } from './common'
import { WriteCore } from './WriteStep'

/** Toʻq koʻk kartada gap: boʻsh joy marjon chiziq; ostida tarjima. Ovoz tugmasi faqat javobdan KEYIN (aks holda javobni aytib qoʻyadi). */
function GapCard({ gap, filled, speech }: { gap: GapItem; filled: boolean; speech: Speech }) {
  const { lang, t } = useI18n()
  const [before, after] = gap.sentence.split('___')
  const full = fullSentence(gap)
  return (
    <div className="rounded-2xl border border-head-line bg-head px-5 py-5 text-white">
      <p lang="de" className="break-words text-2xl font-bold leading-relaxed">
        {before}
        <span className={`inline-block min-w-[4.5rem] border-b-4 border-accent px-1 text-center ${filled ? '' : 'text-transparent'}`}>
          {filled ? gap.answer : <span className="sr-only">{t('ft.blank')}</span>}
        </span>
        {after}
      </p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-base text-head-sub">{gap.tr[lang]}</p>
        {filled && speech.canSpeak() && (
          <button
            type="button"
            onClick={() => speech.speak(full)}
            aria-label={t('ft.gapListen')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            <IconVolume size={24} aria-hidden />
          </button>
        )}
      </div>
    </div>
  )
}

/** Gapda boʻsh joyni toʻldirish: tanlash (3 variant, aralash) yoki yozish (answer yoki accept dagisi toʻgʻri). */
export function GapStep({ gap, mode, speech, onDone }: { gap: GapItem; mode: 'choice' | 'write'; speech: Speech; onDone: (correct: boolean) => void }) {
  const { t } = useI18n()
  const fx = useFeedback()
  const options = useMemo(() => {
    const a = [gap.answer, ...gap.distractors]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }, [gap])
  const [picked, setPicked] = useState<string | null>(null)
  const [written, setWritten] = useState(false)
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})

  if (mode === 'write')
    return (
      <WriteCore
        target={gap.answer}
        accept={gap.accept}
        prompt={
          <div className="space-y-2">
            <p className="text-base text-ink-2">{t('ft.gapWrite')}</p>
            <GapCard gap={gap} filled={written} speech={speech} />
          </div>
        }
        onAnswer={() => setWritten(true)}
        onDone={onDone}
      />
    )

  const answered = picked !== null
  const ok = picked === gap.answer
  const pick = (o: string) => {
    if (answered) return
    setPicked(o)
    if (o === gap.answer) fx.right(refs.current[o])
    else fx.wrong()
  }
  return (
    <div className="flex flex-1 flex-col gap-4 pt-4">
      <p className="text-base text-ink-2">{t('ft.gapChoose')}</p>
      <GapCard gap={gap} filled={answered} speech={speech} />
      <div className="space-y-2" role="group" aria-label={t('ft.gapChoose')}>
        {options.map((o) => {
          const state = !answered ? 'idle' : o === gap.answer ? 'right' : picked === o ? 'wrong' : 'dim'
          const cls = {
            idle: 'border-line bg-surface active:bg-surface-2',
            right: 'border-success bg-success-soft text-success-text',
            wrong: 'border-danger bg-danger-soft text-danger-text',
            dim: 'border-line bg-surface text-ink-3'
          }[state]
          const fxCls = picked === o ? (o === gap.answer ? 'fx-pop' : 'fx-shake') : ''
          return (
            <button
              key={o}
              ref={(el) => {
                refs.current[o] = el
              }}
              type="button"
              lang="de"
              disabled={answered}
              onClick={() => pick(o)}
              className={`flex min-h-[48px] w-full items-center justify-between gap-3 rounded-xl border-2 px-4 py-2 text-left text-lg font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${cls} ${fxCls}`}
            >
              {o}
              {state === 'right' && <IconCheck size={24} aria-label={t('german.right')} />}
              {state === 'wrong' && <IconX size={24} aria-label={t('german.wrong')} />}
            </button>
          )
        })}
      </div>
      <div aria-live="polite" className="sr-only">
        {answered && (ok ? t('german.right') : t('german.wrong'))}
      </div>
      <ContinueFooter disabled={!answered} onClick={() => onDone(ok)} />
    </div>
  )
}
