import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { lessonWordIds } from '../lang/words'
import { ALL_WORD_IDS, courseIdOfLesson, courseIdOfWord, courseOf } from '../lang/registry'
import type { CourseId } from '../lang/types'
import { supabase } from '../lib/supabase'
import { useProfile } from '../profile/ProfileProvider'
import { PROGRESS_KEYS, read, write } from '../progress/storage'
import { activityToPush, addDone, applyForgiveness, mergeActivity, migrateTodayRow, sanitizeActivity, setTodayGoal, streakInfo, todayProgress, type Activity } from './daily'
import { useLessons } from './LessonsProvider'
import { addNewWords, answerWord, dueWordIds, localDay, mergeWords, sanitizeWords, wordsToPush, type Day, type Words } from './srs'
import { fetchRemoteActivity, fetchRemoteWords, pushRemoteActivity, pushRemoteWords } from './wordsRemote'

type Ctx = {
  /** Barcha kurslar soʻzlari (id prefiksi boʻyicha kursga tegishli). Ekranlar kurs boʻyicha wordsOf/dueFor dan oladi. */
  words: Words
  /** Shu kurs soʻzlari. */
  wordsOf: (course: CourseId) => Words
  /** Shu kursda bugun takrorlanadiganlar (avval eng eskisi). */
  dueFor: (course: CourseId) => string[]
  /** Kunlik faollik, maqsad va streak — barcha tillar uchun BITTA. */
  activity: Activity
  /** Foydalanuvchining mahalliy bugungi kuni (yarim tunda yangilanadi). */
  today: Day
  goal: number
  progress: ReturnType<typeof todayProgress>
  streak: ReturnType<typeof streakInfo>
  /** Soʻzlar takrorlash qutisiga (bor boʻlsa — tegilmaydi). */
  learn: (ids: string[]) => void
  /** Dars yoki takrorlash OXIRIGACHA tugatildi (natija ekrani ochilganda): kunlik maqsad +1. Tashlab chiqilgani hisoblanmaydi. */
  addDone: () => void
  /** Takrorlash javobi: schedule — true boʻlsa jadval oʻzgaradi (sessiyadagi birinchi javob). Kunlik maqsadga tegmaydi. */
  answer: (wordId: string, correct: boolean, schedule: boolean) => void
  /** Yakuniy testdagi xato soʻzlar: qutida yoʻq boʻlsa qoʻshiladi, keyin xato deb belgilanadi (oraliq 1, ertaga keladi). Toʻgʻrilar oʻzgarmaydi. */
  markMistakes: (ids: string[]) => void
}
const WordsContext = createContext<Ctx | null>(null)

const loadWords = () => read(PROGRESS_KEYS.words, (s) => sanitizeWords(JSON.parse(s), ALL_WORD_IDS), {})
const loadActivity = () => read(PROGRESS_KEYS.activity, (s) => sanitizeActivity(JSON.parse(s)), {})

/** Dars (istalgan kurs) soʻzlari id'lari. */
const wordIdsOfAnyLesson = (lessonId: string) => lessonWordIds(courseOf(courseIdOfLesson(lessonId)), lessonId)

const onlyCourse = (words: Words, course: CourseId): Words => Object.fromEntries(Object.entries(words).filter(([id]) => courseIdOfWord(id) === course))

/**
 * Soʻzlar va kunlik faollik har doim shu telefonda (localStorage). Kirgan boʻlsa user_words va user_daily_activity bilan
 * birlashtiriladi; serverga yetmaganlari mahalliy nusxadan hisoblanib internet qaytganda yuboriladi (user_lessons kabi).
 * Birinchi sinxron — profilni koʻchirish savoli hal boʻlgach (mehmon maʼlumoti shu oqim bilan akkauntga oʻtadi).
 */
export function WordsProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const { sync, guestDiscarded, dailyGoal } = useProfile()
  const { results } = useLessons()
  const userId = auth.status === 'signedIn' ? auth.user!.id : null
  const [words, setWords] = useState<Words>(loadWords)
  const [activity, setActivity] = useState<Activity>(loadActivity)
  const [today, setToday] = useState<Day>(() => localDay())
  const wordsRef = useRef(words)
  wordsRef.current = words
  const actRef = useRef(activity)
  actRef.current = activity
  const goalRef = useRef(dailyGoal)
  goalRef.current = dailyGoal
  const [retry, setRetry] = useState(0)
  const busy = useRef(false)

  const commitWords = useCallback((next: Words) => {
    wordsRef.current = next
    setWords(next)
    write(PROGRESS_KEYS.words, JSON.stringify(next))
  }, [])
  const commitActivity = useCallback((next: Activity) => {
    actRef.current = next
    setActivity(next)
    write(PROGRESS_KEYS.activity, JSON.stringify(next))
  }, [])

  // Kun almashishi: ilova tun boʻyi ochiq qolsa ham "bugun" yangilanadi
  useEffect(() => {
    const tick = () => setToday(localDay())
    const id = window.setInterval(tick, 60000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])

  // Avval tugatilgan darslar soʻzlari ham qutiga tushadi (0.6.0 dan oldingi natijalar)
  useEffect(() => {
    const ids = Object.keys(results).flatMap(wordIdsOfAnyLesson)
    const next = addNewWords(wordsRef.current, ids, today, new Date().toISOString(), ALL_WORD_IDS)
    if (next !== wordsRef.current) commitWords(next)
  }, [results, today, commitWords])

  // Eski birlikdagi (mashq) bugungi yozuv oʻtkaziladi; maqsad oʻzgarsa — bugungi kunga yoziladi; oʻtkazilgan kun uchun kechirim (sof hisob: daily.ts)
  useEffect(() => {
    const next = applyForgiveness(setTodayGoal(migrateTodayRow(actRef.current, today, dailyGoal), today, dailyGoal), today, dailyGoal)
    if (next !== actRef.current) commitActivity(next)
  }, [today, dailyGoal, activity, commitActivity])

  // Kirganda (profil savoli hal boʻlgach) va internet qaytganda: server bilan birlashtirish + navbatdagilarni yuborish
  useEffect(() => {
    if (!userId || !supabase || sync !== 'ready') return
    const client = supabase
    let cancelled = false
    const run = async () => {
      if (busy.current || cancelled) return
      busy.current = true
      try {
        const firstSync = read(PROGRESS_KEYS.wordsSynced, (s) => s !== userId, true)
        if (firstSync && guestDiscarded) {
          // "Yangidan boshlash": mehmon soʻzlari akkauntga koʻchirilmaydi
          commitWords({})
          commitActivity({})
        }
        const snapshot = wordsRef.current
        const [serverWords, serverAct] = await Promise.all([fetchRemoteWords(client, userId), fetchRemoteActivity(client, userId)])
        if (cancelled) return
        const mergedWords = mergeWords(snapshot, serverWords, firstSync ? 'migrate' : 'sync')
        // Serverda eski birlikdagi bugungi yozuv boʻlishi mumkin: birlashtirgandan keyin oʻtkaziladi
        const mergedAct = migrateTodayRow(mergeActivity(actRef.current, serverAct), localDay(), goalRef.current)
        await pushRemoteWords(client, userId, wordsToPush(mergedWords, serverWords))
        await pushRemoteActivity(client, userId, activityToPush(mergedAct, serverAct))
        if (cancelled) return
        write(PROGRESS_KEYS.wordsSynced, userId)
        // Sinxron paytida berilgan javoblar yoʻqolmasin: shu orada oʻzgargan soʻz mahalliy holatda qoladi
        const latest = wordsRef.current
        const next = { ...mergedWords }
        for (const [id, st] of Object.entries(latest)) if (st !== snapshot[id]) next[id] = st
        commitWords(next)
        commitActivity(migrateTodayRow(mergeActivity(actRef.current, mergedAct), localDay(), goalRef.current))
      } catch {
        // Tarmoq xatosi: mahalliy nusxa bilan ishlayveradi, internet qaytganda qayta uriniladi
      } finally {
        busy.current = false
      }
    }
    void run()
    const onOnline = () => void run()
    window.addEventListener('online', onOnline)
    return () => {
      cancelled = true
      busy.current = false
      window.removeEventListener('online', onOnline)
    }
  }, [userId, sync, guestDiscarded, retry, commitWords, commitActivity])

  const kick = useCallback(() => {
    if (userId) setRetry((n) => n + 1) // darhol yuborishga urinish (internet boʻlmasa xato yutiladi)
  }, [userId])

  const learn = useCallback(
    (ids: string[]) => {
      const next = addNewWords(wordsRef.current, ids, localDay(), new Date().toISOString(), ALL_WORD_IDS)
      if (next === wordsRef.current) return
      commitWords(next)
      kick()
    },
    [commitWords, kick]
  )

  const done = useCallback(() => {
    commitActivity(addDone(actRef.current, localDay(), goalRef.current))
    kick()
  }, [commitActivity, kick])

  const answer = useCallback(
    (wordId: string, correct: boolean, schedule: boolean) => {
      const day = localDay()
      const cur = wordsRef.current[wordId]
      if (schedule && cur) commitWords({ ...wordsRef.current, [wordId]: answerWord(cur, correct, day, new Date().toISOString()) })
      kick()
    },
    [commitWords, commitActivity, kick]
  )

  const markMistakes = useCallback(
    (ids: string[]) => {
      const day = localDay()
      const now = new Date().toISOString()
      const known = ids.filter((id) => ALL_WORD_IDS.has(id))
      if (!known.length) return
      const next = { ...addNewWords(wordsRef.current, known, day, now, ALL_WORD_IDS) }
      for (const id of known) next[id] = answerWord(next[id], false, day, now)
      commitWords(next)
      kick()
    },
    [commitWords, kick]
  )

  const wordsOf = useCallback((course: CourseId) => onlyCourse(words, course), [words])
  const dueFor = useCallback((course: CourseId) => dueWordIds(onlyCourse(words, course), today), [words, today])

  const value = useMemo<Ctx>(
    () => ({
      words,
      wordsOf,
      dueFor,
      activity,
      today,
      goal: dailyGoal,
      progress: todayProgress(activity, today, dailyGoal),
      streak: streakInfo(activity, today, dailyGoal),
      learn,
      addDone: done,
      answer,
      markMistakes
    }),
    [words, wordsOf, dueFor, activity, today, dailyGoal, learn, done, answer, markMistakes]
  )
  return <WordsContext.Provider value={value}>{children}</WordsContext.Provider>
}

export function useWords() {
  const c = useContext(WordsContext)
  if (!c) throw new Error('useWords WordsProvider ichida ishlatilishi kerak')
  return c
}
