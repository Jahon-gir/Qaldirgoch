import { beforeAll, vi } from 'vitest'
import { preloadAllPages } from '../pages/lazyPage'
import { preloadAllDicts } from '../i18n/dicts'

/**
 * Testlarda kasbiy paketlar (src/content/packs) standart holatda O'CHIQ: mavjud testlar asosiy kursni
 * (a1-m1, 22 soʻz) tekshiradi va paket qoʻshilganda buzilmasligi kerak. Paketli kursni tekshiradigan
 * testlar faylning boshida `vi.unmock('<yoʻl>/content/german/packs')` qiladi (masalan packs.course.test.ts).
 */
vi.mock('../content/german/packs', () => ({ DE_PACKS: [], DE_PACK_COURSE: { modules: [], lessons: [], exercises: {} } }))

/** Lazy sahifalar (App.tsx) testlarda oldindan yuklanadi — ekranlar avvalgidek sinxron chiqadi. */
beforeAll(() => preloadAllPages())

/** Rus va kirill lugʻatlari (alohida boʻlak) testlarda oldindan yuklanadi — til almashtirish sinxron. */
beforeAll(() => preloadAllDicts())
