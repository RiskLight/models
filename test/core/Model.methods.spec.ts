import { describe, it, expect } from 'vitest'
import { Model } from '../../src'

class User extends Model {
  defaults() { return { id: null, name: '', email: '' } }
}

describe('Model: setOptions', () => {
  it('merges multiple option objects', () => {
    const user = new User()
    user.setOptions({ custom: 'value' }, { another: 42 })
    expect(user.getOption('custom')).toBe('value')
    expect(user.getOption('another')).toBe(42)
  })

  it('does not overwrite existing with undefined', () => {
    const user = new User()
    user.setOption('patch', true)
    user.setOptions({ patch: undefined })
    // defaults() keeps existing value when new is undefined
    expect(user.getOption('patch')).toBe(true)
  })
})

describe('Model: getRouteResolver', () => {
  it('returns default resolver', () => {
    const user = new User({ id: 42 })
    const resolver = user.getRouteResolver()
    const url = resolver('/api/users/{id}', { id: 42 })
    expect(url).toBe('/api/users/42')
  })

  it('custom route resolver can be overridden', () => {
    class CustomUser extends Model {
      defaults() { return { id: null } }
      getRouteResolver() {
        return (route: string, params: Record<string, any>) => {
          return route.replace(/:(\w+)/g, (_, key) => String(params[key] ?? ''))
        }
      }
    }

    const user = new CustomUser({ id: 7 })
    expect(user.getURL('/api/users/:id')).toBe('/api/users/7')
  })
})

describe('Model: convertObjectToFormData (nested)', () => {
  it('handles flat data', () => {
    const user = new User({ id: 1, name: 'John', email: 'j@t.com' })
    const form = user.convertObjectToFormData({ name: 'John', email: 'j@t.com' })
    expect(form.get('name')).toBe('John')
    expect(form.get('email')).toBe('j@t.com')
  })

  it('handles nested objects', () => {
    const user = new User()
    const form = user.convertObjectToFormData({
      name: 'John',
      address: { street: '123 Main', city: 'NYC' },
    })
    expect(form.get('address[street]')).toBe('123 Main')
    expect(form.get('address[city]')).toBe('NYC')
  })

  it('handles arrays', () => {
    const user = new User()
    const form = user.convertObjectToFormData({
      tags: ['a', 'b', 'c'],
    })
    expect(form.get('tags[0]')).toBe('a')
    expect(form.get('tags[1]')).toBe('b')
    expect(form.get('tags[2]')).toBe('c')
  })

  it('handles null/undefined as empty string', () => {
    const user = new User()
    const form = user.convertObjectToFormData({ name: null, email: undefined })
    expect(form.get('name')).toBe('')
    expect(form.get('email')).toBe('')
  })

  it('handles deeply nested structures', () => {
    const user = new User()
    const form = user.convertObjectToFormData({
      user: {
        profile: {
          name: 'John',
        },
      },
    })
    expect(form.get('user[profile][name]')).toBe('John')
  })
})
