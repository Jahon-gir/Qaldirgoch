import { IconLanguage, IconRoute } from '@tabler/icons-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Notice } from '../../components/ui/Notice'
import { useT } from '../../i18n/I18nProvider'
import { germanPath, professionLabel } from '../../profile/format'
import { answerKey, type Answers } from '../../profile/questions'

/**
 * Natija: faqat foydalanuvchining oʻz javoblari.
 * Taxminiy muddat, foiz yoki "imkoniyat" bahosi koʻrsatilmaydi (CLAUDE.md, 6-qoida).
 */
export function ResultStep({ answers, onFinish }: { answers: Answers; onFinish: (to: string) => void }) {
  const t = useT()

  if (answers.ageRange === 'under18') {
    return (
      <>
        <div className="flex flex-col items-center pt-10 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-trust-soft text-trust-text">
            <IconLanguage size={40} aria-hidden />
          </span>
          <h1 className="sr-only">{t('result.minorHeading')}</h1>
        </div>
        <div className="mt-6">
          <Notice>{t('result.minor')}</Notice>
        </div>
        <div className="mt-auto pt-6">
          <Button onClick={() => onFinish('/til')}>
            {t('result.minorCta')}
          </Button>
        </div>
      </>
    )
  }

  const rows: [string, string][] = [
    [t('result.german'), germanPath(answers.germanLevel, t)],
    [t('result.profession'), professionLabel(answers, t)],
    [t('result.time'), t('result.timeValue', { t: t(answerKey('dailyTime', answers.dailyTime)) })]
  ]

  return (
    <>
      <div className="flex flex-col items-center pt-10 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-success-soft text-success-text">
          <IconRoute size={40} aria-hidden />
        </span>
        <h1 className="mt-4 text-2xl font-semibold">{t('result.title')}</h1>
        <p className="mt-1 text-ink-2">{t('result.text')}</p>
      </div>

      <Card className="mt-6 py-1">
        <dl>
          {rows.map(([k, v]) => (
            <div key={k} className="flex min-h-[48px] items-center justify-between gap-3 border-b border-line py-2 last:border-0">
              <dt className="text-ink-2">{k}</dt>
              <dd className="text-right font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <div className="mt-3">
        <Notice>{t('result.firstStep')}</Notice>
      </div>

      <div className="mt-auto pt-6">
        <Button onClick={() => onFinish('/yol/de/ausbildung')}>
          {t('result.cta')}
        </Button>
      </div>
    </>
  )
}
