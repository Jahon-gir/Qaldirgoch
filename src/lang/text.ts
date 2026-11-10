import type { Key } from '../i18n/uz'
import type { Lang } from '../i18n/I18nProvider'
import type { Course, CourseId } from './types'

/** Kursga bogʻliq matnlar (umumiy ekranlarda). Nemischa kalitlar avvalgidek. */
export const COURSE_TEXT: Record<CourseId, { name: Key; noVoice: Key; matchTarget: Key; front: Key; frontSwap: Key; ftInside: Key; ftNotOfficial: Key }> = {
  de: { name: 'german.title', noVoice: 'german.noVoice', matchTarget: 'german.matchGerman', front: 'vocab.front.de', frontSwap: 'vocab.frontSwap', ftInside: 'ft.inside', ftNotOfficial: 'ft.notOfficial' },
  ko: { name: 'lang.ko.name', noVoice: 'lang.ko.noVoice', matchTarget: 'lang.ko.match', front: 'vocab.front.ko', frontSwap: 'vocab.frontSwap.ko', ftInside: 'lang.ko.ftInside', ftNotOfficial: 'lang.ko.ftNotOfficial' }
}

/** Daraja nomi: label boʻlsa (ko-H → "Hangul") — u, aks holda id ("A1"). */
export function levelName(course: Pick<Course, 'levels'>, id: string, lang: Lang): string {
  return course.levels.find((l) => l.id === id)?.label?.[lang] ?? id
}
