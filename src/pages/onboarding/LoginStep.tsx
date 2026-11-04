import { IconLock } from '@tabler/icons-react'
import { useGoogleSignIn } from '../../auth/useGoogleSignIn'
import { Button } from '../../components/ui/Button'
import { GoogleButton } from '../../components/ui/GoogleButton'
import { Notice } from '../../components/ui/Notice'
import { useT } from '../../i18n/I18nProvider'

export function LoginStep({ onNext }: { onNext: () => void }) {
  const t = useT()
  const { configured, busy, failed, start } = useGoogleSignIn()
  return (
    <>
      <div className="flex flex-col items-center pt-10 text-center">
        <img src="./icon.svg" alt="" width={72} height={72} className="h-[72px] w-[72px]" />
        <h1 className="mt-4 text-2xl font-semibold">{t('login.title')}</h1>
        <p className="mt-2 text-ink-2">{t('login.text')}</p>
      </div>
      <div className="mt-auto space-y-3 pt-8">
        {configured ? (
          <GoogleButton onClick={start} disabled={busy}>
            {t('login.google')}
          </GoogleButton>
        ) : (
          <Notice>{t('login.unavailable')}</Notice>
        )}
        {failed && <Notice tone="danger">{t('login.error')}</Notice>}
        <Button variant="link" onClick={onNext}>
          {t('login.skip')}
        </Button>
        <Notice icon={IconLock}>{t('login.privacy')}</Notice>
      </div>
    </>
  )
}
