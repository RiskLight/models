import { describe, it, expect, beforeEach } from 'vitest'
import { register, locale, getMessage, getMessages, resetMessages, required, email, between } from '../../src'

beforeEach(() => {
  resetMessages()
})

describe('Validation: message system', () => {
  it('getMessage returns default English message', () => {
    expect(getMessage('required')).toBe('Value is required')
    expect(getMessage('email')).toBe('Must be a valid email')
  })

  it('getMessage substitutes parameters', () => {
    expect(getMessage('between', 1, 10)).toBe('Must be between 1 and 10')
    expect(getMessage('min', 5)).toBe('Must be at least 5')
    expect(getMessage('gt', 0)).toBe('Must be greater than 0')
  })

  it('getMessage returns key when not found', () => {
    expect(getMessage('nonexistent_rule')).toBe('nonexistent_rule')
  })

  it('register() adds messages for a locale', () => {
    register('uk', {
      required: 'Поле обовʼязкове',
      email: 'Невірний email',
    })

    locale('uk')
    expect(getMessage('required')).toBe('Поле обовʼязкове')
    expect(getMessage('email')).toBe('Невірний email')
  })

  it('locale() switches active locale', () => {
    register('uk', { required: 'Обовʼязкове' })
    register('ru', { required: 'Обязательно' })

    locale('uk')
    expect(getMessage('required')).toBe('Обовʼязкове')

    locale('ru')
    expect(getMessage('required')).toBe('Обязательно')
  })

  it('locale() returns current locale', () => {
    expect(locale()).toBe('en')
    locale('uk')
    expect(locale()).toBe('uk')
  })

  it('falls back to en when key missing in current locale', () => {
    register('en', { required: 'Required (en)' })
    register('uk', { email: 'Email (uk)' })

    locale('uk')
    // 'required' not in uk → falls back to en
    expect(getMessage('required')).toBe('Required (en)')
    // 'email' in uk
    expect(getMessage('email')).toBe('Email (uk)')
  })

  it('falls back to defaults when key missing in all locales', () => {
    locale('uk')
    // 'integer' not registered in any locale → built-in default
    expect(getMessage('integer')).toBe('Must be an integer')
  })

  it('getMessages() returns merged messages', () => {
    register('en', { required: 'Custom required' })
    const msgs = getMessages()
    expect(msgs.required).toBe('Custom required')
    expect(msgs.email).toBe('Must be a valid email') // default
  })

  it('resetMessages() clears all registered locales', () => {
    register('uk', { required: 'Обовʼязкове' })
    locale('uk')
    resetMessages()
    expect(locale()).toBe('en')
    expect(getMessage('required')).toBe('Value is required')
  })

  it('register() can override specific messages', () => {
    register('en', { required: 'This field is required' })
    expect(getMessage('required')).toBe('This field is required')
  })

  it('register() merges with existing locale messages', () => {
    register('uk', { required: 'Обовʼязкове' })
    register('uk', { email: 'Email' })
    locale('uk')
    expect(getMessage('required')).toBe('Обовʼязкове')
    expect(getMessage('email')).toBe('Email')
  })
})

describe('Validation: rules use message system', () => {
  it('required rule uses getMessage', () => {
    const result = required.validate('')
    expect(result).toBe('Value is required')
  })

  it('between rule uses getMessage with params', () => {
    const rule = between(1, 10)
    const result = rule.validate(0)
    expect(typeof result).toBe('string')
    expect(result).toContain('1')
    expect(result).toContain('10')
  })

  it('format() overrides message from locale system', () => {
    const customRequired = required.format('Поле не може бути порожнім')
    expect(customRequired.validate('')).toBe('Поле не може бути порожнім')
  })

  it('rule.message getter returns current message', () => {
    expect(required.message).toBe('Value is required')
    expect(email.message).toBe('Must be a valid email')
  })
})
