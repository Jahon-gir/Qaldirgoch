import { IconCheck } from '@tabler/icons-react'
import { useI18n } from '../../i18n/I18nProvider'
import { addDays } from '../../german/srs'
import { lessonWords } from '../../german/vocab'
import { useWords } from '../../german/WordsProvider'
import { useCourse } from '../../lang/CourseContext'
import { ListenIcon } from '../german/Listen'
import type { Speech } from '../german/Listen'
import { Card } from '../ui/Card'

const SHOWN = 3

/** Dars natijasida: "Bu darsda oʻrgangan soʻzlaringiz" — birinchi 3 tasi, qolgani "+ yana N ta". */
export function LearnedWords({ lessonId, speech }: { lessonId: string; speech: Speech }) {
  const { lang, t } = useI18n()
  const { words, today } = useWords()
  const course = useCourse()
  const list = lessonWords(lessonId, course)
  if (list.length === 0) return null
  const tomorrow = addDays(today, 1)
  // Faqat rost boʻlsa: kamida bitta soʻz ertaga takrorlashga keladi (avval oʻrganilgan soʻzlar oʻz jadvalida qoladi)
  const comes = list.some((w) => words[w.id]?.due === tomorrow)
  return (
    <section aria-labelledby="learned-title" className="space-y-2">
      <h2 id="learned-title" className="text-lg font-semibold">
        {t('vocab.learned', { n: list.length })}
      </h2>
      <ul className="space-y-2">
        {list.slice(0, SHOWN).map((w) => (
          <li key={w.id}>
            <Card className="flex items-center gap-3 py-3">
              <span className="flex-1">
                <span lang={course.id} className="block text-base font-semibold">
                  {w.term}
                </span>
                <span className="block text-base text-ink-2">{w.tr[lang]}</span>
              </span>
              <ListenIcon speech={speech} text={w.term} />
            </Card>
          </li>
        ))}
      </ul>
      {list.length > SHOWN && <p className="px-1 text-base font-medium text-ink-2">{t('vocab.more', { n: list.length - SHOWN })}</p>}
      {comes && (
        <p className="flex items-center gap-2 px-1 text-base text-ink-2">
          <IconCheck size={18} className="text-success-text" aria-hidden />
          {t('vocab.tomorrow')}
        </p>
      )}
    </section>
  )
}
