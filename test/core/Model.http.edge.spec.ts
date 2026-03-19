import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Model } from '../../src'

vi.mock('axios', () => ({
  default: { request: vi.fn() },
}))
import axios from 'axios'
const mockAxios = vi.mocked(axios)

beforeEach(() => vi.clearAllMocks())

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

// --- Concurrent requests ---

describe('Model HTTP: concurrent requests', () => {
  it('second fetch is skipped while first is loading', async () => {
    mockAxios.request.mockResolvedValue({
      data: { id: 1, name: 'John', email: '' }, status: 200, headers: {},
    })

    const user = new User({ id: 1 })
    user.loading = true // simulate in-progress
    await user.fetch()

    expect(mockAxios.request).not.toHaveBeenCalled()
  })

  it('second save is skipped while first is saving', async () => {
    mockAxios.request.mockResolvedValue({
      data: { id: 1, name: 'John', email: '' }, status: 201, headers: {},
    })

    const user = new User({ name: 'John' })
    user.saving = true
    await user.save()

    expect(mockAxios.request).not.toHaveBeenCalled()
  })

  it('second delete is skipped while first is deleting', async () => {
    mockAxios.request.mockResolvedValue({ data: null, status: 204, headers: {} })

    const user = new User({ id: 1 })
    user.deleting = true
    await user.delete()

    expect(mockAxios.request).not.toHaveBeenCalled()
  })
})

// --- Custom headers ---

describe('Model HTTP: custom headers', () => {
  it('fetch with custom headers', async () => {
    mockAxios.request.mockResolvedValue({
      data: { id: 1, name: 'John', email: '' },
      status: 200,
      headers: {},
    })

    class AuthUser extends Model {
      defaults() { return { id: null, name: '' } }
      routes() { return { fetch: '/api/users/{id}' } }
      getDefaultHeaders() { return { Authorization: 'Bearer token123' } }
    }

    const user = new AuthUser({ id: 1 })
    await user.fetch()

    expect(mockAxios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token123' }),
      }),
    )
  })

  it('per-request headers override defaults', async () => {
    mockAxios.request.mockResolvedValue({
      data: { id: 1, name: '' },
      status: 200,
      headers: {},
    })

    const user = new User({ id: 1 })
    await user.fetch({ headers: { 'X-Custom': 'value' } })

    expect(mockAxios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Custom': 'value' }),
      }),
    )
  })
})

// --- Custom query params ---

describe('Model HTTP: custom query params', () => {
  it('fetch with custom query', async () => {
    mockAxios.request.mockResolvedValue({
      data: { id: 1, name: '' },
      status: 200,
      headers: {},
    })

    class QueryUser extends Model {
      defaults() { return { id: null } }
      routes() { return { fetch: '/api/users/{id}' } }
      getFetchQuery() { return { include: 'profile' } }
    }

    const user = new QueryUser({ id: 1 })
    await user.fetch()

    expect(mockAxios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({ include: 'profile' }),
      }),
    )
  })
})

// --- Error recovery ---

describe('Model HTTP: error recovery', () => {
  it('fatal resets on successful fetch after failure', async () => {
    mockAxios.request
      .mockRejectedValueOnce({ response: { data: null, status: 500, headers: {} } })
      .mockResolvedValueOnce({ data: { id: 1, name: 'John', email: '' }, status: 200, headers: {} })

    const user = new User({ id: 1 })

    await expect(user.fetch()).rejects.toBeDefined()
    expect(user.fatal).toBe(true)

    await user.fetch()
    expect(user.fatal).toBe(false)
  })

  it('loading resets on failure', async () => {
    mockAxios.request.mockRejectedValue({
      response: { data: null, status: 500, headers: {} },
    })

    const user = new User({ id: 1 })
    await expect(user.fetch()).rejects.toBeDefined()
    expect(user.loading).toBe(false)
  })

  it('saving resets on failure', async () => {
    mockAxios.request.mockRejectedValue({
      response: { data: null, status: 500, headers: {} },
    })

    const user = new User({ name: 'John' })
    await expect(user.save()).rejects.toBeDefined()
    expect(user.saving).toBe(false)
  })
})

// --- Route parameters ---

describe('Model HTTP: route parameters', () => {
  it('uses all attributes as route params', () => {
    class Post extends Model {
      defaults() { return { user_id: null, id: null, title: '' } }
      routes() { return { fetch: '/api/users/{user_id}/posts/{id}' } }
    }

    const post = new Post({ user_id: 5, id: 42 })
    expect(post.getFetchURL()).toBe('/api/users/5/posts/42')
  })

  it('missing param becomes empty string', () => {
    const user = new User({ id: null })
    expect(user.getFetchURL()).toBe('/api/users/')
  })
})

// --- Options-based behavior ---

describe('Model HTTP: options', () => {
  it('saveUnchanged=true saves even without changes', async () => {
    mockAxios.request.mockResolvedValue({
      data: { id: 1, name: 'John', email: '' },
      status: 200,
      headers: {},
    })

    const user = new User({ id: 1, name: 'John' })
    user.sync()
    // No changes made
    await user.save()

    expect(mockAxios.request).toHaveBeenCalled()
  })

  it('custom identifier option', () => {
    class UuidUser extends Model {
      defaults() { return { uuid: 'abc-123', name: '' } }
      options() { return { identifier: 'uuid' } }
    }

    const user = new UuidUser()
    expect(user.identifier()).toBe('abc-123')
    expect(user.isNew()).toBe(false)
  })
})
