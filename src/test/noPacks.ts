import { vi } from 'vitest'

/**
 * Testlarda kasbiy paketlar (src/content/packs) standart holatda O'CHIQ: mavjud testlar asosiy kursni
 * (a1-m1, 22 soʻz) tekshiradi va paket qoʻshilganda buzilmasligi kerak. Paketli kursni tekshiradigan
 * testlar faylning boshida `vi.unmock('<yoʻl>/content/german/packs')` qiladi (masalan packs.course.test.ts).
 */
vi.mock('../content/german/packs', () => ({ DE_PACKS: [], DE_PACK_COURSE: { modules: [], lessons: [], exercises: {} } }))
