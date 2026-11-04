import { useRegisterSW } from 'virtual:pwa-register/react'
import { IconRefresh } from '@tabler/icons-react'
import { useT } from '../i18n/I18nProvider'

const CHECK_EVERY = 60 * 60 * 1000

/** Yangi service worker tayyor boʻlganda ilova tepasida chiqadi; "Yangilash" yangi versiyani yoqadi. */
export function UpdateBanner() {
  const t = useT()
  const {
    needRefresh: [needRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      // Ochiq turgan ilova ham vaqti-vaqti bilan yangi versiyani tekshiradi
      if (reg) setInterval(() => void reg.update().catch(() => undefined), CHECK_EVERY)
    }
  })

  if (!needRefresh) return null
  return (
    <div role="status" className="sticky top-0 z-30 bg-trust text-surface">
      <div className="mx-auto flex min-h-[48px] w-full max-w-md items-center gap-3 px-4 py-1.5 pt-[max(0.375rem,env(safe-area-inset-top))]">
        <IconRefresh size={20} className="shrink-0" aria-hidden />
        <span className="flex-1 font-medium">{t('update.text')}</span>
        <button
          type="button"
          onClick={() => void updateServiceWorker(true)}
          className="min-h-[44px] rounded-btn bg-surface px-4 text-base font-semibold text-trust-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface"
        >
          {t('update.action')}
        </button>
      </div>
    </div>
  )
}
