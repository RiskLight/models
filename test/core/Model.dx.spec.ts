import { describe, it, expect } from 'vitest'
import { Model, Collection } from '../../src'

class User extends Model {
  defaults() { return { id: null, name: '', email: '' } }
}

class Address extends Model {
  defaults() { return { street: '', city: '' } }
}

class Users extends Collection<User> {
  model() { return User }
}

describe('Model: toPlainObject', () => {
  it('serializes flat model', () => {
    const user = new User({ id: 1, name: 'John', email: 'j@t.com' })
    expect(user.toPlainObject()).toEqual({ id: 1, name: 'John', email: 'j@t.com' })
  })

  it('deep serializes nested model', () => {
    class UserWithAddress extends Model {
      defaults() { return { name: '', address: null } }
    }

    const address = new Address({ street: '123 Main', city: 'NYC' })
    const user = new UserWithAddress({ name: 'John', address })
    const plain = user.toPlainObject()

    expect(plain.name).toBe('John')
    expect(plain.address).toEqual({ street: '123 Main', city: 'NYC' })
    expect(plain.address).not.toBeInstanceOf(Address)
  })

  it('deep serializes nested collection', () => {
    class Team extends Model {
      defaults() { return { name: '', members: null } }
    }

    const members = new Users([
      { id: 1, name: 'John', email: '' },
      { id: 2, name: 'Jane', email: '' },
    ])
    const team = new Team({ name: 'Dev', members })
    const plain = team.toPlainObject()

    expect(plain.members).toHaveLength(2)
    expect(plain.members[0]).toEqual({ id: 1, name: 'John', email: '' })
  })
})

describe('Collection: Symbol.iterator', () => {
  it('for...of works on collection', () => {
    const users = new Users([
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ])

    const names: string[] = []
    for (const user of users) {
      names.push(user.name)
    }

    expect(names).toEqual(['John', 'Jane'])
  })

  it('spread operator works', () => {
    const users = new Users([
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ])

    const arr = [...users]
    expect(arr).toHaveLength(2)
    expect(arr[0]).toBeInstanceOf(User)
  })

  it('Array.from works', () => {
    const users = new Users([{ id: 1, name: 'John' }])
    const arr = Array.from(users)
    expect(arr).toHaveLength(1)
  })

  it('destructuring works', () => {
    const users = new Users([
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ])

    const [first, second] = users
    expect(first.name).toBe('John')
    expect(second.name).toBe('Jane')
  })
})
