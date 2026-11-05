import { useNavigate } from 'react-router-dom'
import { AccountBlock } from '../components/AccountBlock'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useT } from '../i18n/I18nProvider'
import type { Key } from '../i18n/uz'
import { professionLabel } from '../profile/format'
import { useProfile } from '../profile/ProfileProvider'
import { answerKey } from '../profile/questions'

export default function ProfilePage() {
  const t = useT()
  const nav = useNavigate()
  const { profile } = useProfile()

  const rows: [Key, string][] = profile
    ? [
        ['profile.age', t(answerKey('ageRange', profile.ageRange))],
        ['profile.education', t(answerKey('education', profile.education))],
        ['profile.profession', professionLabel(profile, t)],
        ['profile.german', t(answerKey('germanLevel', profile.germanLevel))],
        ['profile.time', t(answerKey('dailyTime', profile.dailyTime))],
        ['profile.departure', t(answerKey('departure', profile.departure))]
      ]
    : []

  return (
    <div className="space-y-3">
      <PageHeader title={t('profile.title')} back backTo="/sozlamalar" />
      <AccountBlock />
      <Card className="py-1">
        {profile ? (
          <dl>
            {rows.map(([k, v]) => (
              <div key={k} className="flex min-h-[48px] items-center justify-between gap-3 border-b border-line py-2 last:border-0">
                <dt className="text-ink-2">{t(k)}</dt>
                <dd className="text-right font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="py-3 text-ink-2">{t('profile.empty')}</p>
        )}
      </Card>
      <Button variant="secondary" onClick={() => nav('/boshlash?qayta=1')}>
        {t('profile.redo')}
      </Button>
    </div>
  )
}
