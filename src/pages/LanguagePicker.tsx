import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconCheck, IconLock } from '@tabler/icons-react'
import { RoundFlag } from '../components/countries/Flag'
import { useI18n } from '../i18n/I18nProvider'
import { useLessons } from '../german/LessonsProvider'
import { levelProgress, nextUnfinished, type Results } from '../german/logic'
import { useDirection } from '../german/useDirection'
import { LANGUAGE_CATALOG, type CatalogItem } from '../lang/catalog'
import { coursePaths } from '../lang/paths'
import { courseOf } from '../lang/registry'
import { levelName } from '../lang/text'
import type { Course } from '../lang/types'
import { useProfile } from '../profile/ProfileProvider'
import type { Direction } from '../content/german'

/** Qulfli til xabari qancha turadi (ms). */
export const SOON_TOAST_MS = 1800
const FLAG = 64
const RING = 80

/** Kurs holati: joriy daraja (birinchi tugallanmagan dars darajasi) va uning foizi; hali boshlanmagan boʻlsa started = false. */
export function courseStatus(course: Course, direction: Direction, results: Results) {
  const dir = course.directions ? direction : 'general'
  const started = course.lessons.some((l) => l.id in results)
  const next = nextUnfinished(dir, results, course.modules, course.lessons)
  const level = (next && course.moduleById(next.moduleId)?.level) ?? course.levels[0].id
  const { percent } = levelProgress(level, dir, results, course.modules, course.lessons)
  return { started, level, percent }
}

/** Bayroq atrofidagi progress halqasi (yashil). */
function Ring({ percent }: { percent: number }) {
  const r = RING / 2 - 3
  const len = 2 * Math.PI * r
  return (
    <svg viewBox={`0 0 ${RING} ${RING}`} width={RING} height={RING} className="absolute inset-0 -rotate-90" aria-hidden>
      <circle cx={RING / 2} cy={RING / 2} r={r} fill="none" strokeWidth="4" className="stroke-surface-2" />
      {percent > 0 && <circle cx={RING / 2} cy={RING / 2} r={r} fill="none" strokeWidth="4" strokeLinecap="round" className="stroke-success" strokeDasharray={len} strokeDashoffset={len * (1 - percent / 100)} />}
    </svg>
  )
}

function Tile({ item, last, onLocked }: { item: CatalogItem; last: boolean; onLocked: () => void }) {
  const { lang, t } = useI18n()
  const nav = useNavigate()
  const { results } = useLessons()
  const { direction } = useDirection()
  const { setActiveCourse } = useProfile()
  const [shake, setShake] = useState(0)
  const name = t(item.name)

  if (!item.course) {
    return (
      <button
        type="button"
        aria-disabled="true"
        onClick={() => {
          setShake((n) => n + 1)
          onLocked()
        }}
        className="flex min-h-[176px] flex-col items-center justify-center gap-2 rounded-[18px] bg-surface p-4 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span key={shake} data-testid={`lang-${item.id}`} className={`flex flex-col items-center gap-2 ${shake ? 'lp-shake' : ''}`}>
          <span className="relative flex items-center justify-center" style={{ width: RING, height: RING }}>
            <RoundFlag id={item.flag} size={FLAG} gray />
            <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-ink-2 shadow-sm">
              <IconLock size={16} aria-hidden />
            </span>
          </span>
          <span className="text-base font-semibold text-ink-2">{name}</span>
          <span className="text-base text-ink-3">{t('langs.soon')}</span>
        </span>
      </button>
    )
  }

  const course = courseOf(item.course)
  const st = courseStatus(course, direction, results)
  const status = course.id === 'ko' && !st.started ? t('langs.new') : t('langs.levelPercent', { level: levelName(course, st.level, lang), n: st.percent })
  return (
    <button
      type="button"
      onClick={() => {
        setActiveCourse(course.id)
        nav(coursePaths(course.id).home)
      }}
      aria-label={`${name}, ${status}${last ? `, ${t('langs.last')}` : ''}`}
      data-testid={`lang-${item.id}`}
      className="flex min-h-[176px] flex-col items-center justify-center gap-2 rounded-[18px] bg-surface p-4 text-center active:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span className="lp-float relative flex items-center justify-center" style={{ width: RING, height: RING }}>
        <span aria-hidden className="lp-wave absolute rounded-full border-2 border-success" style={{ width: FLAG, height: FLAG }} />
        <Ring percent={st.percent} />
        <RoundFlag id={item.flag} size={FLAG} />
        {last && (
          <span data-testid="lang-last" className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface bg-success text-surface">
            <IconCheck size={14} stroke={3} aria-hidden />
          </span>
        )}
      </span>
      <span className="text-base font-semibold">{name}</span>
      <span className="text-base text-ink-2">{status}</span>
    </button>
  )
}

/** /til — har safar til tanlash: 2×2 kafel (ochiq: nemis, koreys; qulf: yapon, ingliz). */
export default function LanguagePicker() {
  const { t } = useI18n()
  const { activeCourse } = useProfile()
  const [toast, setToast] = useState(0)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const showToast = () => {
    setToast((n) => n + 1)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(0), SOON_TOAST_MS)
  }
  return (
    <div className="space-y-4">
      <header className="py-1">
        <h1 className="text-2xl font-semibold">{t('langs.title')}</h1>
        <p className="text-base text-ink-2">{t('langs.sub')}</p>
      </header>
      <div className="grid grid-cols-2 gap-3">
        {LANGUAGE_CATALOG.map((item) => (
          <Tile key={item.id} item={item} last={!!item.course && item.course === activeCourse} onLocked={showToast} />
        ))}
      </div>
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center px-4">
        {toast > 0 && (
          <p key={toast} role="status" className="lp-toast max-w-md rounded-xl bg-ink px-4 py-3 text-center text-base font-medium text-surface shadow-lg">
            {t('langs.soonToast')}
          </p>
        )}
      </div>
    </div>
  )
}
