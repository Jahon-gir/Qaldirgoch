import { IconArrowLeft } from '@tabler/icons-react'
import { useT } from '../../i18n/I18nProvider'
import { useBack } from '../../lib/useHistoryAnchor'

/** back — orqaga tugmasi; backTo — tarix boʻlmasa (toʻgʻridan-toʻgʻri ochilgan) qaytiladigan ekran. */
export function PageHeader({ title, back, backTo = '/' }: { title: string; back?: boolean; backTo?: string }) {
  const goBack = useBack(backTo)
  const t = useT()
  return (
    <header className="flex min-h-[56px] items-center gap-2">
      {back && (
        <button onClick={goBack} aria-label={t('common.back')} className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full active:bg-surface-2">
          <IconArrowLeft size={24} aria-hidden />
        </button>
      )}
      <h1 className="text-xl font-semibold">{title}</h1>
    </header>
  )
}
