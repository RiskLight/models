import { describe, it, expect } from 'vitest'
import {
  after, before, date, dateformat, ascii, match,
  isnil, isnull, isblank, negative, positive, not, equal, equals,
  same, required, Model,
} from '../../src'

describe('Validation: date rules', () => {
  it('after(date)', () => {
    const rule = after('2025-01-01')
    expect(rule.test('2026-01-01')).toBe(true)
    expect(rule.test('2024-01-01')).toBe(false)
  })

  it('before(date)', () => {
    const rule = before('2025-01-01')
    expect(rule.test('2024-01-01')).toBe(true)
    expect(rule.test('2026-01-01')).toBe(false)
  })

  it('date', () => {
    expect(date.test('2026-03-19')).toBe(true)
    expect(date.test('not a date')).toBe(false)
  })

  it('dateformat(YYYY-MM-DD)', () => {
    const rule = dateformat('YYYY-MM-DD')
    expect(rule.test('2026-03-19')).toBe(true)
    expect(rule.test('19-03-2026')).toBe(false)
    expect(rule.test('2026/03/19')).toBe(false)
  })
})

describe('Validation: string rules', () => {
  it('ascii', () => {
    expect(ascii.test('hello')).toBe(true)
    expect(ascii.test('héllo')).toBe(false)
  })

  it('match(pattern)', () => {
    const rule = match(/^\d{3}-\d{4}$/)
    expect(rule.test('123-4567')).toBe(true)
    expect(rule.test('1234567')).toBe(false)
  })
})

describe('Validation: nullness rules', () => {
  it('isnil', () => {
    expect(isnil.test(null)).toBe(true)
    expect(isnil.test(undefined)).toBe(true)
    expect(isnil.test('')).toBe(false)
    expect(isnil.test(0)).toBe(false)
  })

  it('isnull', () => {
    expect(isnull.test(null)).toBe(true)
    expect(isnull.test(undefined)).toBe(false)
  })

  it('isblank', () => {
    expect(isblank.test(null)).toBe(true)
    expect(isblank.test(undefined)).toBe(true)
    expect(isblank.test('')).toBe(true)
    expect(isblank.test('   ')).toBe(true)
    expect(isblank.test('hello')).toBe(false)
  })
})

describe('Validation: number rules', () => {
  it('negative', () => {
    expect(negative.test(-5)).toBe(true)
    expect(negative.test(0)).toBe(false)
    expect(negative.test(5)).toBe(false)
  })

  it('positive', () => {
    expect(positive.test(5)).toBe(true)
    expect(positive.test(0)).toBe(false)
    expect(positive.test(-5)).toBe(false)
  })
})

describe('Validation: exclusion', () => {
  it('not(...values)', () => {
    const rule = not('admin', 'root')
    expect(rule.test('user')).toBe(true)
    expect(rule.test('admin')).toBe(false)
    expect(rule.test('root')).toBe(false)
  })
})

describe('Validation: aliases', () => {
  it('equal is alias for equals', () => {
    expect(equal('foo').test('foo')).toBe(true)
    expect(equal('foo').test('bar')).toBe(false)
  })
})

describe('Validation: same(attribute)', () => {
  it('validates that two attributes match', async () => {
    class Form extends Model {
      defaults() { return { password: '', password_confirmation: '' } }
      validation() {
        return {
          password: required,
          password_confirmation: same('password'),
        }
      }
    }

    const form = new Form({ password: 'secret', password_confirmation: 'secret' })
    expect(await form.validate()).toBe(true)

    form.password_confirmation = 'different'
    expect(await form.validate()).toBe(false)
    expect(form.errors).toHaveProperty('password_confirmation')
  })
})
