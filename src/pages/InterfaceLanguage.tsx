import { PageHeader } from '../components/layout/PageHeader'
import { LanguagePicker } from '../components/LanguagePicker'
import { useT } from '../i18n/I18nProvider'

export default function InterfaceLanguage() {
  const t = useT()
  return (
    <div className="space-y-3">
      <PageHeader title={t('settings.language')} back />
      <LanguagePicker />
    </div>
  )
}
