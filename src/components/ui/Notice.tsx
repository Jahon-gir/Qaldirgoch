import type { ReactNode } from 'react'
import { IconAlertTriangle, IconCircleCheck, IconInfoCircle } from '@tabler/icons-react'

const map = {
  info: { cls: 'bg-trust-soft text-trust-text', Icon: IconInfoCircle },
  danger: { cls: 'bg-danger-soft text-danger-text', Icon: IconAlertTriangle },
  success: { cls: 'bg-success-soft text-success-text', Icon: IconCircleCheck }
}

/** Ogohlantirish bloki. Rang tanlovidan qat'i nazar xavf doim qizil, muvaffaqiyat doim yashil. */
export function Notice({ tone = 'info', children }: { tone?: keyof typeof map; children: ReactNode }) {
  const { cls, Icon } = map[tone]
  return (
    <div className={`flex gap-2 rounded-xl px-3 py-3 text-sm ${cls}`} role={tone === 'danger' ? 'alert' : undefined}>
      <Icon size={20} className="shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  )
}
