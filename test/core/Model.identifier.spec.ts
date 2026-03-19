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
  routes() { return { save: '/api/users' } }
}

describe('Model: identifier logic on save', () => {
  it('new model gets id from save response', async () => {
    mockAxios.request.mockResolvedValue({
      data: { id: 42, name: 'John', email: 'j@t.com' },
      status: 201,
      headers: {},
    })

    const user = new User({ name: 'John', email: 'j@t.com' })
    expect(user.isNew()).toBe(true)

    await user.save()

    expect(user.id).toBe(42)
    expect(user.isNew()).toBe(false)
  })

  it('existing model does NOT get id overwritten by default', async () => {
    mockAxios.request.mockResolvedValue({
      data: { id: 999, name: 'Updated', email: '' },
      status: 200,
      headers: {},
    })

    const user = new User({ id: 1, name: 'John', email: '' })
    user.sync()
    user.name = 'Updated'
    await user.save()

    expect(user.id).toBe(1) // NOT 999
    expect(user.name).toBe('Updated')
  })

  it('existing model gets id overwritten when overwriteIdentifier=true', async () => {
    class OverwriteUser extends Model {
      defaults() { return { id: null, name: '' } }
      routes() { return { save: '/api/users' } }
      options() { return { overwriteIdentifier: true } }
    }

    mockAxios.request.mockResolvedValue({
      data: { id: 999, name: 'Updated' },
      status: 200,
      headers: {},
    })

    const user = new OverwriteUser({ id: 1, name: 'John' })
    user.sync()
    user.name = 'Updated'
    await user.save()

    expect(user.id).toBe(999)
  })

  it('custom parseIdentifier', async () => {
    class UuidUser extends Model {
      defaults() { return { uuid: null, name: '' } }
      routes() { return { save: '/api/users' } }
      options() { return { identifier: 'uuid' } }
      parseIdentifier(data: Record<string, any>) {
        return data.uuid
      }
    }

    mockAxios.request.mockResolvedValue({
      data: { uuid: 'abc-123', name: 'John' },
      status: 201,
      headers: {},
    })

    const user = new UuidUser({ name: 'John' })
    await user.save()

    expect(user.uuid).toBe('abc-123')
  })

  it('isValidIdentifier', () => {
    const user = new User()
    expect(user.isValidIdentifier(1)).toBe(true)
    expect(user.isValidIdentifier('abc')).toBe(true)
    expect(user.isValidIdentifier(null)).toBe(false)
    expect(user.isValidIdentifier(undefined)).toBe(false)
    expect(user.isValidIdentifier('')).toBe(false)
    expect(user.isValidIdentifier(0)).toBe(false)
  })
})
