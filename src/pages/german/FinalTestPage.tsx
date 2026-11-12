import { moduleNumber } from '../../german/logic'
import type { Direction } from '../../content/german/types'
import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { IconCheck, IconRepeat, IconX } from '@tabler/icons-react'
import { ConfirmExit } from '../../components/german/ConfirmExit'
import { Card } from '../../components/ui/Card'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { Exercise } from '../../components/vocab/ex/Exercise'
import { GapStep } from '../../components/vocab/ex/GapStep'
import { Footer, VocabHeader } from '../../components/vocab/parts'
import { useAuth } from '../../auth/AuthProvider'
import { useI18n } from '../../i18n/I18nProvider'
import { useBack, useHistoryAnchor } from '../../lib/useHistoryAnchor'
import { buildTest, resultLine, isPassed, isScopeUnlocked, passMark, scopeInfo, testId, testSize, type Question, type ScopeInfo } from '../../german/finalTest'
import { useDirection } from '../../german/useDirection'
import { useLessons } from '../../german/LessonsProvider'
import { localDay } from '../../german/srs'
import { useSpeech } from '../../german/useSpeech'
import { useWords } from '../../german/WordsProvider'
import { cleanText } from '../../profile/ProfileProvider'
import { useCourse, useCoursePaths } from '../../lang/CourseContext'
import { COURSE_TEXT, levelName } from '../../lang/text'
import { coursePaths } from '../../lang/paths'
import { formatDate } from '../StepDetail'

const accentBtn =
  'flex min-h-[52px] w-full items-center justify-center rounded-btn bg-accent px-4 py-3 text-base font-semibold text-on-accent active:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

type Done = { score: number; total: number; wrongWords: string[] }

/** /til/test/:scope — modul ("a1-m1") yoki daraja ("level-A1") yakuniy testi. Ochilmagan boʻlsa — Til ekraniga. */
export default function FinalTestPage() {
  const { scope = '' } = useParams()
  const course = useCourse()
  const { direction: profileDirection } = useDirection()
  const direction = course.directions ? profileDirection : 'general'
  const { results } = useLessons()
  const info = scopeInfo(scope, direction, course)
  if (!info || !isScopeUnlocked(info, results) || testSize(info) === 0) return <Navigate to={coursePaths(course.id).home} replace />
  return <FinalTest key={scope} info={info} direction={direction} />
}

function FinalTest({ info, direction }: { info: ScopeInfo; direction: Direction }) {
  const { lang, t } = useI18n()
  const course = useCourse()
  const paths = useCoursePaths()
  const { wordById, gapById, moduleById } = course
  useHistoryAnchor(paths.home)
  const back = useBack(paths.home)
  const speech = useSpeech(course.speechLang)
  const auth = useAuth()
  const { record } = useLessons()
  const { markMistakes, addDone } = useWords()
  const mod = info.type === 'module' ? moduleById(info.moduleIds[0]) : undefined
  const lv = levelName(course, info.level, lang)
  const title = mod ? t('ft.moduleTitle', { n: moduleNumber(mod.id, direction, course.modules) }) : t('ft.levelTitle', { level: lv })
  const sub = mod ? mod.title[lang] : t('german.levelTitle', { level: lv })
  const size = testSize(info)

  const [questions, setQuestions] = useState<Question[] | null>(null)
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState<boolean[]>([])
  const [done, setDone] = useState<Done | null>(null)
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [i, done, questions])

  const start = () => {
    setQuestions(buildTest(info, { canListen: speech.canSpeak(), seed: `${Date.now()}-${Math.random()}`, course }))
    setI(0)
    setAnswers([])
    setDone(null)
  }

  const next = (correct: boolean) => {
    if (!questions) return
    const all = [...answers, correct]
    setAnswers(all)
    if (all.length < questions.length) return setI(all.length)
    // Oxirigacha tugadi: natija saqlanadi (eng yuqorisi qoladi), xato soʻzlar takrorlashga, kunlik maqsad +1
    const score = all.filter(Boolean).length
    const wrongWords = questions.flatMap((q, k) => {
      if (all[k]) return []
      const id = q.kind === 'word' ? q.wordId : gapById(q.gapId)?.wordId
      return id ? [id] : []
    })
    const uniq = [...new Set(wrongWords)]
    markMistakes(uniq)
    record(testId(info.scope), score, questions.length)
    addDone()
    setDone({ score, total: questions.length, wrongWords: uniq })
  }

  if (done) {
    const passed = isPassed(done.score, done.total)
    const name = auth.status === 'signedIn' ? cleanText(auth.user?.name) : undefined
    const line = resultLine(name, formatDate(localDay()), done.score, done.total)
    return (
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex flex-col items-center gap-2 pt-4 text-center">
            {passed && (
              <span className="flex h-24 w-24 items-center justify-center rounded-full bg-success text-surface">
                <IconCheck size={56} stroke={3} aria-hidden />
              </span>
            )}
            <h1 className="text-2xl font-semibold">{passed ? (mod ? t('ft.moduleDone') : t('ft.levelDone', { level: lv })) : t('ft.notPassedTitle')}</h1>
            <p className="text-base text-ink-2">{t('ft.summary', { total: done.total, score: done.score })}</p>
            {!passed && <p className="text-base font-semibold">{t('ft.more', { need: passMark(done.total), got: done.score })}</p>}
          </div>
          {passed && (
            <section aria-label={t('ft.cardBrand')} data-testid="result-card" className="space-y-1 rounded-card border-[1.5px] border-success bg-surface p-4">
              <p className="text-[13px] font-semibold uppercase tracking-wide text-ink-2">{t('ft.cardBrand')}</p>
              <p className="text-lg font-semibold">{title}</p>
              <p className="text-base text-ink-2">{sub}</p>
              <p className="break-words text-base font-semibold">{line}</p>
            </section>
          )}
          {passed && <p className="text-base text-ink-2">{t(COURSE_TEXT[course.id].ftNotOfficial)}</p>}
          {done.wrongWords.length > 0 && (
            <section aria-labelledby="ft-added" className="rounded-xl bg-warn-soft px-4 py-3 text-base text-warn-text">
              <h2 id="ft-added" className="font-semibold">
                {t('ft.addedToReview')}
              </h2>
              <ul className="mt-2 space-y-1">
                {done.wrongWords.map((id) => {
                  const w = wordById(id)
                  return w ? (
                    <li key={id}>
                      <span lang={course.id} className="font-semibold">
                        {w.term}
                      </span>{' '}
                      — {w.tr[lang]}
                    </li>
                  ) : null
                })}
              </ul>
            </section>
          )}
        </div>
        <Footer>
          <button type="button" onClick={back} className={accentBtn}>
            {t('ft.backToLanguage')}
          </button>
          <button type="button" onClick={start} className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-btn px-4 text-base font-semibold text-trust-text underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
            {t('ft.retake')}
          </button>
        </Footer>
      </div>
    )
  }

  if (questions) {
    const q = questions[i]
    const word = q.kind === 'word' ? wordById(q.wordId) : undefined
    const gap = q.kind === 'gap' ? gapById(q.gapId) : undefined
    return (
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-4 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <header className="flex items-center gap-3 py-1">
          <button type="button" onClick={() => setConfirm(true)} aria-label={t('ft.exit')} className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
            <IconX size={24} aria-hidden />
          </button>
          <div className="flex-1">
            <ProgressBar value={(i / questions.length) * 100} label={t('ft.progress')} />
          </div>
          <span className="min-w-[3rem] text-right text-base font-semibold text-ink-2">{t('german.stepOf', { n: i + 1, total: questions.length })}</span>
        </header>
        <div className="flex flex-1 flex-col" key={i}>
          {q.kind === 'word' && word && <Exercise kind={q.method} word={word} speech={speech} onDone={next} />}
          {q.kind === 'gap' && gap && <GapStep gap={gap} mode={q.mode} speech={speech} onDone={next} />}
        </div>
        {confirm && <ConfirmExit title={t('ft.exitTitle')} text={t('ft.exitText')} onStay={() => setConfirm(false)} onLeave={back} />}
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col">
      <VocabHeader title={title} sub={sub} onBack={back} />
      <div className="flex flex-1 flex-col gap-3 px-4 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <Card className="text-center">
            <p className="text-base text-ink-2">{t('ft.questions')}</p>
            <p className="text-3xl font-bold">{size}</p>
          </Card>
          <Card className="text-center">
            <p className="text-base text-ink-2">{t('ft.passLabel')}</p>
            <p className="text-3xl font-bold text-success-text">{passMark(size)}</p>
            <p className="text-base text-ink-2">{t('ft.passValue')}</p>
          </Card>
        </div>
        <Card>
          <h2 className="text-lg font-semibold">{t('ft.insideTitle')}</h2>
          <p className="mt-1 text-base">{t(COURSE_TEXT[course.id].ftInside)}</p>
        </Card>
        <p className="flex items-center gap-2 px-1 text-base text-ink-2">
          <IconRepeat size={20} aria-hidden />
          {t('ft.retakeAny')}
        </p>
        <Footer>
          <button type="button" onClick={start} className={accentBtn}>
            {t('ft.start')}
          </button>
        </Footer>
      </div>
    </div>
  )
}
