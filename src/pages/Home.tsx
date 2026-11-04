import { Link, useNavigate } from 'react-router-dom'
import { IconChevronRight, IconRoute, IconSettings, IconShieldCheck } from '@tabler/icons-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { AUSBILDUNG_STEPS, stepKey } from '../content/roadmap'
import { useT } from '../i18n/I18nProvider'
import { professionLabel } from '../profile/format'
import { useProfile } from '../profile/ProfileProvider'

export default function Home() {
  const nav = useNavigate()
  const t = useT()
  const { profile } = useProfile()
  const current = 0
  // "Boshqa" tanlanib matn yozilmagan boʻlsa — kasb koʻrsatilmaydi
  const showProfession = profile && (profile.profession !== 'other' || profile.professionOther)
  return (
    <div className="space-y-3">
      <header className="flex items-center justify-between py-1">
        <div>
          <p className="text-sm text-ink-2">{t('home.welcome')}</p>
          <h1 className="text-2xl font-semibold">{t('app.name')}</h1>
          {showProfession && <p className="text-sm text-ink-2">{t('home.profession', { name: professionLabel(profile, t) })}</p>}
        </div>
        <Link to="/sozlamalar" aria-label={t('home.settings')} className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-ink-2">
          <IconSettings size={22} aria-hidden />
        </Link>
      </header>

      <Card>
        <p className="text-sm text-ink-2">{t('home.german')}</p>
        <p className="mt-0.5 text-lg font-semibold">{t('home.firstLesson')}</p>
        <div className="mt-3">
          <ProgressBar value={0} label={t('home.progressLabel')} />
        </div>
        <p className="mt-1.5 text-sm text-ink-2">{t('home.lessonsSoon')}</p>
        <Button className="mt-3" onClick={() => nav('/til')}>
          {t('home.start')}
        </Button>
      </Card>

      <Link to="/yol" className="block">
        <Card className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-trust-soft text-trust-text">
            <IconRoute size={22} aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block font-semibold">{t('home.road', { n: current + 1, total: AUSBILDUNG_STEPS.length })}</span>
            <span className="block text-sm text-ink-2">{t('home.now', { step: t(stepKey(AUSBILDUNG_STEPS[current])) })}</span>
          </span>
          <IconChevronRight size={20} className="text-ink-3" aria-hidden />
        </Card>
      </Link>

      <Link to="/xavfsizlik" className="block">
        <Card className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger-text">
            <IconShieldCheck size={22} aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block font-semibold">{t('home.offerTitle')}</span>
            <span className="block text-sm text-ink-2">{t('home.offerText')}</span>
          </span>
          <IconChevronRight size={20} className="text-ink-3" aria-hidden />
        </Card>
      </Link>
    </div>
  )
}
