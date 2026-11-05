import { useEffect, useMemo, useRef, useState } from 'react'
import { IconCheck, IconSnail, IconVolume, IconX } from '@tabler/icons-react'
import { useI18n } from '../../../i18n/I18nProvider'
import { pickVocabOptions } from '../../../german/vocab'
import { useFeedback } from '../../../ui/useFeedback'
import { ContinueFooter, type ExProps } from './common'

export const LISTEN_RATE = 0.8
export const LISTEN_SLOW = 0.45

/** Tinglab topish: ekranda yozuv yoʻq; 4 ta yozma nemischa variant. Ochilganda bir marta oʻqiladi. */
export function ListenStep({ word, speech, onAnswer, onDone }: ExProps) {
  const { lang, t } = useI18n()
  const fx = useFeedback()
  const options = useMemo(() => pickVocabOptions(word, 'tr', lang), [word, lang])
  const [picked, setPicked] = useState<string | null>(null)
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})
  const played = useRef(false)
  const { speak } = speech
  useEffect(() => {
    if (played.current) return
    played.current = true
    speak(word.de, { rate: LISTEN_RATE })
  }, [speak, word.de])
  const answered = picked !== null
  const ok = picked === word.id
  const pick = (id: string) => {
    if (answered) return
    setPicked(id)
    if (id === word.id) fx.right(refs.current[id])
    else fx.wrong()
    onAnswer?.(id === word.id)
  }
  return (
    <div className="flex flex-1 flex-col gap-4 pt-4">
      <p className="text-center text-lg font-semibold">{t('ex.listenQ')}</p>
      <div className="flex items-center justify-center gap-4 py-2">
        <button
          type="button"
          onClick={() => speak(word.de, { rate: LISTEN_RATE })}
          aria-label={t('ex.play')}
          className={`flex h-[84px] w-[84px] items-center justify-center rounded-full border border-head-line text-white shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${speech.speaking ? 'bg-vbtn-on' : 'bg-head'}`}
        >
          <IconVolume size={42} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => speak(word.de, { rate: LISTEN_SLOW })}
          aria-label={t('ex.playSlow')}
          className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-trust-soft text-trust-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <IconSnail size={28} aria-hidden />
        </button>
      </div>
      <div className="space-y-2" role="group" aria-label={t('ex.listenQ')}>
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
              <span>
                <span lang="de" className="block">
                  {o.text}
                </span>
                {state === 'right' && <span className="block text-base font-normal">{word.tr[lang]}</span>}
              </span>
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
