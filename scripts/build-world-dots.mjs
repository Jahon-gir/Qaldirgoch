// Bosh ekran xaritasi: nuqtali dunyo, Oʻzbekiston va shaharlar -> src/home/worldMap.ts
// Ishga tushirish: node scripts/build-world-dots.mjs (natija commit qilinadi; ilovada kutubxona yuklanmaydi).
// Maʼlumot: Natural Earth (public domain) world-atlas@2.0.2 (ISC) orqali; topojson-client, d3-geo (ISC).
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { feature } from 'topojson-client'
import { geoContains, geoEquirectangular, geoPath } from 'd3-geo'

const require = createRequire(import.meta.url)
const land110 = JSON.parse(readFileSync(require.resolve('world-atlas/land-110m.json'), 'utf8'))
const countries110 = JSON.parse(readFileSync(require.resolve('world-atlas/countries-110m.json'), 'utf8'))

const W = 330, H = 150, STEP = 4.4
const land = feature(land110, land110.objects.land)
const uz = feature(countries110, countries110.objects.countries).features.find((f) => f.id === '860')
if (!uz) throw new Error('Oʻzbekiston (860) topilmadi')

// lon -120..240, lat -50..75 (antimeridian chetidan biroz ichkarida)
const frame = { type: 'MultiPoint', coordinates: [[-119.9, -50], [239.9, -50], [239.9, 75], [-119.9, 75]] }
const projection = geoEquirectangular().rotate([-60, 0]).fitExtent([[4, 4], [326, 146]], frame)
const r1 = (n) => Math.round(n * 10) / 10

const dots = []
for (let y = STEP / 2; y < H; y += STEP) {
  for (let x = STEP / 2; x < W; x += STEP) {
    const ll = projection.invert([x, y])
    if (!ll) continue
    if (ll[1] < -56) continue // Antarktida chizigʻi chiqmasin
    if (!geoContains(land, ll) || geoContains(uz, ll)) continue
    dots.push(`M${r1(x)} ${r1(y)}h0`)
  }
}

const uzPath = geoPath(projection).digits(1)(uz)
const pt = (lonlat) => projection(lonlat).map(r1)

// Poytaxtlar [lon, lat]
const CITIES = {
  de: [13.4, 52.52], gb: [-0.13, 51.51], kr: [126.98, 37.57], jp: [139.69, 35.69], us: [-77.04, 38.91], ca: [-75.7, 45.42],
  tr: [32.85, 39.93], ae: [54.37, 24.45], pl: [21.01, 52.23], fr: [2.35, 48.86], it: [12.5, 41.9], au: [149.13, -35.28],
  br: [-47.88, -15.79], za: [28.19, -25.75], in: [77.21, 28.61], my: [101.69, 3.14], fi: [24.94, 60.17], cn: [116.4, 39.9]
}
const cities = Object.entries(CITIES).map(([id, ll]) => ({ id, p: pt(ll) }))

const out = `// AVTOMATIK: node scripts/build-world-dots.mjs. Qoʻlda tahrirlamang.
// Maʼlumot: Natural Earth (public domain), world-atlas@2.0.2 (ISC). Proyeksiya: equirectangular, rotate [-60, 0].
export const MAP_W = ${W}
export const MAP_H = ${H}
/** Quruqlik nuqtalari (${dots.length} ta), bitta path: stroke-linecap round. */
export const LAND_DOTS = ${JSON.stringify(dots.join(''))}
export const UZ_PATH = ${JSON.stringify(uzPath)}
export const TASHKENT: readonly [number, number] = ${JSON.stringify(pt([69.2, 41.3]))}
export const CITIES: readonly { id: string; p: readonly [number, number] }[] = ${JSON.stringify(cities)}
`
writeFileSync(new URL('../src/home/worldMap.ts', import.meta.url), out)
console.log(`worldMap.ts: ${dots.length} nuqta, ${cities.length} shahar, ${out.length} bayt`)
