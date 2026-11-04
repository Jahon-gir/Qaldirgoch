import { IconVolume, IconVolume2 } from '@tabler/icons-react'
import { useT } from '../../i18n/I18nProvider'
import type { useSpeech } from '../../german/useSpeech'

export type Speech = ReturnType<typeof useSpeech>

/** Ovoz yoʻq boʻlsa — tugma oʻrnida sokin yozuv (xato emas, ekran buzilmaydi). */
export function NoVoice() {
  const t = useT()
  return (
    <p role="note" className="rounded-xl bg-surface-2 px-3 py-3 text-center text-base text-ink-2">
      {t('german.noVoice')}
    </p>
  )
}

/** "Tinglash" (marjon) va "Sekin" tugmalari. */
export function ListenButtons({ speech, text, audioUrl }: { speech: Speech; text: string; audioUrl?: string }) {
  const t = useT()
  if (!speech.canSpeak(audioUrl)) return <NoVoice />
  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => speech.speak(text, { audioUrl })}
        className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-btn bg-accent px-4 text-base font-semibold text-on-accent active:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <IconVolume size={22} aria-hidden />
        {t('german.listen')}
      </button>
      <button
        type="button"
        onClick={() => speech.speak(text, { audioUrl, slow: true })}
        className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-btn border-2 border-accent bg-surface px-4 text-base font-semibold text-accent-strong active:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <IconVolume2 size={22} aria-hidden />
        {t('german.slow')}
      </button>
    </div>
  )
}

/** Natija ekranidagi kichik tinglash tugmasi (44×44). Ovoz yoʻq boʻlsa koʻrsatilmaydi. */
export function ListenIcon({ speech, text }: { speech: Speech; text: string }) {
  const t = useT()
  if (!speech.canSpeak()) return null
  return (
    <button
      type="button"
      onClick={() => speech.speak(text)}
      aria-label={t('german.listenWord', { de: text })}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong active:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <IconVolume size={22} aria-hidden />
    </button>
  )
}
