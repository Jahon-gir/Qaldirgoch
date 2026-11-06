import { Link } from 'react-router-dom'
import { IconAlertTriangle, IconShieldExclamation } from '@tabler/icons-react'
import { Overlap, SourceLine, TrustHeader } from '../../components/countries/parts'
import { Card } from '../../components/ui/Card'
import { AUSBILDUNG_INTRO_PATH, AUSBILDUNG_PATH, countryById, programById } from '../../content/countries'
import { BIBB, MIG } from '../../content/ausbildung'
import { useI18n } from '../../i18n/I18nProvider'
import type { Key } from '../../i18n/uz'
import { reducedMotion } from '../../ui/feedback'
import { payByYear } from './intro'

const program = programById(countryById('de')!, 'ausbildung')!

const SECTIONS = ['what', 'money', 'lang', 'docs', 'job', 'contract', 'abroad'] as const
type SectionId = (typeof SECTIONS)[number]
const label = (id: SectionId) => `detail.${id}` as Key

function Bullets({ keys }: { keys: Key[] }) {
  const t = useI18n().t
  return (
    <ul className="list-disc space-y-1.5 pl-5 text-base">
      {keys.map((k) => (
        <li key={k}>{t(k)}</li>
      ))}
    </ul>
  )
}
function Sub({ title }: { title: Key }) {
  return <h3 className="mt-3 text-base font-semibold text-ink-2">{useI18n().t(title)}</h3>
}
function Warn({ k }: { k: Key }) {
  const t = useI18n().t
  return (
    <div className="mt-3 flex gap-2 rounded-xl bg-warn-soft px-3 py-3 text-base text-warn-text">
      <IconAlertTriangle size={22} className="mt-0.5 shrink-0" aria-hidden />
      <div>
        <p className="font-semibold">{t('step.warning')}</p>
        <p className="mt-1">{t(k)}</p>
      </div>
    </div>
  )
}
function Danger({ k }: { k: Key }) {
  const t = useI18n().t
  return (
    <div className="mt-3 flex gap-2 rounded-xl bg-danger-soft px-3 py-3 text-base text-danger-text">
      <IconShieldExclamation size={22} className="mt-0.5 shrink-0" aria-hidden />
      <div>
        <p className="font-semibold">{t('roadmap.scamRisk')}</p>
        <p className="mt-1">{t(k)}</p>
      </div>
    </div>
  )
}
function Section({ id, children }: { id: SectionId; children: React.ReactNode }) {
  const t = useI18n().t
  return (
    <section id={`d-${id}`} aria-labelledby={`d-${id}-h`} className="scroll-mt-4">
      <Card>
        <h2 id={`d-${id}-h`} className="text-lg font-semibold">
          {t(label(id))}
        </h2>
        <div className="mt-2 space-y-2">{children}</div>
      </Card>
    </section>
  )
}

/** Ausbildung haqida toʻliq: boʻlimlar yopiq emas, ketma-ket oʻqiladi. Hamma matn mavjud tasdiqlangan kalitlardan. */
export default function DetailPage() {
  const { lang, t } = useI18n()
  const pay = payByYear(t('step.yol.f3'))
  const go = (id: SectionId) => document.getElementById(`d-${id}`)?.scrollIntoView?.({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' })
  return (
    <div>
      <TrustHeader back={{ to: AUSBILDUNG_INTRO_PATH, text: program.name[lang] }}>
        <h1 className="text-2xl font-medium">{t('detail.title')}</h1>
      </TrustHeader>

      <Overlap>
        <nav aria-label={t('detail.chips')} className="-mx-4 overflow-x-auto px-4 pb-1 pt-1">
          <ul className="flex w-max gap-2">
            {SECTIONS.map((id) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => go(id)}
                  className="flex min-h-[44px] items-center whitespace-nowrap rounded-full border-2 border-line bg-surface px-4 text-base font-semibold text-ink active:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {t(label(id))}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <Section id="what">
          <p className="text-base font-semibold">{t('step.yol.t1')}</p>
          <p className="text-base">{pay[1] && pay[3] ? t('intro.what', { y1: pay[1], y3: pay[3] }) : t('step.yol.f3')}</p>
        </Section>

        <Section id="money">
          <p className="text-base">{t('step.yol.f1')}</p>
          <p className="text-base">{t('step.yol.f2')}</p>
          <div>
            <p className="text-base">{t('step.yol.f3')}</p>
            <p className="text-base text-ink-2">{t('detail.perMonthGross')}</p>
          </div>
          <Warn k="step.yol.f4" />
        </Section>

        <Section id="lang">
          <p className="text-base">{t('step.nemis.f1')}</p>
          <Bullets keys={['step.sertifikat.t1', 'step.nemis.t1', 'step.nemis.t2']} />
        </Section>

        <Section id="docs">
          <Sub title="step.tasks" />
          <Bullets keys={['step.hujjatlar.t1', 'step.hujjatlar.t2', 'step.hujjatlar.t3']} />
          <Sub title="step.documents" />
          <Bullets keys={['step.hujjatlar.d1', 'step.hujjatlar.d2', 'step.hujjatlar.d3', 'step.hujjatlar.d4', 'step.hujjatlar.d5']} />
        </Section>

        <Section id="job">
          <Bullets keys={['step.joy.t1', 'step.joy.t2']} />
          <Danger k="step.joy.warning" />
        </Section>

        <Section id="contract">
          <Bullets keys={['step.shartnoma.t1', 'step.shartnoma.t2', 'step.viza.t1', 'step.viza.t2']} />
          <Sub title="step.documents" />
          <Bullets keys={['step.viza.d1', 'step.viza.d2', 'step.viza.d3', 'step.viza.d4']} />
          <Danger k="step.viza.warning" />
        </Section>

        <Section id="abroad">
          <Bullets keys={['step.jonash.t1', 'step.jonash.t2', 'step.jonash.t3', 'step.jonash.t4', 'step.germaniyada.t1', 'step.germaniyada.t2']} />
        </Section>

        <p className="px-1 text-base text-ink-2" data-testid="source">
          <SourceLine text={t('countries.source', { name: `${MIG.title}, ${BIBB.title}`, date: MIG.checkedAt })} />
        </p>
        <Link
          to={AUSBILDUNG_PATH}
          className="flex min-h-[52px] items-center justify-center rounded-btn bg-accent px-4 py-3 text-base font-semibold text-on-accent active:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {t('intro.openMap')}
        </Link>
      </Overlap>
    </div>
  )
}
