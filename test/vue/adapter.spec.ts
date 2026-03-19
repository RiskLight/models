import { describe, it, expect } from 'vitest'
import { isReactive } from 'vue'
import { Model } from '../../src'

// Import Vue adapter — patches Model prototype
import '../../src/vue'

class User extends Model {
  defaults() { return { name: '', email: '' } }
}

class UserWithRoutes extends Model {
  defaults() { return { id: null, name: '' } }
  routes() { return { fetch: '/api/users/{id}' } }
}

describe('Vue adapter: reactive _attributes', () => {
  it('_attributes is reactive after construction', () => {
    const user = new User({ name: 'John' })
    expect(isReactive(user._attributes)).toBe(true)
  })

  it('attribute changes are reactive', () => {
    const user = new User()
    user.name = 'John'
    expect(user._attributes.name).toBe('John')
    expect(user.name).toBe('John')
  })

  it('assign updates reactive attributes', () => {
    const user = new User()
    user.assign({ name: 'Jane', email: 'jane@t.com' })
    expect(user.name).toBe('Jane')
    expect(user._attributes.name).toBe('Jane')
  })

  it('preserves all Model methods', () => {
    const user = new UserWithRoutes({ id: 1, name: 'John' })

    expect(user.isNew()).toBe(false)
    expect(user.identifier()).toBe(1)
    expect(user.toJSON()).toEqual({ id: 1, name: 'John' })

    user.sync()
    user.name = 'Jane'
    expect(user.changed()).toEqual(['name'])
    user.reset()
    expect(user.name).toBe('John')
  })

  it('instanceof still works', () => {
    const user = new User()
    expect(user).toBeInstanceOf(User)
    expect(user).toBeInstanceOf(Model)
  })
})
