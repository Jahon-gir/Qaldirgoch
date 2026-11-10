import { Link } from 'react-router-dom'
import { IconCheck, IconChevronRight, IconLock, IconTrophy } from '@tabler/icons-react'
import { useI18n } from '../../i18n/I18nProvider'
import { isPassed, isScopeUnlocked, testId, testSize, type ScopeInfo } from '../../german/finalTest'
import type { Results } from '../../german/logic'
import { coursePaths } from '../../lang/paths'
import { courseOf } from '../../lang/registry'
import { levelName } from '../../lang/text'

/**
 * Yakuniy test kartochkasi. Modul testi — faqat ochilganda koʻrinadi (always=false); daraja testi — doim, ochilmaguncha qulf.
 */
export function TestCard({ info, results, title, always = false, className = '' }: { info: ScopeInfo; results: Results; title: string; always?: boolean; className?: string }) {
  const { lang, t } = useI18n()
  const unlocked = isScopeUnlocked(info, results)
  if (!unlocked && !always) return null
  const size = testSize(info)
  if (size === 0) return null
  const r = results[testId(info.scope)]
  const passed = !!r && isPassed(r.score, r.total)
  if (!unlocked)
    return (
      <div aria-disabled="true" className={`flex min-h-[64px] items-center gap-3 rounded-card border-[1.5px] border-dashed border-line bg-surface-2 p-3 text-ink-2 ${className}`}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface">
          <IconTrophy size={22} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold">{title}</span>
          <span className="block text-base">{t('ft.levelLocked', { level: levelName(courseOf(info.course), info.level, lang) })}</span>
        </span>
        <IconLock size={22} className="shrink-0" aria-hidden />
      </div>
    )
  return (
    <Link
      to={coursePaths(info.course).test(info.scope)}
      className={`flex min-h-[64px] items-center gap-3 rounded-card border-[1.5px] border-accent bg-surface p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
        <IconTrophy size={22} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold">{title}</span>
        <span className={`flex items-center gap-1 text-base ${passed ? 'font-semibold text-success-text' : 'text-ink-2'}`}>
          {passed && <IconCheck size={18} stroke={3} aria-hidden />}
          {passed ? t('ft.passed', { score: r.score, total: r.total }) : t('ft.open', { n: size })}
        </span>
      </span>
      <IconChevronRight size={20} className="shrink-0 text-ink-3" aria-hidden />
    </Link>
  )
}
