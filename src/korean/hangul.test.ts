import { describe, expect, it } from 'vitest'
import { compose, decompose, hasFinal, syllablesOf } from './hangul'

describe('hangul: compose / decompose', () => {
  it('harflardan boʻgʻin', () => {
    expect(compose('ㄴ', 'ㅏ')).toBe('나')
    expect(compose('ㅎ', 'ㅏ', 'ㄴ')).toBe('한')
    expect(compose('ㄱ', 'ㅡ', 'ㄹ')).toBe('글')
    expect(compose('ㅇ', 'ㅏ')).toBe('아')
    expect(compose('ㄱ', 'ㅏ')).toBe('가') // birinchi boʻgʻin (0xAC00)
    expect(compose('ㅎ', 'ㅣ', 'ㅎ')).toBe('힣') // oxirgi boʻgʻin (0xD7A3)
  })
  it('boʻgʻindan harflar', () => {
    expect(decompose('한')).toEqual(['ㅎ', 'ㅏ', 'ㄴ'])
    expect(decompose('나')).toEqual(['ㄴ', 'ㅏ'])
    expect(decompose('글')).toEqual(['ㄱ', 'ㅡ', 'ㄹ'])
    expect(decompose('한'.normalize('NFD'))).toEqual(['ㅎ', 'ㅏ', 'ㄴ'])
  })
  it('notoʻgʻri kirish → null', () => {
    expect(compose('ㅏ', 'ㄴ')).toBeNull() // unli bosh harf oʻrnida
    expect(compose('ㄴ', 'ㄴ')).toBeNull()
    expect(compose('a', 'ㅏ')).toBeNull()
    expect(compose('ㄴ', 'ㅏ', 'ㅏ')).toBeNull()
    expect(compose('ㄴ', 'ㅏ', 'ㄸ')).toBeNull() // ㄸ ostki harf boʻlmaydi
    expect(decompose('a')).toBeNull()
    expect(decompose('ㄴ')).toBeNull()
    expect(decompose('나라')).toBeNull()
    expect(decompose('')).toBeNull()
  })
  it('ikki tomonga ham: barcha 11 172 boʻgʻin', () => {
    for (let c = 0xac00; c <= 0xd7a3; c++) {
      const s = String.fromCharCode(c)
      const [l, v, t] = decompose(s)!
      expect(compose(l, v, t)).toBe(s)
    }
  })
  it('batchim va boʻgʻinlar', () => {
    expect(hasFinal('한')).toBe(true)
    expect(hasFinal('나')).toBe(false)
    expect(syllablesOf('라디오')).toEqual(['라', '디', '오'])
  })
})
