import { Link, Navigate, useParams } from 'react-router-dom'
import { IconArrowLeft, IconCheck, IconChevronRight, IconClockHour4, IconPlayerPlayFilled } from '@tabler/icons-react'
import { Card } from '../../components/ui/Card'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { useI18n } from '../../i18n/I18nProvider'
import { useLessons } from '../../german/LessonsProvider'
import { FROM_MODULE, useBack } from '../../lib/useHistoryAnchor'
import { currentInModule, lessonsOf, moduleNumber, moduleProgress } from '../../german/logic'
import { TestCard } from '../../components/german/TestCard'
import { scopeInfo } from '../../german/finalTest'
import { useDirection } from '../../german/useDirection'
import { useCourse, useCoursePaths } from '../../lang/CourseContext'
import { levelName } from '../../lang/text'
import { HangulText } from '../../components/korean/HangulText'

export default function ModulePage() {
  const { moduleId = '' } = useParams()
  const { lang, t } = useI18n()
  const { results } = useLessons()
  const course = useCourse()
  const paths = useCoursePaths()
  const back = useBack(paths.home)
  const { direction: profileDirection } = useDirection()
  const direction = course.directions ? profileDirection : 'general'
  const mod = course.moduleById(moduleId)
  const lessons = mod ? lessonsOf(mod.id, course.lessons) : []
  if (!mod || lessons.length === 0) return <Navigate to={paths.home} replace />
  const p = moduleProgress(mod.id, results, course.lessons)
  const current = currentInModule(mod.id, results, course.lessons)
  return (
    <div className="space-y-3">
      <header className="flex min-h-[56px] items-center gap-2">
        <button type="button" onClick={back} aria-label={t('common.back')} className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
          <IconArrowLeft size={24} aria-hidden />
        </button>
        <div>
          <p className="text-base text-ink-2">{t('german.moduleLabel', { level: levelName(course, mod.level, lang), n: moduleNumber(mod.id, direction, course.modules) })}</p>
          <h1 className="text-xl font-semibold">{mod.title[lang]}</h1>
        </div>
      </header>

      {mod.status !== 'approved' && (
        <p className="inline-flex items-center gap-1.5 rounded-full bg-trust-soft px-3 py-1.5 text-base text-trust-text">
          <IconClockHour4 size={18} aria-hidden />
          {t('german.review')}
        </p>
      )}

      <Card>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-base font-semibold">{t('german.homeCount', { n: p.done, total: p.total })}</p>
          <p className="text-base font-semibold text-success-text">{p.percent}%</p>
        </div>
        <div className="mt-2">
          <ProgressBar value={p.percent} tone="success" label={t('german.moduleProgress')} />
        </div>
      </Card>

      {(() => {
        const info = scopeInfo(mod.id, direction, course)
        return info && <TestCard info={info} results={results} title={t('ft.moduleTitle', { n: moduleNumber(mod.id, direction, course.modules) })} />
      })()}

      <Card className="p-2">
        <ol>
          {lessons.map((l, i) => {
            const done = l.id in results
            const now = current?.id === l.id
            return (
              <li key={l.id}>
                <Link
                  to={paths.lesson(l.id)}
                  state={FROM_MODULE}
                  aria-current={now ? 'step' : undefined}
                  className={`flex min-h-[64px] items-center gap-3 rounded-xl px-2 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${now ? 'bg-accent-soft' : ''}`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-semibold ${
                      done ? 'bg-success text-surface' : now ? 'bg-accent text-on-accent' : 'border-2 border-line bg-surface text-ink-2'
                    }`}
                  >
                    {done ? <IconCheck size={22} aria-hidden /> : now ? <IconPlayerPlayFilled size={18} aria-hidden /> : i + 1}
                  </span>
                  <span className="flex-1">
                    <span className={`block text-base ${now ? 'font-semibold' : ''}`}>
                      <HangulText text={l.title[lang]} />
                    </span>
                    <span className="block text-base text-ink-2">
                      {t(`german.kind.${l.kind}`)} · {t('german.minutes', { n: l.minutes })}
                    </span>
                    <span className="sr-only">{done ? t('german.lessonDone') : now ? t('german.lessonCurrent') : ''}</span>
                  </span>
                  <IconChevronRight size={20} className="shrink-0 text-ink-3" aria-hidden />
                </Link>
              </li>
            )
          })}
        </ol>
      </Card>
    </div>
  )
}
