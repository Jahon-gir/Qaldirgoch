import { useEffect, useRef, useState } from 'react'
import { IconMicrophone, IconSnail, IconVolume } from '@tabler/icons-react'
import { useI18n } from '../../../i18n/I18nProvider'
import { judgeSpoken, type Judged } from '../../../german/speakCheck'
import { useSpeechRecognition } from '../../../german/useSpeechRecognition'
import { useFeedback } from '../../../ui/useFeedback'
import { useCourse } from '../../../lang/CourseContext'
import { navyBtn } from '../parts'
import { ContinueFooter, Verdict, type ExProps } from './common'
import { LISTEN_RATE, LISTEN_SLOW } from './ListenStep'

/** Bir martalik maxfiylik oynasi koʻrilganmi — faqat shu telefonda (profilga yozilmaydi). */
export const MIC_PRIVACY_KEY = 'qaldirgoch.micPrivacy'
const privacySeen = () => {
  try {
    return localStorage.getItem(MIC_PRIVACY_KEY) === '1'
  } catch {
    return false
  }
}
const markPrivacySeen = () => {
  try {
    localStorage.setItem(MIC_PRIVACY_KEY, '1')
  } catch {
    /* saqlanmasa — keyingi safar yana soʻraladi */
  }
}

/** Tanilmasa shuncha urinishdan keyin "Davom etish" chiqadi (tiqilib qolmaslik uchun). */
export const MAX_TRIES = 3

const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const secondaryBtn = `flex min-h-[52px] w-full items-center justify-center rounded-btn border-2 border-head bg-surface px-4 py-3 text-base font-semibold text-trust-text active:bg-surface-2 ${focus}`
const textBtn = `inline-flex min-h-[44px] items-center justify-center px-4 text-base font-semibold text-trust-text underline underline-offset-4 ${focus}`

function PrivacyDialog({ onOk, onCancel }: { onOk: () => void; onCancel: () => void }) {
  const t = useI18n().t
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => ref.current?.focus(), [])
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center" onKeyDown={(e) => e.key === 'Escape' && onCancel()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="mic-privacy-title" className="w-full max-w-md space-y-3 rounded-t-[20px] bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-lg outline-none sm:rounded-[20px]">
        <h2 id="mic-privacy-title" className="text-lg font-semibold">
          {t('ex.speak.privacyTitle')}
        </h2>
        <p className="text-base text-ink-2">{t('ex.speak.privacy')}</p>
        <div className="space-y-2 pt-1">
          <button type="button" onClick={onOk} className={navyBtn}>
            {t('common.continue')}
          </button>
          <button type="button" onClick={onCancel} className={secondaryBtn}>
            {t('ex.speak.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Talaffuz: eshiting → mikrofonga takrorlang → brauzer ovozni matnga aylantiradi → javob bilan solishtiriladi.
 * Faqat "toʻgʻri tanildi" / "tanilmadi": sifat, foiz yoki ball YOʻQ. Natija soʻzning "bilmaganlar" roʻyxatiga taʼsir qilmaydi
 * (xato mikrofon/tanish xatosi boʻlishi mumkin), shuning uchun onDone har doim true; natija (spoken/tried/skipped) ikkinchi argumentda:
 * sahifa shundan "mashq qilingan" soni va kunlik maqsadni hisoblaydi. Oʻtkazib yuborilgan soʻz mashq qilingan hisoblanmaydi.
 */
export function SpeakStep({ word, speech, onDone }: ExProps) {
  const { lang, t } = useI18n()
  const fx = useFeedback()
  const course = useCourse()
  const rec = useSpeechRecognition(course.speechLang)
  const { state } = rec
  const [verdict, setVerdict] = useState<Judged | null>(null)
  const [fails, setFails] = useState(0)
  const [privacy, setPrivacy] = useState(false)
  const spokenOnce = useRef(false) // shu soʻz bir marta aytib tanilgan boʻlsa — keyin oʻtkazib yuborilsa ham 'spoken'
  const micRef = useRef<HTMLButtonElement>(null)
  const { speak } = speech
  const canListen = speech.canSpeak()

  // Yangi natija: solishtirish (bir marta)
  useEffect(() => {
    if (state.status !== 'result') return
    const j = judgeSpoken(state.alternatives, word.term, course.id)
    setVerdict(j)
    if (j.ok) {
      spokenOnce.current = true
      fx.right(micRef.current)
    }
    else setFails((n) => n + 1)
  }, [state, word.term, fx, course.id])

  const begin = () => {
    setVerdict(null)
    rec.start()
  }
  const onMic = () => (privacySeen() ? begin() : setPrivacy(true))
  const confirmPrivacy = () => {
    markPrivacySeen()
    setPrivacy(false)
    begin()
  }
  const reset = () => {
    setVerdict(null)
    rec.reset()
  }
  const skip = () => onDone(true, spokenOnce.current ? 'spoken' : 'skipped')
  const proceed = () => onDone(true, spokenOnce.current ? 'spoken' : 'tried') // "Davom etish": tanildi yoki 3 urinish ishlatildi

  const s = state.status
  const right = s === 'result' && verdict?.ok === true
  const unheard = s === 'result' && verdict !== null && !verdict.ok
  const problem = s === 'no-speech' || s === 'denied' || s === 'network' || s === 'error'
  const canMove = right || fails >= MAX_TRIES

  const mic = (on: boolean) => (
    <button
      ref={micRef}
      type="button"
      onClick={onMic}
      aria-label={t('ex.speak.tap')}
      className={`flex h-[80px] w-[80px] items-center justify-center rounded-full border border-head-line text-white shadow-md ${on ? 'bg-[#D85A30] ring-8 ring-[#F5C4B3]' : 'bg-head'} ${focus}`}
    >
      <IconMicrophone size={40} aria-hidden />
    </button>
  )

  return (
    <div className="flex flex-1 flex-col gap-4 pt-4">
      <div className="rounded-2xl border border-head-line bg-head px-5 py-5 text-center text-white">
        <p className="text-base text-white/90">{t('ex.speak.hint')}</p>
        <p lang={course.id} className="mt-2 break-words text-3xl font-bold">
          {word.term}
        </p>
        <p className="mt-1 text-base text-white/90">{word.tr[lang]}</p>
        {canListen && (
          <div className="mt-3 flex items-center justify-center gap-3">
            <button type="button" onClick={() => speak(word.term, { rate: LISTEN_RATE })} className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 text-base font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${speech.speaking ? 'bg-vbtn-on' : 'bg-white/15'}`}>
              <IconVolume size={22} aria-hidden />
              {t('ex.speak.listen')}
            </button>
            <button type="button" onClick={() => speak(word.term, { rate: LISTEN_SLOW })} aria-label={t('ex.playSlow')} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
              <IconSnail size={24} aria-hidden />
            </button>
          </div>
        )}
      </div>

      <div aria-live="polite" className="flex flex-1 flex-col items-center gap-3 text-center">
        {s === 'listening' && (
          <>
            {mic(true)}
            <p className="text-lg font-semibold">{t('ex.speak.listening')}</p>
            <p className="text-base text-ink-2">{t('ex.speak.listeningHint')}</p>
            <button type="button" onClick={reset} className={textBtn}>
              {t('ex.speak.cancel')}
            </button>
          </>
        )}
        {s === 'idle' && (
          <>
            {mic(false)}
            <p className="text-base font-semibold">{t('ex.speak.tap')}</p>
            <button type="button" onClick={skip} className={textBtn}>
              {t('ex.speak.skip')}
            </button>
          </>
        )}
        {right && verdict && (
          <div className="w-full space-y-3 text-left">
            <Verdict tone="right">
              <span className="block">{t('ex.speak.ok')}</span>
              <span lang={course.id} className="block font-normal">
                {t('ex.speak.said', { heard: verdict.heard })}
              </span>
            </Verdict>
            <button type="button" onClick={reset} className={secondaryBtn}>
              {t('ex.speak.again')}
            </button>
          </div>
        )}
        {unheard && verdict && (
          <div className="w-full space-y-3 text-left">
            <Verdict tone="almost">
              <span lang={course.id} className="block">
                {t('ex.speak.heard', { heard: verdict.heard })}
              </span>
              <span className="block font-normal">{t('ex.speak.heardHint')}</span>
            </Verdict>
          </div>
        )}
        {problem && (
          <div className="w-full text-left">
            <Verdict tone="almost">{t(`ex.speak.${s}` as 'ex.speak.error')}</Verdict>
          </div>
        )}
        {(unheard || problem) && (
          <div className="w-full space-y-2">
            <button type="button" onClick={begin} className={fails >= MAX_TRIES ? secondaryBtn : navyBtn}>
              {t('ex.speak.retry')}
            </button>
            <div className="text-center">
              <button type="button" onClick={skip} className={textBtn}>
                {t('ex.speak.skip')}
              </button>
            </div>
          </div>
        )}
      </div>

      {canMove && <ContinueFooter onClick={proceed} />}
      {privacy && <PrivacyDialog onOk={confirmPrivacy} onCancel={() => setPrivacy(false)} />}
    </div>
  )
}
