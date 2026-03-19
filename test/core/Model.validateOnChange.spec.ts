import { describe, it, expect } from 'vitest'
import { Model, required, email } from '../../src'

describe('Model: validateOnChange', () => {
  class User extends Model {
    defaults() { return { name: '', email: '' } }
    options() { return { validateOnChange: true } }
    validation() {
      return {
        name: required,
        email: required.and(email),
      }
    }
  }

  it('validates attribute when it changes', async () => {
    const user = new User({ name: 'John', email: 'john@test.com' })
    user.email = 'invalid'

    // validateOnChange is async internally, give it a tick
    await new Promise(r => setTimeout(r, 0))

    expect(user.errors).toHaveProperty('email')
  })

  it('clears error when value becomes valid', async () => {
    const user = new User()
    user.email = 'invalid'
    await new Promise(r => setTimeout(r, 0))
    expect(user.errors).toHaveProperty('email')

    user.email = 'valid@test.com'
    await new Promise(r => setTimeout(r, 0))
    expect(user.errors).not.toHaveProperty('email')
  })

  it('does not validate when validateOnChange=false', async () => {
    class SilentUser extends Model {
      defaults() { return { name: '' } }
      options() { return { validateOnChange: false } }
      validation() { return { name: required } }
    }

    const user = new SilentUser()
    user.name = ''
    await new Promise(r => setTimeout(r, 0))
    expect(user.errors).toEqual({})
  })
})
