import { IconCheck } from '@tabler/icons-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Segmented } from '../components/ui/Segmented'
import { ACCENTS } from '../theme/presets'
import { useTheme } from '../theme/ThemeProvider'

export default function Appearance() {
  const t = useTheme()
  return (
    <div className="space-y-5">
      <PageHeader title="Ko'rinish" back />

      <section>
        <h2 className="mb-2 text-sm text-ink-2">Rejim</h2>
        <Segmented
          label="Rejim"
          value={t.mode}
          onChange={(mode) => t.set({ mode })}
          options={[
            { value: 'light', label: "Yorug'" },
            { value: 'dark', label: "Qorong'i" },
            { value: 'auto', label: 'Avto' }
          ]}
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm text-ink-2">Asosiy rang</h2>
        <div role="radiogroup" aria-label="Asosiy rang" className="grid grid-cols-4 gap-y-3">
          {ACCENTS.map((a) => {
            const on = a.id === t.accent
            const color = a.swatch[t.isDark ? 1 : 0]
            return (
              <button key={a.id} role="radio" aria-checked={on} onClick={() => t.set({ accent: a.id })} className="flex flex-col items-center gap-1">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full"
                  style={{ background: color, boxShadow: on ? `0 0 0 3px rgb(var(--c-bg)), 0 0 0 5px ${color}` : undefined }}
                >
                  {on && <IconCheck size={20} className="text-on-accent" aria-hidden />}
                </span>
                <span className={`text-xs ${on ? 'font-semibold' : 'text-ink-2'}`}>{a.name}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm text-ink-2">Matn o'lchami</h2>
        <Segmented
          label="Matn o'lchami"
          value={t.size}
          onChange={(size) => t.set({ size })}
          options={[
            { value: 's', label: <span className="text-sm">A</span>, ariaLabel: 'Kichik' },
            { value: 'm', label: <span className="text-base">A</span>, ariaLabel: "O'rtacha" },
            { value: 'l', label: <span className="text-lg">A</span>, ariaLabel: 'Katta' }
          ]}
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm text-ink-2">Namuna</h2>
        <Card>
          <p className="font-semibold">Nemis tili A1</p>
          <div className="mt-2">
            <ProgressBar value={35} label="Namuna progress" />
          </div>
          <Button className="mt-3" tabIndex={-1}>
            Davom ettirish
          </Button>
        </Card>
        <p className="mt-2 px-1 text-sm text-ink-3">Xavf ogohlantirishlari doim qizil, muvaffaqiyat belgilari doim yashil qoladi.</p>
      </section>
    </div>
  )
}
