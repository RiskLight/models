import { Model } from '@risklight/models'
import { required, string } from '@risklight/models/validation'

const API = 'http://localhost:3001'

export class Position extends Model {
  defaults() {
    return {
      id: null,
      title: '',
      level: '',
      department: '',
    }
  }

  routes() {
    return {
      fetch: `${API}/positions/{id}`,
      save: `${API}/positions`,
      delete: `${API}/positions/{id}`,
    }
  }

  validation() {
    return {
      title: required.and(string),
      level: required,
      department: required,
    }
  }

  options() {
    return { identifier: 'id' }
  }
}
