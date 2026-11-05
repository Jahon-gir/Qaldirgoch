import type { ReactNode } from 'react'
import { IconArrowLeft } from '@tabler/icons-react'
import { useT } from '../../i18n/I18nProvider'

/** B uslubi: toʻq koʻk rasmiy sarlavha. Qorongʻida bir pogʻona ochroq moviy + ingichka och chiziq. */
export function VocabHeader({ title, sub, onBack, right }: { title: string; sub: string; onBack: () => void; right?: ReactNode }) {
  const t = useT()
  return (
    <header className="rounded-b-[20px] border-b border-head-line bg-head px-4 pb-4 pt-[max(0.5rem,env(safe-area-inset-top))] text-white">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onBack} aria-label={t('common.back')} className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
          <IconArrowLeft size={24} aria-hidden />
        </button>
        <div className="min-w-0 flex-1 py-1">
          <h1 className="break-words text-xl font-semibold leading-tight">{title}</h1>
          <p className="text-base text-white/90">{sub}</p>
        </div>
        {right}
      </div>
    </header>
  )
}

/** Toʻq koʻk (head) tugma: 52px. */
export const navyBtn =
  'flex min-h-[52px] w-full items-center justify-center gap-2 rounded-btn bg-head px-4 py-3 text-base font-semibold text-white border border-head-line active:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50'

/** Sahifa pastidagi yopishqoq tugmalar joyi. */
export function Footer({ children }: { children: ReactNode }) {
  return <div className="sticky bottom-0 -mx-4 mt-auto space-y-2 bg-bg px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">{children}</div>
}
