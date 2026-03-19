import { describe, it, expect, vi } from 'vitest'
import { Model } from '../../src'
import { useModel } from '../../src/react'

class User extends Model {
  defaults() { return { name: '', email: '' } }
}

describe('React adapter: useModel', () => {
  it('returns a class that extends the given Model', () => {
    const ReactUser = useModel(User)
    const user = new ReactUser({ name: 'John' })

    expect(user.name).toBe('John')
    expect(user).toBeInstanceOf(User)
  })

  it('exposes subscribe() for external state management', () => {
    const ReactUser = useModel(User)
    const user = new ReactUser()
    const cb = vi.fn()

    user.subscribe(cb)
    user.name = 'John'

    expect(cb).toHaveBeenCalled()
  })

  it('subscribe returns unsubscribe function', () => {
    const ReactUser = useModel(User)
    const user = new ReactUser()
    const cb = vi.fn()

    const unsubscribe = user.subscribe(cb)
    unsubscribe()
    user.name = 'John'

    expect(cb).not.toHaveBeenCalled()
  })

  it('getSnapshot() returns current attributes', () => {
    const ReactUser = useModel(User)
    const user = new ReactUser({ name: 'John', email: 'j@t.com' })

    expect(user.getSnapshot()).toEqual({ name: 'John', email: 'j@t.com' })
  })

  it('getSnapshot() returns new reference after change', () => {
    const ReactUser = useModel(User)
    const user = new ReactUser({ name: 'John', email: '' })

    const snap1 = user.getSnapshot()
    user.name = 'Jane'
    const snap2 = user.getSnapshot()

    expect(snap1).not.toBe(snap2)
    expect(snap2.name).toBe('Jane')
  })
})
