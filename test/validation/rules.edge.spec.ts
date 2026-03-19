import { describe, it, expect } from 'vitest'
import {
  required, email, url, uuid, ip, iso8601, alpha, alphanumeric,
  base64, creditcard, json, integer, numeric, boolean as booleanRule,
  string as stringRule, array, object, date, ascii,
  between, min, max, gt, gte, lt, lte, length, equals,
  after, before, dateformat, match, negative, positive,
  defined, empty, isnil, isnull, isblank, not, same,
} from '../../src'

// --- Exhaustive edge case tests for each rule ---

describe('required: edge cases', () => {
  it('rejects null', () => expect(required.test(null)).toBe(false))
  it('rejects undefined', () => expect(required.test(undefined)).toBe(false))
  it('rejects empty string', () => expect(required.test('')).toBe(false))
  it('accepts 0', () => expect(required.test(0)).toBe(true))
  it('accepts false', () => expect(required.test(false)).toBe(true))
  it('accepts whitespace', () => expect(required.test(' ')).toBe(true))
  it('accepts empty array', () => expect(required.test([])).toBe(true))
  it('accepts empty object', () => expect(required.test({})).toBe(true))
})

describe('email: edge cases', () => {
  it('accepts standard email', () => expect(email.test('user@example.com')).toBe(true))
  it('accepts email with dots', () => expect(email.test('first.last@example.com')).toBe(true))
  it('accepts email with plus', () => expect(email.test('user+tag@example.com')).toBe(true))
  it('rejects no @', () => expect(email.test('userexample.com')).toBe(false))
  it('rejects no domain', () => expect(email.test('user@')).toBe(false))
  it('rejects number', () => expect(email.test(123)).toBe(false))
  it('rejects null', () => expect(email.test(null)).toBe(false))
})

describe('url: edge cases', () => {
  it('accepts https', () => expect(url.test('https://example.com')).toBe(true))
  it('accepts http', () => expect(url.test('http://example.com')).toBe(true))
  it('accepts with path', () => expect(url.test('https://example.com/path')).toBe(true))
  it('rejects plain domain', () => expect(url.test('example.com')).toBe(false))
  it('rejects number', () => expect(url.test(123)).toBe(false))
})

describe('uuid: edge cases', () => {
  it('accepts v4 uuid', () => expect(uuid.test('550e8400-e29b-41d4-a716-446655440000')).toBe(true))
  it('accepts lowercase', () => expect(uuid.test('550e8400-e29b-41d4-a716-446655440000')).toBe(true))
  it('rejects too short', () => expect(uuid.test('550e8400-e29b-41d4')).toBe(false))
  it('rejects wrong chars', () => expect(uuid.test('gggggggg-gggg-gggg-gggg-gggggggggggg')).toBe(false))
  it('rejects number', () => expect(uuid.test(123)).toBe(false))
  it('rejects with trailing space', () => expect(uuid.test('550e8400-e29b-41d4-a716-446655440000 ')).toBe(false))
})

describe('ip: edge cases', () => {
  it('accepts ipv4', () => expect(ip.test('192.168.1.1')).toBe(true))
  it('accepts ipv4 zeros', () => expect(ip.test('0.0.0.0')).toBe(true))
  it('rejects out of range', () => expect(ip.test('999.999.999.999')).toBe(false))
  it('rejects text', () => expect(ip.test('not-an-ip')).toBe(false))
  it('rejects number', () => expect(ip.test(123)).toBe(false))
})

describe('iso8601: edge cases', () => {
  it('accepts datetime with Z', () => expect(iso8601.test('2026-03-19T10:00:00Z')).toBe(true))
  it('accepts datetime with offset', () => expect(iso8601.test('2026-03-19T10:00:00+03:00')).toBe(true))
  it('rejects date only', () => expect(iso8601.test('2026-03-19')).toBe(false))
  it('rejects text', () => expect(iso8601.test('not-a-date')).toBe(false))
  it('rejects number', () => expect(iso8601.test(123)).toBe(false))
})

describe('alpha: edge cases', () => {
  it('accepts letters', () => expect(alpha.test('hello')).toBe(true))
  it('accepts uppercase', () => expect(alpha.test('HELLO')).toBe(true))
  it('accepts accented (via deburr)', () => expect(alpha.test('héllo')).toBe(true))
  it('rejects digits', () => expect(alpha.test('hello1')).toBe(false))
  it('rejects spaces', () => expect(alpha.test('hello world')).toBe(false))
  it('rejects empty', () => expect(alpha.test('')).toBe(false))
  it('rejects number', () => expect(alpha.test(123)).toBe(false))
})

describe('alphanumeric: edge cases', () => {
  it('accepts letters and digits', () => expect(alphanumeric.test('hello123')).toBe(true))
  it('accepts accented (via deburr)', () => expect(alphanumeric.test('café42')).toBe(true))
  it('rejects spaces', () => expect(alphanumeric.test('hello 123')).toBe(false))
  it('rejects special chars', () => expect(alphanumeric.test('hello!')).toBe(false))
})

describe('ascii: edge cases', () => {
  it('accepts ascii', () => expect(ascii.test('hello')).toBe(true))
  it('accepts ascii with numbers', () => expect(ascii.test('abc123')).toBe(true))
  it('accepts empty string', () => expect(ascii.test('')).toBe(true))
  it('rejects unicode', () => expect(ascii.test('héllo')).toBe(false))
  it('rejects emoji', () => expect(ascii.test('hello 😀')).toBe(false))
  it('rejects non-string', () => expect(ascii.test(123)).toBe(false))
})

describe('creditcard: edge cases', () => {
  it('accepts visa', () => expect(creditcard.test('4111111111111111')).toBe(true))
  it('accepts mastercard', () => expect(creditcard.test('5500000000000004')).toBe(true))
  it('rejects too short', () => expect(creditcard.test('411111')).toBe(false))
  it('rejects bad checksum', () => expect(creditcard.test('4111111111111112')).toBe(false))
  it('rejects letters', () => expect(creditcard.test('abcdefghijklmnop')).toBe(false))
})

describe('integer: edge cases', () => {
  it('accepts 0', () => expect(integer.test(0)).toBe(true))
  it('accepts negative', () => expect(integer.test(-5)).toBe(true))
  it('rejects float', () => expect(integer.test(1.5)).toBe(false))
  it('rejects string', () => expect(integer.test('5')).toBe(false))
  it('rejects NaN', () => expect(integer.test(NaN)).toBe(false))
  it('rejects Infinity', () => expect(integer.test(Infinity)).toBe(false))
})

describe('numeric: edge cases', () => {
  it('accepts number', () => expect(numeric.test(5)).toBe(true))
  it('accepts float', () => expect(numeric.test(5.5)).toBe(true))
  it('accepts negative', () => expect(numeric.test(-3)).toBe(true))
  it('accepts string number', () => expect(numeric.test('5')).toBe(true))
  it('accepts string float', () => expect(numeric.test('5.5')).toBe(true))
  it('accepts string negative', () => expect(numeric.test('-3')).toBe(true))
  it('rejects empty string', () => expect(numeric.test('')).toBe(false))
  it('rejects text', () => expect(numeric.test('abc')).toBe(false))
  it('rejects null', () => expect(numeric.test(null)).toBe(false))
})

describe('boolean: edge cases', () => {
  it('accepts true', () => expect(booleanRule.test(true)).toBe(true))
  it('accepts false', () => expect(booleanRule.test(false)).toBe(true))
  it('rejects 1', () => expect(booleanRule.test(1)).toBe(false))
  it('rejects 0', () => expect(booleanRule.test(0)).toBe(false))
  it('rejects string', () => expect(booleanRule.test('true')).toBe(false))
  it('rejects null', () => expect(booleanRule.test(null)).toBe(false))
})

describe('string: edge cases', () => {
  it('accepts string', () => expect(stringRule.test('hello')).toBe(true))
  it('accepts empty string', () => expect(stringRule.test('')).toBe(true))
  it('rejects number', () => expect(stringRule.test(123)).toBe(false))
  it('rejects boolean', () => expect(stringRule.test(true)).toBe(false))
  it('rejects null', () => expect(stringRule.test(null)).toBe(false))
})

describe('array: edge cases', () => {
  it('accepts empty array', () => expect(array.test([])).toBe(true))
  it('accepts filled array', () => expect(array.test([1, 2])).toBe(true))
  it('rejects string', () => expect(array.test('not array')).toBe(false))
  it('rejects object', () => expect(array.test({})).toBe(false))
  it('rejects null', () => expect(array.test(null)).toBe(false))
})

describe('object: edge cases', () => {
  it('accepts plain object', () => expect(object.test({ a: 1 })).toBe(true))
  it('accepts empty object', () => expect(object.test({})).toBe(true))
  it('rejects array', () => expect(object.test([])).toBe(false))
  it('rejects null', () => expect(object.test(null)).toBe(false))
  it('rejects string', () => expect(object.test('object')).toBe(false))
  it('rejects number', () => expect(object.test(42)).toBe(false))
})

describe('between: edge cases', () => {
  it('accepts min boundary', () => expect(between(1, 10).test(1)).toBe(true))
  it('accepts max boundary', () => expect(between(1, 10).test(10)).toBe(true))
  it('accepts middle', () => expect(between(1, 10).test(5)).toBe(true))
  it('rejects below min', () => expect(between(1, 10).test(0)).toBe(false))
  it('rejects above max', () => expect(between(1, 10).test(11)).toBe(false))
  it('rejects string', () => expect(between(1, 10).test('5')).toBe(false))
  it('accepts negative range', () => expect(between(-10, -1).test(-5)).toBe(true))
})

describe('length: edge cases', () => {
  it('string exact min', () => expect(length(3).test('abc')).toBe(true))
  it('string below min', () => expect(length(3).test('ab')).toBe(false))
  it('string in range', () => expect(length(2, 5).test('abc')).toBe(true))
  it('string at max', () => expect(length(2, 5).test('abcde')).toBe(true))
  it('string above max', () => expect(length(2, 5).test('abcdef')).toBe(false))
  it('array length', () => expect(length(2).test([1, 2, 3])).toBe(true))
  it('array below min', () => expect(length(3).test([1])).toBe(false))
  it('empty string fails min>0', () => expect(length(1).test('')).toBe(false))
})

describe('negative/positive: edge cases', () => {
  it('negative rejects zero', () => expect(negative.test(0)).toBe(false))
  it('positive rejects zero', () => expect(positive.test(0)).toBe(false))
  it('negative accepts -0.1', () => expect(negative.test(-0.1)).toBe(true))
  it('positive accepts 0.1', () => expect(positive.test(0.1)).toBe(true))
  it('negative rejects string', () => expect(negative.test('-1')).toBe(false))
  it('positive rejects string', () => expect(positive.test('1')).toBe(false))
})

describe('date rules: edge cases', () => {
  it('date accepts Date object', () => expect(date.test(new Date())).toBe(true))
  it('date accepts timestamp', () => expect(date.test(Date.now())).toBe(true))
  it('date rejects invalid', () => expect(date.test('not-a-date')).toBe(false))

  it('after with Date object', () => {
    const rule = after(new Date('2020-01-01'))
    expect(rule.test('2021-01-01')).toBe(true)
    expect(rule.test('2019-01-01')).toBe(false)
  })

  it('before with Date object', () => {
    const rule = before(new Date('2025-01-01'))
    expect(rule.test('2024-01-01')).toBe(true)
    expect(rule.test('2026-01-01')).toBe(false)
  })

  it('dateformat HH:mm:ss', () => {
    const rule = dateformat('HH:mm:ss')
    expect(rule.test('10:30:00')).toBe(true)
    expect(rule.test('25:61:00')).toBe(true) // format match only, not value validation
    expect(rule.test('10:30')).toBe(false)
  })

  it('dateformat YYYY/MM/DD', () => {
    const rule = dateformat('YYYY/MM/DD')
    expect(rule.test('2026/03/19')).toBe(true)
    expect(rule.test('2026-03-19')).toBe(false)
  })
})

describe('match: edge cases', () => {
  it('phone pattern', () => {
    const rule = match(/^\+\d{1,3}-\d{3,14}$/)
    expect(rule.test('+1-5551234567')).toBe(true)
    expect(rule.test('5551234567')).toBe(false)
  })
  it('rejects non-string', () => expect(match(/test/).test(123)).toBe(false))
  it('accepts empty with empty pattern', () => expect(match(/^$/).test('')).toBe(true))
})

describe('json: edge cases', () => {
  it('accepts object', () => expect(json.test('{"key":"value"}')).toBe(true))
  it('accepts array', () => expect(json.test('[1,2,3]')).toBe(true))
  it('accepts string', () => expect(json.test('"hello"')).toBe(true))
  it('accepts number', () => expect(json.test('42')).toBe(true))
  it('rejects malformed', () => expect(json.test('{key:value}')).toBe(false))
  it('rejects non-string', () => expect(json.test(42)).toBe(false))
})

describe('base64: edge cases', () => {
  it('accepts valid', () => expect(base64.test('SGVsbG8=')).toBe(true))
  it('accepts no padding', () => expect(base64.test('SGVs')).toBe(true))
  it('accepts double padding', () => expect(base64.test('SG==')).toBe(true))
  it('rejects bad chars', () => expect(base64.test('SGVs!!=')).toBe(false))
  it('rejects non-string', () => expect(base64.test(123)).toBe(false))
})

describe('not: edge cases', () => {
  it('rejects all listed values', () => {
    const rule = not(1, 2, 3)
    expect(rule.test(4)).toBe(true)
    expect(rule.test(1)).toBe(false)
    expect(rule.test(2)).toBe(false)
    expect(rule.test(3)).toBe(false)
  })
  it('type-strict', () => {
    expect(not('1').test(1)).toBe(true) // string '1' != number 1
  })
})

describe('defined/empty/isnil/isnull/isblank: edge cases', () => {
  it('defined accepts 0', () => expect(defined.test(0)).toBe(true))
  it('defined accepts false', () => expect(defined.test(false)).toBe(true))
  it('defined accepts empty string', () => expect(defined.test('')).toBe(true))
  it('defined rejects undefined', () => expect(defined.test(undefined)).toBe(false))

  it('empty accepts null', () => expect(empty.test(null)).toBe(true))
  it('empty accepts undefined', () => expect(empty.test(undefined)).toBe(true))
  it('empty accepts empty string', () => expect(empty.test('')).toBe(true))
  it('empty accepts empty array', () => expect(empty.test([])).toBe(true))
  it('empty rejects 0', () => expect(empty.test(0)).toBe(false))
  it('empty rejects false', () => expect(empty.test(false)).toBe(false))

  it('isnil accepts null', () => expect(isnil.test(null)).toBe(true))
  it('isnil accepts undefined', () => expect(isnil.test(undefined)).toBe(true))
  it('isnil rejects 0', () => expect(isnil.test(0)).toBe(false))
  it('isnil rejects empty string', () => expect(isnil.test('')).toBe(false))

  it('isnull accepts null only', () => expect(isnull.test(null)).toBe(true))
  it('isnull rejects undefined', () => expect(isnull.test(undefined)).toBe(false))

  it('isblank accepts null', () => expect(isblank.test(null)).toBe(true))
  it('isblank accepts undefined', () => expect(isblank.test(undefined)).toBe(true))
  it('isblank accepts empty string', () => expect(isblank.test('')).toBe(true))
  it('isblank accepts whitespace', () => expect(isblank.test('   ')).toBe(true))
  it('isblank accepts tab', () => expect(isblank.test('\t')).toBe(true))
  it('isblank rejects text', () => expect(isblank.test('hello')).toBe(false))
  it('isblank rejects 0', () => expect(isblank.test(0)).toBe(false))
})
