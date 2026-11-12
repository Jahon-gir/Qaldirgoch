# Kasbiy soʻzlar: Excel shablon bilan ishlash

Bu qoʻllanma jamoa uchun: kasbiy nemis soʻzlari (keyin boshqa tillar) Excel'da yoziladi, keyin bitta buyruq bilan ilovaga oʻtkaziladi. Dasturchi boʻlish shart emas.

Shablon: [`shablon.xlsx`](shablon.xlsx). Har bir soha yoki jamoa aʼzosi uchun nusxa oling (masalan, `docs/content/care-1.xlsx`).

## Varaqlar

| Varaq | Nima yoziladi |
|---|---|
| **Qollanma** | Qisqa eslatma (import qilinmaydi) |
| **Sohalar** | Soha: `general` (umumiy: ish kundaligi), `care` (parvarish va tibbiyot), `technical` (texnik kasblar), `hospitality` (mehmonxona va oshxona), `logistics` (logistika va haydovchilik), `metal` (metall va avtomobil), `cleaning` (tozalash xizmati), `agriculture` (qishloq xoʻjaligi), `retail` (savdo), `food` (oziq-ovqat ishlab chiqarish). Nomlar uch tilda |
| **Vaziyatlar** | Soha ichidagi vaziyat: masalan, `technical` → `asboblar` "Asboblar", `birinchi-kun` "Birinchi ish kuni" |
| **Sozlar** | Har bir qator — bitta soʻz yoki ibora |

1-qator — ustun nomlari (oʻzgartirmang). 2-qatordagi kulrang yozuv — izoh va misol, import uni oʻtkazib yuboradi. Maʼlumot **3-qatordan** boshlanadi.

## "Sozlar" ustunlari

| Ustun | Majburiy | Izoh |
|---|---|---|
| field, situation, level | ha | Soha, vaziyat id'si, daraja (A1, A2, B1, B2) |
| article | otlarda | `der` / `die` / `das`. Ilovada "der Hammer" boʻlib chiqadi, Artikl mashqi ishlaydi |
| term | ha | Soʻz **artiklsiz**: `Hammer`. Ibora ham boʻladi: `Vorsicht!` |
| plural | otlarda | `die Hämmer`; koʻpligi yoʻq boʻlsa `—` |
| icon | tavsiya | Rasm hali boʻlmasa koʻrsatiladigan ikonka (Tabler nomi, `src/components/german/icons.ts` roʻyxatidan): `tools`, `stethoscope` |
| slug | yoʻq | Boʻsh qoldiring — soʻzdan oʻzi chiqadi (`Säge` → `saege`). Koreys tilida majburiy |
| uz, uz_cyrl, ru | ha | Tarjima. Kirillni qoʻlda yozing (avtomatik emas). Qoralamada faqat `uz` yetadi |
| pron_uz, pron_cyrl, pron_ru | tekshiruvda/tasdiqlanganda | Oʻqilishi (dars kartasida chiqadi): `der ha-mer` / `дер ха-мер`. ch → x, sch → sh, ei → ay, eu → oy, ü → yu |
| example_term, example_uz, example_cyrl, example_ru | tavsiya | Ishdan olingan qisqa gap va tarjimasi |
| jobs | yoʻq | Kasblar, vergul bilan: `elektroniker, shk` |
| safety | yoʻq | Xavfsizlik soʻzi boʻlsa `ha` |
| image_file, image_source, image_checked | tavsiya | Rasm (pastga qarang) |
| image_license, image_author | cc rasmda | Litsenziya va muallif |
| audio_file | yoʻq | Boʻsh boʻlsa ilova telefon ovozidan foydalanadi |
| source | yoʻq | Masalan: `Goethe A1 Wortliste — faqat daraja uchun` |
| status | ha | `qoralama` → `tekshiruvda` → `tasdiqlangan` |
| verified_by, verified_at | tasdiqlanganda | Tekshiruvchi ismi va sana `2026-11-13` |

Soʻz id'si avtomatik yasaladi: `soha-vaziyat-slug` (masalan `technical-asboblar-hammer`). U foydalanuvchi progressida saqlanadi, shuning uchun **soʻz ilovaga chiqqandan keyin soha, vaziyat yoki slug'ni oʻzgartirmang**.

## Rasmlar

- Fayl: `public/content/de/img/<soha>/<nom>.webp` (Excel'da `image_file` = `technical/hammer.webp`).
- Format **WebP**, hajmi ~30 KB atrofida (60 KB dan oshsa import toʻxtaydi). Arzon telefon va sekin internet uchun.
- Hamma rasm **bitta uslubda** (uslub qoʻllanmasi alohida tasdiqlanadi).
- `image_source`: `ai` — AI chizgan; `own` — oʻzimiz chizgan yoki suratga olgan; `cc` — erkin litsenziyali (license va author majburiy).
- AI chizgan rasmni odam koʻrib chiqadi: toʻgʻri asbob, toʻgʻri harakat, xatosiz. Shundan keyin `image_checked` = `ha`. Tasdiqlangan soʻzda bu majburiy.

## Holatlar

- **qoralama** — yozilmoqda.
- **tekshiruvda** — uch tilda tayyor, nemis tilini biladigan odam koʻrishini kutyapti.
- **tasdiqlangan** — tekshiruvchi koʻrdi (`verified_by`, `verified_at` majburiy).

## Mualliflik huquqi

telc, Goethe-Institut va darsliklardagi **matn, misol gap va rasmlar koʻchirilmaydi**. Ularning soʻz roʻyxatlaridan faqat soʻz qaysi darajaga tegishli ekanini aniqlash uchun foydalaniladi. Misol gaplarni oʻzimiz yozamiz.

## Buyruqlar

```bash
npm run content:import -- docs/content/fayl.xlsx --dry   # faqat tekshirish
npm run content:import -- docs/content/fayl.xlsx         # tekshirish + src/content/packs/de/<soha>.json ga yozish
npm run content:import -- docs/content/fayl.xlsx --til ko  # koreys tili
npm run content:check                                     # tayyor JSON'larni Excel'siz tekshirish
npm run content:template                                  # shablonni qayta yaratish
```

Xato boʻlsa hech narsa yozilmaydi; har bir xato varaq, qator va sabab bilan chiqadi, masalan:

```
XATO  Sozlar, 7-qator: koʻplik "Hämmer" — "die ..." shaklida yoki koʻpligi yoʻq boʻlsa "—"
```

## Ilovada qanday chiqadi (0.12.1 dan)

- Har bir **vaziyat** — Til ekranida alohida **modul**. `general` modullari hammaga, qolganlari foydalanuvchi tanlagan yoʻnalishga (Til ekranidagi "Yoʻnalish: … · Oʻzgartirish") koʻrinadi.
- Soʻzlar **6 tadan darsga** boʻlinadi (oxirida 1–2 soʻz qolsa, oldingi darsga qoʻshiladi); har darsda soʻz kartalari, juftlash va 2 tagacha **"boʻshliqni toʻldiring"** mashqi. Bu mashq otning misol gapidan avtomatik yasaladi: ot misolda aynan shu shaklda (masalan `Hammer`, `Nägel` emas) boʻlsa, oʻsha joy boʻsh qoldiriladi va tarjima koʻrsatiladi. Shuning uchun misol gapda otni lugʻatdagi shaklida ishlatish foydali.
- Dars tugagach soʻzlar **Lugʻat** va **takrorlash** qutisiga tushadi, modul yakuniy testi ochiladi — mavjud barcha mashq usullari ishlaydi.
- **Qoralama** soʻzlar ilovaga chiqmaydi.
