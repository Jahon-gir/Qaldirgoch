import { useState } from 'react'
import { Link } from 'react-router-dom'
import { IconArrowLeft, IconChevronRight, IconClockHour4, IconLock, IconTools } from '@tabler/icons-react'
import { Card } from '../components/ui/Card'
import { ProgressBar } from '../components/ui/ProgressBar'
import { RoundFlag } from '../components/countries/Flag'
import { GoalCard, ReviewCard, StreakLine, WordsBreakdown } from '../components/german/progress'
import { useI18n } from '../i18n/I18nProvider'
import { useDirection } from '../german/useDirection'
import { useLessons } from '../german/LessonsProvider'
import { levelProgress, nextUnfinished, visibleModules } from '../german/logic'
import { nextDueDay } from '../german/srs'
import { useWords } from '../german/WordsProvider'
import { TestCard } from '../components/german/TestCard'
import { ModuleList } from '../components/german/ModuleList'
import { levelScope, scopeInfo } from '../german/finalTest'
import { useCourse, useCoursePaths } from '../lang/CourseContext'
import { COURSE_TEXT, levelName } from '../lang/text'
import { useBack } from '../lib/useHistoryAnchor'
import { HangulText } from '../components/korean/HangulText'

/** Kurs ekrani (/til/de, /til/ko): daraja → modullar, kunlik maqsad, takrorlash. Nemis va koreys uchun bitta komponent. */
export default function Language() {
  const { lang, t } = useI18n()
  const { results } = useLessons()
  const course = useCourse()
  const paths = useCoursePaths()
  const back = useBack('/til')
  const { direction: profileDirection } = useDirection()
  // Yoʻnalishsiz kursda (koreys) hamma modul umumiy — yoʻnalish taʼsir qilmaydi
  const direction = course.directions ? profileDirection : 'general'
  const [level, setLevel] = useState<string>(course.levels[0].id)
  const lv = (id: string) => levelName(course, id, lang)
  const locked = (id: string) => course.levels.find((x) => x.id === id)?.locked ?? true

  // Kunlik maqsad va streak — barcha tillar uchun bitta; soʻzlar va takrorlash — shu kurs
  const { wordsOf, dueFor, activity, today, goal, streak } = useWords()
  const words = wordsOf(course.id)
  const due = dueFor(course.id)
  // Roʻyxatda faqat umumiy modullar; kasbiy modullar alohida (Kasblar) — sanoq ham roʻyxatga mos
  const lp = levelProgress(level, 'general', results, course.modules, course.lessons)
  const next = nextUnfinished(direction, results, course.modules, course.lessons)
  const nextModule = next ? course.moduleById(next.moduleId) : null
  const modules = visibleModules('general', course.modules).filter((m) => m.level === level)

  return (
    <div className="space-y-3">
      <header className="py-1">
        <div className="flex min-h-[48px] items-center gap-2">
          <button type="button" onClick={back} aria-label={t('common.back')} className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
            <IconArrowLeft size={24} aria-hidden />
          </button>
          <RoundFlag id={course.flag} size={32} />
          <h1 className="text-2xl font-semibold">{t(COURSE_TEXT[course.id].name)}</h1>
        </div>
      </header>

      {course.id === 'ko' && (
        <p className="flex items-start gap-2 rounded-card bg-trust-soft px-4 py-3 text-base text-trust-text">
          <IconClockHour4 size={20} className="mt-0.5 shrink-0" aria-hidden />
          {t('lang.ko.notice')}
        </p>
      )}

      <GoalCard activity={activity} today={today} goal={goal} />
      <StreakLine current={streak.current} record={streak.record} />
      <ReviewCard due={due.length} nextDue={nextDueDay(words, today)} today={today} hasWords={Object.keys(words).length > 0} to={paths.review} />

      <div className="rounded-card bg-accent p-4 text-on-accent">
        <p className="text-base opacity-90">{t('german.continueTitle')}</p>
        {next && nextModule ? (
          <>
            <p className="text-lg font-semibold">
              <HangulText text={next.title[lang]} />
            </p>
            <p className="text-base opacity-90">{nextModule.title[lang]}</p>
            <Link
              to={paths.lesson(next.id)}
              className="mt-3 flex min-h-[48px] items-center justify-center rounded-btn bg-surface px-4 text-base font-semibold text-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface"
            >
              {t('common.continue')}
            </Link>
          </>
        ) : (
          <p className="text-lg font-semibold">{t('german.allDone')}</p>
        )}
      </div>
      <WordsBreakdown words={words} to={paths.vocab} />

      <div role="group" aria-label={t('german.levels')} className="grid grid-cols-3 gap-2">
        {course.levels.map(({ id: lid, locked: isLocked }) => {
          const p = levelProgress(lid, 'general', results, course.modules, course.lessons)
          const on = level === lid
          return (
            <button
              key={lid}
              type="button"
              disabled={isLocked}
              aria-pressed={on}
              onClick={() => setLevel(lid)}
              className={`flex min-h-[64px] flex-col items-center justify-center rounded-card border-2 px-2 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                on ? 'border-accent bg-surface' : 'border-transparent bg-surface'
              } ${isLocked ? 'text-ink-3' : ''}`}
            >
              <span className="flex items-center gap-1 text-lg font-semibold">
                {lv(lid)}
                {isLocked && <IconLock size={18} aria-hidden />}
              </span>
              <span className="text-base text-ink-2">{isLocked ? t('german.levelLater') : `${p.done}/${p.total}`}</span>
            </button>
          )
        })}
      </div>

      {!locked(level) && (
        <section aria-labelledby="level-title" className="space-y-1.5 px-1">
          <div className="flex items-baseline justify-between gap-2">
            <h2 id="level-title" className="text-lg font-semibold">
              {t('german.levelTitle', { level: lv(level) })}
            </h2>
            <p className="text-base text-ink-2">{t('german.levelCount', { n: lp.done, total: lp.total })}</p>
          </div>
          <ProgressBar value={lp.percent} tone="success" label={t('german.levelTitle', { level: lv(level) })} />
        </section>
      )}
      {!locked(level) &&
        (() => {
          const info = scopeInfo(levelScope(level), direction, course)
          return info && <TestCard info={info} results={results} title={t('ft.levelTitle', { level: lv(level) })} always />
        })()}

      <h2 className="sr-only">{t('german.modules')}</h2>
      {modules.length === 0 ? (
        <Card>
          <p className="text-base text-ink-2">{t('german.noLessons')}</p>
        </Card>
      ) : (
        <ModuleList modules={modules} direction={direction} />
      )}

      {course.directions && (
        <section aria-labelledby="kasb-title" className="space-y-2">
          <h2 id="kasb-title" className="px-1 pt-2 text-lg font-semibold text-trust-text">{t('kasb.section')}</h2>
          <Link to={paths.professions} className="flex min-h-[64px] items-center gap-3 rounded-card border-2 border-accent bg-surface p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
              <IconTools size={22} aria-hidden />
            </span>
            <span className="flex-1 text-base font-semibold">{t('kasb.open')}</span>
            <IconChevronRight size={20} className="shrink-0 text-ink-3" aria-hidden />
          </Link>
        </section>
      )}
    </div>
  )
}
