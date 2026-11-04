import { OptionCard } from './ui/OptionCard'
import { LANGS, useI18n } from '../i18n/I18nProvider'

/** Interfeys tilini tanlash: tanlov darhol qoʻllanadi. */
export function LanguagePicker() {
  const { lang, setLang, t } = useI18n()
  return (
    <div role="radiogroup" aria-label={t('lang.choose')} className="space-y-2">
      {LANGS.map((l) => (
        <OptionCard key={l.id} selected={l.id === lang} onClick={() => setLang(l.id)} lang={l.id}>
          <span className="text-lg">{l.name}</span>
        </OptionCard>
      ))}
    </div>
  )
}
