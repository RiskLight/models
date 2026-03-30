import { Model } from '@risklight/models'
import { required, string, email as emailRule, integer, between, array } from '@risklight/models/validation'

const API = 'http://localhost:3001'

export class User extends Model {
  defaults() {
    return {
      id: null,
      name: '',
      email: '',
      age: 0,
      active: true,
      positionId: null,
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
      positionId: required,
      tags: required.and(array),
    }
  }

  options() {
    return {
      identifier: 'id',
      saveUnchanged: false,
      patch: true,
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
}
