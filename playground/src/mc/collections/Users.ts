import { Collection } from '@risklight/models'
import { User } from '../models/User'

const API = 'http://localhost:3001'

export class Users extends Collection<User> {
  model() { return User }

  routes() {
    return {
      fetch: `${API}/users`,
    }
  }
}
