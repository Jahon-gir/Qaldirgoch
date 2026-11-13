import { LESSON_ICON_NAMES } from '../../components/german/iconNames'
import { packsToCourse } from '../pack/toCourse'
import type { ContentPack } from '../pack/types'

/**
 * Nemis tili kasbiy paketlari (Excel → content:import). Har bir soha alohida JS bo'lagi (chunk, 0.23.0):
 * asosiy JS kichik bo'ladi, paketlar parallel yuklanadi va service worker ularni oflayn keshga oladi.
 * Top-level await: bu modulni import qilgan kod paketlar yuklangandan keyingina ishlaydi — API sinxron qoladi.
 */
const FILES = import.meta.glob<ContentPack>('../packs/de/*.json', { import: 'default' })
export const DE_PACKS: ContentPack[] = (await Promise.all(Object.values(FILES).map((load) => load()))).sort((a, b) => a.order - b.order)
export const DE_PACK_COURSE = packsToCourse(DE_PACKS, { icons: LESSON_ICON_NAMES })
