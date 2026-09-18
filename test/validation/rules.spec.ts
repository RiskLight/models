import { describe, it, expect } from 'vitest'
import {
  required, email, url, uuid, ip, iso8601,
  alpha, alphanumeric, base64, creditcard, json,
  integer, numeric, boolean as booleanRule,
  between, min, max, length, gt, gte, lt, lte,
  equals, string as stringRule, array, object,
  defined, empty,
  same,
} from '../../src'

// --- Format validators (backed by Zod under the hood) ---

describe('Validation: format rules', () => {
  it('email', () => {
    expect(email.test('user@test.com')).toBe(true)
    expect(email.test('invalid')).toBe(false)
  })

  it('url', () => {
    expect(url.test('https://example.com')).toBe(true)
    expect(url.test('not-a-url')).toBe(false)
  })

  it('uuid', () => {
    expect(uuid.test('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    expect(uuid.test('not-uuid')).toBe(false)
  })

  it('ip', () => {
    expect(ip.test('192.168.1.1')).toBe(true)
    expect(ip.test('999.999.999.999')).toBe(false)
  })

  it('iso8601', () => {
    expect(iso8601.test('2026-03-19T10:00:00Z')).toBe(true)
    expect(iso8601.test('not-a-date')).toBe(false)
  })

  it('alpha', () => {
    expect(alpha.test('hello')).toBe(true)
    expect(alpha.test('hello123')).toBe(false)
  })

  it('alphanumeric', () => {
    expect(alphanumeric.test('hello123')).toBe(true)
    expect(alphanumeric.test('hello 123!')).toBe(false)
  })

  it('base64', () => {
    expect(base64.test('SGVsbG8=')).toBe(true)
    expect(base64.test('not base64!')).toBe(false)
  })

  it('creditcard', () => {
    expect(creditcard.test('4111111111111111')).toBe(true)
    expect(creditcard.test('1234')).toBe(false)
  })

  it('json', () => {
    expect(json.test('{"key":"value"}')).toBe(true)
    expect(json.test('not json')).toBe(false)
  })
})

// --- Type rules ---

describe('Validation: type rules', () => {
  it('integer', () => {
    expect(integer.test(5)).toBe(true)
    expect(integer.test(5.5)).toBe(false)
  })

  it('numeric', () => {
    expect(numeric.test(5)).toBe(true)
    expect(numeric.test(5.5)).toBe(true)
    expect(numeric.test('5')).toBe(true)
    expect(numeric.test('abc')).toBe(false)
  })

  it('boolean', () => {
    expect(booleanRule.test(true)).toBe(true)
    expect(booleanRule.test(false)).toBe(true)
    expect(booleanRule.test(1)).toBe(false)
  })

  it('string', () => {
    expect(stringRule.test('hello')).toBe(true)
    expect(stringRule.test(123)).toBe(false)
  })

  it('array', () => {
    expect(array.test([1, 2])).toBe(true)
    expect(array.test('not array')).toBe(false)
  })

  it('object', () => {
    expect(object.test({ a: 1 })).toBe(true)
    expect(object.test(null)).toBe(false)
  })
})

// --- Comparison rules ---

describe('Validation: comparison rules', () => {
  it('between(min, max)', () => {
    const rule = between(1, 10)
    expect(rule.test(5)).toBe(true)
    expect(rule.test(0)).toBe(false)
    expect(rule.test(11)).toBe(false)
  })

  it('min(n)', () => {
    expect(min(5).test(5)).toBe(true)
    expect(min(5).test(4)).toBe(false)
  })

  it('max(n)', () => {
    expect(max(10).test(10)).toBe(true)
    expect(max(10).test(11)).toBe(false)
  })

  it('gt / gte / lt / lte', () => {
    expect(gt(5).test(6)).toBe(true)
    expect(gt(5).test(5)).toBe(false)
    expect(gte(5).test(5)).toBe(true)
    expect(lt(5).test(4)).toBe(true)
    expect(lt(5).test(5)).toBe(false)
    expect(lte(5).test(5)).toBe(true)
  })

  it('length(min, max)', () => {
    expect(length(2, 5).test('abc')).toBe(true)
    expect(length(2, 5).test('a')).toBe(false)
    expect(length(2, 5).test('abcdef')).toBe(false)
  })

  it('equals', () => {
    expect(equals('foo').test('foo')).toBe(true)
    expect(equals('foo').test('bar')).toBe(false)
  })
})

// --- Presence rules ---

describe('Validation: presence rules', () => {
  it('required', () => {
    expect(required.test('value')).toBe(true)
    expect(required.test('')).toBe(false)
    expect(required.test(null)).toBe(false)
    expect(required.test(undefined)).toBe(false)
  })

  it('defined', () => {
    expect(defined.test('')).toBe(true)
    expect(defined.test(0)).toBe(true)
    expect(defined.test(undefined)).toBe(false)
  })

  it('empty', () => {
    expect(empty.test('')).toBe(true)
    expect(empty.test(null)).toBe(true)
    expect(empty.test('value')).toBe(false)
  })
})

// --- Chaining ---

describe('Validation: chaining', () => {
  it('and() combines rules', () => {
    const rule = required.and(email)
    expect(rule.test('user@test.com')).toBe(true)
    expect(rule.test('')).toBe(false)
    expect(rule.test('invalid')).toBe(false)
  })

  it('or() allows alternative', () => {
    const rule = email.or(empty)
    expect(rule.test('user@test.com')).toBe(true)
    expect(rule.test('')).toBe(true)
    expect(rule.test('invalid')).toBe(false)
  })

  it('format() sets custom error message', () => {
    const rule = required.format('This field is required')
    const result = rule.validate(null)
    expect(result).toBe('This field is required')
  })
})

// --- Integration with Model ---

describe('Validation: model integration', () => {
  // This test validates that the old vue-mc validation syntax works
  it('validation() with rules works on model', async () => {
    const { Model } = await import('../../src')

    class User extends Model {
      defaults() {
        return { name: '', email: '' }
      }
      validation() {
        return {
          name: required,
          email: required.and(email),
        }
      }
    }

    const user = new User()
    const errors = await user.validate()
    expect(errors).toHaveProperty('name')
    expect(errors).toHaveProperty('email')

    user.name = 'John'
    user.email = 'john@test.com'
    const errors2 = await user.validate()
    expect(errors2).toEqual({}) // valid
  })
})

describe('combinators report the failing rule', () => {
  it('and() uses the message of the rule that failed', () => {
    const rule = required.and(email)
    expect(rule.validate('')).toBe(required.message)
    expect(rule.validate('broken')).toBe(email.message)
    expect(rule.validate('a@b.co')).toBe(true)
  })

  it('and() forwards attribute and model to both rules', () => {
    const rule = required.and(same('password'))
    const model = { get: (k: string) => (k === 'password' ? 'secret' : undefined) }
    expect(rule.validate('secret', 'confirm', model)).toBe(true)
    expect(rule.validate('other', 'confirm', model)).toBe(same('password').message)
  })

  it('format() overrides the message of a combined rule', () => {
    const rule = required.and(email).format('Need a real email')
    expect(rule.validate('broken')).toBe('Need a real email')
  })

  it('or() keeps the first message when both fail', () => {
    const rule = email.or(url)
    expect(rule.validate('nope')).toBe(email.message)
    expect(rule.validate('https://x.io')).toBe(true)
  })
})
