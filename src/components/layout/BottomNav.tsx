import { NavLink } from 'react-router-dom'
import { IconHome, IconLanguage, IconMessageCircle, IconRoute, IconShieldCheck } from '@tabler/icons-react'

const items = [
  { to: '/', label: 'Bosh', Icon: IconHome },
  { to: '/yol', label: "Yo'l", Icon: IconRoute },
  { to: '/til', label: 'Til', Icon: IconLanguage },
  { to: '/xavfsizlik', label: 'Xavfsiz', Icon: IconShieldCheck },
  { to: '/ai', label: 'AI', Icon: IconMessageCircle }
]

export function BottomNav() {
  return (
    <nav aria-label="Asosiy menyu" className="sticky bottom-0 z-10 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md justify-around">
        {items.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-xs ${isActive ? 'font-semibold text-accent-strong' : 'text-ink-3'}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={24} stroke={isActive ? 2.2 : 1.7} aria-hidden />
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
