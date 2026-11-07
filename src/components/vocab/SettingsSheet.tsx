import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { IconArrowsShuffle, IconCards, IconEar, IconKeyboard, IconList, IconListCheck, IconMicrophone, IconPuzzle, IconTag, type Icon } from '@tabler/icons-react'
import { useI18n } from '../../i18n/I18nProvider'
import { VOCAB_MODES, type VocabMode } from '../../profile/questions'
import { reducedMotion } from '../../ui/feedback'

const ICONS: Record<VocabMode, Icon> = { list: IconList, cards: IconCards, test: IconListCheck, build: IconPuzzle, listen: IconEar, write: IconKeyboard, article: IconTag, speak: IconMicrophone, mixed: IconArrowsShuffle }

/** Tanlovdan keyin oyna yopilguncha kutish va yopilish animatsiyasi (ms). */
export const PICK_DELAY_MS = 180
export const CLOSE_MS = 300
const STAGGER_MS = 45

/**
 * Mashq usuli oynasi (pastdan). Plitka bosilishi bilan tanlov saqlanadi va ekran shu usulga oʻtadi (onPick);
 * ripple, ~180 ms dan keyin oyna pastga sirpanib yopiladi. Fon bosilsa — tanlovsiz yopiladi.
 */
export function SettingsSheet({ mode, hasNouns = true, canListen = true, canSpeakMic = true, onPick, onClose }: { mode: VocabMode; hasNouns?: boolean; canListen?: boolean; canSpeakMic?: boolean; onPick: (m: VocabMode) => void; onClose: () => void }) {
  const t = useI18n().t
  const ref = useRef<HTMLDivElement>(null)
  const [closing, setClosing] = useState(false)
  const [ripple, setRipple] = useState<{ mode: VocabMode; x: number; y: number; size: number; n: number } | null>(null)
  const timers = useRef<number[]>([])
  const still = reducedMotion()
  useEffect(() => {
    ref.current?.focus()
    const all = timers.current
    return () => all.forEach((id) => window.clearTimeout(id))
  }, [])

  const close = (delay: number) => {
    if (closing) return
    if (still) return onClose()
    timers.current.push(
      window.setTimeout(() => {
        setClosing(true)
        timers.current.push(window.setTimeout(onClose, CLOSE_MS))
      }, delay)
    )
  }
  const pick = (m: VocabMode, e: MouseEvent<HTMLButtonElement>) => {
    if (closing) return
    onPick(m) // saqlanadi va ekran darhol shu usulga oʻtadi
    if (!still) {
      const r = e.currentTarget.getBoundingClientRect()
      setRipple({ mode: m, x: e.clientX - r.left, y: e.clientY - r.top, size: Math.max(r.width, r.height) * 2.4, n: Date.now() })
    }
    close(PICK_DELAY_MS)
  }
  const modes = VOCAB_MODES.filter((m) => (m !== 'article' || hasNouns) && (m !== 'speak' || canSpeakMic))
  return (
    <div
      className={`fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center ${closing ? 'dim-out' : 'dim-in'}`}
      onClick={() => close(0)}
      onKeyDown={(e) => e.key === 'Escape' && close(0)}
    >
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t('vocab.settings')}
        onClick={(e) => e.stopPropagation()}
        className={`max-h-[90vh] w-full max-w-md space-y-3 overflow-y-auto rounded-t-[20px] bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-lg outline-none sm:rounded-[20px] ${closing ? 'sheet-down' : 'sheet-up'}`}
      >
        <div className="mx-auto h-1 w-10 rounded-full bg-line" aria-hidden />
        <h2 id="vs-method" className="text-lg font-semibold">
          {t('vocab.method')}
        </h2>
        <div role="radiogroup" aria-labelledby="vs-method" className="grid grid-cols-2 gap-[10px]">
          {modes.map((m, i) => {
            const Ic = ICONS[m]
            const on = mode === m
            // Ovoz yoʻq: tinglash xira, izoh bilan (tanlab boʻlmaydi)
            const off = m === 'listen' && !canListen
            return (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={on}
                aria-disabled={off || undefined}
                aria-describedby={off ? 'vs-novoice' : undefined}
                onClick={(e) => !off && pick(m, e)}
                style={{ animationDelay: `${i * STAGGER_MS}ms` }}
                className={`sheet-tile relative flex min-h-[72px] flex-col items-start justify-between gap-2 overflow-hidden rounded-[14px] p-3 text-left transition-transform active:scale-[0.96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  off ? 'bg-surface-2 text-ink-3 opacity-60' : on ? 'bg-sel text-sel-ink' : 'bg-vf text-vink'
                }`}
              >
                {ripple?.mode === m && (
                  <span
                    key={ripple.n}
                    aria-hidden
                    className="ripple pointer-events-none absolute rounded-full bg-current"
                    style={{ left: ripple.x, top: ripple.y, width: ripple.size, height: ripple.size }}
                  />
                )}
                <Ic size={24} aria-hidden />
                <span className="text-[14px] font-medium leading-tight">{t(`vocab.mode.${m}`)}</span>
                {off && (
                  <span id="vs-novoice" className="text-[13px] leading-tight">
                    {t('vocab.noVoice')}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
