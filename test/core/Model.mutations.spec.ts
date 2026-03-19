import { describe, it, expect } from 'vitest'
import { Model } from '../../src'

// --- Mutations ---

describe('Model: mutations', () => {
  class User extends Model {
    defaults() {
      return { name: '', email: '', age: 0 }
    }
    mutations() {
      return {
        name: (v: string) => v.trim(),
        email: (v: string) => v.toLowerCase(),
        age: [(v: any) => Number(v), (v: number) => Math.floor(v)],
      }
    }
  }

  it('mutated() applies single mutation to value', () => {
    const user = new User()
    expect(user.mutated('name', '  John  ')).toBe('John')
  })

  it('mutated() applies mutation pipeline (array)', () => {
    const user = new User()
    expect(user.mutated('age', '25.7')).toBe(25)
  })

  it('mutated() returns value as-is for unmutated attributes', () => {
    const user = new User()
    expect(user.mutated('unknown', 'hello')).toBe('hello')
  })

  it('mutate() applies mutations to all attributes', () => {
    const user = new User({ name: '  John  ', email: 'JOHN@TEST.COM', age: '25.7' })
    user.mutate()
    expect(user.name).toBe('John')
    expect(user.email).toBe('john@test.com')
    expect(user.age).toBe(25)
  })

  it('mutate(attribute) applies mutation to specific attribute', () => {
    const user = new User({ name: '  John  ', email: 'JOHN@TEST.COM' })
    user.mutate('name')
    expect(user.name).toBe('John')
    expect(user.email).toBe('JOHN@TEST.COM') // untouched
  })

  it('mutate([...attributes]) applies mutations to multiple attributes', () => {
    const user = new User({ name: '  John  ', email: 'JOHN@TEST.COM', age: '25.7' })
    user.mutate(['name', 'email'])
    expect(user.name).toBe('John')
    expect(user.email).toBe('john@test.com')
    expect(user.age).toBe('25.7') // untouched
  })
})

// --- Mutation options ---

describe('Model: mutation options', () => {
  it('mutateOnChange applies mutation on set()', () => {
    class User extends Model {
      defaults() { return { name: '' } }
      mutations() { return { name: (v: string) => v.trim() } }
      options() { return { mutateOnChange: true } }
    }
    const user = new User()
    user.name = '  John  '
    expect(user.name).toBe('John')
  })

  it('mutateOnChange=false does not mutate on set()', () => {
    class User extends Model {
      defaults() { return { name: '' } }
      mutations() { return { name: (v: string) => v.trim() } }
      options() { return { mutateOnChange: false } }
    }
    const user = new User()
    user.name = '  John  '
    expect(user.name).toBe('  John  ')
  })

  it('mutateBeforeSync applies mutation on sync()', () => {
    class User extends Model {
      defaults() { return { name: '' } }
      mutations() { return { name: (v: string) => v.trim() } }
      options() { return { mutateBeforeSync: true } }
    }
    const user = new User({ name: '  John  ' })
    user.sync()
    expect(user.saved('name')).toBe('John')
  })
})
