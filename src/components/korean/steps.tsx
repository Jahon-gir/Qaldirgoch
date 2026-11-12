import { useMemo, useRef, useState, type ReactNode } from 'react'
import { IconBackspace, IconCheck, IconVolume, IconX } from '@tabler/icons-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { useI18n } from '../../i18n/I18nProvider'
import { useFeedback } from '../../ui/useFeedback'
import type { LetterExercise, SyllableExercise } from '../../content/german'
import { seededShuffle, syllableOutcome, wordOutcome, type Outcome } from '../../german/logic'
import { compose, isVowel } from '../../korean/hangul'
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
  // 1–2 belgili kartalar: 1–2 ustun; 3 va undan koʻp: 3 ustun (qatorlar); 2 dan uzun yozuv ("한국어", "감사합니다") — 1 ustun
  const long = ex.letters.some((l) => [...l.char].length > 2)
  const cols = long || ex.letters.length === 1 ? 'grid-cols-1' : ex.letters.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
  return (
    <div className="flex flex-1 flex-col gap-4">
      <p className="text-base text-ink-2">{t(ex.letters.length > 1 ? 'letter.many' : 'letter.one')}</p>
      <ul className={`grid gap-2 ${cols}`}>
        {ex.letters.map((l) => (
          <li key={l.char} className="flex flex-col items-center gap-1 rounded-card bg-surface px-2 py-3 text-center" data-testid="letter-card">
            <span lang="ko" className={`font-bold leading-none ${[...l.char].length <= 2 ? 'text-[64px]' : [...l.char].length <= 4 ? 'text-5xl' : 'text-4xl'}`}>
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
/** Tugma: id har tugmaga noyob (pastki harf bosh harf bilan bir xil boʻlishi mumkin: 밥 = ㅂ + ㅏ + ㅂ). text '' — "Yoʻq". */
type SylTile = { id: string; text: string }
const NONE = 'none'

const tileCls =
  'flex h-14 min-w-[56px] items-center justify-center rounded-xl border border-vedge bg-vf px-3 text-3xl font-bold text-vink active:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-30'

/**
 * Undosh + unli (+ pastki harf) katakchalari; har tanlovda blok jonli yigʻiladi (ㄴ + ㅏ = 나, ㅂ + ㅏ + ㅂ = 밥).
 * Unli tugmasi unli katagiga tushadi (murakkab unli — bitta tugma); undosh — avval bosh katakka, u toʻla boʻlsa pastki katakka.
 * Aniq katakni tanlash uchun boʻsh katakni bosing. Toʻla katak bosilsa boʻshaydi. Pastki katak "Yoʻq" ham boʻla oladi.
 */
export function SyllableStep({ ex, onDone }: { ex: SyllableExercise; onDone: (o: Outcome) => void }) {
  const { lang, t } = useI18n()
  const fx = useFeedback()
  const box = useRef<HTMLDivElement>(null)
  const target = compose(ex.initial, ex.vowel, ex.final) ?? ''
  const hasFinalSlot = !!ex.final || !!ex.showFinal
  const tiles = useMemo<SylTile[]>(() => {
    const list: SylTile[] = [{ id: 'i', text: ex.initial }, { id: 'v', text: ex.vowel }]
    if (ex.final) list.push({ id: 'f', text: ex.final })
    ex.distractors.forEach((d, k) => list.push({ id: `d${k}`, text: d }))
    if (ex.showFinal && !ex.final) list.push({ id: NONE, text: '' })
    return seededShuffle(list, ex.id)
  }, [ex])
  const [filled, setFilled] = useState<Partial<Record<Slot, SylTile>>>({})
  const [aim, setAim] = useState<Slot | null>(null) // bosilgan boʻsh katak: keyingi undosh shu yerga tushadi
  const [result, setResult] = useState<boolean | null>(null)
  const done = result !== null
  const slots: Slot[] = hasFinalSlot ? ['initial', 'vowel', 'final'] : ['initial', 'vowel']
  const label: Record<Slot, string> = { initial: t('syl.initial'), vowel: t('syl.vowel'), final: t('syl.final') }
  const complete = slots.every((s) => filled[s])
  const finalText = filled.final?.text || undefined
  const built = filled.initial && filled.vowel ? compose(filled.initial.text, filled.vowel.text, finalText) : null
  const preview = built ?? (filled.initial?.text || filled.vowel?.text || '')
  // 3 katakda (pastki harf bilan) katakchalar kichikroq: 360 px da chetga tegmasin
  const box3 = slots.length === 3
  const slotSize = box3 ? 'h-14 w-14 text-2xl' : 'h-16 w-16 text-3xl'
  const used = new Set(Object.values(filled).flatMap((x) => (x ? [x.id] : []))) // boʻshatilgan katak undefined boʻladi
  const shown = (s: Slot) => (filled[s] ? filled[s]!.text || '—' : '')
  const spoken = (s: Slot) => (filled[s] ? filled[s]!.text || t('syl.noneA11y') : t('syl.empty'))

  const put = (tile: SylTile) => {
    if (done || used.has(tile.id)) return
    let slot: Slot
    if (tile.id === NONE) slot = 'final'
    else if (isVowel(tile.text)) slot = 'vowel'
    else if (aim && aim !== 'vowel' && slots.includes(aim)) slot = aim
    else if (!filled.initial) slot = 'initial'
    else slot = hasFinalSlot ? 'final' : 'initial'
    setFilled({ ...filled, [slot]: tile })
    setAim(null)
  }
  const tap = (s: Slot) => {
    if (done) return
    if (filled[s]) setFilled({ ...filled, [s]: undefined })
    else if (s !== 'vowel') setAim(aim === s ? null : s)
  }
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

      <div ref={box} className={`flex items-center justify-center ${box3 ? 'gap-1' : 'gap-2'} ${result === false ? 'fx-shake' : result ? 'fx-pop' : ''}`}>
        {slots.map((s, i) => (
          <span key={s} className={`flex items-center ${box3 ? 'gap-1' : 'gap-2'}`}>
            {i > 0 && (
              <span aria-hidden className="text-2xl font-bold text-ink-3">
                +
              </span>
            )}
            <button
              type="button"
              lang="ko"
              disabled={done || (!filled[s] && s === 'vowel')}
              onClick={() => tap(s)}
              aria-label={t('syl.slot', { part: label[s], v: spoken(s) })}
              aria-pressed={aim === s || undefined}
              className={`flex ${slotSize} flex-col items-center justify-center rounded-xl border-2 font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                filled[s] ? 'border-head bg-surface text-ink' : aim === s ? 'border-solid border-accent bg-surface text-ink-3' : 'border-dashed border-ink-3 bg-surface-2 text-ink-3'
              }`}
            >
              {shown(s)}
            </button>
          </span>
        ))}
        <span aria-hidden className="text-2xl font-bold text-ink-3">
          =
        </span>
        <span
          lang="ko"
          data-testid="syllable-preview"
          className={`flex ${box3 ? 'h-14 min-w-[56px] text-3xl' : 'h-16 min-w-[64px] text-4xl'} items-center justify-center rounded-xl border-2 px-2 font-bold ${
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
            {tiles.map((c) =>
              c.id === NONE ? (
                <button key={c.id} type="button" onClick={() => put(c)} disabled={used.has(c.id)} aria-label={t('syl.noFinal')} className={`${tileCls} text-xl`}>
                  {t('syl.none')}
                </button>
              ) : (
                <button key={c.id} type="button" lang="ko" onClick={() => put(c)} disabled={used.has(c.id)} className={tileCls}>
                  {c.text}
                </button>
              )
            )}
          </div>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => {
                setFilled({})
                setAim(null)
              }}
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
