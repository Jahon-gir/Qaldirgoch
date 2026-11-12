import { LESSON_ICON_NAMES } from '../../components/german/iconNames'
import { packsToCourse } from '../pack/toCourse'
import type { ContentPack } from '../pack/types'

/** Nemis tili kasbiy paketlari (Excel → content:import). Statik import: tez va oflayn. */
const FILES = import.meta.glob<ContentPack>('../packs/de/*.json', { eager: true, import: 'default' })
export const DE_PACKS: ContentPack[] = Object.values(FILES).sort((a, b) => a.order - b.order)
export const DE_PACK_COURSE = packsToCourse(DE_PACKS, { icons: LESSON_ICON_NAMES })
