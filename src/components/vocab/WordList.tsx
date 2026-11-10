import { useState } from 'react'
import { IconHandClick, IconVolume } from '@tabler/icons-react'
import type { VocabWord } from '../../content/german/words'
import { useI18n } from '../../i18n/I18nProvider'
import type { VocabFront } from '../../profile/questions'
import type { Speech } from '../german/Listen'
import { DeWord } from './ex/common'
import { useCourse } from '../../lang/CourseContext'

/** Ovoz tugmasi: koʻrinishi 40px doira, bosish maydoni 44px. Har doim nemischani oʻqiydi. */
export function SpeakDot({ speech, de }: { speech: Speech; de: string }) {
  const t = useI18n().t
  if (!speech.canSpeak()) return null
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        speech.speak(de)
      }}
      aria-label={t('german.listenWord', { de })}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-trust-soft text-trust-text">
        <IconVolume size={22} aria-hidden />
      </span>
    </button>
  )
}

/** Roʻyxat: qator bosilsa tarjima ochiladi/yopiladi; ovoz tugmasi faqat oʻqiydi. */
export function WordList({ words, front, speech }: { words: VocabWord[]; front: VocabFront; speech: Speech }) {
  const { lang, t } = useI18n()
  const course = useCourse()
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set())
  const allOpen = words.length > 0 && words.every((w) => open.has(w.id))
  const toggle = (id: string) =>
    setOpen((s) => {
      const n = new Set(s)
      if (!n.delete(id)) n.add(id)
      return n
    })
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-base text-ink-2">{t('vocab.listHint')}</p>
        <button
          type="button"
          aria-pressed={allOpen}
          onClick={() => setOpen(allOpen ? new Set() : new Set(words.map((w) => w.id)))}
          className={`min-h-[44px] shrink-0 rounded-full border-2 px-4 text-base font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${allOpen ? 'border-head bg-trust-soft text-trust-text' : 'border-line bg-surface text-ink'}`}
        >
          {t('vocab.all')}
        </button>
      </div>
      <ul className="overflow-hidden rounded-card bg-surface">
        {words.map((w) => {
          const shown = open.has(w.id)
          const main = front === 'target' ? <DeWord de={w.term} /> : w.tr[lang]
          const other = front === 'target' ? w.tr[lang] : <DeWord de={w.term} />
          return (
            <li key={w.id} className="flex items-center border-b border-line last:border-0">
              <button
                type="button"
                aria-expanded={shown}
                onClick={() => toggle(w.id)}
                className="flex min-h-[64px] min-w-0 flex-1 flex-col justify-center px-4 py-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
              >
                <span lang={front === 'target' ? course.id : undefined} className="break-words text-lg font-semibold">
                  {main}
                </span>
                {course.features.pron && front === 'target' && <span className="text-base text-ink-2">{w.pron[lang]}</span>}
                {shown ? (
                  <span lang={front === 'target' ? undefined : course.id} className="break-words text-base text-ink-2">
                    {other}
                    {course.features.pron && front !== 'target' && <span className="block">{w.pron[lang]}</span>}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-base text-ink-3">
                    <IconHandClick size={18} aria-hidden />
                    {t('vocab.tapShow')}
                    <span className="sr-only">{t('vocab.hidden')}</span>
                  </span>
                )}
              </button>
              <div className="pr-2">
                <SpeakDot speech={speech} de={w.term} />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
