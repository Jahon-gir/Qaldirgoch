import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { IconCheck } from '@tabler/icons-react'

/**
 * Tanlov kartochkasi (radiogroup ichida). Tanlangani: accent 1.5px chegara va ✓;
 * `soft` boʻlsa fon ham accent-soft (savollar ekrani).
 */
export function OptionCard({
  selected,
  soft = false,
  children,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean; soft?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={`flex min-h-[56px] w-full items-center gap-3 rounded-card border-[1.5px] px-4 py-3 text-left text-base transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        selected ? `border-accent font-semibold ${soft ? 'bg-accent-soft' : 'bg-surface'}` : 'border-transparent bg-surface'
      } ${className}`}
      {...rest}
    >
      <span className="flex-1">{children}</span>
      {selected && (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
          <IconCheck size={16} stroke={3} aria-hidden />
        </span>
      )}
    </button>
  )
}
