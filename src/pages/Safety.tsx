import { Link } from 'react-router-dom'
import { IconChevronRight, IconFileSearch, IconPhoneCall, IconSearch } from '@tabler/icons-react'
import { SafetyMark } from '../components/safety/SafetyMark'
import { useT } from '../i18n/I18nProvider'
import { HOTLINE } from '../safety/hotline'
import { fmtDate } from '../safety/format'

const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const iconBox = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-trust-soft text-trust-text'

/** Xavfsizlik markazi: agentlikni tekshirish (faol), taklifni tekshirish (tez orada), ishonch telefoni. */
export default function Safety() {
  const t = useT()
  return (
    <div className="space-y-4">
      <header className="bank-head -mx-4 -mt-[max(1rem,env(safe-area-inset-top))] px-4 pb-6 pt-[max(1.5rem,env(safe-area-inset-top))] text-white">
        <div className="flex items-center gap-4">
          <SafetyMark size={64} />
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold leading-tight">{t('safety.title')}</h1>
            <p className="text-base text-white">{t('safety.hero.sub')}</p>
          </div>
        </div>
      </header>

      <ul className="space-y-3">
        <li>
          <Link to="/xavfsizlik/agentlik" className={`bank-card flex min-h-[72px] items-center gap-3 p-4 active:opacity-90 ${focus}`}>
            <span className={iconBox}>
              <IconSearch size={22} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-semibold">{t('safety.agency.title')}</span>
              <span className="block text-base text-ink-2">{t('safety.agency.desc')}</span>
            </span>
            <IconChevronRight size={22} className="shrink-0 text-ink-3" aria-hidden />
          </Link>
        </li>
        <li>
          {/* Bosilmaydi: havola ham, tugma ham emas */}
          <div aria-disabled="true" data-testid="offer-card" className="flex min-h-[72px] items-center gap-3 rounded-card bg-bank-soft p-4 text-ink-2">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bank-card text-ink-2">
              <IconFileSearch size={22} aria-hidden />
            </span>
            <span className="min-w-0 flex-1 text-base font-semibold">{t('safety.offer.title')}</span>
            <span className="shrink-0 rounded-full bg-bank-card px-3 py-1 text-sm font-semibold text-ink-2">{t('common.soon')}</span>
          </div>
        </li>
        <li>
          <a href={HOTLINE.href} className={`bank-card flex min-h-[72px] items-center gap-3 p-4 active:opacity-90 ${focus}`}>
            <span className={iconBox}>
              <IconPhoneCall size={22} aria-hidden />
            </span>
            <span className="min-w-0 flex-1 text-base font-semibold">{t('safety.hotline.title')}</span>
          </a>
        </li>
      </ul>

      <div className="space-y-2 px-1 text-ink-2">
        <p className="text-base">{t('safety.disclaimer')}</p>
        <p className="text-sm">{t('safety.hotline.source', { date: fmtDate(HOTLINE.checked) })}</p>
        <a href={HOTLINE.sourceUrl} target="_blank" rel="noopener noreferrer" className={`flex min-h-[44px] items-center text-sm font-semibold text-trust-text underline ${focus}`}>
          gov.uz
        </a>
      </div>
    </div>
  )
}
