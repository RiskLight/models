import { describe, it, expect, vi } from 'vitest'
import { Model } from '../../src'
import { Collection } from '../../src'

class User extends Model {
  defaults() {
    return { id: null, name: '', email: '' }
  }
}

class Users extends Collection<User> {
  model() { return User }
}

// --- Construction ---

describe('Collection: construction', () => {
  it('creates empty collection', () => {
    const users = new Users()
    expect(users.models).toEqual([])
    expect(users.size()).toBe(0)
    expect(users.isEmpty()).toBe(true)
  })

  it('creates collection from array of attributes', () => {
    const users = new Users([
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ])
    expect(users.size()).toBe(2)
    expect(users.models[0]).toBeInstanceOf(User)
    expect(users.models[0].name).toBe('John')
  })

  it('creates collection from model instances', () => {
    const john = new User({ id: 1, name: 'John' })
    const users = new Users([john])
    expect(users.size()).toBe(1)
    expect(users.models[0]).toBe(john)
  })
})

// --- Add / Remove ---

describe('Collection: add and remove', () => {
  it('add() appends model', () => {
    const users = new Users()
    users.add({ id: 1, name: 'John' })
    expect(users.size()).toBe(1)
    expect(users.models[0].name).toBe('John')
  })

  it('add() accepts array', () => {
    const users = new Users()
    users.add([{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }])
    expect(users.size()).toBe(2)
  })

  it('add() converts plain objects to models', () => {
    const users = new Users()
    users.add({ id: 1, name: 'John' })
    expect(users.models[0]).toBeInstanceOf(User)
  })

  it('remove() removes model by instance', () => {
    const john = new User({ id: 1, name: 'John' })
    const users = new Users([john])
    users.remove(john)
    expect(users.size()).toBe(0)
  })

  it('remove() by predicate', () => {
    const users = new Users([
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ])
    users.remove(m => m.name === 'John')
    expect(users.size()).toBe(1)
    expect(users.models[0].name).toBe('Jane')
  })

  it('clear() removes all models', () => {
    const users = new Users([{ id: 1 }, { id: 2 }])
    users.clear()
    expect(users.isEmpty()).toBe(true)
  })
})

// --- Querying ---

describe('Collection: querying', () => {
  it('find() returns first matching model', () => {
    const users = new Users([
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ])
    const found = users.find(m => m.name === 'Jane')
    expect(found?.name).toBe('Jane')
  })

  it('where() returns all matching models', () => {
    const users = new Users([
      { id: 1, name: 'John', email: 'j@t.com' },
      { id: 2, name: 'Jane', email: 'j@t.com' },
      { id: 3, name: 'Bob', email: 'b@t.com' },
    ])
    const result = users.where(m => m.email === 'j@t.com')
    expect(result).toHaveLength(2)
  })

  it('has() checks if model exists', () => {
    const john = new User({ id: 1, name: 'John' })
    const users = new Users([john])
    expect(users.has(john)).toBe(true)
  })

  it('first() and last()', () => {
    const users = new Users([
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ])
    expect(users.first()?.name).toBe('John')
    expect(users.last()?.name).toBe('Jane')
  })

  it('indexOf() returns index', () => {
    const john = new User({ id: 1, name: 'John' })
    const users = new Users([john])
    expect(users.indexOf(john)).toBe(0)
  })
})

// --- Iteration ---

describe('Collection: iteration', () => {
  it('each() iterates models', () => {
    const names: string[] = []
    const users = new Users([{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }])
    users.each(m => names.push(m.name))
    expect(names).toEqual(['John', 'Jane'])
  })

  it('map() transforms models', () => {
    const users = new Users([{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }])
    const names = users.map(m => m.name)
    expect(names).toEqual(['John', 'Jane'])
  })

  it('reduce() accumulates', () => {
    const users = new Users([
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ])
    const result = users.reduce((acc, m) => acc + m.name, '')
    expect(result).toBe('JohnJane')
  })
})

// --- Events ---

describe('Collection: events', () => {
  it('emits add event', () => {
    const users = new Users()
    const cb = vi.fn()
    users.on('add', cb)
    users.add({ id: 1, name: 'John' })
    expect(cb).toHaveBeenCalled()
  })

  it('emits remove event', () => {
    const john = new User({ id: 1, name: 'John' })
    const users = new Users([john])
    const cb = vi.fn()
    users.on('remove', cb)
    users.remove(john)
    expect(cb).toHaveBeenCalled()
  })
})

// --- Pagination ---

describe('Collection: pagination', () => {
  it('page() sets current page', () => {
    const users = new Users()
    users.page(2)
    expect(users.getPage()).toBe(2)
    expect(users.isPaginated()).toBe(true)
  })

  it('page(false) disables pagination', () => {
    const users = new Users()
    users.page(2)
    users.page(false)
    expect(users.isPaginated()).toBe(false)
  })
})

// --- Serialization ---

describe('Collection: serialization', () => {
  it('toJSON() returns models array', () => {
    const users = new Users([{ id: 1, name: 'John', email: '' }])
    expect(users.toJSON()).toEqual([{ id: 1, name: 'John', email: '' }])
  })

  it('toArray() returns plain objects', () => {
    const users = new Users([{ id: 1, name: 'John', email: '' }])
    expect(users.toArray()).toEqual([{ id: 1, name: 'John', email: '' }])
  })
})
