import { createContext, useContext } from 'react'
import { DE_COURSE } from './de'
import type { Course } from './types'

/**
 * Joriy til kursi. Hozircha provayder yoʻq: hamma joyda standart — nemis kursi (ekran avvalgidek).
 * Til tanlash qoʻshilganda (profil activeCourse) shu kontekst bilan beriladi.
 */
export const CourseContext = createContext<Course>(DE_COURSE)
export const useCourse = () => useContext(CourseContext)
