import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Model } from '../../src'

vi.mock('axios', () => ({
  default: {
    request: vi.fn(),
  },
}))

import axios from 'axios'
const mockAxios = vi.mocked(axios)

class User extends Model {
  defaults() { return { id: null, name: '', email: '' } }
  routes() { return { save: '/api/users' } }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Model: backend validation errors', () => {
  it('sets errors from 422 response on save failure', async () => {
    mockAxios.request.mockRejectedValue({
      message: 'Validation failed',
      response: {
        data: { name: ['Name is required'], email: ['Email is invalid'] },
        status: 422,
        headers: {},
      },
    })

    const user = new User({ name: '', email: 'bad' })
    await expect(user.save()).rejects.toBeDefined()

    expect(user.errors).toEqual({
      name: ['Name is required'],
      email: ['Email is invalid'],
    })
  })

  it('does not set errors for non-422 responses', async () => {
    mockAxios.request.mockRejectedValue({
      message: 'Server error',
      response: {
        data: { error: 'Internal server error' },
        status: 500,
        headers: {},
      },
    })

    const user = new User({ id: 1, name: 'John', email: 'j@t.com' })
    await expect(user.save()).rejects.toBeDefined()

    expect(user.errors).toEqual({})
  })

  it('custom validation error status', async () => {
    class CustomUser extends Model {
      defaults() { return { id: null, name: '' } }
      routes() { return { save: '/api/users' } }
      options() { return { validationErrorStatus: 400 } }
    }

    mockAxios.request.mockRejectedValue({
      message: 'Bad request',
      response: {
        data: { name: ['Required'] },
        status: 400,
        headers: {},
      },
    })

    const user = new CustomUser({ name: '' })
    await expect(user.save()).rejects.toBeDefined()

    expect(user.errors).toEqual({ name: ['Required'] })
  })
})
