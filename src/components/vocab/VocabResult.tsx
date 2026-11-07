import { IconCheck } from '@tabler/icons-react'
import { wordById } from '../../content/german/words'
import { useI18n } from '../../i18n/I18nProvider'
import type { Session } from '../../german/srs'
import { vocabSummary } from '../../german/vocab'
import { Footer, navyBtn } from './parts'

/** Natija (Kartochka va Test uchun umumiy). Lugʻat mashqi SRS jadvaliga tegmaydi. */
export function VocabResult({ session, counted, speak, onDone, onRetry }: { session: Session; counted: boolean; speak?: { total: number; practiced: number }; onDone: () => void; onRetry: () => void }) {
  const { lang, t } = useI18n()
  const s = vocabSummary(session)
  return (
    <div className="flex flex-1 flex-col gap-4 pt-4">
      <div className="flex flex-col items-center gap-2 pt-2 text-center">
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-success text-surface">
          <IconCheck size={56} stroke={3} aria-hidden />
        </span>
        <h2 className="text-2xl font-semibold">{t('vocab.done')}</h2>
        <p className="text-base text-ink-2">{speak ? (speak.practiced === 0 ? t('vocab.summarySpeakNone') : t('vocab.summarySpeak', { n: speak.total, m: speak.practiced })) : t('vocab.summary', { n: s.total, m: s.known })}</p>
        {counted && (
          <p role="status" className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1.5 text-base font-semibold text-success-text">
            <IconCheck size={18} aria-hidden />
            {t('vocab.goalPlus')}
          </p>
        )}
      </div>
      {s.wrongIds.length > 0 && (
        <section aria-labelledby="vocab-unknown" className="space-y-2">
          <h2 id="vocab-unknown" className="text-lg font-semibold">
            {t('vocab.unknownTitle')}
          </h2>
          <ul className="overflow-hidden rounded-card bg-surface">
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
        </section>
      )}
      <Footer>
        <button type="button" onClick={onDone} className={navyBtn}>
          {t('vocab.ready')}
        </button>
        {s.wrongIds.length > 0 && (
          <button
            type="button"
            onClick={onRetry}
            className="flex min-h-[52px] w-full items-center justify-center rounded-btn border-2 border-head bg-surface px-4 py-3 text-base font-semibold text-trust-text active:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {t('vocab.retry')}
          </button>
        )}
      </Footer>
    </div>
  )
}
