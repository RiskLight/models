import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Model, Collection } from '../../src'

vi.mock('axios', () => ({
  default: { request: vi.fn() },
}))
import axios from 'axios'
const mockAxios = vi.mocked(axios)

class User extends Model {
  defaults() { return { id: null, name: '' } }
}

class Users extends Collection<User> {
  model() { return User }
  routes() { return { fetch: '/api/users' } }
}

beforeEach(() => vi.clearAllMocks())

describe('Collection: applyPagination', () => {
  it('detects last page from response metadata', async () => {
    mockAxios.request.mockResolvedValue({
      data: {
        data: [{ id: 1, name: 'John' }],
        current_page: 3,
        last_page: 3,
      },
      status: 200,
      headers: {},
    })

    const users = new Users()
    users.page(3)
    await users.fetch()

    expect(users.isLastPage()).toBe(true)
  })

  it('not last page when more pages exist', async () => {
    mockAxios.request.mockResolvedValue({
      data: {
        data: [{ id: 1, name: 'John' }],
        current_page: 1,
        last_page: 5,
      },
      status: 200,
      headers: {},
    })

    const users = new Users()
    users.page(1)
    await users.fetch()

    expect(users.isLastPage()).toBe(false)
  })

  it('updates page from response', async () => {
    mockAxios.request.mockResolvedValue({
      data: {
        data: [{ id: 1, name: 'John' }],
        current_page: 2,
        last_page: 5,
      },
      status: 200,
      headers: {},
    })

    const users = new Users()
    users.page(2)
    await users.fetch()

    expect(users.getPage()).toBe(2)
  })
})

describe('Collection: setErrors', () => {
  it('applies array of errors by index', () => {
    const users = new Users([
      { id: 1, name: 'John' },
      { id: 2, name: '' },
    ])

    users.setErrors([
      {},
      { name: 'Required' },
    ])

    expect(users.models[0].errors).toEqual({})
    expect(users.models[1].errors).toEqual({ name: 'Required' })
  })

  it('applies object of errors by identifier', () => {
    const users = new Users([
      { id: 1, name: 'John' },
      { id: 2, name: '' },
    ])

    users.setErrors({
      2: { name: 'Required' },
    })

    expect(users.models[0].errors).toEqual({})
    expect(users.models[1].errors).toEqual({ name: 'Required' })
  })
})
