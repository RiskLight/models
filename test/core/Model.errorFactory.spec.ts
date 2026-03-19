import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Model, ValidationError, Response, required } from '../../src'

vi.mock('axios', () => ({
  default: { request: vi.fn() },
}))
import axios from 'axios'
const mockAxios = vi.mocked(axios)

beforeEach(() => vi.clearAllMocks())

describe('Model: error factories', () => {
  it('onSave rejects with ValidationError instance', async () => {
    class User extends Model {
      defaults() { return { name: '' } }
      routes() { return { save: '/api/users' } }
      validation() { return { name: required } }
    }

    const user = new User()
    try {
      await user.save()
      expect.unreachable()
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError)
      expect((error as ValidationError).getValidationErrors()).toHaveProperty('name')
    }
  })

  it('createValidationError can be overridden', () => {
    class CustomError extends ValidationError {}

    class User extends Model {
      defaults() { return { name: '' } }
      createValidationError(errors: any, message?: string) {
        return new CustomError(errors, message || 'Custom validation')
      }
    }

    const user = new User()
    const err = user.createValidationError({ name: 'required' })
    expect(err).toBeInstanceOf(CustomError)
    expect(err.message).toBe('Custom validation')
  })

  it('createRequestError wraps error and response', () => {
    const user = new (class extends Model {
      defaults() { return {} }
    })()

    const res = new Response({ data: null, status: 500, headers: {} })
    const err = user.createRequestError(new Error('fail'), res)
    expect(err.message).toBe('fail')
    expect(err.getResponse()).toBe(res)
  })

  it('createResponseError wraps message', () => {
    const user = new (class extends Model {
      defaults() { return {} }
    })()

    const err = user.createResponseError('Bad data')
    expect(err.message).toBe('Bad data')
  })
})
