import type { ReactNode } from 'react'

export function Segmented<T extends string>({ value, options, onChange, label }: {
  value: T
  options: { value: T; label: ReactNode; ariaLabel?: string }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-xl bg-surface-2 p-1">
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={on}
            aria-label={o.ariaLabel}
            onClick={() => onChange(o.value)}
            className={`min-h-[44px] flex-1 rounded-lg text-sm transition ${on ? 'bg-surface font-semibold text-ink shadow-sm' : 'text-ink-2'}`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
