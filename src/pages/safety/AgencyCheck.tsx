import { useMemo, useState } from 'react'
import { IconChevronRight, IconCircleCheck, IconSearch, IconX } from '@tabler/icons-react'
import { VocabHeader } from '../../components/vocab/parts'
import { CallButton, Callout, SourceLine } from '../../components/safety/parts'
import { useT, type TFn } from '../../i18n/I18nProvider'
import { useBack } from '../../lib/useHistoryAnchor'
import { fmtDate } from '../../safety/format'
import { classifyQuery, searchAgencies, type Agency } from '../../safety/search'
import { useAgencies } from '../../safety/useAgencies'

const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-ink-2">{label}</dt>
      <dd className="break-words text-base">{children}</dd>
    </div>
  )
}

const licenseText = (t: TFn, a: Agency) =>
  a.litsenziya_sanasi ? t('safety.license.value', { no: a.litsenziya_raqami, date: fmtDate(a.litsenziya_sanasi) }) : `№${a.litsenziya_raqami}`

/** a) Topildi. Foydalanuvchi matni emas, reestr maʼlumoti; React matnni oʻzi tozalaydi (dangerouslySetInnerHTML yoʻq). */
function Found({ agency }: { agency: Agency }) {
  const t = useT()
  return (
    <article className="bank-card space-y-4 p-4" data-testid="agency-found">
      <p className="inline-flex items-center gap-2 rounded-full bg-success-soft px-3 py-1.5 text-base font-semibold text-success-text">
        <IconCircleCheck size={20} aria-hidden />
        {t('safety.found')}
      </p>
      <h2 className="break-words text-xl font-semibold leading-snug">{agency.nomi}</h2>
      <dl className="space-y-3">
        <Row label={t('safety.row.license')}>{licenseText(t, agency)}</Row>
        {agency.manzil && <Row label={t('safety.row.address')}>{agency.manzil}</Row>}
        {agency.telefonlar.length > 0 && (
          <Row label={t('safety.row.phone')}>
            {agency.telefonlar.map((p) => (
              <span key={p} className="block">
                {p}
              </span>
            ))}
          </Row>
        )}
        {agency.email && <Row label={t('safety.row.email')}>{agency.email}</Row>}
      </dl>
      <Callout>{t('safety.found.note')}</Callout>
      <CallButton />
      <SourceLine agency={agency} />
    </article>
  )
}

/** c) Topilmadi — sariq blok (qizil emas). */
function NotFound({ source }: { source: Agency }) {
  const t = useT()
  return (
    <article className="bank-card space-y-4 p-4" data-testid="agency-notfound">
      <Callout title={t('safety.nf.title')}>{t('safety.nf.body')}</Callout>
      <div>
        <h2 className="text-base font-semibold">{t('safety.nf.before')}</h2>
        <ol className="mt-2 list-decimal space-y-2 pl-6 text-base">
          <li>{t('safety.nf.s1')}</li>
          <li>{t('safety.nf.s2')}</li>
          <li>{t('safety.nf.s3')}</li>
        </ol>
      </div>
      <CallButton />
      <SourceLine agency={source} />
    </article>
  )
}

export default function AgencyCheck() {
  const t = useT()
  const goBack = useBack('/xavfsizlik')
  const { status, agencies, reload } = useAgencies()
  const [query, setQuery] = useState('')
  const [pickedId, setPickedId] = useState<string | null>(null)

  const searching = classifyQuery(query).kind !== 'empty'
  const results = useMemo(() => searchAgencies(agencies, query), [agencies, query])
  const picked = results.length > 1 ? results.find((a) => a.id === pickedId) : undefined
  const change = (v: string) => {
    setQuery(v)
    setPickedId(null)
  }

  return (
    <div className="space-y-4">
      <VocabHeader bank title={t('safety.check.title')} onBack={goBack} />

      <div className="bank-card flex items-center gap-1 pl-3 pr-1 focus-within:outline focus-within:outline-2 focus-within:outline-accent">
        <IconSearch size={22} className="shrink-0 text-ink-3" aria-hidden />
        <input
          type="text"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={100}
          value={query}
          onChange={(e) => change(e.target.value)}
          aria-label={t('safety.search.label')}
          placeholder={t('safety.search.placeholder')}
          className="min-h-[52px] min-w-0 flex-1 bg-transparent px-2 text-base text-ink outline-none placeholder:text-ink-3"
        />
        {query && (
          <button type="button" onClick={() => change('')} aria-label={t('safety.search.clear')} className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-2 active:bg-bank-soft ${focus}`}>
            <IconX size={22} aria-hidden />
          </button>
        )}
      </div>

      <div aria-live="polite" className="space-y-3">
        {status === 'loading' && (
          <p role="status" className="px-1 text-base text-ink-2">
            {t('safety.loading')}
          </p>
        )}
        {status === 'error' && (
          <div className="space-y-3">
            <Callout>{t('safety.error')}</Callout>
            <button type="button" onClick={reload} className={`bank-btn min-h-[52px] w-full rounded-btn px-4 py-3 text-base font-semibold text-white active:opacity-90 ${focus}`}>
              {t('safety.retry')}
            </button>
          </div>
        )}
        {status === 'ready' && !searching && <p className="px-1 text-base text-ink-2">{t('safety.search.hint')}</p>}
        {status === 'ready' && searching && results.length === 0 && <NotFound source={agencies[0]} />}
        {status === 'ready' && results.length === 1 && <Found agency={results[0]} />}
        {status === 'ready' && results.length > 1 && picked && (
          <>
            <button type="button" onClick={() => setPickedId(null)} className={`inline-flex min-h-[44px] items-center px-1 text-base font-semibold text-trust-text underline ${focus}`}>
              {t('safety.many.back')}
            </button>
            <Found agency={picked} />
          </>
        )}
        {status === 'ready' && results.length > 1 && !picked && (
          <>
            <h2 className="px-1 text-base font-semibold">{t('safety.many.title', { n: results.length })}</h2>
            <ul className="space-y-2">
              {results.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setPickedId(a.id)}
                    aria-label={t('safety.many.item', { name: a.nomi, no: a.litsenziya_raqami })}
                    className={`bank-card flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left active:opacity-90 ${focus}`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-base font-semibold">{a.nomi}</span>
                      <span className="block text-sm text-ink-2">№{a.litsenziya_raqami}</span>
                    </span>
                    <IconChevronRight size={22} className="shrink-0 text-ink-3" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
