import { Model } from '@risklight/models'
import { required, string, email as emailRule, integer, between, array } from '@risklight/models/validation'
import { Position } from './Position'
import { Address } from './Address'

const API = 'http://localhost:3001'

export class User extends Model {
  defaults() {
    return {
      id: null,
      name: '',
      email: '',
      age: 0,
      active: true,
      position: null as Position | null,
      address: new Address(),
      tags: [] as string[],
      settings: {
        theme: 'light',
        notifications: true,
        language: 'en',
      },
      createdAt: null as string | null,
    }
  }

  routes() {
    return {
      fetch: `${API}/users/{id}`,
      save: `${API}/users`,
      delete: `${API}/users/{id}`,
    }
  }

  validation() {
    return {
      name: required.and(string).format('Name is required'),
      email: required.and(emailRule).format('Valid email is required'),
      age: required.and(integer).and(between(0, 120)).format('Age must be 0-120'),
      position: required.format('Position is required'),
      address: required.format('Address is required'),
      tags: required.and(array).format('At least one tag is required'),
    }
  }

  options() {
    return {
      identifier: 'id',
      saveUnchanged: false,
      patch: true,
      mutateBeforeSync: true,
      validateRecursively: true,
    }
  }

  mutations() {
    return {
      position: (value: any) => {
        if (value instanceof Position) return value
        if (value && typeof value === 'object') return new Position(value)
        return null
      },
      address: (value: any) => {
        if (value instanceof Address) return value
        if (value && typeof value === 'object') return new Address(value)
        return new Address()
      },
    }
  }

  getSaveMethod(): string {
    return this.isNew() ? 'POST' : 'PATCH'
  }

  getSaveURL(): string {
    return this.isNew()
      ? `${API}/users`
      : `${API}/users/${this.get('id')}`
  }

  getSaveData(): Record<string, any> {
    const data = super.getSaveData()
    if (data.position instanceof Position) {
      data.position = data.position.toJSON()
    }
    if (data.address instanceof Address) {
      data.address = data.address.toJSON()
    }
    return data
  }
}
