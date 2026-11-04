import { useState } from 'react'
import { IconCircleCheck, IconCloudUpload, IconUserCircle } from '@tabler/icons-react'
import { useAuth, type AuthUser } from '../auth/AuthProvider'
import { useGoogleSignIn } from '../auth/useGoogleSignIn'
import { useT } from '../i18n/I18nProvider'
import { useProfile } from '../profile/ProfileProvider'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { GoogleButton } from './ui/GoogleButton'
import { Notice } from './ui/Notice'

export function initials(u: Pick<AuthUser, 'name' | 'email'>): string {
  const src = (u.name || u.email || '?').trim()
  const words = src.split(/[\s@._-]+/).filter(Boolean)
  const letters = words.length > 1 ? [words[0], words[1]].map((w) => Array.from(w)[0]) : Array.from(words[0] ?? '?').slice(0, 2)
  return letters.join('').toUpperCase()
}

function Avatar({ user }: { user: AuthUser }) {
  const [broken, setBroken] = useState(false)
  if (user.avatarUrl && !broken) {
    return (
      <img
        src={user.avatarUrl}
        alt=""
        width={56}
        height={56}
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className="h-14 w-14 shrink-0 rounded-full object-cover"
      />
    )
  }
  return (
    <span aria-hidden className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent-soft text-lg font-semibold text-accent-strong">
      {initials(user)}
    </span>
  )
}

/** Profil sahifasi tepasidagi akkaunt bloki: mehmon yoki kirgan holat. */
export function AccountBlock() {
  const t = useT()
  const { status, user } = useAuth()
  const { syncPending, signOutAndClear } = useProfile()
  const google = useGoogleSignIn()
  const [leaving, setLeaving] = useState(false)

  if (status === 'signedIn' && user) {
    return (
      <Card className="space-y-3">
        <div className="flex items-center gap-3">
          <Avatar user={user} />
          <div className="min-w-0 flex-1">
            {user.name && <p className="truncate text-lg font-semibold">{user.name}</p>}
            {user.email && <p className="truncate text-sm text-ink-2">{user.email}</p>}
          </div>
        </div>
        {syncPending ? (
          <Notice icon={IconCloudUpload}>{t('account.syncPending')}</Notice>
        ) : (
          <Notice tone="success" icon={IconCircleCheck}>
            {t('account.synced')}
          </Notice>
        )}
        <Button
          variant="secondary"
          disabled={leaving}
          onClick={() => {
            setLeaving(true)
            void signOutAndClear()
          }}
        >
          {t('account.signOut')}
        </Button>
        <p className="text-sm text-ink-3">{t('account.signOutNote')}</p>
      </Card>
    )
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink-2">
          <IconUserCircle size={32} aria-hidden />
        </span>
        <div>
          <p className="text-lg font-semibold">{t('account.guestTitle')}</p>
          <p className="text-sm text-ink-2">{t('account.guestText')}</p>
        </div>
      </div>
      {google.configured ? (
        <GoogleButton onClick={google.start} disabled={google.busy || status === 'loading'}>
          {t('login.google')}
        </GoogleButton>
      ) : (
        <Notice>{t('login.unavailable')}</Notice>
      )}
      {google.failed && <Notice tone="danger">{t('login.error')}</Notice>}
    </Card>
  )
}
