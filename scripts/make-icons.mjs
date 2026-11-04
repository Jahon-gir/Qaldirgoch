// public/icon.svg dan PWA PNG ikonkalarini yasaydi (Playwright kerak)
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
import { readFileSync } from 'node:fs'
const svg = readFileSync('public/icon.svg', 'utf8')
const maskable = svg.replace('rx="24"', 'rx="0"')
  .replace(/<path/, '<g transform="translate(50 50) scale(0.72) translate(-50 -50)"><path')
  .replace('</svg>', '</g></svg>')
const b = await chromium.launch()
const p = await b.newPage()
for (const [name, src, size] of [['icon-192.png', svg, 192], ['icon-512.png', svg, 512], ['icon-maskable-512.png', maskable, 512], ['apple-touch-icon.png', maskable, 180]]) {
  await p.setViewportSize({ width: size, height: size })
  await p.setContent(`<html><body style="margin:0">${src.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`)
  await p.screenshot({ path: `public/${name}`, omitBackground: true })
}
await b.close()
