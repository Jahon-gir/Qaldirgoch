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
    expect(compose('ㄴ', 'ㅏ', 'ㄸ')).toBeNull() // ㄸ pastki harf boʻlmaydi
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
  it('qattiq undoshlar va murakkab unlilar', () => {
    expect(compose('ㄲ', 'ㅏ')).toBe('까')
    expect(compose('ㅃ', 'ㅏ')).toBe('빠')
    expect(compose('ㅉ', 'ㅏ')).toBe('짜')
    expect(compose('ㅆ', 'ㅣ')).toBe('씨')
    expect(compose('ㄱ', 'ㅘ')).toBe('과')
    expect(compose('ㅇ', 'ㅢ')).toBe('의')
    expect(compose('ㅎ', 'ㅚ')).toBe('회')
    expect(compose('ㅈ', 'ㅟ')).toBe('쥐')
    expect(compose('ㄷ', 'ㅙ')).toBe('돼')
    expect(compose('ㄱ', 'ㅖ')).toBe('계')
    expect(decompose('과')).toEqual(['ㄱ', 'ㅘ']) // murakkab unli — bitta belgi
    expect(decompose('돼')).toEqual(['ㄷ', 'ㅙ'])
    expect(decompose('까')).toEqual(['ㄲ', 'ㅏ'])
  })
  it('pastki harf: 7 asosiy tovush va bir xil bosh/pastki harf', () => {
    expect(compose('ㅂ', 'ㅏ', 'ㅂ')).toBe('밥')
    expect(compose('ㅁ', 'ㅜ', 'ㄹ')).toBe('물')
    expect(compose('ㅅ', 'ㅏ', 'ㄴ')).toBe('산')
    expect(compose('ㄱ', 'ㅏ', 'ㅇ')).toBe('강')
    expect(compose('ㅈ', 'ㅣ', 'ㅂ')).toBe('집')
    expect(compose('ㅁ', 'ㅜ', 'ㄴ')).toBe('문')
    expect(compose('ㅊ', 'ㅐ', 'ㄱ')).toBe('책')
    expect(compose('ㅇ', 'ㅗ', 'ㅅ')).toBe('옷')
    expect(compose('ㅅ', 'ㅏ', 'ㅁ')).toBe('삼')
    expect(compose('ㄷ', 'ㅏ', 'ㄷ')).toBe('닫')
    expect(decompose('밥')).toEqual(['ㅂ', 'ㅏ', 'ㅂ'])
    expect(decompose('한')).toHaveLength(3)
    expect(compose('ㅂ', 'ㅏ', '')).toBe('바') // boʻsh pastki harf — yoʻq
    expect(compose('ㅂ', 'ㅏ', 'ㅃ')).toBeNull() // ㅃ pastki harf boʻlmaydi
  })
  it('batchim va boʻgʻinlar', () => {
    expect(hasFinal('한')).toBe(true)
    expect(hasFinal('나')).toBe(false)
    expect(syllablesOf('라디오')).toEqual(['라', '디', '오'])
  })
})
