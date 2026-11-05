import { Link, useNavigate } from 'react-router-dom'
import { IconChevronRight, IconRepeat, IconRoute, IconSettings, IconShieldCheck } from '@tabler/icons-react'
import { Logo } from '../components/Logo'
import { AUSBILDUNG_PATH } from '../content/countries'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { AUSBILDUNG_STEPS } from '../content/ausbildung'
import { professionLabel } from '../profile/format'
import { useProfile } from '../profile/ProfileProvider'
import { useProgress } from '../progress/ProgressProvider'
import { useI18n } from '../i18n/I18nProvider'
import { useWords } from '../german/WordsProvider'

export default function Home() {
  const nav = useNavigate()
  const { t } = useI18n()
  const { profile } = useProfile()
  const { progress, streak, due } = useWords()
  const { summary } = useProgress()
  const currentStep = summary.currentIndex >= 0 ? AUSBILDUNG_STEPS[summary.currentIndex] : null
  // "Boshqa" tanlanib matn yozilmagan boʻlsa — kasb koʻrsatilmaydi
  const showProfession = profile && (profile.profession !== 'other' || profile.professionOther)
  return (
    <div className="space-y-3">
      <h1 className="sr-only">{t('app.name')}</h1>
      <div className="flex justify-end">
        <Link to="/sozlamalar" aria-label={t('home.settings')} className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-ink-2">
          <IconSettings size={22} aria-hidden />
        </Link>
      </div>
      <div className="flex flex-col items-center pb-2 text-center">
        <Logo />
        <p className="mt-3 text-xl font-medium">{t('home.welcome')}</p>
        {showProfession && <p className="text-sm text-ink-2">{t('home.profession', { name: professionLabel(profile, t) })}</p>}
      </div>

      <Card>
        <p className="text-sm text-ink-2">{t('home.german')}</p>
        <p className="mt-0.5 text-lg font-semibold">{t('home.germanToday', { n: Math.min(progress.count, progress.goal), goal: progress.goal, s: streak.current })}</p>
        <div className="mt-2">
          <ProgressBar value={progress.percent} tone="success" thin label={t('home.goalLabel')} />
        </div>
        <Button className="mt-3" onClick={() => nav('/til')}>
          {t('home.start')}
        </Button>
      </Card>

      {due.length > 0 && (
        <Link
          to="/til/takrorlash"
          className="flex min-h-[56px] items-center gap-3 rounded-card bg-accent px-4 py-3 text-on-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <IconRepeat size={22} className="shrink-0" aria-hidden />
          <span className="flex-1 text-base font-semibold">{t('home.reviewWaiting', { n: due.length })}</span>
          <IconChevronRight size={20} className="shrink-0" aria-hidden />
        </Link>
      )}

      <Link to={AUSBILDUNG_PATH} className="block">
        <Card className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-trust-soft text-trust-text">
            <IconRoute size={22} aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block text-base font-semibold">{t('home.road', { n: summary.done, total: summary.total })}</span>
            <span className="block text-base text-ink-2">{currentStep ? t('home.now', { step: t(currentStep.title) }) : t('roadmap.allDone')}</span>
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
