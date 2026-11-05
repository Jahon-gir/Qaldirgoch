import { useMemo, useRef, useState } from 'react'
import { IconCheck, IconX } from '@tabler/icons-react'
import { wordById } from '../../content/german/words'
import { useI18n } from '../../i18n/I18nProvider'
import { sessionCurrent, type Session } from '../../german/srs'
import { faceText, pickVocabOptions } from '../../german/vocab'
import type { VocabFront } from '../../profile/questions'
import { useFeedback } from '../../ui/useFeedback'
import { Footer, navyBtn } from './parts'

/** Test: savol moviy blokda, 4 variant. Javobdan keyin — "Davom etish". Xato soʻz oxirida yana bir marta soʻraladi. */
export function VocabTest({ session, front, onAnswer }: { session: Session; front: VocabFront; onAnswer: (correct: boolean) => void }) {
  const { lang, t } = useI18n()
  const fx = useFeedback()
  const id = sessionCurrent(session)
  const word = id ? wordById(id) : undefined
  // Variantlar shu savol uchun bir marta aralashtiriladi
  const options = useMemo(() => (word ? pickVocabOptions(word, front, lang) : []), [word, front, lang, session.pos])
  const [picked, setPicked] = useState<string | null>(null)
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})
  if (!word) return null
  const answered = picked !== null
  const ok = picked === word.id
  const optLang = front === 'de' ? undefined : 'de'
  const pick = (optionId: string) => {
    if (answered) return
    setPicked(optionId)
    if (optionId === word.id) fx.right(refs.current[optionId])
    else fx.wrong()
  }
  return (
    <div className="flex flex-1 flex-col gap-4 pt-4" key={`${session.pos}-${word.id}`}>
      <div className="rounded-2xl border border-head-line bg-head px-5 py-5 text-center text-white">
        <p className="text-base text-white/90">{front === 'de' ? t('vocab.qDe') : t('vocab.qTr')}</p>
        <p lang={front === 'de' ? 'de' : undefined} className="mt-2 break-words text-3xl font-bold">
          {faceText(word, front, lang)}
        </p>
      </div>
      <div className="space-y-2" role="group" aria-label={front === 'de' ? t('vocab.qDe') : t('vocab.qTr')}>
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
              lang={optLang}
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
      <Footer>
        <button type="button" disabled={!answered} onClick={() => onAnswer(ok)} className={navyBtn}>
          {t('common.continue')}
        </button>
      </Footer>
    </div>
  )
}
