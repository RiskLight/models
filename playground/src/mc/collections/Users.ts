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

  // json-server uses _page/_limit instead of page/limit
  getPaginationQuery(): Record<string, any> {
    if (this.isPaginated()) {
      return { _page: this.getPage(), _limit: 2 }
    }
    return {}
  }
}
