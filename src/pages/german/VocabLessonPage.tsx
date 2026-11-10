import { useCallback, useMemo, useRef, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { IconAdjustmentsHorizontal } from '@tabler/icons-react'
import { FlashCards } from '../../components/vocab/FlashCards'
import { SettingsSheet } from '../../components/vocab/SettingsSheet'
import { VocabHeader } from '../../components/vocab/parts'
import { VocabResult } from '../../components/vocab/VocabResult'
import { Exercise } from '../../components/vocab/ex/Exercise'
import type { SpeakOutcome } from '../../components/vocab/ex/common'
import { WordList } from '../../components/vocab/WordList'
import { useI18n } from '../../i18n/I18nProvider'
import { useBack, useHistoryAnchor } from '../../lib/useHistoryAnchor'
import { useLessons } from '../../german/LessonsProvider'
import { useDirection } from '../../german/useDirection'
import { sessionCurrent, sessionDone, type Session } from '../../german/srs'
import { hasArticle, mixedKinds, nextMixedKind, type ExerciseKind } from '../../german/exercises'
import { useCourse, useCoursePaths } from '../../lang/CourseContext'
import { useSpeech } from '../../german/useSpeech'
import { speechRecognitionSupported } from '../../german/useSpeechRecognition'
import { MIXED, isUnlocked, lessonWords, shuffled, startVocabSession, unlockedWords, vocabAnswer, vocabGroups, vocabLesson } from '../../german/vocab'
import { useWords } from '../../german/WordsProvider'
import { useProfile } from '../../profile/ProfileProvider'
import type { VocabFront, VocabMode } from '../../profile/questions'

type Run = { session: Session; counted: boolean; kinds: ExerciseKind[]; outcomes: Record<string, SpeakOutcome> }

/** Talaffuz: kunlik maqsadga +1 faqat soʻzlarning kamida yarmi (ceil(N/2)) mashq qilingan (spoken/tried) boʻlsa. */
export const speakPracticed = (outcomes: Record<string, SpeakOutcome>) => Object.values(outcomes).filter((o) => o !== 'skipped').length
export const speakGoalMet = (outcomes: Record<string, SpeakOutcome>, total: number) => total > 0 && speakPracticed(outcomes) >= Math.ceil(total / 2)
const QUESTION_MODES: readonly VocabMode[] = ['test', 'build', 'listen', 'write', 'article', 'speak', 'mixed']

function Practice({ lessonId, title, ids }: { lessonId: string; title: string; ids: string[] }) {
  const { t } = useI18n()
  const course = useCourse()
  const paths = useCoursePaths()
  const wordById = course.wordById
  useHistoryAnchor(paths.vocab)
  const back = useBack(paths.vocab)
  const speech = useSpeech(course.speechLang)
  const canListen = speech.canSpeak()
  const [canSpeakMic] = useState(speechRecognitionSupported) // feature detect: SpeechRecognition bormi
  const { addDone } = useWords()
  const { vocabMode, vocabFront, setVocabPrefs } = useProfile()
  const nounIds = useMemo(() => ids.filter((id) => { const w = wordById(id); return !!w && hasArticle(w, course) }), [ids, course])
  // Aralash mashq (barcha soʻzlar) Kartochka rejimida ochiladi; keyin tanlov odatdagidek profilda saqlanadi
  const [mode, setMode] = useState<VocabMode>(lessonId === MIXED ? 'cards' : vocabMode)
  const [front, setFront] = useState<VocabFront>(vocabFront)
  const [sheet, setSheet] = useState(false)
  // Darsda ot boʻlmasa Artikl, ovoz boʻlmasa Tinglash — Test bilan almashtiriladi
  // Mikrofon tanish yoʻq, lekin profilda Talaffuz tanlangan — Roʻyxatga qaytadi (xato bermaydi)
  // Yozish usuli yoʻq kursda (koreys) — Test
  const eff: VocabMode = mode === 'article' && nounIds.length === 0 ? 'test' : mode === 'write' && !course.features.write ? 'test' : mode === 'listen' && !canListen ? 'test' : mode === 'speak' && !canSpeakMic ? 'list' : mode
  const start = useCallback(
    (list: string[], counted: boolean, m: VocabMode): Run => ({
      session: startVocabSession(m === 'article' ? list.filter((id) => nounIds.includes(id)) : list),
      counted,
      outcomes: {},
      kinds: m === 'mixed' ? mixedKinds(list.flatMap((id) => wordById(id) ?? []), canListen, Math.random, course) : []
    }),
    [nounIds, canListen, course]
  )
  const [run, setRun] = useState<Run>(() => start(lessonId === MIXED ? shuffled(ids) : ids, true, eff))
  const runRef = useRef(run)
  runRef.current = run

  const finished = sessionDone(run.session)
  const pickMode = (m: VocabMode) => {
    setVocabPrefs({ mode: m })
    if (m === mode) return
    setMode(m)
    // Usul oʻzgarsa mashq yangidan boshlanadi
    const base = run.counted ? (lessonId === MIXED ? shuffled(ids) : ids) : uniq(run.session.queue)
    setRun(start(base, run.counted, m))
  }
  // Kartochka: old tomon tili almashadi (profilda saqlanadi), mashq qayta boshlanmaydi
  const swapFront = () => {
    const next: VocabFront = front === 'target' ? 'tr' : 'target'
    setFront(next)
    setVocabPrefs({ front: next })
  }
  const answer = (correct: boolean, outcome?: SpeakOutcome) => {
    const cur = runRef.current
    const curId = sessionCurrent(cur.session)
    const next = vocabAnswer(cur.session, correct)
    // Qayta soʻraladigan soʻz uchun ham usul tanlanadi (oldingisi bilan bir xil emas)
    let kinds = cur.kinds
    if (eff === 'mixed' && next.queue.length > kinds.length) {
      const w = wordById(next.queue[next.queue.length - 1])
      kinds = w ? [...kinds, nextMixedKind(w, kinds[kinds.length - 1], canListen, Math.random, course)] : kinds
    }
    const outcomes = eff === 'speak' && curId ? { ...cur.outcomes, [curId]: outcome ?? 'skipped' } : cur.outcomes
    const r = { ...cur, session: next, kinds, outcomes }
    runRef.current = r
    setRun(r)
    // Kunlik maqsad +1: mashq OXIRIGACHA tugadi (natija ekrani); bilmaganlarni qayta mashq qilish sanalmaydi
    // Talaffuzda +1 faqat yetarlicha soʻz mashq qilingan boʻlsa
    if (sessionDone(next) && cur.counted && (eff !== 'speak' || speakGoalMet(outcomes, next.queue.length))) addDone()
  }
  const retry = () => {
    const wrong = Object.keys(run.session.first).filter((id) => !run.session.first[id])
    setRun(start(wrong, false, eff))
  }

  const modeName = t(`vocab.mode.${eff}`)
  const isQ = QUESTION_MODES.includes(eff)
  const sub =
    isQ && !finished ? t('vocab.qOf', { mode: modeName, n: Math.min(run.session.pos + 1, run.session.queue.length), total: run.session.queue.length }) : `${modeName} · ${t('vocab.words', { n: ids.length })}`
  const id = sessionCurrent(run.session)
  const word = id ? wordById(id) : undefined
  const kind: ExerciseKind = eff === 'mixed' ? run.kinds[run.session.pos] ?? 'test' : (eff as ExerciseKind)

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col">
      <VocabHeader
        title={title}
        sub={sub}
        onBack={back}
        right={
          <button
            type="button"
            onClick={() => setSheet(true)}
            aria-label={t('vocab.settings')}
            aria-haspopup="dialog"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            <IconAdjustmentsHorizontal size={24} aria-hidden />
          </button>
        }
      />
      <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
        {eff === 'list' ? (
          <WordList words={ids.flatMap((id) => wordById(id) ?? [])} front={front} speech={speech} />
        ) : finished ? (
          <VocabResult
            session={run.session}
            counted={run.counted && (eff !== 'speak' || speakGoalMet(run.outcomes, run.session.queue.length))}
            speak={eff === 'speak' ? { total: run.session.queue.length, practiced: speakPracticed(run.outcomes) } : undefined} onDone={back} onRetry={retry} />
        ) : eff === 'cards' ? (
          <FlashCards session={run.session} front={front} speech={speech} onAnswer={answer} onSwapFront={swapFront} />
        ) : word ? (
          <Exercise key={`${run.session.pos}-${eff}`} kind={kind} word={word} speech={speech} onDone={answer} />
        ) : null}
      </div>
      {sheet && <SettingsSheet mode={eff} hasNouns={nounIds.length > 0} canWrite={course.features.write} canListen={canListen} canSpeakMic={canSpeakMic} onPick={pickMode} onClose={() => setSheet(false)} />}
    </div>
  )
}

const uniq = (a: string[]) => a.filter((x, i) => a.indexOf(x) === i)

/** /til/lugat/:lessonId — dars soʻzlari; /til/lugat/aralash — ochilgan barcha darslar soʻzlari aralash. */
export default function VocabLessonPage() {
  const { lessonId = '' } = useParams()
  const { lang, t } = useI18n()
  const { results } = useLessons()
  const course = useCourse()
  const paths = useCoursePaths()
  const { direction: profileDirection } = useDirection()
  const direction = course.directions ? profileDirection : 'general'
  const mixed = lessonId === MIXED
  const lesson = mixed ? undefined : vocabLesson(lessonId, course)
  const ids = useMemo(() => {
    if (mixed) return unlockedWords(vocabGroups(direction, results, course)).map((w) => w.id)
    return lesson ? lessonWords(lesson.id, course).map((w) => w.id) : []
  }, [mixed, lesson, direction, results, course])
  // Notanish dars, qulflangan dars yoki ochiq dars yoʻq (aralash) — Lugʻat ekraniga
  if (ids.length === 0 || (lesson && !isUnlocked(lesson.id, results))) return <Navigate to={paths.vocab} replace />
  const title = mixed ? t('vocab.mixedTitle') : t('vocab.lessonTitle', { n: lesson!.order, title: lesson!.title[lang] })
  return <Practice key={lessonId} lessonId={lessonId} title={title} ids={ids} />
}
