import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useProfile } from '../../profile/ProfileProvider'
import { QUESTIONS, type Answers } from '../../profile/questions'
import { LanguageStep } from './LanguageStep'
import { LoginStep } from './LoginStep'
import { QuestionStep } from './QuestionStep'
import { ResultStep } from './ResultStep'

type Step = { kind: 'lang' } | { kind: 'login' } | { kind: 'q'; i: number } | { kind: 'result' }

/**
 * Birinchi ochilish oqimi: Til → Kirish → 6 savol → Natija.
 * Bitta marshrut ichida: tugagach `replace` bilan oʻtiladi, "orqaga" onboardingga qaytarmaydi.
 * `?qayta=1` — Sozlamalar → Profil'dan savollarni qayta toʻldirish.
 */
export default function Onboarding() {
  const { profile, onboarded, saveAnswers, completeOnboarding } = useProfile()
  const [params] = useSearchParams()
  const redo = params.get('qayta') === '1'
  const nav = useNavigate()
  // Faqat ochilish paytida tekshiriladi: tugatish tugmasi bosilganda oʻzining yoʻnalishi ishlaydi
  const [alreadyDone] = useState(onboarded && !redo)

  const [step, setStep] = useState<Step>(redo ? { kind: 'q', i: 0 } : { kind: 'lang' })
  const [draft, setDraft] = useState<Partial<Answers>>(() => (profile ? { ...profile } : {}))
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number>(undefined)

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [step])

  if (alreadyDone) return <Navigate to="/" replace />

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 3000)
  }

  const finish = (to: string) => {
    completeOnboarding()
    nav(to, { replace: true })
  }

  let body
  switch (step.kind) {
    case 'lang':
      body = <LanguageStep onNext={() => setStep({ kind: 'login' })} />
      break
    case 'login':
      body = (
        <LoginStep
          onNext={(msg) => {
            if (msg) showToast(msg)
            setStep({ kind: 'q', i: 0 })
          }}
        />
      )
      break
    case 'q':
      body = (
        <QuestionStep
          key={step.i}
          index={step.i}
          draft={draft}
          onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
          onBack={() => {
            if (step.i > 0) setStep({ kind: 'q', i: step.i - 1 })
            else if (redo) nav(-1)
            else setStep({ kind: 'login' })
          }}
          onNext={() => {
            if (step.i < QUESTIONS.length - 1) return setStep({ kind: 'q', i: step.i + 1 })
            saveAnswers(draft as Answers)
            setStep({ kind: 'result' })
          }}
        />
      )
      break
    case 'result':
      // Saqlangan (tozalangan) profil koʻrsatiladi
      body = <ResultStep answers={profile ?? (draft as Answers)} onFinish={finish} />
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      {body}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-20 flex justify-center px-4">
        {toast && <p className="max-w-sm rounded-xl bg-ink px-4 py-3 text-center text-sm text-bg shadow-lg">{toast}</p>}
      </div>
    </div>
  )
}
