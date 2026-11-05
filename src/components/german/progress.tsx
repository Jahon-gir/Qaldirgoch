import { Link } from 'react-router-dom'
import { IconCalendarCheck, IconCheck, IconChevronRight, IconFlameFilled } from '@tabler/icons-react'
import { Card } from '../ui/Card'
import { useI18n } from '../../i18n/I18nProvider'
import type { Key } from '../../i18n/uz'
import { weekDays, type Activity } from '../../german/daily'
import { daysBetween, statusCounts, type Day, type Words } from '../../german/srs'

/* ---------- Kunlik maqsad: halqa + hafta kunlari ---------- */

function Ring({ count, goal, label }: { count: number; goal: number; label: string }) {
  const r = 30
  const len = 2 * Math.PI * r
  const part = Math.min(1, count / goal)
  return (
    <div className="relative h-[76px] w-[76px] shrink-0" role="img" aria-label={label}>
      <svg viewBox="0 0 76 76" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="38" cy="38" r={r} fill="none" strokeWidth="8" className="stroke-surface-2" />
        <circle cx="38" cy="38" r={r} fill="none" strokeWidth="8" strokeLinecap="round" className="stroke-success" strokeDasharray={len} strokeDashoffset={len * (1 - part)} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-base font-bold" aria-hidden>
        {part >= 1 ? <IconCheck size={28} stroke={3} className="text-success-text" /> : `${Math.min(count, goal)}/${goal}`}
      </span>
    </div>
  )
}

export function GoalCard({ activity, today, goal }: { activity: Activity; today: Day; goal: number }) {
  const { t } = useI18n()
  const count = activity[today]?.count ?? 0
  const done = count >= goal
  const days = weekDays(activity, today, goal)
  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-4">
        <Ring count={count} goal={goal} label={t('german.goal.ring', { n: Math.min(count, goal), goal })} />
        <div className="flex-1">
          {done ? (
            <p className="text-lg font-semibold">{t('german.goal.done')}</p>
          ) : (
            <>
              <p className="text-lg font-semibold">{t('german.goal.title')}</p>
              <p className="text-base text-ink-2">{t('german.goal.left', { n: goal - count })}</p>
            </>
          )}
        </div>
      </div>
      <ul aria-label={t('german.week.label')} className="grid grid-cols-7 gap-1">
        {days.map((d) => (
          <li key={d.day} className="flex flex-col items-center gap-1">
            <span aria-hidden className={`text-base ${d.isToday ? 'font-semibold text-ink' : 'text-ink-2'}`}>
              {t(`german.week.${d.index}` as Key)}
            </span>
            <span
              aria-hidden
              className={`flex h-7 w-7 items-center justify-center rounded-full ${d.done ? 'bg-success text-surface' : d.isToday ? 'border-2 border-success bg-surface' : 'bg-surface-2'}`}
            >
              {d.done && <IconCheck size={16} stroke={3} />}
            </span>
            <span className="sr-only">
              {t(`german.weekFull.${d.index}` as Key)}
              {d.isToday ? `, ${t('german.week.today')}` : ''}
              {d.done ? `, ${t('german.week.done')}` : ''}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

/* ---------- Ketma-ket kunlar ---------- */

export function StreakLine({ current, record }: { current: number; record: number }) {
  const t = useI18n().t
  return (
    <p className="flex min-h-[44px] items-center gap-2 px-1 text-base font-medium">
      <IconFlameFilled size={24} className={current > 0 ? 'text-accent' : 'text-ink-3'} aria-hidden />
      {t('german.streak', { n: current, r: record })}
    </p>
  )
}

/* ---------- Takrorlash ---------- */

export function ReviewCard({ due, nextDue, today, hasWords }: { due: number; nextDue: Day | null; today: Day; hasWords: boolean }) {
  const t = useI18n().t
  if (due > 0) {
    return (
      <div className="rounded-card bg-accent p-4 text-on-accent">
        <p className="text-lg font-semibold">{t('review.cardTitle', { n: due })}</p>
        <Link
          to="/til/takrorlash"
          className="mt-3 flex min-h-[48px] items-center justify-center rounded-btn bg-surface px-4 text-base font-semibold text-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface"
        >
          {t('review.start')}
        </Link>
      </div>
    )
  }
  const when = nextDue ? (daysBetween(today, nextDue) <= 1 ? t('review.tomorrow') : t('review.inDays', { n: daysBetween(today, nextDue) })) : null
  return (
    <p className="flex min-h-[44px] items-center gap-2 rounded-card bg-surface-2 px-4 py-3 text-base text-ink-2">
      <IconCalendarCheck size={22} className="shrink-0" aria-hidden />
      {hasWords && when ? t('review.none', { when }) : t('review.noneEmpty')}
    </p>
  )
}

/* ---------- Soʻzlar holati ---------- */

/** to — berilsa kartochka bosiladigan (Lugʻatga olib boradi). */
export function WordsBreakdown({ words, to }: { words: Words; to?: string }) {
  const t = useI18n().t
  const c = statusCounts(words)
  const parts = [
    { key: 'new', n: c.new, bar: 'bg-accent', label: t('words.new') },
    { key: 'learning', n: c.learning, bar: 'bg-trust', label: t('words.learning') },
    { key: 'strong', n: c.strong, bar: 'bg-success', label: t('words.strong') }
  ]
  const card = (
    <Card className="space-y-3">
      <div className="flex min-h-[44px] items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{t('words.title', { n: c.total })}</h2>
        {to && <IconChevronRight size={22} className="shrink-0 text-ink-3" aria-hidden />}
      </div>
      <div role="img" aria-label={`${t('words.bar')}: ${parts.map((p) => `${p.label} ${p.n}`).join(', ')}`} className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-surface-2">
        {c.total > 0 && parts.filter((p) => p.n > 0).map((p) => <span key={p.key} className={`h-full ${p.bar}`} style={{ width: `${(p.n / c.total) * 100}%` }} />)}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1" aria-hidden>
        {parts.map((p) => (
          <li key={p.key} className="flex items-center gap-1.5 text-base text-ink-2">
            <span className={`h-3 w-3 rounded-full ${p.bar}`} />
            {p.label} <span className="font-semibold text-ink">{p.n}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
  return to ? (
    <Link to={to} className="block rounded-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
      {card}
    </Link>
  ) : (
    card
  )
}
