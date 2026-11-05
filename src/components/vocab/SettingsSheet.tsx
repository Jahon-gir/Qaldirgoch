import { useEffect, useRef } from 'react'
import { useI18n } from '../../i18n/I18nProvider'
import { VOCAB_FRONTS, VOCAB_MODES, type VocabFront, type VocabMode } from '../../profile/questions'
import { navyBtn } from './parts'

const opt = (on: boolean) =>
  `flex min-h-[48px] flex-1 items-center justify-center rounded-btn border-2 px-2 py-2 text-center text-base font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
    on ? 'border-head bg-trust-soft text-trust-text' : 'border-line bg-surface text-ink active:bg-surface-2'
  }`

/** Pastdan oyna: mashq usuli va old tomoni. Tanlov darhol saqlanadi (profilda). */
export function SettingsSheet({ mode, front, onChange, onClose }: { mode: VocabMode; front: VocabFront; onChange: (p: { mode?: VocabMode; front?: VocabFront }) => void; onClose: () => void }) {
  const t = useI18n().t
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [])
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t('vocab.settings')}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-t-[20px] bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-lg outline-none sm:rounded-[20px]"
      >
        <div className="mx-auto h-1.5 w-10 rounded-full bg-line" aria-hidden />
        <section className="space-y-2">
          <h2 id="vs-method" className="text-base font-semibold">
            {t('vocab.method')}
          </h2>
          <div role="radiogroup" aria-labelledby="vs-method" className="flex gap-2">
            {VOCAB_MODES.map((m) => (
              <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => onChange({ mode: m })} className={opt(mode === m)}>
                {t(`vocab.mode.${m}`)}
              </button>
            ))}
          </div>
        </section>
        <section className="space-y-2">
          <h2 id="vs-front" className="text-base font-semibold">
            {t('vocab.frontTitle')}
          </h2>
          <div role="radiogroup" aria-labelledby="vs-front" className="flex gap-2">
            {VOCAB_FRONTS.map((f) => (
              <button key={f} type="button" role="radio" aria-checked={front === f} onClick={() => onChange({ front: f })} className={opt(front === f)}>
                {t(`vocab.front.${f}`)}
              </button>
            ))}
          </div>
        </section>
        <button type="button" onClick={onClose} className={navyBtn}>
          {t('vocab.sheetDone')}
        </button>
      </div>
    </div>
  )
}
