import { describe, expect, it } from 'vitest'
import { toCyrillic } from '../../i18n/translit'
import { payByYear } from './intro'
import { ru } from '../../i18n/ru'
import { uz } from '../../i18n/uz'

describe('payByYear: step.yol.f3 dan raqamlar', () => {
  it('uz: 1-yil 724, 3-yil 977, 4-yil "1 014"', () => {
    expect(payByYear(uz['step.yol.f3'])).toEqual({ 1: '724', 2: '854', 3: '977', 4: '1 014' })
  })
  it('ru va kirill matnlarda ham bir xil raqamlar', () => {
    expect(payByYear(ru['step.yol.f3'])).toEqual({ 1: '724', 2: '854', 3: '977', 4: '1 014' })
    expect(payByYear(toCyrillic(uz['step.yol.f3']))).toEqual({ 1: '724', 2: '854', 3: '977', 4: '1 014' })
  })
  it('tushunarsiz matn — boʻsh obyekt', () => {
    expect(payByYear('Hech narsa')).toEqual({})
  })
})
