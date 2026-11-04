export function ProgressBar({ value, tone = 'accent', label }: { value: number; tone?: 'accent' | 'success'; label: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-label={label} aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${tone === 'accent' ? 'bg-accent' : 'bg-success'}`} style={{ width: `${v}%` }} />
    </div>
  )
}
