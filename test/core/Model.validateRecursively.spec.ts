import { describe, it, expect } from 'vitest'
import { isEmpty } from 'lodash-es'
import { Model, Collection, required, email } from '../../src'

class Address extends Model {
  defaults() { return { street: '', city: '' } }
  validation() {
    return {
      street: required,
      city: required,
    }
  }
}

class User extends Model {
  defaults() { return { name: '', email: '', address: null } }
  validation() {
    return {
      name: required,
      email: required.and(email),
    }
  }
}

class Users extends Collection<User> {
  model() { return User }
}

describe('Model: validateRecursively', () => {
  it('validates nested model attributes', async () => {
    const address = new Address()
    const user = new User({ name: 'John', email: 'j@t.com', address })

    const errors = await user.validate()

    // User itself is valid, but nested address is not
    expect(isEmpty(errors)).toBe(true) // user's own errors empty
    expect(address.errors).toHaveProperty('street')
    expect(address.errors).toHaveProperty('city')
  })

  it('passes when nested model is valid', async () => {
    const address = new Address({ street: '123 Main St', city: 'NYC' })
    const user = new User({ name: 'John', email: 'j@t.com', address })

    const errors = await user.validate()
    expect(isEmpty(errors)).toBe(true)
    expect(isEmpty(address.errors)).toBe(true)
  })

  it('skips nested validation when validateRecursively=false', async () => {
    class NoRecurseUser extends Model {
      defaults() { return { name: '', address: null } }
      validation() { return { name: required } }
      options() { return { validateRecursively: false } }
    }

    const address = new Address() // invalid
    const user = new NoRecurseUser({ name: 'John', address })

    const errors = await user.validate()
    expect(isEmpty(errors)).toBe(true)
    expect(address.errors).toEqual({}) // untouched
  })

  it('validates nested collection models', async () => {
    class Team extends Model {
      defaults() { return { name: '', members: null } }
      validation() { return { name: required } }
    }

    const members = new Users([
      { name: 'John', email: 'j@t.com' },
      { name: '', email: '' }, // invalid
    ])

    const team = new Team({ name: 'Dev', members })
    await team.validate()

    expect(members.models[1].errors).toHaveProperty('name')
    expect(members.models[1].errors).toHaveProperty('email')
  })

  it('null nested values are skipped', async () => {
    const user = new User({ name: 'John', email: 'j@t.com', address: null })
    const errors = await user.validate()
    expect(isEmpty(errors)).toBe(true)
  })
})
