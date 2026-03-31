import { Collection } from '@risklight/models'
import { Position } from '../models/Position'

const API = 'http://localhost:3001'

export class Positions extends Collection<Position> {
  model() { return Position }

  routes() {
    return {
      fetch: `${API}/positions`,
    }
  }
}
