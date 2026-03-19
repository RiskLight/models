import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Model, Collection } from '../../src'

vi.mock('axios', () => ({
  default: {
    request: vi.fn(),
  },
}))

import axios from 'axios'
const mockAxios = vi.mocked(axios)

class User extends Model {
  defaults() { return { id: null, name: '', email: '' } }
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

beforeEach(() => {
  vi.clearAllMocks()
})

// --- Fetch ---

describe('Collection integration: fetch', () => {
  it('fetches and replaces models', async () => {
    mockAxios.request.mockResolvedValue({
      data: [
        { id: 1, name: 'John', email: 'j@t.com' },
        { id: 2, name: 'Jane', email: 'jane@t.com' },
      ],
      status: 200,
      headers: {},
    })

    const users = new Users()
    await users.fetch()

    expect(users.size()).toBe(2)
    expect(users.models[0].name).toBe('John')
    expect(users.models[1].name).toBe('Jane')
    expect(users.loading).toBe(false)
  })

  it('sends GET to correct URL', async () => {
    mockAxios.request.mockResolvedValue({
      data: [],
      status: 200,
      headers: {},
    })

    const users = new Users()
    await users.fetch()

    expect(mockAxios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/users',
        method: 'GET',
      }),
    )
  })

  it('includes pagination query', async () => {
    mockAxios.request.mockResolvedValue({
      data: [],
      status: 200,
      headers: {},
    })

    const users = new Users()
    users.page(3)
    await users.fetch()

    expect(mockAxios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({ page: 3 }),
      }),
    )
  })

  it('handles paginated response with data wrapper', async () => {
    mockAxios.request.mockResolvedValue({
      data: {
        data: [{ id: 1, name: 'John', email: '' }],
        total: 10,
        per_page: 1,
      },
      status: 200,
      headers: {},
    })

    const users = new Users()
    users.page(1)
    await users.fetch()

    expect(users.size()).toBe(1)
    expect(users.models[0].name).toBe('John')
  })

  it('sets fatal on fetch failure', async () => {
    mockAxios.request.mockRejectedValue({
      response: { data: null, status: 500, headers: {} },
    })

    const users = new Users()
    await expect(users.fetch()).rejects.toBeDefined()
    expect(users.fatal).toBe(true)
    expect(users.loading).toBe(false)
  })

  it('emits fetch event', async () => {
    mockAxios.request.mockResolvedValue({
      data: [],
      status: 200,
      headers: {},
    })

    const users = new Users()
    const cb = vi.fn()
    users.on('fetch', cb)
    await users.fetch()

    expect(cb).toHaveBeenCalledWith({ error: null })
  })
})

// --- Save ---

describe('Collection integration: save', () => {
  it('sends POST with saving models data', async () => {
    mockAxios.request.mockResolvedValue({
      data: [
        { id: 1, name: 'John', email: '' },
        { id: 2, name: 'Jane', email: '' },
      ],
      status: 200,
      headers: {},
    })

    const users = new Users([
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ])

    // Mark models as saving manually for this test
    users.models[0].saving = true
    users.models[1].saving = true

    await users.save()

    expect(mockAxios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/users',
        method: 'POST',
      }),
    )
    expect(users.saving).toBe(false)
  })
})

// --- Delete ---

describe('Collection integration: delete', () => {
  it('sends DELETE request with model identifiers in body', async () => {
    mockAxios.request.mockResolvedValue({
      data: null,
      status: 204,
      headers: {},
    })

    const users = new Users([
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ])

    users.models[0].deleting = true
    users.models[1].deleting = true

    await users.delete()

    expect(mockAxios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/users',
        method: 'DELETE',
      }),
    )
    expect(users.deleting).toBe(false)
  })
})
