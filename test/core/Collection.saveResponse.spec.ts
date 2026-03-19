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
  routes() { return { save: '/api/users' } }
}

class Users extends Collection<User> {
  model() { return User }
  routes() { return { save: '/api/users' } }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Collection: onSaveSuccess pairs response with models', () => {
  it('updates each saving model with corresponding response data', async () => {
    mockAxios.request.mockResolvedValue({
      data: [
        { id: 10, name: 'John Updated', email: 'j@t.com' },
        { id: 20, name: 'Jane Updated', email: 'jane@t.com' },
      ],
      status: 200,
      headers: {},
    })

    const users = new Users([
      { name: 'John', email: 'j@t.com' },
      { name: 'Jane', email: 'jane@t.com' },
    ])

    // Mark all as saving
    users.models.forEach(m => m.saving = true)
    await users.save()

    expect(users.models[0].id).toBe(10)
    expect(users.models[0].name).toBe('John Updated')
    expect(users.models[1].id).toBe(20)
    expect(users.models[1].name).toBe('Jane Updated')
  })

  it('syncs saving models when response is empty', async () => {
    mockAxios.request.mockResolvedValue({
      data: null,
      status: 204,
      headers: {},
    })

    const users = new Users([
      { id: 1, name: 'John', email: '' },
    ])
    users.models[0].saving = true
    users.models[0].name = 'Updated'

    await users.save()

    // Model should be synced (changed() = false)
    expect(users.models[0].changed()).toBe(false)
    expect(users.models[0].saving).toBe(false)
  })
})

describe('Collection: onDeleteSuccess removes models', () => {
  it('clears deleting models after successful delete', async () => {
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

    await users.delete()

    // Model.onDeleteSuccess calls clear() which resets to defaults
    // and sets deleting=false. But model was already in collection,
    // verify the collection state is clean
    expect(users.deleting).toBe(false)
    expect(users.models[0].deleting).toBe(false)
    expect(users.models[0].fatal).toBe(false)
  })
})
