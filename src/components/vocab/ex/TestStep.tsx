import { useMemo, useRef, useState } from 'react'
import { IconCheck, IconX } from '@tabler/icons-react'
import { useI18n } from '../../../i18n/I18nProvider'
import { pickVocabOptions } from '../../../german/vocab'
import { useFeedback } from '../../../ui/useFeedback'
import { useCourse } from '../../../lang/CourseContext'
import { ContinueFooter, Prompt, type ExProps } from './common'

/** Test: savol moviy blokda, 4 variant; javobdan keyin "Davom etish". */
/** Savol tili doim nemischa → oʻzbekcha (vocabFront testga taʼsir qilmaydi). */
export function TestStep({ word, onAnswer, onDone }: ExProps) {
  const { lang, t } = useI18n()
  const course = useCourse()
  const fx = useFeedback()
  // Variantlar shu savol uchun bir marta aralashtiriladi
  const options = useMemo(() => pickVocabOptions(word, 'target', lang, Math.random, course.vocab), [word, lang, course])
  const [picked, setPicked] = useState<string | null>(null)
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})
  const answered = picked !== null
  const ok = picked === word.id
  const q = t('vocab.qDe')
  const pick = (id: string) => {
    if (answered) return
    setPicked(id)
    if (id === word.id) fx.right(refs.current[id])
    else fx.wrong()
    onAnswer?.(id === word.id)
  }
  return (
    <div className="flex flex-1 flex-col gap-4 pt-4">
      <Prompt label={q} lang={course.id}>
        {word.term}
      </Prompt>
      <div className="space-y-2" role="group" aria-label={q}>
        {options.map((o) => {
          const state = !answered ? 'idle' : o.correct ? 'right' : picked === o.id ? 'wrong' : 'dim'
          const cls = {
            idle: 'border-line bg-surface active:bg-surface-2',
            right: 'border-success bg-success-soft text-success-text',
            wrong: 'border-danger bg-danger-soft text-danger-text',
            dim: 'border-line bg-surface text-ink-3'
          }[state]
          const fxCls = picked === o.id ? (o.correct ? 'fx-pop' : 'fx-shake') : ''
          return (
            <button
              key={o.id}
              ref={(el) => {
                refs.current[o.id] = el
              }}
              type="button"
              disabled={answered}
              onClick={() => pick(o.id)}
              className={`flex min-h-[48px] w-full items-center justify-between gap-3 rounded-xl border-2 px-4 py-2 text-left text-lg font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${cls} ${fxCls}`}
            >
              {o.text}
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
