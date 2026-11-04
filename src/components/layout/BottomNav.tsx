import { NavLink } from 'react-router-dom'
import { IconHome, IconLanguage, IconMessageCircle, IconRoute, IconShieldCheck } from '@tabler/icons-react'
import { useT } from '../../i18n/I18nProvider'
import type { Key } from '../../i18n/uz'

const items: { to: string; label: Key; Icon: typeof IconHome }[] = [
  { to: '/', label: 'nav.home', Icon: IconHome },
  { to: '/yol', label: 'nav.roadmap', Icon: IconRoute },
  { to: '/til', label: 'nav.language', Icon: IconLanguage },
  { to: '/xavfsizlik', label: 'nav.safety', Icon: IconShieldCheck },
  { to: '/ai', label: 'nav.ai', Icon: IconMessageCircle }
]

export function BottomNav() {
  const t = useT()
  return (
    <nav aria-label={t('nav.label')} className="sticky bottom-0 z-10 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md justify-around">
        {items.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-sm ${isActive ? 'font-semibold text-accent-strong' : 'text-ink-3'}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={24} stroke={isActive ? 2.2 : 1.7} aria-hidden />
                  {t(label)}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
