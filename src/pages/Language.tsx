import { useState } from 'react'
import { Link } from 'react-router-dom'
import { IconArrowLeft, IconChevronRight, IconClockHour4, IconLock } from '@tabler/icons-react'
import { Card } from '../components/ui/Card'
import { OptionCard } from '../components/ui/OptionCard'
import { ProgressBar } from '../components/ui/ProgressBar'
import { RoundFlag } from '../components/countries/Flag'
import { GoalCard, ReviewCard, StreakLine, WordsBreakdown } from '../components/german/progress'
import { useI18n } from '../i18n/I18nProvider'
import { useDirection } from '../german/useDirection'
import { useLessons } from '../german/LessonsProvider'
import { levelProgress, lessonsOf, moduleProgress, nextUnfinished, visibleModules } from '../german/logic'
import { nextDueDay } from '../german/srs'
import { useWords } from '../german/WordsProvider'
import { TestCard } from '../components/german/TestCard'
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
  const { direction: profileDirection, setDirection } = useDirection()
  // Yoʻnalishsiz kursda (koreys) hamma modul umumiy — yoʻnalish taʼsir qilmaydi
  const direction = course.directions ? profileDirection : 'general'
  const [level, setLevel] = useState<string>(course.levels[0].id)
  const [picking, setPicking] = useState(false)
  const lv = (id: string) => levelName(course, id, lang)
  const locked = (id: string) => course.levels.find((x) => x.id === id)?.locked ?? true

  // Kunlik maqsad va streak — barcha tillar uchun bitta; soʻzlar va takrorlash — shu kurs
  const { wordsOf, dueFor, activity, today, goal, streak } = useWords()
  const words = wordsOf(course.id)
  const due = dueFor(course.id)
  const lp = levelProgress(level, direction, results, course.modules, course.lessons)
  const next = nextUnfinished(direction, results, course.modules, course.lessons)
  const nextModule = next ? course.moduleById(next.moduleId) : null
  const modules = visibleModules(direction, course.modules).filter((m) => m.level === level)

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
        {course.directions && (
          <p className="flex min-h-[44px] flex-wrap items-center gap-x-2 text-base text-ink-2">
            {t('german.direction', { name: t(`dir.${direction}`) })}
            <button
              type="button"
              aria-expanded={picking}
              onClick={() => setPicking((v) => !v)}
              className="min-h-[44px] px-1 font-semibold text-trust-text underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              {t('german.directionChange')}
            </button>
          </p>
        )}
      </header>

      {course.id === 'ko' && (
        <p className="flex items-start gap-2 rounded-card bg-trust-soft px-4 py-3 text-base text-trust-text">
          <IconClockHour4 size={20} className="mt-0.5 shrink-0" aria-hidden />
          {t('lang.ko.notice')}
        </p>
      )}

      {picking && course.directions && (
        <div role="radiogroup" aria-label={t('german.directionPick')} className="space-y-2">
          {course.directions.map((d) => (
            <OptionCard
              key={d}
              selected={direction === d}
              onClick={() => {
                setDirection(d)
                setPicking(false)
              }}
            >
              {t(`dir.${d}`)}
            </OptionCard>
          ))}
        </div>
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
          const p = levelProgress(lid, direction, results, course.modules, course.lessons)
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
        <ul className="space-y-2">
          {modules.map((m, idx) => {
            const count = lessonsOf(m.id, course.lessons).length
            const p = moduleProgress(m.id, results, course.lessons)
            const body = (
              <>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-semibold ${count ? 'bg-accent-soft text-accent-strong' : 'border-2 border-line text-ink-3'}`}>{idx + 1}</span>
                <span className="flex-1">
                  <span className={`block text-base font-semibold ${count ? '' : 'text-ink-2'}`}>{m.title[lang]}</span>
                  {count === 0 ? (
                    <span className="block text-base text-ink-3">{t('common.soon')}</span>
                  ) : p.done > 0 ? (
                    <span className="mt-1.5 flex items-center gap-2">
                      <span className="flex-1">
                        <ProgressBar value={p.percent} tone="success" label={t('german.moduleProgress')} />
                      </span>
                      <span className="text-base text-ink-2">{p.done}/{p.total}</span>
                    </span>
                  ) : (
                    <span className="block text-base text-ink-2">{t('german.lessonsN', { n: count })}</span>
                  )}
                </span>
                {count > 0 && <IconChevronRight size={20} className="shrink-0 text-ink-3" aria-hidden />}
              </>
            )
            return (
              <li key={m.id}>
                {count > 0 ? (
                  <Link to={paths.module(m.id)} className="flex min-h-[64px] items-center gap-3 rounded-card bg-surface p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                    {body}
                  </Link>
                ) : (
                  <div className="flex min-h-[64px] items-center gap-3 rounded-card bg-surface p-3 opacity-80">{body}</div>
                )}
                {(() => {
                  // Modul testi: modulning barcha darslari tugagach ostida chiqadi
                  const info = scopeInfo(m.id, direction, course)
                  return info && <TestCard info={info} results={results} title={t('ft.moduleTitle', { n: idx + 1 })} className="mt-2" />
                })()}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
