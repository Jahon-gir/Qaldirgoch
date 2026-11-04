import { Link, useNavigate } from 'react-router-dom'
import { IconChevronRight, IconRoute, IconSettings, IconShieldCheck } from '@tabler/icons-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { AUSBILDUNG_STEPS } from '../content/roadmap'

export default function Home() {
  const nav = useNavigate()
  const current = 0
  return (
    <div className="space-y-3">
      <header className="flex items-center justify-between py-1">
        <div>
          <p className="text-sm text-ink-2">Xush kelibsiz</p>
          <h1 className="text-2xl font-semibold">Qaldirg'och</h1>
        </div>
        <Link to="/sozlamalar" aria-label="Sozlamalar" className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-ink-2">
          <IconSettings size={22} aria-hidden />
        </Link>
      </header>

      <Card>
        <p className="text-sm text-ink-2">Nemis tili · A1</p>
        <p className="mt-0.5 text-lg font-semibold">Birinchi darsingiz sizni kutmoqda</p>
        <div className="mt-3">
          <ProgressBar value={0} label="A1 darajasi bo'yicha progress" />
        </div>
        <p className="mt-1.5 text-sm text-ink-2">Darslar tez orada qo'shiladi</p>
        <Button className="mt-3" onClick={() => nav('/til')}>
          Boshlash
        </Button>
      </Card>

      <Link to="/yol" className="block">
        <Card className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-trust-soft text-trust-text">
            <IconRoute size={22} aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block font-semibold">
              Yo'lingiz: {current + 1} / {AUSBILDUNG_STEPS.length}
            </span>
            <span className="block text-sm text-ink-2">Hozir: {AUSBILDUNG_STEPS[current].title}</span>
          </span>
          <IconChevronRight size={20} className="text-ink-3" aria-hidden />
        </Card>
      </Link>

      <Link to="/xavfsizlik" className="block">
        <Card className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger-text">
            <IconShieldCheck size={22} aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block font-semibold">Taklif oldingizmi?</span>
            <span className="block text-sm text-ink-2">Pul to'lashdan oldin tekshiring</span>
          </span>
          <IconChevronRight size={20} className="text-ink-3" aria-hidden />
        </Card>
      </Link>
    </div>
  )
}
