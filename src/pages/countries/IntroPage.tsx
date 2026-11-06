import { Link } from 'react-router-dom'
import { IconBook2, IconCoinEuro, IconContract, IconInfoCircle, IconLanguage, IconShieldExclamation, IconAlertTriangle, type Icon } from '@tabler/icons-react'
import { Overlap, SourceLine, TrustHeader } from '../../components/countries/parts'
import { Card } from '../../components/ui/Card'
import { AUSBILDUNG_DETAIL_PATH, AUSBILDUNG_PATH, countryById, programById } from '../../content/countries'
import { AUSBILDUNG_STEPS, BIBB, MIG, stepById } from '../../content/ausbildung'
import { useI18n } from '../../i18n/I18nProvider'
import { hasStarted } from '../../progress/logic'
import { useProgress } from '../../progress/ProgressProvider'
import { payByYear } from './intro'

const de = countryById('de')!
const program = programById(de, 'ausbildung')!

function Need({ Ic, title, text }: { Ic: Icon; title: string; text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-trust-soft text-trust-text">
        <Ic size={24} aria-hidden />
      </span>
      <span className="min-w-0 flex-1 pt-0.5">
        <span className="block text-base font-semibold">{title}</span>
        <span className="block break-words text-base text-ink-2">{text}</span>
      </span>
    </li>
  )
}

/** Ausbildung kirish ekrani: nima bu, nima kerak, qanday ishlaydi. Yangi fakt yoʻq — barcha raqam va matn mavjud kalitlardan. */
export default function IntroPage() {
  const { lang, t } = useI18n()
  const { items } = useProgress()
  const started = hasStarted(items)
  const pay = payByYear(t('step.yol.f3'))
  const money = stepById('yol')?.cost?.amount
  const sources = `${MIG.title}, ${BIBB.title}`
  return (
    <div>
      <TrustHeader back={{ to: '/yol/de', text: de.name[lang] }}>
        <h1 className="text-2xl font-medium">{program.name[lang]}</h1>
        <p className="mt-2 text-base opacity-90">{program.short[lang]}</p>
      </TrustHeader>

      <Overlap>
        <Card>
          <h2 className="text-lg font-semibold">{t('intro.whatTitle')}</h2>
          <p className="mt-1 text-base">{pay[1] && pay[3] ? t('intro.what', { y1: pay[1], y3: pay[3] }) : t('step.yol.f3')}</p>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">{t('intro.needTitle')}</h2>
          <ul className="mt-3 space-y-3">
            <Need Ic={IconLanguage} title={t('intro.needLang')} text={t('intro.needLangText')} />
            {money != null && <Need Ic={IconCoinEuro} title={t('intro.needMoney')} text={t('intro.needMoneyText', { amount: money })} />}
            <Need Ic={IconContract} title={t('intro.needContract')} text={t('intro.needContractText')} />
          </ul>
        </Card>

        <div className="flex gap-2 rounded-xl bg-warn-soft px-3 py-3 text-base text-warn-text">
          <IconAlertTriangle size={22} className="mt-0.5 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">{t('step.warning')}</p>
            <p className="mt-1">{t('step.yol.f4')}</p>
          </div>
        </div>

        <Card>
          <h2 className="text-lg font-semibold">{t('intro.howTitle')}</h2>
          <div className="mt-2 flex items-center gap-3">
            <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-trust-soft text-xl font-bold text-trust-text">
              {AUSBILDUNG_STEPS.length}
            </span>
            <p className="min-w-0 flex-1 text-base">
              <span className="sr-only">{AUSBILDUNG_STEPS.length} </span>
              {t('intro.how')}
            </p>
          </div>
          <Link
            to={AUSBILDUNG_DETAIL_PATH}
            className="mt-3 flex min-h-[48px] items-center justify-center gap-2 rounded-btn border-2 border-head bg-surface px-4 text-base font-semibold text-trust-text active:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <IconBook2 size={22} aria-hidden />
            {t('intro.readMore')}
          </Link>
        </Card>

        <div className="flex gap-2 rounded-xl bg-danger-soft px-3 py-3 text-base text-danger-text">
          <IconShieldExclamation size={22} className="mt-0.5 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">{t('roadmap.scamRisk')}</p>
            <p className="mt-1">{t('step.viza.warning')}</p>
          </div>
        </div>

        <p className="flex gap-2 px-1 text-base text-ink-2" data-testid="source">
          <IconInfoCircle size={20} className="mt-0.5 shrink-0" aria-hidden />
          <span>
            <SourceLine text={t('countries.source', { name: sources, date: MIG.checkedAt })} />
          </span>
        </p>

        <Link
          to={AUSBILDUNG_PATH}
          className="flex min-h-[52px] items-center justify-center rounded-btn bg-accent px-4 py-3 text-base font-semibold text-on-accent active:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {started ? t('common.continue') : t('intro.openMap')}
        </Link>
      </Overlap>
    </div>
  )
}
