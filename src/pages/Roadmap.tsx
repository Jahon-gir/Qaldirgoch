import { IconCheck } from '@tabler/icons-react'
import { Card } from '../components/ui/Card'
import { Notice } from '../components/ui/Notice'
import { AUSBILDUNG_STEPS } from '../content/roadmap'

export default function Roadmap() {
  const current = 0
  return (
    <div className="space-y-3">
      <div className="rounded-card bg-trust px-4 py-4 text-surface">
        <p className="text-sm opacity-80">Germaniya · Ausbildung</p>
        <h1 className="text-xl font-semibold">Sizning yo'lingiz</h1>
      </div>
      <Card className="p-2">
        <ol>
          {AUSBILDUNG_STEPS.map((s, i) => {
            const done = i < current
            const now = i === current
            return (
              <li key={s.id} className={`flex min-h-[48px] items-center gap-3 rounded-xl px-2 py-2 ${now ? 'bg-trust-soft' : ''}`} aria-current={now ? 'step' : undefined}>
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    done ? 'bg-success text-surface' : now ? 'bg-trust text-surface' : 'bg-surface-2 text-ink-2'
                  }`}
                >
                  {done ? <IconCheck size={16} aria-hidden /> : i + 1}
                </span>
                <span className={now ? 'font-semibold text-trust-text' : done ? '' : 'text-ink-2'}>{s.title}</span>
              </li>
            )
          })}
        </ol>
      </Card>
      <Notice>Har bir bosqichning vazifalari, xarajati va rasmiy manbalari keyingi yangilanishda qo'shiladi.</Notice>
    </div>
  )
}
