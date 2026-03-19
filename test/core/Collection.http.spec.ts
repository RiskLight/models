import { describe, it, expect, vi } from 'vitest'
import { Model, Collection } from '../../src'

class User extends Model {
  defaults() {
    return { id: null, name: '', email: '' }
  }
  routes() {
    return {
      fetch: '/api/users/{id}',
      save: '/api/users',
      delete: '/api/users/{id}',
    }
  }
}

class Users extends Collection<User> {
  model() { return User }
  routes() {
    return {
      fetch: '/api/users',
      save: '/api/users',
      delete: '/api/users',
    }
  }
}

// --- State flags ---

describe('Collection HTTP: state flags', () => {
  it('loading defaults to false', () => {
    const users = new Users()
    expect(users.loading).toBe(false)
  })

  it('saving defaults to false', () => {
    const users = new Users()
    expect(users.saving).toBe(false)
  })

  it('deleting defaults to false', () => {
    const users = new Users()
    expect(users.deleting).toBe(false)
  })

  it('fatal defaults to false', () => {
    const users = new Users()
    expect(users.fatal).toBe(false)
  })
})

// --- Fetch lifecycle ---

describe('Collection HTTP: fetch lifecycle', () => {
  it('onFetch() skips if paginated and on last page', async () => {
    const users = new Users()
    users.page(1)
    ;(users as any)._lastPage = true
    const result = await users.onFetch()
    expect(result).toBe(1) // REQUEST_SKIP
  })

  it('onFetch() continues normally', async () => {
    const users = new Users()
    const result = await users.onFetch()
    expect(result).toBe(0) // REQUEST_CONTINUE
    expect(users.loading).toBe(true)
  })
})

// --- Save lifecycle ---

describe('Collection HTTP: save', () => {
  it('getSavingModels() returns models with saving=true', () => {
    const users = new Users([
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ])
    ;(users.models[0] as any).saving = true
    const saving = users.getSavingModels()
    expect(saving).toHaveLength(1)
    expect(saving[0].name).toBe('John')
  })

  it('getSaveData() returns data from saving models', () => {
    const users = new Users([
      { id: 1, name: 'John', email: '' },
      { id: 2, name: 'Jane', email: '' },
    ])
    ;(users.models[0] as any).saving = true
    const data = users.getSaveData()
    expect(data).toHaveLength(1)
    expect(data[0]).toEqual({ id: 1, name: 'John', email: '' })
  })
})

// --- Delete lifecycle ---

describe('Collection HTTP: delete', () => {
  it('getDeletingModels() returns models with deleting=true', () => {
    const users = new Users([
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ])
    ;(users.models[1] as any).deleting = true
    const deleting = users.getDeletingModels()
    expect(deleting).toHaveLength(1)
    expect(deleting[0].name).toBe('Jane')
  })

  it('getDeleteBody() returns identifiers when useDeleteBody=true', () => {
    const users = new Users([
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ])
    ;(users.models[0] as any).deleting = true
    ;(users.models[1] as any).deleting = true
    const body = users.getDeleteBody()
    expect(body).toEqual([1, 2])
  })
})

// --- Pagination with fetch ---

describe('Collection HTTP: pagination', () => {
  it('getPaginationQuery() returns page param', () => {
    const users = new Users()
    users.page(3)
    expect(users.getPaginationQuery()).toEqual({ page: 3 })
  })

  it('getPaginationQuery() returns empty when not paginated', () => {
    const users = new Users()
    expect(users.getPaginationQuery()).toEqual({})
  })
})

// --- Routes ---

describe('Collection HTTP: routes', () => {
  it('getFetchURL() resolves route', () => {
    const users = new Users()
    expect(users.getFetchURL()).toBe('/api/users')
  })

  it('getSaveURL() resolves route', () => {
    const users = new Users()
    expect(users.getSaveURL()).toBe('/api/users')
  })

  it('getDeleteURL() resolves route', () => {
    const users = new Users()
    expect(users.getDeleteURL()).toBe('/api/users')
  })
})
