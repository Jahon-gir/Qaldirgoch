import type { ReactNode } from 'react'
import { IconAlertTriangle, IconCheck, IconX } from '@tabler/icons-react'
import { articleOf, type Article } from '../../../german/exercises'
import type { VocabWord } from '../../../content/german/words'
import type { Speech } from '../../german/Listen'
import { Footer, navyBtn } from '../parts'
import { useT } from '../../../i18n/I18nProvider'

/** Har bir mashq komponenti: javob aniqlanganda onAnswer (takrorlashda SRS shu paytda yoziladi), "Davom etish"da onDone. */
/** Talaffuz natijasi: spoken — aytib tanildi; tried — 3 urinish ishlatildi, tanilmadi; skipped — oʻtkazib yuborildi. */
export type SpeakOutcome = 'spoken' | 'tried' | 'skipped'
/** onDone ning ikkinchi argumenti faqat Talaffuz (SpeakStep) uchun; boshqa mashqlar uni yubormaydi. */
export type ExProps = { word: VocabWord; speech: Speech; onAnswer?: (correct: boolean) => void; onDone: (correct: boolean, outcome?: SpeakOutcome) => void }

/** Artikl ranglari (Roʻyxat, Kartochka va Artikl mashqida bir xil). */
export const ARTICLE_TEXT: Record<Article, string> = { der: 'text-der', die: 'text-die', das: 'text-das' }
export const ARTICLE_BTN: Record<Article, string> = { der: 'bg-der-bg text-der', die: 'bg-die-bg text-die', das: 'bg-das-bg text-das' }

/** Nemischa soʻz; ot boʻlsa faqat artikl soʻzi rangda. */
export function DeWord({ de }: { de: string }) {
  const a = articleOf(de)
  if (!a) return <>{de}</>
  return (
    <>
      <span className={ARTICLE_TEXT[a.article]}>{a.article}</span> {a.noun}
    </>
  )
}

/** Moviy savol bloki (burchak 16px). */
export function Prompt({ label, children, lang }: { label: string; children?: ReactNode; lang?: string }) {
  return (
    <div className="rounded-2xl border border-head-line bg-head px-5 py-5 text-center text-white">
      <p className="text-base text-white/90">{label}</p>
      {children != null && (
        <p lang={lang} className="mt-2 break-words text-3xl font-bold">
          {children}
        </p>
      )}
    </div>
  )
}

export type Tone = 'right' | 'almost' | 'wrong'

/** Natija xabari: yashil / sariq / qizil. */
export function Verdict({ tone, children }: { tone: Tone; children: ReactNode }) {
  const cls = { right: 'bg-success-soft text-success-text', almost: 'bg-warn-soft text-warn-text', wrong: 'bg-danger-soft text-danger-text' }[tone]
  const Icon = { right: IconCheck, almost: IconAlertTriangle, wrong: IconX }[tone]
  return (
    <p role="status" className={`flex items-start gap-2 rounded-xl px-4 py-3 text-base font-semibold ${cls}`}>
      <Icon size={20} className="mt-0.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  )
}

export function ContinueFooter({ onClick, disabled, label }: { onClick: () => void; disabled?: boolean; label?: string }) {
  const t = useT()
  return (
    <Footer>
      <button type="button" disabled={disabled} onClick={onClick} className={navyBtn}>
        {label ?? t('common.continue')}
      </button>
    </Footer>
  )
}
