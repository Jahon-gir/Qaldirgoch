import { Link } from 'react-router-dom'
import { IconChevronRight, IconLanguage, IconPalette, IconUser, type Icon } from '@tabler/icons-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { LANGS, useI18n } from '../i18n/I18nProvider'

function Row({ to, Icon, label, value }: { to: string; Icon: Icon; label: string; value?: string }) {
  return (
    <Link to={to} className="flex min-h-[56px] items-center gap-3 border-b border-line px-4 last:border-0">
      <Icon size={22} className="text-accent-strong" aria-hidden />
      <span className="flex-1 font-medium">{label}</span>
      {value && <span className="text-ink-2">{value}</span>}
      <IconChevronRight size={20} className="text-ink-3" aria-hidden />
    </Link>
  )
}

export default function Settings() {
  const { t, lang } = useI18n()
  return (
    <div className="space-y-3">
      <PageHeader title={t('settings.title')} back />
      <Card className="p-0">
        <Row to="/sozlamalar/profil" Icon={IconUser} label={t('settings.profile')} />
        <Row to="/sozlamalar/til" Icon={IconLanguage} label={t('settings.language')} value={LANGS.find((l) => l.id === lang)?.name} />
        <Row to="/sozlamalar/korinish" Icon={IconPalette} label={t('settings.appearance')} />
      </Card>
      <p className="px-1 text-center text-sm text-ink-3">
        {t('app.name')} · {t('settings.version', { v: __APP_VERSION__ })}
      </p>
    </div>
  )
}
