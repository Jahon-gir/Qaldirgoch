import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { IconCheck, IconX } from '@tabler/icons-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { useI18n } from '../../i18n/I18nProvider'
import type { ChoiceExercise, MatchExercise, WordExercise } from '../../content/german'
import { choiceOutcome, isCorrectOption, isMatchingPair, matchColumns, matchOutcome, wordOutcome, type Outcome } from '../../german/logic'
import { LESSON_ICONS } from './icons'
import { ListenButtons, type Speech } from './Listen'

/** Qadam pastidagi tugma: kichik ekranda ham doim koʻrinib turadi. */
function Footer({ children }: { children: ReactNode }) {
  return <div className="sticky bottom-0 -mx-4 mt-auto bg-bg px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">{children}</div>
}

/* ---------- Yangi soʻz ---------- */

export function WordStep({ ex, speech, onDone }: { ex: WordExercise; speech: Speech; onDone: (o: Outcome) => void }) {
  const { lang, t } = useI18n()
  const Icon = LESSON_ICONS[ex.icon]
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-col items-center gap-3 pt-2 text-center">
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-accent-soft text-accent-strong">{Icon && <Icon size={48} aria-hidden />}</span>
        <h2 lang="de" className="break-words text-3xl font-bold">
          {ex.de}
        </h2>
        <p className="text-xl">{ex.tr[lang]}</p>
        <p className="text-base text-ink-2">{ex.pron[lang]}</p>
      </div>
      <ListenButtons speech={speech} text={ex.de} audioUrl={ex.audioUrl} />
      <Card>
        <p lang="de" className="text-base font-semibold">
          {ex.example.de}
        </p>
        <p className="mt-1 text-base text-ink-2">{ex.example.tr[lang]}</p>
      </Card>
      <Footer>
        <Button onClick={() => onDone(wordOutcome())}>{t('common.next')}</Button>
      </Footer>
    </div>
  )
}

/* ---------- Variant tanlash ---------- */

export function ChoiceStep({ ex, onDone }: { ex: ChoiceExercise; onDone: (o: Outcome) => void }) {
  const { lang, t } = useI18n()
  const [picked, setPicked] = useState<string | null>(null)
  const answered = picked !== null
  const ok = answered && isCorrectOption(ex, picked)
  const [before, after] = ex.sentence.split('___')
  const right = ex.options.find((o) => o.correct)
  return (
    <div className="flex flex-1 flex-col gap-4">
      <p className="text-base text-ink-2">{ex.prompt[lang]}</p>
      <Card>
        <p lang="de" className="text-xl font-semibold leading-relaxed">
          {before}
          <span className={`mx-1 inline-block min-w-[4rem] border-b-2 text-center ${answered ? 'border-success text-success-text' : 'border-ink-3'}`}>
            {answered ? right?.text : ' '}
          </span>
          {after}
        </p>
        <p className="mt-2 text-base text-ink-2">{ex.translation[lang]}</p>
      </Card>
      <div className="space-y-2" role="group" aria-label={ex.prompt[lang]}>
        {ex.options.map((o) => {
          const chosen = picked === o.id
          const state = !answered ? 'idle' : o.correct ? 'right' : chosen ? 'wrong' : 'dim'
          const cls = {
            idle: 'border-line bg-surface active:bg-surface-2',
            right: 'border-success bg-success-soft text-success-text',
            wrong: 'border-danger bg-danger-soft text-danger-text',
            dim: 'border-line bg-surface text-ink-3'
          }[state]
          return (
            <button
              key={o.id}
              type="button"
              lang="de"
              disabled={answered}
              onClick={() => setPicked(o.id)}
              className={`flex min-h-[48px] w-full items-center justify-between gap-3 rounded-btn border-2 px-4 py-2 text-left text-lg font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${cls}`}
            >
              {o.text}
              {state === 'right' && <IconCheck size={24} aria-label={t('german.right')} />}
              {state === 'wrong' && <IconX size={24} aria-label={t('german.wrong')} />}
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
            <p className="mt-1 text-base">{ex.explain[lang]}</p>
          </div>
        )}
      </div>
      <Footer>
        <Button disabled={!answered} onClick={() => picked && onDone(choiceOutcome(ex, picked))}>
          {t('common.continue')}
        </Button>
      </Footer>
    </div>
  )
}

/* ---------- Juftlash ---------- */

const FLASH_RIGHT_MS = 700
const FLASH_WRONG_MS = 600

export function MatchStep({ ex, onDone }: { ex: MatchExercise; onDone: (o: Outcome) => void }) {
  const { lang, t } = useI18n()
  const cols = useMemo(() => matchColumns(ex), [ex])
  const [sel, setSel] = useState<string | null>(null)
  const [matched, setMatched] = useState<string[]>([])
  const [gone, setGone] = useState<string[]>([]) // yashil boʻlib oʻchganlar (joyi saqlanadi)
  const [wrong, setWrong] = useState<{ left: string; right: string } | null>(null)
  const [live, setLive] = useState('')
  const wrongLefts = useRef<Set<string>>(new Set())
  const allDone = matched.length === ex.pairs.length

  useEffect(() => {
    if (matched.length === gone.length) return
    const id = window.setTimeout(() => setGone(matched), FLASH_RIGHT_MS)
    return () => {
      window.clearTimeout(id)
    }
  }, [matched, gone])

  useEffect(() => {
    if (!wrong) return
    const id = window.setTimeout(() => setWrong(null), FLASH_WRONG_MS)
    return () => {
      window.clearTimeout(id)
    }
  }, [wrong])

  const pickLeft = (id: string) => {
    if (wrong || matched.includes(id)) return
    setSel(sel === id ? null : id)
  }
  const pickRight = (id: string) => {
    if (wrong || !sel || matched.includes(id)) return
    if (isMatchingPair(ex, sel, id)) {
      setMatched([...matched, id])
      setLive(t('german.pairRight'))
    } else {
      wrongLefts.current.add(sel) // xato juft hisoblanadi
      setWrong({ left: sel, right: id })
      setLive(t('german.pairWrong'))
    }
    setSel(null)
  }

  const itemCls = (id: string, side: 'left' | 'right') => {
    if (gone.includes(id)) return 'invisible border-transparent'
    if (matched.includes(id)) return 'border-success bg-success-soft text-success-text'
    if (wrong && wrong[side] === id) return 'border-danger bg-danger-soft text-danger-text'
    if (side === 'left' && sel === id) return 'border-accent bg-accent-soft font-semibold'
    return 'border-line bg-surface active:bg-surface-2'
  }
  const base =
    'flex min-h-[56px] w-full items-center justify-center gap-1 break-words rounded-btn border-2 px-2 py-2 text-center text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

  return (
    <div className="flex flex-1 flex-col gap-4">
      <p className="text-base text-ink-2">{ex.prompt[lang]}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2" role="group" aria-label={t('german.matchGerman')}>
          {cols.left.map((p) => (
            <button key={p.id} type="button" lang="de" aria-pressed={sel === p.id} aria-hidden={gone.includes(p.id) || undefined} tabIndex={gone.includes(p.id) ? -1 : undefined} onClick={() => pickLeft(p.id)} className={`${base} ${itemCls(p.id, 'left')}`}>
              {matched.includes(p.id) && <IconCheck size={18} aria-hidden />}
              {wrong?.left === p.id && <IconX size={18} aria-hidden />}
              {p.de}
            </button>
          ))}
        </div>
        <div className="space-y-2" role="group" aria-label={t('german.matchTranslation')}>
          {cols.right.map((p) => (
            <button key={p.id} type="button" aria-hidden={gone.includes(p.id) || undefined} tabIndex={gone.includes(p.id) ? -1 : undefined} onClick={() => pickRight(p.id)} className={`${base} ${itemCls(p.id, 'right')}`}>
              {matched.includes(p.id) && <IconCheck size={18} aria-hidden />}
              {wrong?.right === p.id && <IconX size={18} aria-hidden />}
              {p.tr[lang]}
            </button>
          ))}
        </div>
      </div>
      <p role="status" className={allDone ? 'flex items-center justify-center gap-2 text-base font-semibold text-success-text' : 'sr-only'}>
        {allDone ? (
          <>
            <IconCheck size={20} aria-hidden />
            {t('german.matchDone')}
          </>
        ) : (
          live
        )}
      </p>
      <Footer>
        <Button disabled={!allDone} onClick={() => onDone(matchOutcome(ex, wrongLefts.current))}>
          {t('common.continue')}
        </Button>
      </Footer>
    </div>
  )
}
