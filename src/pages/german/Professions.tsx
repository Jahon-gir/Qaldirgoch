import { Link } from 'react-router-dom'
import { IconArrowLeft, IconBuildingFactory2, IconCar, IconChevronRight, IconHammer, IconHeartbeat, IconPlant2, IconShoppingCart, IconSparkles, IconToolsKitchen2, IconTruck } from '@tabler/icons-react'
import type { Icon } from '@tabler/icons-react'
import { useI18n } from '../../i18n/I18nProvider'
import { lessonsOf } from '../../german/logic'
import { useDirection } from '../../german/useDirection'
import { useCourse, useCoursePaths } from '../../lang/CourseContext'
import { useBack } from '../../lib/useHistoryAnchor'
import type { Direction } from '../../content/german/types'

export const PROFESSION_ICONS: Partial<Record<Direction, Icon>> = {
  technical: IconHammer,
  care: IconHeartbeat,
  hospitality: IconToolsKitchen2,
  logistics: IconTruck,
  metal: IconCar,
  cleaning: IconSparkles,
  agriculture: IconPlant2,
  retail: IconShoppingCart,
  food: IconBuildingFactory2
}

/** Kasblar roʻyxati (/til/kasblar): foydalanuvchining kasbi birinchi; tanlangan kasb yoʻnalish sifatida saqlanadi. */
export default function Professions() {
  const { t } = useI18n()
  const course = useCourse()
  const paths = useCoursePaths()
  const back = useBack(paths.home)
  const { direction, setDirection } = useDirection()
  const list = (course.directions ?? []).filter((d) => d !== 'general')
  const sorted = [...list.filter((d) => d === direction), ...list.filter((d) => d !== direction)]
  const countOf = (d: Direction) => course.modules.filter((m) => m.direction === d && lessonsOf(m.id, course.lessons).length > 0).length
  return (
    <div className="space-y-3">
      <header className="flex min-h-[56px] items-center gap-2">
        <button type="button" onClick={back} aria-label={t('common.back')} className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
          <IconArrowLeft size={24} aria-hidden />
        </button>
        <h1 className="text-xl font-semibold">{t('kasb.title')}</h1>
      </header>
      <ul className="space-y-2">
        {sorted.map((d) => {
          const Ico = PROFESSION_ICONS[d] ?? IconHammer
          const n = countOf(d)
          const mine = d === direction
          return (
            <li key={d}>
              <Link
                to={paths.profession(d)}
                onClick={() => setDirection(d)}
                className={`flex min-h-[64px] items-center gap-3 rounded-card border-2 bg-surface p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${mine ? 'border-accent' : 'border-transparent'}`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
                  <Ico size={22} aria-hidden />
                </span>
                <span className="flex-1">
                  <span className="block text-base font-semibold">{t(`dir.${d}`)}</span>
                  <span className="block text-base text-ink-2">{n > 0 ? t('kasb.modulesN', { n }) : t('common.soon')}</span>
                </span>
                {mine && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-sm font-semibold text-accent-strong">{t('kasb.mine')}</span>}
                <IconChevronRight size={20} className="shrink-0 text-ink-3" aria-hidden />
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
