import { useEffect, useRef } from 'react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { useT } from '../../i18n/I18nProvider'

/** Chiqishni tasdiqlash oynasi (dars va yakuniy test): natija saqlanmasligi aytiladi. Brauzer confirm() ishlatilmaydi. */
export function ConfirmExit({ title, text, onStay, onLeave }: { title: string; text: string; onStay: () => void; onLeave: () => void }) {
  const t = useT()
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [])
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/50 p-4 sm:items-center" onKeyDown={(e) => e.key === 'Escape' && onStay()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="exit-title" className="w-full max-w-md outline-none">
        <Card className="space-y-3 p-5 shadow-lg">
          <h2 id="exit-title" className="text-lg font-semibold">
            {title}
          </h2>
          <p className="text-base text-ink-2">{text}</p>
          <Button onClick={onStay}>{t('german.exitStay')}</Button>
          <Button variant="secondary" onClick={onLeave}>
            {t('german.exitLeave')}
          </Button>
        </Card>
      </div>
    </div>
  )
}
