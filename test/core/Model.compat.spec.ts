import { describe, it, expect } from 'vitest'
import { Model } from '../../src'

class User extends Model {
  defaults() { return { id: null, name: '', email: '' } }
}

// --- vue-mc compatibility: misc methods ---

describe('Model: vue-mc compat', () => {
  it('_uid is unique string', () => {
    const a = new User()
    const b = new User()
    expect(typeof a._uid).toBe('string')
    expect(a._uid).not.toBe(b._uid)
  })

  it('$class returns constructor name', () => {
    const user = new User()
    expect(user.$class).toBe('User')
  })

  it('toString() returns string representation', () => {
    const user = new User({ id: 1, name: 'John' })
    const str = user.toString()
    expect(str).toContain('User')
  })

  it('boot() is called during construction', () => {
    let booted = false
    class BootUser extends Model {
      defaults() { return { name: '' } }
      boot() { booted = true }
    }
    new BootUser()
    expect(booted).toBe(true)
  })

  it('setAttributeErrors() sets error for single attribute', () => {
    const user = new User()
    user.setAttributeErrors('name', 'Name is required')
    expect(user.errors.name).toBe('Name is required')
  })

  it('setAttributeErrors() with array', () => {
    const user = new User()
    user.setAttributeErrors('name', ['Too short', 'Required'])
    expect(user.errors.name).toEqual(['Too short', 'Required'])
  })

  it('getErrors() returns all errors', () => {
    const user = new User()
    user.setErrors({ name: 'Required', email: 'Invalid' })
    expect(user.getErrors()).toEqual({ name: 'Required', email: 'Invalid' })
  })

  it('clearErrors() clears all errors and fatal', () => {
    const user = new User()
    user.setErrors({ name: 'Required' })
    user.fatal = true
    user.clearErrors()
    expect(user.errors).toEqual({})
    expect(user.fatal).toBe(false)
  })

  it('isExisting() is opposite of isNew()', () => {
    const newUser = new User()
    expect(newUser.isNew()).toBe(true)
    expect(newUser.isExisting()).toBe(false)

    const existingUser = new User({ id: 1 })
    expect(existingUser.isNew()).toBe(false)
    expect(existingUser.isExisting()).toBe(true)
  })

  it('getOption with fallback', () => {
    const user = new User()
    expect(user.getOption('nonexistent', 'fallback')).toBe('fallback')
  })

  it('setOptions merges options', () => {
    const user = new User()
    user.setOption('custom.nested', 42)
    expect(user.getOption('custom.nested')).toBe(42)
  })

  it('attributes getter returns _attributes copy', () => {
    const user = new User({ id: 1, name: 'John', email: '' })
    expect(user.attributes).toEqual({ id: 1, name: 'John', email: '' })
    // Should be a copy
    user.attributes.name = 'Modified'
    expect(user.name).toBe('John')
  })
})
