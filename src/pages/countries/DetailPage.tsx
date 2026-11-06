import { IconAlertTriangle, IconShieldExclamation } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { Overlap, SourceLine, TrustHeader } from '../../components/countries/parts'
import { Card } from '../../components/ui/Card'
import type { Country, Program } from '../../content/countries'
import { stepById } from '../../content/ausbildung'
import { sourceSummary, type DetailBlock, type DetailSection, type ProgramContent } from '../../content/programs'
import { useI18n } from '../../i18n/I18nProvider'
import type { Key } from '../../i18n/uz'
import { reducedMotion } from '../../ui/feedback'
import { ProgramCta } from './ProgramCta'
import { payByYear } from './intro'

function Callout({ k, tone }: { k: Key; tone: 'warn' | 'danger' }) {
  const t = useI18n().t
  const warn = tone === 'warn'
  const Ic = warn ? IconAlertTriangle : IconShieldExclamation
  return (
    <div className={`mt-3 flex gap-2 rounded-xl px-3 py-3 text-base ${warn ? 'bg-warn-soft text-warn-text' : 'bg-danger-soft text-danger-text'}`}>
      <Ic size={22} className="mt-0.5 shrink-0" aria-hidden />
      <div>
        <p className="font-semibold">{warn ? t('step.warning') : t('roadmap.scamRisk')}</p>
        <p className="mt-1">{t(k)}</p>
      </div>
    </div>
  )
}

function Block({ b, text }: { b: DetailBlock; text: (k: Key) => string }) {
  const t = useI18n().t
  return (
    <>
      {b.sub && <h3 className="mt-3 text-base font-semibold text-ink-2">{t(b.sub)}</h3>}
      {b.as === 'ul' ? (
        <ul className="list-disc space-y-1.5 pl-5 text-base">
          {b.keys.map((k) => (
            <li key={k}>{text(k)}</li>
          ))}
        </ul>
      ) : (
        b.keys.map((k) =>
          b.note ? (
            <div key={k}>
              <p className="text-base">{text(k)}</p>
              <p className="text-base text-ink-2">{t(b.note)}</p>
            </div>
          ) : (
            <p key={k} className={`text-base ${b.strong ? 'font-semibold' : ''}`}>
              {text(k)}
            </p>
          )
        )
      )}
    </>
  )
}

function Section({ s, children }: { s: DetailSection; children: ReactNode }) {
  const t = useI18n().t
  return (
    <section id={`d-${s.id}`} aria-labelledby={`d-${s.id}-h`} className="scroll-mt-4">
      <Card>
        <h2 id={`d-${s.id}-h`} className="text-lg font-semibold">
          {t(s.title)}
        </h2>
        <div className="mt-2 space-y-2">{children}</div>
      </Card>
    </section>
  )
}

/** Batafsil sahifa (shablon): chiplar va boʻlimlar content.detail dan quriladi; boʻlimlar yopiq emas, ketma-ket oʻqiladi. */
export default function DetailPage({ country, program, content }: { country: Country; program: Program; content: ProgramContent }) {
  const { lang, t } = useI18n()
  const pay = payByYear(t('step.yol.f3'))
  const vars = { y1: pay[1] ?? '', y3: pay[3] ?? '', amount: stepById('yol')?.cost?.amount ?? '' }
  // Ausbildung: raqamlar step.yol.f3 dan; oʻqib boʻlmasa asl matn
  const text = (k: Key) => (k === 'intro.what' && !(pay[1] && pay[3]) ? t('step.yol.f3') : t(k, vars))
  const go = (id: string) => document.getElementById(`d-${id}`)?.scrollIntoView?.({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' })
  const src = sourceSummary(content)
  return (
    <div>
      <TrustHeader back={{ to: `/yol/${country.id}/${program.id}/kirish`, text: program.name[lang] }}>
        <h1 className="text-2xl font-medium">{content.roadmap ? t('detail.title') : `${program.name[lang]}: ${t('detail.titleShort')}`}</h1>
      </TrustHeader>

      <Overlap>
        <nav aria-label={t('detail.chips')} className="-mx-4 overflow-x-auto px-4 pb-1 pt-1">
          <ul className="flex w-max gap-2">
            {content.detail.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => go(s.id)}
                  className="flex min-h-[44px] items-center whitespace-nowrap rounded-full border-2 border-line bg-surface px-4 text-base font-semibold text-ink active:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {t(s.title)}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {content.detail.map((s) => {
          const blocks: DetailBlock[] = s.blocks ?? [{ keys: s.items, as: s.items.length === 1 ? 'p' : 'ul' }]
          return (
            <Section key={s.id} s={s}>
              {blocks.map((b, i) => (
                <Block key={i} b={b} text={text} />
              ))}
              {s.callout && <Callout k={s.callout} tone={s.calloutTone ?? 'warn'} />}
            </Section>
          )
        })}

        <p className="px-1 text-base text-ink-2" data-testid="source">
          <SourceLine text={t('countries.source', { name: src.names, date: src.date })} />
        </p>
        <ProgramCta content={content} />
      </Overlap>
    </div>
  )
}
