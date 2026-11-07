import type { ReactNode } from 'react'
import { IconAlertTriangle, IconExternalLink, IconPhoneCall } from '@tabler/icons-react'
import { useT } from '../../i18n/I18nProvider'
import { HOTLINE } from '../../safety/hotline'
import { fmtDate } from '../../safety/format'
import type { Agency } from '../../safety/search'

const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

/** Sariq izoh bloki (ogohlantirish, xavf emas). Matn 16 px. */
export function Callout({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl bg-warn-soft px-4 py-3 text-base text-warn-text">
      <IconAlertTriangle size={22} className="mt-0.5 shrink-0" aria-hidden />
      <div className="space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  )
}

/** "1282 ga qoʻngʻiroq" — tel: havola, asosiy (gradient) tugma. */
export function CallButton() {
  const t = useT()
  return (
    <a href={HOTLINE.href} className={`bank-btn flex min-h-[52px] w-full items-center justify-center gap-2 rounded-btn px-4 py-3 text-base font-semibold text-white active:opacity-90 ${focus}`}>
      <IconPhoneCall size={22} aria-hidden />
      {t('safety.call')}
    </a>
  )
}

/** Manba qatori (CLAUDE.md 5-qoida): reestr yangilangan va tekshirilgan sanalari maʼlumotdan olinadi. */
export function SourceLine({ agency }: { agency: Agency }) {
  const t = useT()
  return (
    <div className="space-y-1 text-sm text-ink-2">
      <p>{t('safety.source', { updated: fmtDate(agency.reestr_yangilangan), checked: fmtDate(agency.tekshirilgan) })}</p>
      <a href={agency.manba_url} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-[44px] items-center gap-1 font-semibold text-trust-text underline ${focus}`}>
        {t('safety.open')}
        <IconExternalLink size={16} aria-hidden />
      </a>
    </div>
  )
}
