import { describe, it, expect, vi } from 'vitest'
import { Model } from '../../src'
import { useModel } from '../../src/vue'

class User extends Model {
  defaults() { return { name: '', email: '' } }
}

class UserWithRoutes extends Model {
  defaults() { return { id: null, name: '' } }
  routes() { return { fetch: '/api/users/{id}' } }
}

describe('Vue adapter: useModel', () => {
  it('returns a class that extends the given Model', () => {
    const VueUser = useModel(User)
    const user = new VueUser({ name: 'John' })

    expect(user.name).toBe('John')
    expect(user).toBeInstanceOf(User)
  })

  it('attribute changes trigger Vue reactivity', () => {
    const VueUser = useModel(User)
    const user = new VueUser()

    expect(user._refs).toBeDefined()
    expect(user._refs.name).toBeDefined()

    user.name = 'John'
    expect(user._refs.name.value).toBe('John')
  })

  it('handles undeclared attributes in Vue context', () => {
    const VueUser = useModel(User)
    const user = new VueUser()
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    ;(user as any).discount = 5
    expect(user._refs.discount).toBeDefined()
    expect(user._refs.discount.value).toBe(5)

    vi.restoreAllMocks()
  })

  it('preserves all Model methods', () => {
    const VueUser = useModel(UserWithRoutes)
    const user = new VueUser({ id: 1, name: 'John' })

    expect(user.isNew()).toBe(false)
    expect(user.identifier()).toBe(1)
    expect(user.toJSON()).toEqual({ id: 1, name: 'John' })

    user.sync()
    user.name = 'Jane'
    expect(user.changed()).toEqual(['name'])
    user.reset()
    expect(user.name).toBe('John')
  })
})
