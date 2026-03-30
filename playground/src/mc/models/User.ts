import { Model } from '@risklight/models'
import { required, string, email as emailRule, integer, between, array } from '@risklight/models/validation'
import { Position } from './Position'

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
      address: {
        street: '',
        city: '',
        zip: '',
        country: '',
      },
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
      name: required.and(string),
      email: required.and(emailRule),
      age: required.and(integer).and(between(0, 120)),
      position: required,
      tags: required.and(array),
    }
  }

  options() {
    return {
      identifier: 'id',
      saveUnchanged: false,
      patch: true,
      mutateBeforeSync: true,
    }
  }

  // Cast position from plain object to Position model on fetch
  mutations() {
    return {
      position: (value: any) => {
        if (value instanceof Position) return value
        if (value && typeof value === 'object') return new Position(value)
        return null
      },
    }
  }

  // json-server: POST for create, PATCH for partial update
  getSaveMethod(): string {
    return this.isNew() ? 'POST' : 'PATCH'
  }

  getSaveURL(): string {
    return this.isNew()
      ? `${API}/users`
      : `${API}/users/${this.get('id')}`
  }

  // Serialize position back to plain object for save
  getSaveData(): Record<string, any> {
    const data = super.getSaveData()
    if (data.position instanceof Position) {
      data.position = data.position.toJSON()
    }
    return data
  }
}
