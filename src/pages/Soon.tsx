import type { ReactNode } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'

export function Soon({ title, items, children }: { title: string; items: string[]; children?: ReactNode }) {
  return (
    <div className="space-y-3">
      <PageHeader title={title} />
      {children}
      <Card>
        <p className="font-semibold">Tez orada</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-2">
          {items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
