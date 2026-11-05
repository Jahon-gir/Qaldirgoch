import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { IconCheck, IconFlameFilled, IconVolume, IconX } from '@tabler/icons-react'
import { Button } from '../../components/ui/Button'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { VOCAB, wordById } from '../../content/german/words'
import { useI18n } from '../../i18n/I18nProvider'
import { useBack, useHistoryAnchor } from '../../lib/useHistoryAnchor'
import { daysBetween, isFirstAttempt, pickOptions, sessionAnswer, sessionCurrent, sessionDone, sessionSummary, startSession, type Session } from '../../german/srs'
import { useSpeech } from '../../german/useSpeech'
import { useWords } from '../../german/WordsProvider'

/** Toʻgʻri javobdan keyin keyingi soʻzga oʻtish (xato javobda — "Davom etish" tugmasi). */
export const RIGHT_ADVANCE_MS = 1500

function Footer({ children }: { children: ReactNode }) {
  return <div className="sticky bottom-0 -mx-4 mt-auto space-y-2 bg-bg px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">{children}</div>
}

function Question({ session, onAnswered }: { session: Session; onAnswered: (correct: boolean) => void }) {
  const { lang, t } = useI18n()
  const speech = useSpeech()
  const { words, today, answer } = useWords()
  const id = sessionCurrent(session)!
  const word = wordById(id)!
  // Variantlar shu savol uchun bir marta aralashtiriladi
  const options = useMemo(() => pickOptions(word, VOCAB, lang), [word, lang])
  const [picked, setPicked] = useState<string | null>(null)
  const answered = picked !== null
  const ok = answered && picked === word.id

  useEffect(() => {
    if (!ok) return
    const timer = window.setTimeout(() => onAnswered(true), RIGHT_ADVANCE_MS)
    return () => {
      window.clearTimeout(timer)
    }
  }, [ok, onAnswered])

  const pick = (optionId: string) => {
    if (answered) return
    setPicked(optionId)
    answer(id, optionId === word.id, isFirstAttempt(session, id))
  }
  const dueIn = Math.max(1, daysBetween(today, words[id]?.due ?? today))

  return (
    <div className="flex flex-1 flex-col gap-4">
      <p className="text-base text-ink-2">{t('review.question')}</p>
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <h1 lang="de" className="break-words text-4xl font-bold">
          {word.de}
        </h1>
        {speech.canSpeak() && (
          <button
            type="button"
            onClick={() => speech.speak(word.de, { slow: true })}
            aria-label={t('german.listenWord', { de: word.de })}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent-strong active:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <IconVolume size={26} aria-hidden />
          </button>
        )}
      </div>
      <div className="space-y-2" role="group" aria-label={t('review.question')}>
        {options.map((o) => {
          const state = !answered ? 'idle' : o.correct ? 'right' : picked === o.id ? 'wrong' : 'dim'
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
              disabled={answered}
              onClick={() => pick(o.id)}
              className={`flex min-h-[52px] w-full items-center justify-between gap-3 rounded-btn border-2 px-4 py-2 text-left text-lg font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${cls}`}
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
          <p className={`flex items-start gap-2 rounded-xl px-4 py-3 text-base font-semibold ${ok ? 'bg-success-soft text-success-text' : 'bg-danger-soft text-danger-text'}`}>
            {ok ? <IconCheck size={20} className="mt-0.5 shrink-0" aria-hidden /> : <IconX size={20} className="mt-0.5 shrink-0" aria-hidden />}
            {ok ? t('review.right', { n: dueIn }) : t('review.wrong')}
          </p>
        )}
      </div>
      {answered && !ok && (
        <Footer>
          <Button onClick={() => onAnswered(false)}>{t('common.continue')}</Button>
        </Footer>
      )}
    </div>
  )
}

function Result({ session, onDone }: { session: Session; onDone: () => void }) {
  const { lang, t } = useI18n()
  const { progress, streak } = useWords()
  const [showMistakes, setShowMistakes] = useState(false)
  const s = sessionSummary(session)
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-col items-center gap-2 pt-6 text-center">
        <span className={`flex h-24 w-24 items-center justify-center rounded-full ${progress.met ? 'bg-success text-surface' : 'bg-success-soft text-success-text'}`}>
          <IconCheck size={56} stroke={3} aria-hidden />
        </span>
        <h1 className="text-2xl font-semibold">{progress.met ? t('review.goalDone') : t('review.finished')}</h1>
        <p className="text-base text-ink-2">{t('review.summary', { n: s.reviewed, c: s.correct })}</p>
        <p className="mt-1 flex items-center gap-2 text-lg font-semibold">
          <IconFlameFilled size={26} className={streak.current > 0 ? 'text-accent' : 'text-ink-3'} aria-hidden />
          {t('review.streak', { n: streak.current })}
        </p>
      </div>
      {showMistakes && s.wrongIds.length > 0 && (
        <section aria-labelledby="review-mistakes" className="space-y-2">
          <h2 id="review-mistakes" className="text-lg font-semibold">
            {t('review.mistakesTitle')}
          </h2>
          <div className="rounded-card bg-surface">
            <ul>
              {s.wrongIds.map((id) => {
                const w = wordById(id)
                if (!w) return null
                return (
                  <li key={id} className="border-b border-line px-4 py-3 text-base last:border-0">
                    <span lang="de" className="font-semibold">
                      {w.de}
                    </span>{' '}
                    — <span className="text-ink-2">{w.tr[lang]}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      )}
      <Footer>
        <Button onClick={onDone}>{t('review.done')}</Button>
        {s.wrongIds.length > 0 && !showMistakes && (
          <Button variant="secondary" onClick={() => setShowMistakes(true)}>
            {t('review.showMistakes', { n: s.wrongIds.length })}
          </Button>
        )}
      </Footer>
    </div>
  )
}

export default function ReviewPage() {
  const { t } = useI18n()
  useHistoryAnchor('/til')
  const back = useBack('/til')
  const { due, addDone } = useWords()
  // Sessiya ochilgan paytdagi soʻzlar bilan boshlanadi (javob berilgani roʻyxatdan chiqib ketmasin)
  const [session, setSession] = useState<Session>(() => startSession(due.filter((id) => wordById(id))))
  const finished = sessionDone(session)
  const onAnswered = useCallback(
    (correct: boolean) => {
      const next = sessionAnswer(session, correct)
      setSession(next)
      // Kunlik maqsad +1: sessiya OXIRIGACHA tugadi (natija ekrani ochiladi); X bilan tashlab chiqilgani sanalmaydi
      if (sessionDone(next) && !sessionDone(session)) addDone()
    },
    [session, addDone]
  )

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [session.pos])

  if (session.queue.length === 0) {
    return (
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <h1 className="text-2xl font-semibold">{t('review.empty')}</h1>
        </div>
        <Footer>
          <Button onClick={back}>{t('review.done')}</Button>
        </Footer>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-4 pt-[max(0.5rem,env(safe-area-inset-top))]">
      {finished ? (
        <Result session={session} onDone={back} />
      ) : (
        <>
          <header className="flex items-center gap-3 py-1">
            <button type="button" onClick={back} aria-label={t('review.close')} className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
              <IconX size={24} aria-hidden />
            </button>
            <div className="flex-1">
              <ProgressBar value={(session.pos / session.queue.length) * 100} label={t('review.progress')} />
            </div>
            <span className="min-w-[4rem] text-right text-base font-semibold text-ink-2">
              {session.pos + 1} / {session.queue.length}
            </span>
          </header>
          <div className="flex flex-1 flex-col pt-3" key={session.pos}>
            <Question session={session} onAnswered={onAnswered} />
          </div>
        </>
      )}
    </div>
  )
}
