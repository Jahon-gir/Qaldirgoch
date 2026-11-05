import { useRef, useState, type FormEvent } from 'react'
import { useI18n } from '../../../i18n/I18nProvider'
import { check, isBlank, isRight, type CheckResult } from '../../../german/answer'
import { useFeedback } from '../../../ui/useFeedback'
import { Footer, navyBtn } from '../parts'
import { Prompt, Verdict, type ExProps } from './common'

export const SPECIAL = ['ä', 'ö', 'ü', 'ß'] as const

/** Yozish: savol — tarjima; ä ö ü ß tugmalari kursor turgan joyga qoʻyadi; Enter ham tekshiradi. */
export function WriteStep({ word, onAnswer, onDone }: ExProps) {
  const { lang, t } = useI18n()
  const fx = useFeedback()
  const [value, setValue] = useState('')
  const [result, setResult] = useState<CheckResult | null>(null)
  const [blank, setBlank] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const done = result !== null

  const insert = (c: string) => {
    const el = input.current
    const start = el?.selectionStart ?? value.length
    const end = el?.selectionEnd ?? value.length
    setValue(value.slice(0, start) + c + value.slice(end))
    setBlank(false)
    // Fokus va kursor maydonga qaytadi (qoʻyilgan harfdan keyin)
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(start + 1, start + 1)
    })
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (done) return onDone(isRight(result))
    if (isBlank(value)) return setBlank(true)
    const r = check(value, word.de)
    setResult(r)
    if (isRight(r)) fx.right(input.current)
    else fx.wrong()
    onAnswer?.(isRight(r))
  }
  const tone = result === null ? '' : result === 'almost' ? 'border-warn' : isRight(result) ? 'border-success' : 'border-danger'
  const message =
    result === 'exact' ? t('ex.exact') : result === 'correct' ? t('ex.correct', { t: word.de }) : result === 'almost' ? t('ex.almost', { t: word.de }) : t('ex.wrong', { t: word.de })

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col gap-4 pt-4" noValidate>
      <Prompt label={t('ex.writeQ')}>{word.tr[lang]}</Prompt>
      <div className="grid grid-cols-4 gap-2">
        {SPECIAL.map((c) => (
          <button
            key={c}
            type="button"
            lang="de"
            disabled={done}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insert(c)}
            aria-label={t('ex.insert', { c })}
            className="flex h-12 items-center justify-center rounded-xl border border-vedge bg-vf text-xl font-semibold text-vink active:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40"
          >
            {c}
          </button>
        ))}
      </div>
      <input
        ref={input}
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          setBlank(false)
        }}
        readOnly={done}
        lang="de"
        aria-label={t('ex.input')}
        aria-invalid={blank || undefined}
        aria-describedby={blank ? 'write-blank' : undefined}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint="done"
        className={`h-[52px] w-full rounded-xl border-2 bg-surface px-4 text-[20px] text-ink outline-none focus:border-head ${tone || 'border-line'} ${result === 'wrong' ? 'fx-shake' : ''}`}
      />
      {blank && (
        <p id="write-blank" role="alert" className="text-base font-semibold text-danger-text">
          {t('ex.blank')}
        </p>
      )}
      {done && <Verdict tone={result === 'almost' ? 'almost' : isRight(result) ? 'right' : 'wrong'}>{message}</Verdict>}
      <Footer>
        <button type="submit" className={navyBtn}>
          {done ? t('common.continue') : t('ex.check')}
        </button>
      </Footer>
    </form>
  )
}
