import { Link } from 'react-router-dom'
import { IconChevronRight, IconDeviceMobileDown, IconLanguage, IconPalette, IconUser, type Icon } from '@tabler/icons-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { LANGS, useI18n } from '../i18n/I18nProvider'
import { useInstall } from '../pwa/useInstall'

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

const installCls = 'flex min-h-[56px] w-full items-center gap-3 bg-tint px-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent'

/** "Telefonga oʻrnatish": oʻrnatilgan boʻlsa koʻrinmaydi; brauzer oynasi tayyor boʻlsa — oynani ochadi; aks holda koʻrsatma ekraniga. */
function InstallRow() {
  const t = useI18n().t
  const { installed, canPrompt, install } = useInstall()
  if (installed) return null
  const content = (
    <>
      <IconDeviceMobileDown size={22} className="text-trust-text" aria-hidden />
      <span className="flex-1 font-medium">{t('settings.install')}</span>
      <IconChevronRight size={20} className="text-ink-3" aria-hidden />
    </>
  )
  return canPrompt ? (
    <button type="button" onClick={() => void install()} className={installCls}>
      {content}
    </button>
  ) : (
    <Link to="/sozlamalar/ornatish" className={installCls}>
      {content}
    </Link>
  )
}

export default function Settings() {
  const { t, lang } = useI18n()
  return (
    <div className="space-y-3">
      <PageHeader title={t('settings.title')} back />
      <Card className="overflow-hidden p-0">
        <Row to="/sozlamalar/profil" Icon={IconUser} label={t('settings.profile')} />
        <Row to="/sozlamalar/til" Icon={IconLanguage} label={t('settings.language')} value={LANGS.find((l) => l.id === lang)?.name} />
        <Row to="/sozlamalar/korinish" Icon={IconPalette} label={t('settings.appearance')} />
        <InstallRow />
      </Card>
      <p className="px-1 text-center text-sm text-ink-3">
        {t('app.name')} · {t('settings.version', { v: __APP_VERSION__ })}
      </p>
    </div>
  )
}
