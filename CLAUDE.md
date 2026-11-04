# Qaldirg'och — loyiha qoidalari (Claude Code uchun)

Qaldirg'och — O'zbekiston fuqarolarini noldan Germaniyada qonuniy ish boshlashgacha
qadamma-qadam olib boradigan mobil platforma. Jamoaviy loyiha, tanlov uchun (~8 hafta).
To'liq TZ: docs/TZ.md (asl nusxasi: "Qaldirg'och — Texnik topshiriq (TZ)" hujjati).

## 1-versiya doirasi
- Davlat: Germaniya. Yo'l: Ausbildung (kasbiy ta'lim).
- Modullar: onboarding va profil, yo'l xaritasi (10 bosqich), kasbiy nemis tili (A1 to'liq,
  A2 boshlanishi), xavfsizlik (agentlik va taklifni tekshirish), manbali AI maslahatchi,
  eslatmalar, admin panel (kontentni tasdiqlash).
- KIRMAYDI: hamyon/to'lovlar, hujjat fayllarini saqlash, to'qima vakansiyalar,
  ishga joylashtirish, xarita, valyuta kursi, ob-havo.

## Texnika
- React + Vite + TypeScript, Tailwind CSS, PWA (service worker, oflayn kesh).
- Bitta kod: telefon (PWA, keyin Capacitor APK) → sayt → Telegram Mini App.
- Supabase: Auth (Google, telefon, mehmon rejimi), PostgreSQL + RLS, Storage, Edge Functions, cron.
- AI faqat Edge Functions orqali; bilim bazasi pgvector (RAG), faqat tasdiqlangan kontentdan.

## Qat'iy qoidalar
1. Hech qanday API kaliti, parol yoki admin login kodda yoki brauzerda bo'lmaydi.
   Hammasi Supabase Secrets'da. Admin huquqi server tomonida tekshiriladi.
2. Har bir jadvalda RLS yoqilgan; foydalanuvchi faqat o'z ma'lumotini ko'radi.
3. Foydalanuvchi matni ekranga chiqishdan oldin tozalanadi (XSS).
4. Pasport, diplom, manzil kabi shaxsiy hujjatlar yig'ilmaydi va saqlanmaydi.
5. Migrantga ko'rsatiladigan har bir fakt/raqam: manba URL + "oxirgi tekshirilgan" sana.
   Kontent holati: qoralama → tekshiruvda → tasdiqlangan; faqat tasdiqlangani ko'rinadi.
6. To'qima ma'lumot, soxta raqam, soxta baholash (masalan "92% match") taqiqlanadi.
7. AI noqonuniy yo'llarga yordam bermaydi; bilmasa "tasdiqlangan ma'lumot yo'q" deydi.

## Dizayn
- Uslub: A+B — bosh ekran va darslar iliq/motivatsion, hujjatlar va xavfsizlik rasmiy/sokin.
- Ranglar: asosiy marjon (harakat), to'q ko'k (ishonch), yashil (progress), qizil (xavf).
- Matn kamida 16 px, bosish maydoni kamida 44x44 px, kontrast WCAG AA.
- O'zbekcha ʻ ʼ va kirill to'g'ri chiqadigan shrift. Interfeys: o'zbek (lotin, kirill), rus.
- Arzon Android (2–3 GB RAM) va sekin 3G'da tez ishlashi shart.
- Har bir yangi ekran yoki dizayn o'zgarishi avval mockupda tasdiqlanadi.

## Ish tartibi
- Bitta PR — bitta funksiya. Har PR'da package.json versiyasi oshiriladi.
- PR tavsifi o'zbek tilida: nima qilindi, qanday sinash kerak.
- Kod izohlari va commit xabarlari qisqa, tushunarli.
