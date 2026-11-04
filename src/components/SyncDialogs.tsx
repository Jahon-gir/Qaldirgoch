import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useT } from '../i18n/I18nProvider'
import { useProfile } from '../profile/ProfileProvider'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

function Modal({ title, children }: { title: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [])
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/50 p-4 sm:items-center">
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="sync-title" className="w-full max-w-md outline-none">
        <Card className="space-y-3 p-5 shadow-lg">
          <h2 id="sync-title" className="text-lg font-semibold">
            {title}
          </h2>
          {children}
        </Card>
      </div>
    </div>
  )
}

/** Kirgandan keyin bir marta: mehmon profilini koʻchirish yoki akkaunt/telefon profilini tanlash. Yopib boʻlmaydi — javob shart. */
export function SyncDialogs() {
  const t = useT()
  const { sync, answerMigrate, answerChoose } = useProfile()
  const [busy, setBusy] = useState(false)
  const run = async (f: () => Promise<void>) => {
    setBusy(true)
    try {
      await f()
    } finally {
      setBusy(false)
    }
  }

  if (sync === 'ask') {
    return (
      <Modal title={t('sync.ask.title')}>
        <p className="text-ink-2">{t('sync.ask.text')}</p>
        <Button disabled={busy} onClick={() => run(() => answerMigrate(true))}>
          {t('sync.ask.yes')}
        </Button>
        <Button variant="secondary" disabled={busy} onClick={() => run(() => answerMigrate(false))}>
          {t('sync.ask.no')}
        </Button>
        <p className="text-sm text-ink-3">{t('sync.ask.noNote')}</p>
      </Modal>
    )
  }
  if (sync === 'choose') {
    return (
      <Modal title={t('sync.choose.title')}>
        <p className="text-ink-2">{t('sync.choose.text')}</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-ink-2">
          <li>{t('sync.choose.serverNote')}</li>
          <li>{t('sync.choose.localNote')}</li>
        </ul>
        <Button disabled={busy} onClick={() => run(() => answerChoose('server'))}>
          {t('sync.choose.server')}
        </Button>
        <Button variant="secondary" disabled={busy} onClick={() => run(() => answerChoose('local'))}>
          {t('sync.choose.local')}
        </Button>
      </Modal>
    )
  }
  return null
}
