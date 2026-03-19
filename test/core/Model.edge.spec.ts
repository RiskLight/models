import { describe, it, expect, vi } from 'vitest'
import { Model, Collection } from '../../src'

class User extends Model {
  defaults() { return { id: null, name: '', email: '' } }
}

// --- Proxy edge cases ---

describe('Model: proxy edge cases', () => {
  it('instanceof works through Proxy', () => {
    const user = new User()
    expect(user).toBeInstanceOf(User)
    expect(user).toBeInstanceOf(Model)
  })

  it('JSON.stringify works on nested models', () => {
    class Team extends Model {
      defaults() { return { name: '', leader: null } }
    }
    const leader = new User({ id: 1, name: 'John', email: 'j@t.com' })
    const team = new Team({ name: 'Dev', leader: leader.toJSON() })
    const json = JSON.parse(JSON.stringify(team))
    expect(json.leader).toEqual({ id: 1, name: 'John', email: 'j@t.com' })
  })

  it('for...in iterates attributes', () => {
    const user = new User({ id: 1, name: 'John', email: 'j@t.com' })
    const keys: string[] = []
    for (const key in user._attributes) {
      keys.push(key)
    }
    expect(keys).toContain('id')
    expect(keys).toContain('name')
    expect(keys).toContain('email')
  })

  it('Object.keys on _attributes returns attribute names', () => {
    const user = new User({ id: 1, name: 'John', email: '' })
    expect(Object.keys(user._attributes)).toEqual(['id', 'name', 'email'])
  })

  it('Symbol properties work through Proxy', () => {
    const user = new User()
    const sym = Symbol('test')
    ;(user as any)[sym] = 'hello'
    expect((user as any)[sym]).toBe('hello')
  })

  it('constructor.name is preserved', () => {
    const user = new User()
    expect(user.constructor.name).toBe('User')
  })
})

// --- Collection registration ---

describe('Model: collection registration', () => {
  class Users extends Collection<User> {
    model() { return User }
  }

  it('model registers with collection on add', () => {
    const users = new Users()
    users.add({ id: 1, name: 'John' })
    expect(users.models[0].collections).toContain(users)
  })

  it('model unregisters from collection on remove', () => {
    const john = new User({ id: 1, name: 'John' })
    const users = new Users([john])
    users.remove(john)
    expect(john.collections).not.toContain(users)
  })
})

// --- Deep clone ---

describe('Model: clone edge cases', () => {
  it('clone does not share _attributes reference', () => {
    const user = new User({ id: 1, name: 'John' })
    const copy = user.clone()
    copy.name = 'Jane'
    expect(user.name).toBe('John')
    expect(copy.name).toBe('Jane')
  })

  it('clone does not share _reference', () => {
    const user = new User({ id: 1, name: 'John' })
    user.sync()
    const copy = user.clone()
    copy.name = 'Jane'
    copy.sync()
    expect(user.saved('name')).toBe('John')
  })

  it('clone preserves class', () => {
    class Admin extends Model {
      defaults() { return { id: null, name: '', role: 'admin' } }
    }
    const admin = new Admin({ id: 1, name: 'Boss' })
    const copy = admin.clone()
    expect(copy).toBeInstanceOf(Admin)
    expect(copy.role).toBe('admin')
  })
})

// --- Assign ---

describe('Model: assign', () => {
  it('assign updates attributes and syncs reference', () => {
    const user = new User({ id: 1, name: 'John', email: '' })
    user.assign({ id: 1, name: 'Jane', email: 'jane@t.com' })
    expect(user.name).toBe('Jane')
    expect(user.saved('name')).toBe('Jane')
    expect(user.changed()).toBe(false)
  })

  it('assign fills missing attributes with defaults', () => {
    const user = new User()
    user.assign({ id: 5, name: 'John' })
    expect(user.email).toBe('')
  })
})

// --- Options merge ---

describe('Model: options merge', () => {
  it('constructor options override class options', () => {
    class PatchUser extends Model {
      defaults() { return { id: null } }
      options() { return { patch: true } }
    }
    const user = new PatchUser(undefined, undefined, { patch: false })
    expect(user.getOption('patch')).toBe(false)
  })

  it('class options override defaults', () => {
    class CustomUser extends Model {
      defaults() { return { id: null } }
      options() { return { identifier: 'uuid' } }
    }
    const user = new CustomUser()
    expect(user.getOption('identifier')).toBe('uuid')
  })
})
