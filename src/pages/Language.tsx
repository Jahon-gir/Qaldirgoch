import { useState } from 'react'
import { Link } from 'react-router-dom'
import { IconChevronRight, IconLock } from '@tabler/icons-react'
import { Card } from '../components/ui/Card'
import { OptionCard } from '../components/ui/OptionCard'
import { ProgressBar } from '../components/ui/ProgressBar'
import { DIRECTIONS, LEVELS, LEVEL_LOCKED, type Level } from '../content/german'
import { GoalCard, ReviewCard, StreakLine, WordsBreakdown } from '../components/german/progress'
import { useI18n } from '../i18n/I18nProvider'
import { useDirection } from '../german/useDirection'
import { useLessons } from '../german/LessonsProvider'
import { levelProgress, lessonsOf, moduleProgress, visibleModules } from '../german/logic'
import { nextDueDay } from '../german/srs'
import { useWords } from '../german/WordsProvider'

export default function Language() {
  const { lang, t } = useI18n()
  const { results } = useLessons()
  const { direction, setDirection } = useDirection()
  const [level, setLevel] = useState<Level>('A1')
  const [picking, setPicking] = useState(false)

  const { words, activity, today, goal, due, streak } = useWords()
  const lp = levelProgress(level, direction, results)
  const modules = visibleModules(direction).filter((m) => m.level === level)

  return (
    <div className="space-y-3">
      <header className="py-1">
        <h1 className="text-2xl font-semibold">{t('german.title')}</h1>
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
      </header>

      {picking && (
        <div role="radiogroup" aria-label={t('german.directionPick')} className="space-y-2">
          {DIRECTIONS.map((d) => (
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
      <ReviewCard due={due.length} nextDue={nextDueDay(words, today)} today={today} hasWords={Object.keys(words).length > 0} />
      <WordsBreakdown words={words} />

      <div role="group" aria-label={t('german.levels')} className="grid grid-cols-3 gap-2">
        {LEVELS.map((lv) => {
          const locked = LEVEL_LOCKED[lv]
          const p = levelProgress(lv, direction, results)
          const on = level === lv
          return (
            <button
              key={lv}
              type="button"
              disabled={locked}
              aria-pressed={on}
              onClick={() => setLevel(lv)}
              className={`flex min-h-[64px] flex-col items-center justify-center rounded-card border-2 px-2 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                on ? 'border-accent bg-surface' : 'border-transparent bg-surface'
              } ${locked ? 'text-ink-3' : ''}`}
            >
              <span className="flex items-center gap-1 text-lg font-semibold">
                {lv}
                {locked && <IconLock size={18} aria-hidden />}
              </span>
              <span className="text-base text-ink-2">{locked ? t('german.levelLater') : `${p.done}/${p.total}`}</span>
            </button>
          )
        })}
      </div>

      {!LEVEL_LOCKED[level] && (
        <section aria-labelledby="level-title" className="space-y-1.5 px-1">
          <div className="flex items-baseline justify-between gap-2">
            <h2 id="level-title" className="text-lg font-semibold">
              {t('german.levelTitle', { level })}
            </h2>
            <p className="text-base text-ink-2">{t('german.levelCount', { n: lp.done, total: lp.total })}</p>
          </div>
          <ProgressBar value={lp.percent} tone="success" label={t('german.levelTitle', { level })} />
        </section>
      )}

      <h2 className="sr-only">{t('german.modules')}</h2>
      {modules.length === 0 ? (
        <Card>
          <p className="text-base text-ink-2">{t('german.noLessons')}</p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {modules.map((m) => {
            const count = lessonsOf(m.id).length
            const p = moduleProgress(m.id, results)
            const body = (
              <>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-semibold ${count ? 'bg-accent-soft text-accent-strong' : 'border-2 border-line text-ink-3'}`}>{m.order}</span>
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
                  <Link to={`/til/modul/${m.id}`} className="flex min-h-[64px] items-center gap-3 rounded-card bg-surface p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                    {body}
                  </Link>
                ) : (
                  <div className="flex min-h-[64px] items-center gap-3 rounded-card bg-surface p-3 opacity-80">{body}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
