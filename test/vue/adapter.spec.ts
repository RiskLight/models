import { describe, it, expect, vi } from 'vitest'
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

describe('Vue adapter: auto-reactivity via import', () => {
  it('model gets _vueState after construction', () => {
    const user = new User({ name: 'John' })
    expect(user._vueState).toBeDefined()
    expect(user._vueState.name).toBe('John')
  })

  it('_vueState updates when attribute changes', () => {
    const user = new User()
    user.name = 'John'
    expect(user._vueState.name).toBe('John')
  })

  it('_vueState updates on assign', () => {
    const user = new User()
    user.assign({ name: 'Jane', email: 'jane@t.com' })
    expect(user._vueState.name).toBe('Jane')
    expect(user._vueState.email).toBe('jane@t.com')
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
