import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { Model } from '../../src'

// --- Zod schema() integration ---

describe('Validation: zod schema()', () => {
  const UserSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    age: z.number().int().min(0).optional(),
  })

  class User extends Model {
    defaults() {
      return { name: '', email: '', age: 0 }
    }
    schema() {
      return UserSchema
    }
  }

  it('validate() uses zod schema when defined', async () => {
    const user = new User()
    const errors = await user.validate()
    expect(errors).toHaveProperty('name')
    expect(errors).toHaveProperty('email')
  })

  it('valid model passes zod validation', async () => {
    const user = new User({ name: 'John', email: 'john@test.com', age: 25 })
    const errors = await user.validate()
    expect(errors).toEqual({})
  })

  it('schema() takes priority over validation()', async () => {
    const { required } = await import('../../src')

    class StrictUser extends Model {
      defaults() {
        return { name: '', email: '' }
      }
      schema() {
        return z.object({
          name: z.string().min(1),
          email: z.string().email(),
        })
      }
      validation() {
        return { name: required }
      }
    }

    const user = new StrictUser()
    const errors = await user.validate()
    expect(errors).toHaveProperty('name')
    expect(errors).toHaveProperty('email')
  })
})
