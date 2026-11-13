import { Link } from 'react-router-dom'
import { IconChevronRight } from '@tabler/icons-react'
import { ProgressBar } from '../ui/ProgressBar'
import { TestCard } from './TestCard'
import { useI18n } from '../../i18n/I18nProvider'
import { useLessons } from '../../german/LessonsProvider'
import { lessonsOf, moduleNumber, moduleProgress } from '../../german/logic'
import { scopeInfo } from '../../german/finalTest'
import { useCourse, useCoursePaths } from '../../lang/CourseContext'
import type { Direction, Module } from '../../content/german/types'

/** Modullar roʻyxati (Til ekrani — umumiy modullar, kasb sahifasi — shu kasb modullari). Raqam — guruh ichidagi oʻrni. */
export function ModuleList({ modules, direction }: { modules: readonly Module[]; direction: Direction }) {
  const { lang, t } = useI18n()
  const { results } = useLessons()
  const course = useCourse()
  const paths = useCoursePaths()
  return (
    <ul className="space-y-2">
      {modules.map((m) => {
        const count = lessonsOf(m.id, course.lessons).length
        const p = moduleProgress(m.id, results, course.lessons)
        const n = moduleNumber(m.id, direction, course.modules)
        const body = (
          <>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-semibold ${count ? 'bg-accent-soft text-accent-strong' : 'border-2 border-line text-ink-3'}`}>{n}</span>
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
        const info = scopeInfo(m.id, direction, course)
        return (
          <li key={m.id}>
            {count > 0 ? (
              <Link to={paths.module(m.id)} className="flex min-h-[64px] items-center gap-3 rounded-card bg-surface p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                {body}
              </Link>
            ) : (
              <div className="flex min-h-[64px] items-center gap-3 rounded-card bg-surface p-3 opacity-80">{body}</div>
            )}
            {info && <TestCard info={info} results={results} title={t('ft.moduleTitle', { n })} className="mt-2" />}
          </li>
        )
      })}
    </ul>
  )
}
