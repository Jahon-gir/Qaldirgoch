import { Link } from 'react-router-dom'
import { IconCheck, IconChevronRight, IconLock } from '@tabler/icons-react'
import { Footer, navyBtn, VocabHeader } from '../../components/vocab/parts'
import { useI18n } from '../../i18n/I18nProvider'
import { useBack, useHistoryAnchor } from '../../lib/useHistoryAnchor'
import { useDirection } from '../../german/useDirection'
import { useLessons } from '../../german/LessonsProvider'
import { MIXED, unlockedWords, vocabGroups } from '../../german/vocab'

/** Lugʻat: modul → darslar. Dars oxirigacha tugatilgan boʻlsa ochiq (user_lessons), aks holda qulf. */
export default function VocabPage() {
  const { lang, t } = useI18n()
  useHistoryAnchor('/til')
  const back = useBack('/til')
  const { direction } = useDirection()
  const { results } = useLessons()
  const groups = vocabGroups(direction, results)
  const opened = unlockedWords(groups)
  const levels = [...new Set(groups.map((g) => g.module.level))].join(', ')
  const first = groups[0]?.lessons[0]?.lesson
  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col">
      <VocabHeader title={t('vocab.title')} sub={t('vocab.sub', { level: levels || 'A1', n: opened.length })} onBack={back} />
      <div className="flex flex-1 flex-col gap-4 px-4 pt-4">
        {groups.map((g) => (
          <section key={g.module.id} aria-labelledby={`vg-${g.module.id}`} className="space-y-2">
            <h2 id={`vg-${g.module.id}`} className="px-1 text-lg font-semibold">
              {g.module.title[lang]}
            </h2>
            <ul className="space-y-2">
              {g.lessons.map(({ lesson, words, unlocked }) => {
                const title = t('vocab.lessonTitle', { n: lesson.order, title: lesson.title[lang] })
                return (
                  <li key={lesson.id}>
                    {unlocked ? (
                      <Link to={`/til/lugat/${lesson.id}`} className="flex min-h-[64px] items-center gap-3 rounded-card bg-surface p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                        <span className="flex-1">
                          <span className="block text-base font-semibold">{title}</span>
                          <span className="block text-base text-ink-2">{t('vocab.words', { n: words.length })}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-[13px] font-semibold text-success-text">
                          <IconCheck size={14} stroke={3} aria-hidden />
                          {t('vocab.open')}
                        </span>
                        <IconChevronRight size={20} className="shrink-0 text-ink-3" aria-hidden />
                      </Link>
                    ) : (
                      <div aria-disabled="true" className="flex min-h-[64px] items-center gap-3 rounded-card bg-surface-2 p-3 text-ink-2">
                        <span className="flex-1">
                          <span className="block text-base font-semibold">{title}</span>
                          <span className="block text-base">{t('vocab.locked')}</span>
                        </span>
                        <IconLock size={22} className="shrink-0" aria-label={t('vocab.lockedA11y')} />
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
        <Footer>
          {opened.length > 0 ? (
            <Link to={`/til/lugat/${MIXED}`} className={navyBtn}>
              {t('vocab.mixedBtn')}
            </Link>
          ) : (
            <div className="space-y-2 text-center">
              <p className="text-base text-ink-2">{t('vocab.finishFirst')}</p>
              {first && (
                <Link to={`/til/dars/${first.id}`} className={navyBtn}>
                  {t('vocab.finishFirstLink')}
                </Link>
              )}
            </div>
          )}
        </Footer>
      </div>
    </div>
  )
}
