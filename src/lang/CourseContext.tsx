import { createContext, useContext, useMemo } from 'react'
import { Outlet } from 'react-router-dom'
import { DE_COURSE } from './de'
import { coursePaths } from './paths'
import { courseOf } from './registry'
import type { Course, CourseId } from './types'

/** Joriy til kursi. Marshrut (CourseScope) beradi; provayder boʻlmasa — nemis kursi. */
export const CourseContext = createContext<Course>(DE_COURSE)
export const useCourse = () => useContext(CourseContext)
export const useCoursePaths = () => {
  const id = useCourse().id
  return useMemo(() => coursePaths(id), [id])
}

/** Marshrut qatlami: ichidagi sahifalar shu kurs bilan ishlaydi (nemis sahifa komponentlari qayta ishlatiladi). */
export function CourseScope({ id }: { id: CourseId }) {
  return (
    <CourseContext.Provider value={courseOf(id)}>
      <Outlet />
    </CourseContext.Provider>
  )
}
