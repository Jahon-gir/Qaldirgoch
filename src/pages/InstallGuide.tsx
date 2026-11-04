import { Fragment, type ReactNode } from 'react'
import { IconShare2 } from '@tabler/icons-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { useT } from '../i18n/I18nProvider'
import { useInstall } from '../pwa/useInstall'

/** "{nom}" oʻrinbosarlarini tayyor elementlar bilan almashtiradi (tillarda soʻz tartibi har xil). */
function rich(text: string, parts: Record<string, ReactNode>): ReactNode {
  return text.split(/(\{\w+\})/).map((p, i) => <Fragment key={i}>{parts[p.slice(1, -1)] ?? p}</Fragment>)
}

/** iPhone (Safari) va oʻrnatib boʻlmaydigan brauzerlar uchun koʻrsatma. Oʻrnatilgan boʻlsa ham ochiladi. */
export default function InstallGuide() {
  const t = useT()
  const { installed } = useInstall()
  const share = (
    <span className="inline-flex items-center gap-1 align-bottom">
      <IconShare2 size={20} className="text-trust-text" aria-hidden />
      <strong>{t('install.share')}</strong>
    </span>
  )
  const steps: ReactNode[] = [
    t('install.step1'),
    rich(t('install.step2'), { share }),
    rich(t('install.step3'), { add: <strong>{t('install.add')}</strong> })
  ]
  return (
    <div className="space-y-3">
      <PageHeader title={t('settings.install')} back />
      <p className="text-base text-ink-2">{t('install.intro')}</p>
      {installed ? (
        <Card role="status">
          <p className="text-base font-semibold">{t('install.already')}</p>
        </Card>
      ) : (
        <Card>
          <ol className="space-y-4">
            {steps.map((s, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-trust text-base font-semibold text-surface" aria-hidden>
                  {i + 1}
                </span>
                <span className="text-base">{s}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  )
}
