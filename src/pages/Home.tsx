import { Link, useNavigate } from 'react-router-dom'
import { IconChevronRight, IconRoute, IconSettings, IconShieldCheck } from '@tabler/icons-react'
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
import { useDirection } from '../german/useDirection'
import { useLessons } from '../german/LessonsProvider'
import { levelProgress, nextUnfinished } from '../german/logic'

export default function Home() {
  const nav = useNavigate()
  const { lang, t } = useI18n()
  const { profile } = useProfile()
  const { results } = useLessons()
  const { direction } = useDirection()
  const nextLesson = nextUnfinished(direction, results)
  const a1 = levelProgress('A1', direction, results)
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
        <p className="mt-0.5 text-lg font-semibold">{!nextLesson ? t('german.allDone') : a1.done === 0 ? t('home.firstLesson') : nextLesson.title[lang]}</p>
        <div className="mt-3">
          <ProgressBar value={a1.percent} tone="success" label={t('home.progressLabel')} />
        </div>
        <p className="mt-1.5 text-sm text-ink-2">{t('german.homeCount', { n: a1.done, total: a1.total })}</p>
        <Button className="mt-3" onClick={() => nav('/til')}>
          {t('home.start')}
        </Button>
      </Card>

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
