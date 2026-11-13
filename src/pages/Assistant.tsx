import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { IconAlertTriangle, IconArrowLeft, IconArrowUp, IconCheck, IconCopy, IconEdit, IconExternalLink, IconPlayerStop, IconRefresh, IconRobot, IconVolume } from '@tabler/icons-react'
import { askAi, MAX_QUESTION, safeUrl, type AiError, type AiSource } from '../ai/ask'
import { useI18n } from '../i18n/I18nProvider'
import type { Key } from '../i18n/uz'
import { supabase } from '../lib/supabase'
import { useBack } from '../lib/useHistoryAnchor'
import { fmtDate } from '../safety/format'

const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const SUGGESTED: Key[] = ['ai.q1', 'ai.q2', 'ai.q3', 'ai.q4']
const ERR: Record<AiError, Key> = { auth: 'ai.err.auth', empty: 'ai.err.empty', long: 'ai.err.long', limit: 'ai.err.limit', offline: 'ai.err.offline', config: 'ai.err.config', ai: 'ai.err.ai' }
const SPEECH_LANG = { uz: 'uz-UZ', 'uz-Cyrl': 'uz-UZ', ru: 'ru-RU' } as const

type Msg =
  | { id: number; role: 'user'; text: string }
  | { id: number; role: 'ai'; q: string; pending: true }
  | { id: number; role: 'ai'; q: string; pending?: false; text: string; found: boolean; sources: AiSource[] }
  | { id: number; role: 'ai'; q: string; pending?: false; error: AiError }

/** Robot avatar (marjon doira). */
export function AiAvatar({ size = 28 }: { size?: number }) {
  return (
    <span aria-hidden className="flex shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong" style={{ width: size, height: size }}>
      <IconRobot size={Math.round(size * 0.6)} />
    </span>
  )
}

let nextId = 1

/**
 * AI maslahatchi — chat koʻrinishi (ChatGPT uslubi, Jorj tasdiqlagan mockup 2026-11-13).
 * Har savol serverga alohida yuboriladi; suhbat faqat ekran ochiq turganda saqlanadi.
 * Javob matn sifatida chiqadi (React escape qiladi), HTML emas.
 */
export default function Assistant() {
  const { t, lang } = useI18n()
  const goBack = useBack('/')
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [q, setQ] = useState('')
  const [copied, setCopied] = useState<number | null>(null)
  const [speaking, setSpeaking] = useState<number | null>(null)
  const active = useRef<number | null>(null) // javobi kutilayotgan xabar id
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const busy = msgs.some((m) => m.role === 'ai' && m.pending)

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'end' })
  }, [msgs])

  useEffect(() => {
    return () => {
      active.current = null
      if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel()
    }
  }, [])

  // Matn maydoni yozilgan sari oʻsadi (5 qatorgacha)
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`
  }, [q])

  const ask = async (question: string, replaceId?: number) => {
    const text = question.trim()
    if (!text || busy) return
    const id = replaceId ?? nextId++
    active.current = id
    setMsgs((m) => {
      const pend: Msg = { id, role: 'ai', q: text, pending: true }
      if (replaceId !== undefined) return m.map((x) => (x.id === replaceId ? pend : x))
      return [...m, { id: nextId++, role: 'user', text }, pend]
    })
    const r = await askAi(supabase, text, lang)
    if (active.current !== id) return // toʻxtatilgan yoki yangi suhbat
    active.current = null
    setMsgs((m) => m.map((x) => (x.id !== id ? x : r.ok ? { id, role: 'ai', q: text, text: r.data.answer, found: r.data.found, sources: r.data.sources } : { id, role: 'ai', q: text, error: r.error })))
  }

  const stop = () => {
    const id = active.current
    active.current = null
    setMsgs((m) => m.filter((x) => x.id !== id))
  }

  const newChat = () => {
    active.current = null
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel()
    setSpeaking(null)
    setMsgs([])
    setQ('')
  }

  const submit = (e?: FormEvent) => {
    e?.preventDefault()
    if (busy) return stop()
    if (q.trim().length < 3) return
    void ask(q)
    setQ('')
  }

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Kompyuterda Enter — yuborish, Shift+Enter — yangi qator; telefonda Enter yangi qator
    const fine = typeof matchMedia !== 'undefined' && matchMedia('(pointer: fine)').matches
    if (fine && e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  const copy = async (id: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500)
    } catch {
      /* ruxsat yoʻq */
    }
  }

  const speak = (id: number, text: string) => {
    if (typeof speechSynthesis === 'undefined') return
    speechSynthesis.cancel()
    if (speaking === id) return setSpeaking(null)
    const u = new SpeechSynthesisUtterance(text)
    u.lang = SPEECH_LANG[lang]
    u.onend = () => setSpeaking((s) => (s === id ? null : s))
    setSpeaking(id)
    speechSynthesis.speak(u)
  }

  const iconBtn = `flex h-11 w-11 items-center justify-center rounded-full text-ink-3 active:bg-surface-2 ${focus}`

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-md flex-col bg-surface">
      <header className="flex shrink-0 items-center gap-2 border-b border-line px-2 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <button type="button" onClick={goBack} aria-label={t('common.back')} className={`${iconBtn} text-ink-2`}>
          <IconArrowLeft size={24} aria-hidden />
        </button>
        <AiAvatar size={32} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold leading-tight">{t('assistant.title')}</h1>
          <p className="truncate text-sm text-ink-3">{t('ai.sub')}</p>
        </div>
        <button type="button" onClick={newChat} aria-label={t('ai.newChat')} title={t('ai.newChat')} className={`${iconBtn} text-ink-2`}>
          <IconEdit size={22} aria-hidden />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4" aria-live="polite">
        {msgs.length === 0 ? (
          <div className="flex min-h-full flex-col items-center justify-center gap-3 py-6 text-center">
            <AiAvatar size={64} />
            <h2 className="text-2xl font-semibold">{t('ai.empty.title')}</h2>
            <p className="text-base text-ink-2">{t('ai.empty.sub')}</p>
            <div className="mt-3 grid w-full grid-cols-2 gap-2" role="group" aria-label={t('ai.suggested')}>
              {SUGGESTED.map((k) => (
                <button key={k} type="button" onClick={() => void ask(t(k))} className={`min-h-[64px] rounded-2xl border border-line p-3 text-left text-base leading-snug active:bg-bg ${focus}`}>
                  {t(k)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul className="space-y-5 py-4">
            {msgs.map((m) =>
              m.role === 'user' ? (
                <li key={m.id} className="flex justify-end">
                  <p className="max-w-[85%] whitespace-pre-line break-words rounded-[20px] rounded-br-md bg-bg px-4 py-2.5 text-base">{m.text}</p>
                </li>
              ) : (
                <li key={m.id} className="flex items-start gap-2.5" data-testid="ai-answer">
                  <span className="mt-0.5">
                    <AiAvatar />
                  </span>
                  <div className="min-w-0 flex-1">
                    {m.pending ? (
                      <div role="status" className="flex h-7 items-center gap-1" aria-label={t('ai.thinking')}>
                        {[0, 1, 2].map((i) => (
                          <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-ink-3 motion-reduce:animate-none" style={{ animationDelay: `${i * 150}ms` }} />
                        ))}
                      </div>
                    ) : 'error' in m ? (
                      <div role="alert" className="flex items-start gap-2 rounded-2xl bg-warn-soft p-3 text-warn-text">
                        <IconAlertTriangle size={20} className="mt-0.5 shrink-0" aria-hidden />
                        <div className="min-w-0 flex-1">
                          <p className="text-base">{t(ERR[m.error])}</p>
                          {m.error !== 'limit' && (
                            <button type="button" onClick={() => void ask(m.q, m.id)} className={`mt-1 flex min-h-[44px] items-center gap-1.5 text-base font-semibold underline ${focus}`}>
                              <IconRefresh size={18} aria-hidden />
                              {t('ai.retry')}
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        {!m.found && <p className="mb-1.5 inline-block rounded-full bg-warn-soft px-3 py-0.5 text-sm font-semibold text-warn-text">{t('ai.noInfo')}</p>}
                        <p className="whitespace-pre-line break-words text-base leading-relaxed">{m.text}</p>
                        {m.sources.length > 0 && (
                          <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={t('ai.sources')}>
                            {m.sources.map((s) => {
                              const href = safeUrl(s.url)
                              const label = `${s.title} · ${fmtDate(s.checkedAt)}`
                              return (
                                <li key={s.url}>
                                  {href ? (
                                    <a href={href} target="_blank" rel="noopener noreferrer" title={t('ai.checked', { date: fmtDate(s.checkedAt) })} className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-bg px-3 text-sm text-ink-2 active:opacity-80 ${focus}`}>
                                      <IconExternalLink size={14} aria-hidden />
                                      {label}
                                    </a>
                                  ) : (
                                    <span className="inline-flex min-h-[36px] items-center rounded-full bg-bg px-3 text-sm text-ink-2">{label}</span>
                                  )}
                                </li>
                              )
                            })}
                          </ul>
                        )}
                        <div className="-ml-3 mt-1 flex">
                          <button type="button" onClick={() => void copy(m.id, m.text)} aria-label={t(copied === m.id ? 'ai.copied' : 'ai.copy')} className={iconBtn}>
                            {copied === m.id ? <IconCheck size={18} aria-hidden /> : <IconCopy size={18} aria-hidden />}
                          </button>
                          <button type="button" onClick={() => speak(m.id, m.text)} aria-pressed={speaking === m.id} aria-label={t('ai.listen')} className={`${iconBtn} ${speaking === m.id ? 'text-accent' : ''}`}>
                            <IconVolume size={18} aria-hidden />
                          </button>
                          <button type="button" onClick={() => void ask(m.q, m.id)} disabled={busy} aria-label={t('ai.retry')} className={`${iconBtn} disabled:opacity-40`}>
                            <IconRefresh size={18} aria-hidden />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </li>
              )
            )}
          </ul>
        )}
        <div ref={endRef} />
      </div>

      <div className="shrink-0 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <form onSubmit={submit} className="flex items-end gap-2 rounded-[26px] border border-line bg-surface py-1.5 pl-4 pr-1.5">
          <label htmlFor="ai-q" className="sr-only">
            {t('ai.placeholder')}
          </label>
          <textarea
            id="ai-q"
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value.slice(0, MAX_QUESTION))}
            onKeyDown={onKey}
            rows={1}
            maxLength={MAX_QUESTION}
            placeholder={t('ai.placeholder')}
            className="max-h-[132px] min-h-[44px] flex-1 resize-none bg-transparent py-2.5 text-base text-ink outline-none placeholder:text-ink-3"
          />
          <button
            type="submit"
            aria-label={t(busy ? 'ai.stop' : 'ai.send')}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${busy ? 'bg-surface-2 text-ink' : q.trim().length >= 3 ? 'bg-ink text-surface' : 'bg-surface-2 text-ink-3'} ${focus}`}
          >
            {busy ? <IconPlayerStop size={18} aria-hidden /> : <IconArrowUp size={22} aria-hidden />}
          </button>
        </form>
        <p className="px-2 pt-1.5 text-center text-sm text-ink-3">{t('ai.disclaimer')}</p>
      </div>
    </div>
  )
}
