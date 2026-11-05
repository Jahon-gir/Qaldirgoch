import { useCallback, useMemo, useRef, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { IconAdjustmentsHorizontal } from '@tabler/icons-react'
import { FlashCards } from '../../components/vocab/FlashCards'
import { SettingsSheet } from '../../components/vocab/SettingsSheet'
import { VocabHeader } from '../../components/vocab/parts'
import { VocabResult } from '../../components/vocab/VocabResult'
import { VocabTest } from '../../components/vocab/VocabTest'
import { WordList } from '../../components/vocab/WordList'
import { lessonById } from '../../content/german'
import { wordById, type VocabWord } from '../../content/german/words'
import { useI18n } from '../../i18n/I18nProvider'
import { useBack, useHistoryAnchor } from '../../lib/useHistoryAnchor'
import { useLessons } from '../../german/LessonsProvider'
import { useDirection } from '../../german/useDirection'
import { sessionDone, type Session } from '../../german/srs'
import { useSpeech } from '../../german/useSpeech'
import { MIXED, isUnlocked, lessonWords, shuffled, startVocabSession, unlockedWords, vocabAnswer, vocabGroups, vocabLesson } from '../../german/vocab'
import { useWords } from '../../german/WordsProvider'
import { useProfile } from '../../profile/ProfileProvider'
import type { VocabFront, VocabMode } from '../../profile/questions'

type Run = { session: Session; counted: boolean }

function Practice({ lessonId, title, ids }: { lessonId: string; title: string; ids: string[] }) {
  const { t } = useI18n()
  useHistoryAnchor('/til/lugat')
  const back = useBack('/til/lugat')
  const speech = useSpeech()
  const { addDone } = useWords()
  const { vocabMode, vocabFront, setVocabPrefs } = useProfile()
  // Aralash mashq Kartochka rejimida ochiladi; keyin tanlov odatdagidek profilda saqlanadi
  const [mode, setMode] = useState<VocabMode>(lessonId === MIXED ? 'cards' : vocabMode)
  const [front, setFront] = useState<VocabFront>(vocabFront)
  const [sheet, setSheet] = useState(false)
  const start = useCallback((list: string[], counted: boolean): Run => ({ session: startVocabSession(list), counted }), [])
  const [run, setRun] = useState<Run>(() => start(lessonId === MIXED ? shuffled(ids) : ids, true))
  const sessionRef = useRef(run.session)
  sessionRef.current = run.session

  const finished = sessionDone(run.session)
  const change = (p: { mode?: VocabMode; front?: VocabFront }) => {
    if (p.mode) setMode(p.mode)
    if (p.front) setFront(p.front)
    setVocabPrefs(p)
    // Usul oʻzgarsa mashq yangidan boshlanadi (kunlik maqsadga tegmaydi: tugamagan). Old tomoni — faqat koʻrinish
    if (p.mode && p.mode !== mode) setRun((r) => (sessionDone(r.session) ? r : start(r.session.queue.filter((x, i, a) => a.indexOf(x) === i), r.counted)))
  }
  const answer = (correct: boolean) => {
    const next = vocabAnswer(sessionRef.current, correct)
    sessionRef.current = next
    setRun((r) => ({ ...r, session: next }))
    // Kunlik maqsad +1: mashq OXIRIGACHA tugadi (natija ekrani); bilmaganlarni qayta mashq qilish sanalmaydi
    if (sessionDone(next) && run.counted) addDone()
  }
  const retry = () => {
    const wrong = Object.keys(run.session.first).filter((id) => !run.session.first[id])
    setRun(start(wrong, false))
  }

  const modeName = t(`vocab.mode.${mode}`)
  const sub = mode === 'test' && !finished ? t('vocab.testSub', { n: Math.min(run.session.pos + 1, run.session.queue.length), total: run.session.queue.length }) : `${modeName} · ${t('vocab.words', { n: ids.length })}`

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
        {mode === 'list' ? (
          <WordList words={lessonWordsOf(ids)} front={front} speech={speech} />
        ) : finished ? (
          <VocabResult session={run.session} counted={run.counted} onDone={back} onRetry={retry} />
        ) : mode === 'cards' ? (
          <FlashCards session={run.session} front={front} speech={speech} onAnswer={answer} onOpenSettings={() => setSheet(true)} />
        ) : (
          <VocabTest key={run.session.pos} session={run.session} front={front} onAnswer={answer} />
        )}
      </div>
      {sheet && <SettingsSheet mode={mode} front={front} onChange={change} onClose={() => setSheet(false)} />}
    </div>
  )
}

const lessonWordsOf = (ids: string[]): VocabWord[] => ids.flatMap((id) => wordById(id) ?? [])

/** /til/lugat/:lessonId — dars soʻzlari; /til/lugat/aralash — ochilgan barcha darslar soʻzlari aralash. */
export default function VocabLessonPage() {
  const { lessonId = '' } = useParams()
  const { lang, t } = useI18n()
  const { results } = useLessons()
  const { direction } = useDirection()
  const mixed = lessonId === MIXED
  const lesson = mixed ? undefined : vocabLesson(lessonId)
  const ids = useMemo(() => {
    if (mixed) return unlockedWords(vocabGroups(direction, results)).map((w) => w.id)
    return lesson ? lessonWords(lesson.id).map((w) => w.id) : []
  }, [mixed, lesson, direction, results])
  // Notanish dars, qulflangan dars yoki ochiq dars yoʻq (aralash) — Lugʻat ekraniga
  if (ids.length === 0 || (lesson && !isUnlocked(lesson.id, results))) return <Navigate to="/til/lugat" replace />
  const title = mixed ? t('vocab.mixedTitle') : t('vocab.lessonTitle', { n: lessonById(lessonId)!.order, title: lessonById(lessonId)!.title[lang] })
  return <Practice key={lessonId} lessonId={lessonId} title={title} ids={ids} />
}
