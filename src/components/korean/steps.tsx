import { useMemo, useRef, useState, type ReactNode } from 'react'
import { IconBackspace, IconCheck, IconVolume, IconX } from '@tabler/icons-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { useI18n } from '../../i18n/I18nProvider'
import { useFeedback } from '../../ui/useFeedback'
import type { LetterExercise, SyllableExercise } from '../../content/german'
import { seededShuffle, syllableOutcome, wordOutcome, type Outcome } from '../../german/logic'
import { compose, isInitial, isVowel } from '../../korean/hangul'
import { ListenIcon, NoVoice, type Speech } from '../german/Listen'
import { HangulText } from './HangulText'

/** Koreys darslari: harf kartochkasi va boʻgʻin yigʻish. Koreyscha matn doim lang="ko" ichida (CSS :lang(ko) shrifti). */

function Footer({ children }: { children: ReactNode }) {
  return <div className="sticky bottom-0 -mx-4 mt-auto bg-bg px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">{children}</div>
}

/* ---------- Yangi harf(lar) ---------- */

export function LetterStep({ ex, speech, onDone }: { ex: LetterExercise; speech: Speech; onDone: (o: Outcome) => void }) {
  const { lang, t } = useI18n()
  const voice = speech.canSpeak()
  return (
    <div className="flex flex-1 flex-col gap-4">
      <p className="text-base text-ink-2">{t(ex.letters.length > 1 ? 'letter.many' : 'letter.one')}</p>
      <ul className={`grid gap-2 ${ex.letters.length === 3 ? 'grid-cols-3' : ex.letters.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {ex.letters.map((l) => (
          <li key={l.char} className="flex flex-col items-center gap-1 rounded-card bg-surface px-2 py-3 text-center" data-testid="letter-card">
            <span lang="ko" className="text-[64px] font-bold leading-none">
              {l.char}
            </span>
            <span className="text-lg font-semibold text-accent-strong">{l.sound}</span>
            {voice && (
              <button
                type="button"
                onClick={() => speech.speak(l.char, { slow: true })}
                aria-label={t('letter.listen', { c: l.sound })}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent-strong active:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <IconVolume size={22} aria-hidden />
              </button>
            )}
          </li>
        ))}
      </ul>
      <p className="text-base">
        <HangulText text={ex.note[lang]} />
      </p>
      {!voice && <NoVoice />}
      {ex.example && (
        <Card className="flex items-center gap-3">
          <span className="flex-1">
            <span className="block text-base text-ink-2">{t('letter.example')}</span>
            <span lang="ko" className="block text-2xl font-bold">
              {ex.example.term}
            </span>
            <span className="block text-base text-ink-2">
              {ex.example.pron[lang]} · {ex.example.tr[lang]}
            </span>
          </span>
          <ListenIcon speech={speech} text={ex.example.term} />
        </Card>
      )}
      <Footer>
        <Button onClick={() => onDone(wordOutcome())}>{t('common.next')}</Button>
      </Footer>
    </div>
  )
}

/* ---------- Boʻgʻin yigʻish ---------- */

type Slot = 'initial' | 'vowel' | 'final'

const tileCls =
  'flex h-14 min-w-[56px] items-center justify-center rounded-xl border border-vedge bg-vf px-3 text-3xl font-bold text-vink active:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-30'

/**
 * Undosh + unli (+ ostki harf) katakchalari; har tanlovda blok jonli yigʻiladi (ㄴ + ㅏ = 나).
 * Undosh tugmasi undosh katagiga, unli — unli katagiga tushadi; toʻla katak bosilsa boʻshaydi.
 */
export function SyllableStep({ ex, onDone }: { ex: SyllableExercise; onDone: (o: Outcome) => void }) {
  const { lang, t } = useI18n()
  const fx = useFeedback()
  const box = useRef<HTMLDivElement>(null)
  const target = compose(ex.initial, ex.vowel, ex.final) ?? ''
  const tiles = useMemo(() => seededShuffle([ex.initial, ex.vowel, ...(ex.final ? [ex.final] : []), ...ex.distractors], ex.id), [ex])
  const [filled, setFilled] = useState<Partial<Record<Slot, string>>>({})
  const [result, setResult] = useState<boolean | null>(null)
  const done = result !== null
  const slots: Slot[] = ex.final ? ['initial', 'vowel', 'final'] : ['initial', 'vowel']
  const label: Record<Slot, string> = { initial: t('syl.initial'), vowel: t('syl.vowel'), final: t('syl.final') }
  const complete = slots.every((s) => filled[s])
  const built = filled.initial && filled.vowel ? compose(filled.initial, filled.vowel, filled.final) : null
  const preview = built ?? (filled.initial || filled.vowel || '')

  const put = (c: string) => {
    if (done) return
    // Undosh — avval bosh katak, u toʻla boʻlsa (va ostki harf kutilsa) — ostki katak
    const slot: Slot | null = isVowel(c) ? 'vowel' : isInitial(c) ? (filled.initial && ex.final ? 'final' : 'initial') : null
    if (slot) setFilled({ ...filled, [slot]: c })
  }
  const clear = (s: Slot) => !done && setFilled({ ...filled, [s]: undefined })
  const check = () => {
    if (!complete || done) return
    const ok = built === target
    setResult(ok)
    if (ok) fx.right(box.current)
    else fx.wrong()
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="rounded-2xl border border-head-line bg-head px-5 py-4 text-center text-white">
        <p className="text-base text-white/90">{t('syl.title')}</p>
        <p className="mt-1 text-2xl font-bold">«{ex.pron[lang]}»</p>
      </div>

      <div ref={box} className={`flex items-center justify-center gap-2 ${result === false ? 'fx-shake' : result ? 'fx-pop' : ''}`}>
        {slots.map((s, i) => (
          <span key={s} className="flex items-center gap-2">
            {i > 0 && (
              <span aria-hidden className="text-2xl font-bold text-ink-3">
                +
              </span>
            )}
            <button
              type="button"
              lang="ko"
              disabled={done || !filled[s]}
              onClick={() => clear(s)}
              aria-label={t('syl.slot', { part: label[s], v: filled[s] ?? t('syl.empty') })}
              className={`flex h-16 w-16 flex-col items-center justify-center rounded-xl border-2 text-3xl font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                filled[s] ? 'border-head bg-surface text-ink' : 'border-dashed border-ink-3 bg-surface-2 text-ink-3'
              }`}
            >
              {filled[s] ?? ''}
            </button>
          </span>
        ))}
        <span aria-hidden className="text-2xl font-bold text-ink-3">
          =
        </span>
        <span
          lang="ko"
          data-testid="syllable-preview"
          className={`flex h-16 min-w-[64px] items-center justify-center rounded-xl border-2 px-2 text-4xl font-bold ${
            result === null ? 'border-line bg-surface' : result ? 'border-success bg-success-soft text-success-text' : 'border-danger bg-danger-soft text-danger-text'
          }`}
        >
          {preview}
        </span>
      </div>
      <p className="sr-only" aria-live="polite">
        {built ? t('syl.result', { s: built }) : ''}
      </p>

      {done ? (
        <p role="status" className={`flex items-start gap-2 rounded-xl px-4 py-3 text-base font-semibold ${result ? 'bg-success-soft text-success-text' : 'bg-danger-soft text-danger-text'}`}>
          {result ? <IconCheck size={20} className="mt-0.5 shrink-0" aria-hidden /> : <IconX size={20} className="mt-0.5 shrink-0" aria-hidden />}
          <span>
            {result ? t('syl.right') : t('syl.wrong')}{' '}
            <span lang="ko">{target}</span> «{ex.pron[lang]}»
          </span>
        </p>
      ) : (
        <>
          <div className="flex flex-wrap justify-center gap-2" role="group" aria-label={t('syl.letters')}>
            {tiles.map((c) => (
              <button key={c} type="button" lang="ko" onClick={() => put(c)} disabled={Object.values(filled).includes(c)} className={tileCls}>
                {c}
              </button>
            ))}
          </div>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setFilled({})}
              disabled={!Object.values(filled).some(Boolean)}
              className="flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-line bg-surface px-4 text-base font-semibold text-ink active:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40"
            >
              <IconBackspace size={20} aria-hidden />
              {t('syl.clear')}
            </button>
          </div>
        </>
      )}

      <Footer>
        {done ? (
          <Button onClick={() => onDone(syllableOutcome(ex, target, !!result))}>{t('common.continue')}</Button>
        ) : (
          <Button disabled={!complete} onClick={check}>
            {t('ex.check')}
          </Button>
        )}
      </Footer>
    </div>
  )
}
