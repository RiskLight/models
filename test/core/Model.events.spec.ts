import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Model } from '../../src'

vi.mock('axios', () => ({
  default: { request: vi.fn() },
}))
import axios from 'axios'
const mockAxios = vi.mocked(axios)

class User extends Model {
  defaults() { return { id: null, name: '', email: '' } }
  routes() { return { save: '/api/users' } }
}

beforeEach(() => vi.clearAllMocks())

describe('Model: create/update events', () => {
  it('emits create event when saving new model', async () => {
    mockAxios.request.mockResolvedValue({
      data: { id: 1, name: 'John', email: '' },
      status: 201,
      headers: {},
    })

    const user = new User({ name: 'John' })
    const onCreate = vi.fn()
    const onUpdate = vi.fn()
    user.on('create', onCreate)
    user.on('update', onUpdate)

    await user.save()

    expect(onCreate).toHaveBeenCalledWith({ error: null })
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('emits update event when saving existing model', async () => {
    mockAxios.request.mockResolvedValue({
      data: { id: 1, name: 'Jane', email: '' },
      status: 200,
      headers: {},
    })

    const user = new User({ id: 1, name: 'John' })
    user.sync()
    user.name = 'Jane'

    const onCreate = vi.fn()
    const onUpdate = vi.fn()
    user.on('create', onCreate)
    user.on('update', onUpdate)

    await user.save()

    expect(onUpdate).toHaveBeenCalledWith({ error: null })
    expect(onCreate).not.toHaveBeenCalled()
  })
})

describe('Model: change:{attribute} events', () => {
  it('emits change:name when name changes', () => {
    const user = new User()
    const cb = vi.fn()
    user.on('change:name', cb)

    user.name = 'John'

    expect(cb).toHaveBeenCalledWith({ value: 'John', previous: '' })
  })

  it('does not emit change:email when name changes', () => {
    const user = new User()
    const cb = vi.fn()
    user.on('change:email', cb)

    user.name = 'John'

    expect(cb).not.toHaveBeenCalled()
  })

  it('change and change:attr both fire', () => {
    const user = new User()
    const changeCb = vi.fn()
    const changeNameCb = vi.fn()
    user.on('change', changeCb)
    user.on('change:name', changeNameCb)

    user.name = 'John'

    expect(changeCb).toHaveBeenCalled()
    expect(changeNameCb).toHaveBeenCalled()
  })
})
