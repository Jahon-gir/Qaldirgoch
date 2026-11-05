import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { IconCheck, IconX } from '@tabler/icons-react'
import { ChoiceStep, MatchStep, WordStep } from '../../components/german/steps'
import { ListenIcon, NoVoice } from '../../components/german/Listen'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { exercisesOf, lessonById, type Lesson } from '../../content/german'
import { useI18n } from '../../i18n/I18nProvider'
import { useDirection } from '../../german/useDirection'
import { useLessons } from '../../german/LessonsProvider'
import { nextLessonAfter, summarize, type Outcome } from '../../german/logic'
import { useSpeech } from '../../german/useSpeech'
import { useWords } from '../../german/WordsProvider'
import { wordIdsOfLesson } from '../../content/german/words'
import { FROM_MODULE, useBackToModule, useHistoryAnchor } from '../../lib/useHistoryAnchor'

/** Darsdan chiqishni tasdiqlash: natija saqlanmasligi aytiladi. */
function ConfirmExit({ onStay, onLeave }: { onStay: () => void; onLeave: () => void }) {
  const t = useI18n().t
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [])
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/50 p-4 sm:items-center" onKeyDown={(e) => e.key === 'Escape' && onStay()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="exit-title" className="w-full max-w-md outline-none">
        <Card className="space-y-3 p-5 shadow-lg">
          <h2 id="exit-title" className="text-lg font-semibold">
            {t('german.exitTitle')}
          </h2>
          <p className="text-base text-ink-2">{t('german.exitText')}</p>
          <Button onClick={onStay}>{t('german.exitStay')}</Button>
          <Button variant="secondary" onClick={onLeave}>
            {t('german.exitLeave')}
          </Button>
        </Card>
      </div>
    </div>
  )
}

function ResultView({ lesson, summary }: { lesson: Lesson; summary: ReturnType<typeof summarize> }) {
  const { lang, t } = useI18n()
  const nav = useNavigate()
  const loc = useLocation()
  const speech = useSpeech()
  const { direction } = useDirection()
  const { progress } = useWords()
  const next = nextLessonAfter(lesson.id, direction)
  // Darsga modul ekranidan kiriladi: orqaga qaytish tarixni ikkilantirmaydi ("orqaga" tugmasi modulda qolib ketmaydi)
  const toModule = useBackToModule(`/til/modul/${lesson.moduleId}`)
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-col items-center gap-2 pt-4 text-center">
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-success text-surface">
          <IconCheck size={56} stroke={3} aria-hidden />
        </span>
        <h1 className="text-2xl font-semibold">{t('german.done')}</h1>
        <p className="text-base text-ink-2">{lesson.title[lang]}</p>
        {progress.met && (
          <p role="status" className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1.5 text-base font-semibold text-success-text">
            <IconCheck size={18} aria-hidden />
            {t('german.goal.done')}
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center">
          <p className="text-base text-ink-2">{t('german.correctAnswers')}</p>
          <p className="text-2xl font-bold text-success-text">
            {summary.score}/{summary.total}
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-base text-ink-2">{t('german.newWords')}</p>
          <p className="text-2xl font-bold">{summary.newWords}</p>
        </Card>
      </div>
      {summary.mistakes.length > 0 && (
        <section aria-labelledby="mistakes-title" className="space-y-2">
          <h2 id="mistakes-title" className="text-lg font-semibold">
            {t('german.mistakes')}
          </h2>
          {!speech.canSpeak() && <NoVoice />}
          <ul className="space-y-2">
            {summary.mistakes.map((m) => (
              <li key={m.key}>
                <Card className="flex items-center gap-3 py-3">
                  <span className="flex-1">
                    <span lang="de" className="block text-base font-semibold">
                      {m.de}
                    </span>
                    <span className="block text-base text-ink-2">{m.tr[lang]}</span>
                  </span>
                  <ListenIcon speech={speech} text={m.de} />
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="sticky bottom-0 -mx-4 mt-auto space-y-2 bg-bg px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        {next && <Button onClick={() => nav(`/til/dars/${next.id}`, { replace: true, state: loc.state })}>{t('german.nextLesson')}</Button>}
        <Button variant={next ? 'secondary' : 'primary'} onClick={toModule}>
          {t('german.backToModule')}
        </Button>
      </div>
    </div>
  )
}

function LessonRunner({ lesson }: { lesson: Lesson }) {
  const { t } = useI18n()
  const { record } = useLessons()
  const leave = useBackToModule(`/til/modul/${lesson.moduleId}`)
  const { learn, addDone } = useWords()
  const speech = useSpeech()
  // Toʻgʻridan-toʻgʻri ochilsa tarixga modul qoʻyiladi — "Modulga qaytish" bir qadam orqaga boʻladi
  useHistoryAnchor(`/til/modul/${lesson.moduleId}`, FROM_MODULE)
  const exercises = exercisesOf(lesson.id)
  const [i, setI] = useState(0)
  const outcomes = useRef<Outcome[]>([])
  const finished = useRef(false)
  const [summary, setSummary] = useState<ReturnType<typeof summarize> | null>(null)
  const [confirmExit, setConfirmExit] = useState(false)

  // Yangi qadam yuqoridan ochilsin (effekt hech narsa qaytarmaydi)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [i, summary])

  const onStepDone = (o: Outcome) => {
    outcomes.current = [...outcomes.current, o]
    if (i + 1 < exercises.length) return setI(i + 1)
    if (finished.current) return
    finished.current = true
    const s = summarize(exercises, outcomes.current)
    record(lesson.id, s.score, s.total)
    learn(wordIdsOfLesson(lesson.id)) // darsdagi soʻzlar takrorlash qutisiga (ertaga keladi)
    addDone() // kunlik maqsad +1: dars oxirigacha tugadi (qayta tugatish ham sanaladi); tashlab chiqilgani sanalmaydi
    setSummary(s)
  }

  const ex = exercises[i]
  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-4 pt-[max(0.5rem,env(safe-area-inset-top))]">
      {summary ? (
        <ResultView lesson={lesson} summary={summary} />
      ) : (
        <>
          <header className="flex items-center gap-3 py-1">
            <button type="button" onClick={() => setConfirmExit(true)} aria-label={t('german.exit')} className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
              <IconX size={24} aria-hidden />
            </button>
            <div className="flex-1">
              <ProgressBar value={(i / exercises.length) * 100} label={t('german.lessonProgress')} />
            </div>
            <span className="min-w-[3rem] text-right text-base font-semibold text-ink-2">{t('german.stepOf', { n: i + 1, total: exercises.length })}</span>
          </header>
          <div className="flex flex-1 flex-col pt-3" key={ex.id}>
            {ex.type === 'word' && <WordStep ex={ex} speech={speech} onDone={onStepDone} />}
            {ex.type === 'choice' && <ChoiceStep ex={ex} onDone={onStepDone} />}
            {ex.type === 'match' && <MatchStep ex={ex} onDone={onStepDone} />}
          </div>
        </>
      )}
      {confirmExit && <ConfirmExit onStay={() => setConfirmExit(false)} onLeave={leave} />}
    </div>
  )
}

export default function LessonPage() {
  const { lessonId = '' } = useParams()
  const lesson = lessonById(lessonId)
  if (!lesson || exercisesOf(lessonId).length === 0) return <Navigate to="/til" replace />
  return <LessonRunner key={lesson.id} lesson={lesson} />
}
