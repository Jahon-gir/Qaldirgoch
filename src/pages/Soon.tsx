import type { ReactNode } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { useT } from '../i18n/I18nProvider'
import type { Key } from '../i18n/uz'

export function Soon({ title, items, children }: { title: Key; items: Key[]; children?: ReactNode }) {
  const t = useT()
  return (
    <div className="space-y-3">
      <PageHeader title={t(title)} />
      {children}
      <Card>
        <p className="font-semibold">{t('common.soon')}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-2">
          {items.map((i) => (
            <li key={i}>{t(i)}</li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
