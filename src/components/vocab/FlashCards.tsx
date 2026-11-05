import { useRef, useState } from 'react'
import { IconChevronDown, IconVolume } from '@tabler/icons-react'
import { wordById } from '../../content/german/words'
import { useI18n } from '../../i18n/I18nProvider'
import { sessionCurrent, type Session } from '../../german/srs'
import { faceText } from '../../german/vocab'
import type { VocabFront } from '../../profile/questions'
import { useFeedback } from '../../ui/useFeedback'
import type { Speech } from '../german/Listen'
import { Footer } from './parts'

/** Nuqtalar: joriy nuqta uzun (marjon). Koʻp boʻlsa (20+) oddiy hisoblagich. */
function Dots({ pos, total }: { pos: number; total: number }) {
  const t = useI18n().t
  if (total > 20) return <span className="text-base font-semibold text-ink-2">{t('vocab.cardCount', { n: pos + 1, total })}</span>
  return (
    <div role="img" aria-label={`${t('vocab.progress')}: ${t('vocab.cardCount', { n: pos + 1, total })}`} className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} aria-hidden className={`h-2 rounded-full ${i === pos ? 'w-5 bg-accent' : i < pos ? 'w-2 bg-success' : 'w-2 bg-surface-2'}`} />
      ))}
    </div>
  )
}

function Label({ children }: { children: string }) {
  return <span className="absolute left-4 top-3 text-[13px] font-medium uppercase tracking-wide opacity-80">{children}</span>
}

/** Bitta kartochka: suzadi, bosilsa 3D aylanadi. Ovoz tugmasi nemischa tomonda va kartochkani AYLANTIRMAYDI. */
function Card({ id, front, speech }: { id: string; front: VocabFront; speech: Speech }) {
  const { lang, t } = useI18n()
  const [flipped, setFlipped] = useState(false)
  const w = wordById(id)!
  const back: VocabFront = front === 'de' ? 'tr' : 'de'
  const face = (side: VocabFront, hidden: boolean, cls: string) => (
    <div aria-hidden={hidden || undefined} className={`card-face absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[20px] px-5 text-center text-vink ${cls}`}>
      <Label>{t(`vocab.front.${side}`)}</Label>
      <p lang={side === 'de' ? 'de' : undefined} className="break-words text-[30px] font-bold leading-tight">
        {faceText(w, side, lang)}
      </p>
      {side === 'de' && speech.canSpeak() && (
        <button
          type="button"
          tabIndex={hidden ? -1 : undefined}
          onClick={(e) => {
            e.stopPropagation()
            speech.speak(w.de)
          }}
          aria-label={t('german.listenWord', { de: w.de })}
          aria-pressed={speech.speaking}
          className={`flex h-12 w-12 items-center justify-center rounded-full text-vbtn-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vink ${speech.speaking ? 'bg-vbtn-on' : 'bg-vbtn'}`}
        >
          <IconVolume size={26} aria-hidden />
        </button>
      )}
    </div>
  )
  const flip = () => setFlipped((f) => !f)
  return (
    <div className="flex flex-col items-center py-4">
      <div className="card-float h-[230px] w-[300px] max-w-full">
        <div className="card-persp h-full w-full">
          <div
            role="button"
            tabIndex={0}
            aria-label={t('vocab.flip')}
            aria-pressed={flipped}
            data-testid="vocab-card"
            data-flipped={flipped}
            onClick={flip}
            onKeyDown={(e) => {
              if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                flip()
              }
            }}
            className="card-flip relative h-full w-full cursor-pointer rounded-[20px] shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            {face(front, flipped, 'bg-vf border border-vedge')}
            {face(back, !flipped, 'card-back bg-vb border border-vedge')}
          </div>
        </div>
      </div>
      <div className="card-shadow mt-3 h-3 w-[220px] max-w-[70%] rounded-[50%] bg-ink/25 blur-[6px]" aria-hidden />
    </div>
  )
}

/** Kartochka rejimi: "Bilmadim" soʻz oxirida yana bir marta chiqadi; keyingi kartochka old tomondan ochiladi. */
export function FlashCards({ session, front, speech, onAnswer, onOpenSettings }: { session: Session; front: VocabFront; speech: Speech; onAnswer: (known: boolean) => void; onOpenSettings: () => void }) {
  const t = useI18n().t
  const fx = useFeedback()
  const holder = useRef<HTMLDivElement>(null)
  const id = sessionCurrent(session)
  if (!id) return null
  const answer = (known: boolean) => {
    // Bildim: ovoz + zarra; Bilmadim: faqat xato ovozi (silkinishsiz)
    if (known) fx.right(holder.current?.querySelector('[data-testid="vocab-card"]'))
    else fx.wrong()
    onAnswer(known)
  }
  return (
    <div className="flex flex-1 flex-col gap-2 pt-4">
      <div className="flex items-center justify-between gap-3">
        <Dots pos={session.pos} total={session.queue.length} />
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex min-h-[44px] items-center gap-1 rounded-full bg-trust-soft px-3 text-base font-semibold text-trust-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {t('vocab.frontChip', { side: t(`vocab.front.${front}`) })}
          <IconChevronDown size={18} aria-hidden />
        </button>
      </div>
      <div ref={holder} className="flex flex-1 flex-col justify-center" key={`${session.pos}-${id}`}>
        <Card id={id} front={front} speech={speech} />
      </div>
      <Footer>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => answer(false)}
            className="flex min-h-[52px] flex-1 items-center justify-center rounded-xl bg-danger-soft px-3 text-base font-semibold text-danger-text active:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
          >
            {t('vocab.unknown')}
          </button>
          <button
            type="button"
            onClick={() => answer(true)}
            className="flex min-h-[52px] flex-1 items-center justify-center rounded-xl bg-success-soft px-3 text-base font-semibold text-success-text active:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-success"
          >
            {t('vocab.known')}
          </button>
        </div>
      </Footer>
    </div>
  )
}
