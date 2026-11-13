import { Button } from '../../components/ui/Button'
import { LanguagePicker } from '../../components/LanguagePicker'
import { MigraLogo } from '../../components/Logo'
import { useT } from '../../i18n/I18nProvider'

export function LanguageStep({ onNext }: { onNext: () => void }) {
  const t = useT()
  return (
    <>
      <div className="flex flex-col items-center pt-10 text-center">
        <MigraLogo size={88} />
        <h1 className="mt-4 text-2xl font-semibold">{t('app.name')}</h1>
        <p className="mt-1 text-ink-2">{t('app.tagline')}</p>
      </div>
      <div className="mt-8">
        <LanguagePicker />
      </div>
      <div className="mt-auto pt-6">
        <Button onClick={onNext}>
          {t('common.continue')}
        </Button>
      </div>
    </>
  )
}
