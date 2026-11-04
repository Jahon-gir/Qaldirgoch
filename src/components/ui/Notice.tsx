import type { ReactNode } from 'react'
import { IconAlertTriangle, IconCircleCheck, IconInfoCircle, type Icon as TablerIcon } from '@tabler/icons-react'

const map = {
  info: { cls: 'bg-trust-soft text-trust-text', Icon: IconInfoCircle },
  danger: { cls: 'bg-danger-soft text-danger-text', Icon: IconAlertTriangle },
  success: { cls: 'bg-success-soft text-success-text', Icon: IconCircleCheck }
}

/** Ogohlantirish bloki. Rang tanlovidan qat'i nazar xavf doim qizil, muvaffaqiyat doim yashil. */
export function Notice({ tone = 'info', icon, children }: { tone?: keyof typeof map; icon?: TablerIcon; children: ReactNode }) {
  const { cls, Icon: DefaultIcon } = map[tone]
  const Icon = icon ?? DefaultIcon
  return (
    <div className={`flex gap-2 rounded-xl px-3 py-3 text-sm ${cls}`} role={tone === 'danger' ? 'alert' : undefined}>
      <Icon size={20} className="shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  )
}
