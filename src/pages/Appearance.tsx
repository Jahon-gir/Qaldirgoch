import { IconCheck } from '@tabler/icons-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Segmented } from '../components/ui/Segmented'
import { ACCENTS } from '../theme/presets'
import { useTheme } from '../theme/ThemeProvider'
import { useT } from '../i18n/I18nProvider'

export default function Appearance() {
  const t = useTheme()
  const tr = useT()
  return (
    <div className="space-y-5">
      <PageHeader title={tr('settings.appearance')} back />

      <section>
        <h2 className="mb-2 text-sm text-ink-2">{tr('appearance.mode')}</h2>
        <Segmented
          label={tr('appearance.mode')}
          value={t.mode}
          onChange={(mode) => t.set({ mode })}
          options={[
            { value: 'light', label: tr('appearance.light') },
            { value: 'dark', label: tr('appearance.dark') },
            { value: 'auto', label: tr('appearance.auto') }
          ]}
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm text-ink-2">{tr('appearance.accent')}</h2>
        <div role="radiogroup" aria-label={tr('appearance.accent')} className="grid grid-cols-4 gap-y-3">
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
                <span className={`text-sm ${on ? 'font-semibold' : 'text-ink-2'}`}>{tr(`accent.${a.id}`)}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm text-ink-2">{tr('appearance.size')}</h2>
        <Segmented
          label={tr('appearance.size')}
          value={t.size}
          onChange={(size) => t.set({ size })}
          options={[
            { value: 's', label: <span className="text-sm">A</span>, ariaLabel: tr('appearance.sizeS') },
            { value: 'm', label: <span className="text-base">A</span>, ariaLabel: tr('appearance.sizeM') },
            { value: 'l', label: <span className="text-lg">A</span>, ariaLabel: tr('appearance.sizeL') }
          ]}
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm text-ink-2">{tr('appearance.sample')}</h2>
        <Card>
          <p className="font-semibold">{tr('appearance.sampleTitle')}</p>
          <div className="mt-2">
            <ProgressBar value={35} label={tr('appearance.sampleProgress')} />
          </div>
          <Button className="mt-3" tabIndex={-1}>
            {tr('appearance.sampleButton')}
          </Button>
        </Card>
        <p className="mt-2 px-1 text-sm text-ink-3">{tr('appearance.note')}</p>
      </section>
    </div>
  )
}
