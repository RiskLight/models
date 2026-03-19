import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Model, Collection, required } from '../../src'

class User extends Model {
  defaults() { return { id: null, name: '', email: '' } }
  routes() { return { save: '/api/users' } }
}

class Users extends Collection<User> {
  model() { return User }
  routes() { return { save: '/api/users' } }
}

describe('Collection: clone', () => {
  it('creates a shallow copy', () => {
    const users = new Users([
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ])
    users.page(3)

    const clone = users.clone()

    expect(clone.size()).toBe(2)
    expect(clone.getPage()).toBe(3)
    expect(clone).not.toBe(users)
    expect(clone).toBeInstanceOf(Users)
  })

  it('shares model references (shallow)', () => {
    const users = new Users([{ id: 1, name: 'John' }])
    const clone = users.clone()

    expect(clone.models[0]).toBe(users.models[0])
  })

  it('modifying clone does not affect original models array', () => {
    const users = new Users([{ id: 1, name: 'John' }])
    const clone = users.clone()
    clone.add({ id: 2, name: 'Jane' })

    expect(users.size()).toBe(1)
    expect(clone.size()).toBe(2)
  })
})

describe('Collection: isModel', () => {
  it('returns true for Model instance', () => {
    const users = new Users()
    const user = new User({ id: 1 })
    expect(users.isModel(user)).toBe(true)
  })

  it('returns false for plain object', () => {
    const users = new Users()
    expect(users.isModel({ id: 1 })).toBe(false)
  })

  it('returns false for null', () => {
    const users = new Users()
    expect(users.isModel(null)).toBe(false)
  })
})

describe('Collection: model registry', () => {
  it('addModelToRegistry and hasModelInRegistry', () => {
    const users = new Users()
    const user = new User({ id: 1 })

    expect(users.hasModelInRegistry(user)).toBe(false)
    users.addModelToRegistry(user)
    expect(users.hasModelInRegistry(user)).toBe(true)
  })

  it('removeModelFromRegistry', () => {
    const users = new Users()
    const user = new User({ id: 1 })

    users.addModelToRegistry(user)
    users.removeModelFromRegistry(user)
    expect(users.hasModelInRegistry(user)).toBe(false)
  })
})

vi.mock('axios', () => ({
  default: { request: vi.fn() },
}))

describe('Collection: onSave with per-model validation', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects if any model fails validation', async () => {
    class ValidatedUser extends Model {
      defaults() { return { id: null, name: '' } }
      routes() { return { save: '/api/users' } }
      validation() { return { name: required } }
    }

    class ValidatedUsers extends Collection<ValidatedUser> {
      model() { return ValidatedUser }
      routes() { return { save: '/api/users' } }
    }

    const users = new ValidatedUsers([
      { name: 'John' },
      { name: '' }, // invalid
    ])

    await expect(users.save()).rejects.toBeDefined()
  })
})
