import { Model } from '@risklight/models'
import { required, string, length, match } from '@risklight/models/validation'

export class Address extends Model {
  defaults() {
    return {
      street: '',
      city: '',
      zip: '',
      country: '',
      building: '',
      apartment: '',
    }
  }

  validation() {
    return {
      street: required.format('Street is required'),
      city: required.format('City is required'),
      zip: required.and(string).and(match(/^\d{3,10}$/)).format('ZIP must be 3-10 digits'),
      country: required.and(string).and(length(2, 2)).format('Country must be 2-letter code (US, UK, DE)'),
    }
  }

  options() {
    return { identifier: 'id' }
  }
}
