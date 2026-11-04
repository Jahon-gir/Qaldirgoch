import { Link } from 'react-router-dom'
import { IconChevronRight, IconPalette } from '@tabler/icons-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'

export default function Settings() {
  return (
    <div className="space-y-3">
      <PageHeader title="Sozlamalar" back />
      <Card className="p-0">
        <Link to="/sozlamalar/korinish" className="flex min-h-[56px] items-center gap-3 px-4">
          <IconPalette size={22} className="text-accent-strong" aria-hidden />
          <span className="flex-1 font-medium">Ko'rinish</span>
          <IconChevronRight size={20} className="text-ink-3" aria-hidden />
        </Link>
      </Card>
      <p className="px-1 text-center text-sm text-ink-3">Qaldirg'och · versiya {__APP_VERSION__}</p>
    </div>
  )
}
