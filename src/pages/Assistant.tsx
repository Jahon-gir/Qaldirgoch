import { useEffect, useRef, useState, type FormEvent } from 'react'
import { IconAlertTriangle, IconExternalLink, IconLoader2, IconSend, IconSparkles } from '@tabler/icons-react'
import { askAi, MAX_QUESTION, safeUrl, type AiAnswer, type AiError } from '../ai/ask'
import { useAuth } from '../auth/AuthProvider'
import { useGoogleSignIn } from '../auth/useGoogleSignIn'
import { useI18n } from '../i18n/I18nProvider'
import type { Key } from '../i18n/uz'
import { supabase } from '../lib/supabase'
import { fmtDate } from '../safety/format'

const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const SUGGESTED: Key[] = ['ai.q1', 'ai.q2', 'ai.q3', 'ai.q4']
const ERR: Record<AiError, Key> = { auth: 'ai.err.auth', empty: 'ai.err.empty', long: 'ai.err.long', limit: 'ai.err.limit', offline: 'ai.err.offline', config: 'ai.err.config', ai: 'ai.err.ai' }

/** AI maslahatchi: faqat tasdiqlangan kontentdan javob, har javobda manba va sana. */
export default function Assistant() {
  const { t, lang } = useI18n()
  const { status } = useAuth()
  const google = useGoogleSignIn()
  const [q, setQ] = useState('')
  const [asked, setAsked] = useState('')
  const [busy, setBusy] = useState(false)
  const [res, setRes] = useState<AiAnswer | null>(null)
  const [err, setErr] = useState<AiError | null>(null)
  const answerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const r = document.documentElement
    r.dataset.surface = 'bank'
    return () => {
      delete r.dataset.surface
    }
  }, [])

  const send = async (text: string) => {
    if (busy) return
    setBusy(true)
    setErr(null)
    setRes(null)
    setAsked(text.trim())
    const r = await askAi(supabase, text, lang)
    setBusy(false)
    if (r.ok) setRes(r.data)
    else setErr(r.error)
    requestAnimationFrame(() => answerRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }))
  }
  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void send(q)
  }

  const signedIn = status === 'signedIn'

  return (
    <div className="space-y-4">
      <header className="bank-head -mx-4 -mt-[max(1rem,env(safe-area-inset-top))] px-4 pb-6 pt-[max(1.5rem,env(safe-area-inset-top))] text-white">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/15">
            <IconSparkles size={30} aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold leading-tight">{t('assistant.title')}</h1>
            <p className="text-base text-white">{t('ai.sub')}</p>
          </div>
        </div>
      </header>

      {!signedIn ? (
        <div className="bank-card space-y-3 p-4">
          <p className="text-base">{t('ai.signin')}</p>
          {google.configured && (
            <button type="button" onClick={google.start} disabled={google.busy} className={`bank-btn flex min-h-[48px] w-full items-center justify-center rounded-btn px-4 text-base font-semibold text-white disabled:opacity-60 ${focus}`}>
              {t('ai.signinBtn')}
            </button>
          )}
        </div>
      ) : (
        <>
          <form onSubmit={onSubmit} className="bank-card space-y-3 p-4">
            <label htmlFor="ai-q" className="block text-base font-semibold">
              {t('ai.label')}
            </label>
            <textarea
              id="ai-q"
              value={q}
              onChange={(e) => setQ(e.target.value.slice(0, MAX_QUESTION))}
              rows={3}
              maxLength={MAX_QUESTION}
              placeholder={t('ai.placeholder')}
              className="w-full resize-none rounded-btn border border-line bg-bg p-3 text-base text-ink placeholder:text-ink-3"
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-ink-3">
                {q.length}/{MAX_QUESTION}
              </span>
              <button type="submit" disabled={busy || q.trim().length < 3} className={`bank-btn flex min-h-[48px] items-center gap-2 rounded-btn px-5 text-base font-semibold text-white disabled:opacity-50 ${focus}`}>
                {busy ? <IconLoader2 size={20} className="animate-spin" aria-hidden /> : <IconSend size={20} aria-hidden />}
                {t('ai.send')}
              </button>
            </div>
          </form>

          <section aria-label={t('ai.suggested')} className="space-y-2">
            <h2 className="px-1 text-base font-semibold text-ink-2">{t('ai.suggested')}</h2>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED.map((k) => (
                <button
                  key={k}
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setQ(t(k))
                    void send(t(k))
                  }}
                  className={`min-h-[44px] rounded-full bg-trust-soft px-4 py-2 text-left text-base text-trust-text active:opacity-80 disabled:opacity-60 ${focus}`}
                >
                  {t(k)}
                </button>
              ))}
            </div>
          </section>

          <div ref={answerRef} aria-live="polite" className="scroll-mt-4">
            {busy && (
              <div role="status" className="bank-card flex items-center gap-3 p-4 text-ink-2">
                <IconLoader2 size={22} className="animate-spin" aria-hidden />
                <span className="text-base">{t('ai.thinking')}</span>
              </div>
            )}
            {err && (
              <div role="alert" className="flex gap-3 rounded-card bg-warn-soft p-4 text-warn-text">
                <IconAlertTriangle size={22} className="mt-0.5 shrink-0" aria-hidden />
                <p className="text-base">{t(ERR[err])}</p>
              </div>
            )}
            {res && (
              <article className="bank-card space-y-3 p-4" data-testid="ai-answer">
                {asked && <p className="text-sm font-semibold text-ink-2">{asked}</p>}
                {!res.found && <p className="inline-block rounded-full bg-warn-soft px-3 py-1 text-sm font-semibold text-warn-text">{t('ai.noInfo')}</p>}
                {/* Matn sifatida (React escape qiladi), HTML emas */}
                <p className="whitespace-pre-line text-base leading-relaxed">{res.answer}</p>
                {res.sources.length > 0 && (
                  <div className="space-y-1 border-t border-line pt-3">
                    <p className="text-sm font-semibold text-ink-2">{t('ai.sources')}</p>
                    <ul className="space-y-1">
                      {res.sources.map((s) => {
                        const href = safeUrl(s.url)
                        return (
                          <li key={s.url}>
                            {href ? (
                              <a href={href} target="_blank" rel="noopener noreferrer" className={`flex min-h-[44px] items-center gap-2 text-sm font-semibold text-trust-text underline ${focus}`}>
                                <IconExternalLink size={16} className="shrink-0" aria-hidden />
                                <span>
                                  {s.title} · {t('ai.checked', { date: fmtDate(s.checkedAt) })}
                                </span>
                              </a>
                            ) : (
                              <span className="text-sm">{s.title}</span>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
                {typeof res.left === 'number' && <p className="text-sm text-ink-3">{t('ai.left', { n: res.left })}</p>}
              </article>
            )}
          </div>
        </>
      )}

      <p className="px-1 text-sm text-ink-2">{t('ai.disclaimer')}</p>
    </div>
  )
}
