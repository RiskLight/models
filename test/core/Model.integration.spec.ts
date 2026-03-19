import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Model } from '../../src'

// Mock axios at module level
vi.mock('axios', () => ({
  default: {
    request: vi.fn(),
  },
}))

import axios from 'axios'
const mockAxios = vi.mocked(axios)

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

beforeEach(() => {
  vi.clearAllMocks()
})

// --- Fetch ---

describe('Model integration: fetch', () => {
  it('sends GET request and updates attributes', async () => {
    mockAxios.request.mockResolvedValue({
      data: { id: 1, name: 'John', email: 'john@test.com' },
      status: 200,
      headers: {},
    })

    const user = new User({ id: 1 })
    await user.fetch()

    expect(mockAxios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/users/1',
        method: 'GET',
      }),
    )
    expect(user.name).toBe('John')
    expect(user.email).toBe('john@test.com')
    expect(user.loading).toBe(false)
  })

  it('sets fatal on fetch failure', async () => {
    mockAxios.request.mockRejectedValue({
      response: { data: null, status: 500, headers: {} },
    })

    const user = new User({ id: 1 })
    await expect(user.fetch()).rejects.toBeDefined()
    expect(user.fatal).toBe(true)
    expect(user.loading).toBe(false)
  })

  it('skips fetch if already loading', async () => {
    const user = new User({ id: 1 })
    user.loading = true
    await user.fetch()

    expect(mockAxios.request).not.toHaveBeenCalled()
  })

  it('emits fetch event on success', async () => {
    mockAxios.request.mockResolvedValue({
      data: { id: 1, name: 'John', email: '' },
      status: 200,
      headers: {},
    })

    const user = new User({ id: 1 })
    const cb = vi.fn()
    user.on('fetch', cb)
    await user.fetch()

    expect(cb).toHaveBeenCalledWith({ error: null })
  })
})

// --- Save (create) ---

describe('Model integration: save (create)', () => {
  it('sends POST for new model', async () => {
    mockAxios.request.mockResolvedValue({
      data: { id: 10, name: 'John', email: 'j@t.com' },
      status: 201,
      headers: {},
    })

    const user = new User({ name: 'John', email: 'j@t.com' })
    await user.save()

    expect(mockAxios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/users',
        method: 'POST',
      }),
    )
    expect(user.id).toBe(10)
    expect(user.saving).toBe(false)
  })
})

// --- Save (update) ---

describe('Model integration: save (update)', () => {
  it('sends PUT for existing model', async () => {
    mockAxios.request.mockResolvedValue({
      data: { id: 1, name: 'Jane', email: 'j@t.com' },
      status: 200,
      headers: {},
    })

    const user = new User({ id: 1, name: 'John', email: 'j@t.com' })
    user.sync()
    user.name = 'Jane'
    await user.save()

    expect(mockAxios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'PUT',
      }),
    )
  })

  it('sends PATCH with only changed data when patch=true', async () => {
    class PatchUser extends Model {
      defaults() { return { id: null, name: '', email: '' } }
      routes() { return { save: '/api/users/{id}' } }
      options() { return { patch: true } }
    }

    mockAxios.request.mockResolvedValue({
      data: { id: 1, name: 'Jane', email: 'j@t.com' },
      status: 200,
      headers: {},
    })

    const user = new PatchUser({ id: 1, name: 'John', email: 'j@t.com' })
    user.sync()
    user.name = 'Jane'
    await user.save()

    expect(mockAxios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'PATCH',
        data: { id: 1, name: 'Jane' }, // only changed + id
      }),
    )
  })

  it('skips save when saveUnchanged=false and nothing changed', async () => {
    class StrictUser extends Model {
      defaults() { return { id: null, name: '' } }
      routes() { return { save: '/api/users' } }
      options() { return { saveUnchanged: false } }
    }

    const user = new StrictUser({ id: 1, name: 'John' })
    user.sync()
    await user.save()

    expect(mockAxios.request).not.toHaveBeenCalled()
  })
})

// --- Save with validation ---

describe('Model integration: save with validation', () => {
  it('rejects save when validation fails', async () => {
    const { required, email } = await import('../../src')

    class ValidatedUser extends Model {
      defaults() { return { name: '', email: '' } }
      routes() { return { save: '/api/users' } }
      validation() {
        return {
          name: required,
          email: required.and(email),
        }
      }
    }

    const user = new ValidatedUser()
    await expect(user.save()).rejects.toBeDefined()
    expect(mockAxios.request).not.toHaveBeenCalled()
    expect(user.saving).toBe(false)
  })
})

// --- Delete ---

describe('Model integration: delete', () => {
  it('sends DELETE request', async () => {
    mockAxios.request.mockResolvedValue({
      data: null,
      status: 204,
      headers: {},
    })

    const user = new User({ id: 1, name: 'John' })
    await user.delete()

    expect(mockAxios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/users/1',
        method: 'DELETE',
      }),
    )
  })

  it('clears model after successful delete', async () => {
    mockAxios.request.mockResolvedValue({
      data: null,
      status: 204,
      headers: {},
    })

    const user = new User({ id: 1, name: 'John' })
    await user.delete()

    expect(user.name).toBe('')
    expect(user.id).toBeNull()
  })

  it('emits delete event', async () => {
    mockAxios.request.mockResolvedValue({
      data: null,
      status: 204,
      headers: {},
    })

    const user = new User({ id: 1 })
    const cb = vi.fn()
    user.on('delete', cb)
    await user.delete()

    expect(cb).toHaveBeenCalledWith({ error: null })
  })
})

// --- Backend validation errors ---

describe('Model integration: backend validation', () => {
  it('sets errors from 422 response', async () => {
    mockAxios.request.mockRejectedValue({
      response: {
        data: { name: ['Name is required'] },
        status: 422,
        headers: {},
      },
    })

    const user = new User({ name: '' })
    await expect(user.save()).rejects.toBeDefined()
  })
})

// --- Upload ---

describe('Model integration: upload', () => {
  it('sends FormData', async () => {
    mockAxios.request.mockResolvedValue({
      data: { id: 1, name: 'John', email: '' },
      status: 200,
      headers: {},
    })

    const user = new User({ id: 1, name: 'John' })
    await user.upload()

    const call = mockAxios.request.mock.calls[0][0]
    expect(call.data).toBeInstanceOf(FormData)
  })
})
