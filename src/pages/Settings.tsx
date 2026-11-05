import { Link } from 'react-router-dom'
import { IconChevronRight, IconDeviceMobileDown, IconLanguage, IconPalette, IconTarget, IconUser, IconVolume, type Icon } from '@tabler/icons-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { GOALS, type DailyGoal } from '../german/daily'
import { useProfile } from '../profile/ProfileProvider'
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

/** "Kunlik maqsad": 1 / 2 / 3 (dars yoki takrorlash), har birining ostida qisqa izoh (profilda dailyGoal). */
function GoalRow() {
  const t = useI18n().t
  const { profile, dailyGoal, setDailyGoal } = useProfile()
  if (!profile) return null
  return (
    <div className="space-y-2 border-b border-line px-4 py-3 last:border-0">
      <p className="flex min-h-[32px] items-center gap-3 font-medium">
        <IconTarget size={22} className="text-accent-strong" aria-hidden />
        {t('settings.dailyGoal')}
      </p>
      <div role="radiogroup" aria-label={t('settings.dailyGoal')} className="space-y-2">
        {GOALS.map((g) => {
          const on = g === dailyGoal
          return (
            <button
              key={g}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={t('settings.goalN', { n: g })}
              onClick={() => setDailyGoal(g as DailyGoal)}
              className={`flex min-h-[56px] w-full flex-col justify-center rounded-btn border-2 px-4 py-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${on ? 'border-accent bg-accent-soft' : 'border-line bg-surface active:bg-surface-2'}`}
            >
              <span aria-hidden className="text-lg font-semibold">
                {g}
              </span>
              <span aria-hidden className="text-base text-ink-2">
                {t('settings.goalN', { n: g })}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** "Ovoz effektlari": yoqish/oʻchirish (profilda soundEffects; standart yoqilgan). */
function SoundRow() {
  const t = useI18n().t
  const { profile, soundEffects, setSoundEffects } = useProfile()
  if (!profile) return null
  return (
    <button
      type="button"
      role="switch"
      aria-checked={soundEffects}
      onClick={() => setSoundEffects(!soundEffects)}
      className="flex min-h-[56px] w-full items-center gap-3 border-b border-line px-4 py-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
    >
      <IconVolume size={22} className="shrink-0 text-accent-strong" aria-hidden />
      <span className="flex-1">
        <span className="block font-medium">{t('settings.sound')}</span>
        <span className="block text-sm text-ink-2">{t('settings.soundHint')}</span>
      </span>
      <span aria-hidden className={`relative h-7 w-12 shrink-0 rounded-full border-2 transition-colors ${soundEffects ? 'border-success bg-success' : 'border-ink-3 bg-surface-2'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow transition-transform ${soundEffects ? 'translate-x-[22px]' : 'translate-x-0.5'} ${soundEffects ? '' : 'bg-ink-3'}`} />
      </span>
    </button>
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
        <GoalRow />
        <SoundRow />
        <InstallRow />
      </Card>
      <p className="px-1 text-center text-sm text-ink-3">
        {t('app.name')} · {t('settings.version', { v: __APP_VERSION__ })}
      </p>
    </div>
  )
}
