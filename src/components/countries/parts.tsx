import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { IconArrowLeft } from '@tabler/icons-react'
import { useT } from '../../i18n/I18nProvider'
import type { Key } from '../../i18n/uz'

/** Toʻq koʻk (ishonch) sarlavha bloki; roʻyxat/kartochkalar uning ostiga 12px kirib turadi (`Overlap`). */
export function TrustHeader({ children, back }: { children: ReactNode; back?: { to: string; label: Key } }) {
  const t = useT()
  return (
    <header className="rounded-card bg-trust px-4 pb-6 pt-4 text-surface">
      {back && (
        <Link to={back.to} className="-ml-2 mb-1 inline-flex min-h-[44px] items-center gap-2 rounded-full px-2 text-base font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface">
          <IconArrowLeft size={22} aria-hidden />
          {t(back.label)}
        </Link>
      )}
      {children}
    </header>
  )
}

export const Overlap = ({ children }: { children: ReactNode }) => <div className="relative -mt-3 space-y-2">{children}</div>

/** Faqat https havolalar (kontent xatosidan javascript: va hokazo chiqmasin). */
export const safeUrl = (u: string) => (/^https:\/\//i.test(u) ? u : undefined)
export const hostOf = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

/** "Manba: x · tekshirilgan: sana" — sana qatorda boʻlinib ketmasligi uchun boʻlaklar yaxlit turadi. */
export function SourceLine({ text }: { text: string }) {
  const [a, ...rest] = text.split(' · ')
  return (
    <>
      <span className="inline-block">{rest.length ? `${a} ·` : a}</span>
      {rest.map((x) => (
        <span key={x} className="inline-block"> {x}</span>
      ))}
    </>
  )
}
