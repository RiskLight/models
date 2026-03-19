import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Model } from '../../src'

class User extends Model {
  defaults() {
    return { id: null, name: '', email: '' }
  }
  routes() {
    return {
      fetch: '/api/users/{id}',
      save: '/api/users',
      delete: '/api/users/{id}',
    }
  }
}

// --- Route resolution ---

describe('Model HTTP: routes', () => {
  it('getFetchURL() resolves route parameters from attributes', () => {
    const user = new User({ id: 42 })
    expect(user.getFetchURL()).toBe('/api/users/42')
  })

  it('getSaveURL() resolves route', () => {
    const user = new User()
    expect(user.getSaveURL()).toBe('/api/users')
  })

  it('getDeleteURL() resolves route parameters', () => {
    const user = new User({ id: 42 })
    expect(user.getDeleteURL()).toBe('/api/users/42')
  })

  it('supports custom route parameter pattern', () => {
    class CustomUser extends Model {
      defaults() { return { id: null } }
      routes() { return { fetch: '/api/users/:id' } }
      options() { return { routeParameterPattern: /:(\w+)/ } }
    }
    const user = new CustomUser({ id: 7 })
    expect(user.getFetchURL()).toBe('/api/users/7')
  })

  it('getRoute() returns route string', () => {
    const user = new User()
    expect(user.getRoute('fetch')).toBe('/api/users/{id}')
  })

  it('getRoute() returns fallback if route not defined', () => {
    const user = new User()
    expect(user.getRoute('custom', '/fallback')).toBe('/fallback')
  })
})

// --- Request methods ---

describe('Model HTTP: methods', () => {
  it('getFetchMethod() returns GET', () => {
    const user = new User()
    expect(user.getFetchMethod()).toBe('GET')
  })

  it('getCreateMethod() returns POST', () => {
    const user = new User()
    expect(user.getCreateMethod()).toBe('POST')
  })

  it('getUpdateMethod() returns PUT by default', () => {
    const user = new User()
    expect(user.getUpdateMethod()).toBe('PUT')
  })

  it('getPatchMethod() returns PATCH', () => {
    const user = new User()
    expect(user.getPatchMethod()).toBe('PATCH')
  })

  it('getDeleteMethod() returns DELETE', () => {
    const user = new User()
    expect(user.getDeleteMethod()).toBe('DELETE')
  })

  it('getSaveMethod() returns POST for new model', () => {
    const user = new User()
    expect(user.getSaveMethod()).toBe('POST')
  })

  it('getSaveMethod() returns PUT for existing model', () => {
    const user = new User({ id: 1 })
    expect(user.getSaveMethod()).toBe('PUT')
  })

  it('getSaveMethod() returns PATCH when patch option is true', () => {
    class PatchUser extends Model {
      defaults() { return { id: null, name: '' } }
      routes() { return { save: '/api/users' } }
      options() { return { patch: true } }
    }
    const user = new PatchUser({ id: 1 })
    expect(user.getSaveMethod()).toBe('PATCH')
  })
})

// --- Save data ---

describe('Model HTTP: save data', () => {
  it('getSaveData() returns all attributes', () => {
    const user = new User({ id: 1, name: 'John', email: 'j@t.com' })
    expect(user.getSaveData()).toEqual({ id: 1, name: 'John', email: 'j@t.com' })
  })

  it('getSaveData() returns only changed attributes when patching', () => {
    class PatchUser extends Model {
      defaults() { return { id: null, name: '', email: '' } }
      routes() { return { save: '/api/users/{id}' } }
      options() { return { patch: true } }
    }
    const user = new PatchUser({ id: 1, name: 'John', email: 'j@t.com' })
    user.sync()
    user.name = 'Jane'
    const data = user.getSaveData()
    expect(data).toHaveProperty('name', 'Jane')
    expect(data).toHaveProperty('id', 1) // always includes identifier
    expect(data).not.toHaveProperty('email')
  })
})

// --- Lifecycle hooks ---

describe('Model HTTP: lifecycle', () => {
  it('onFetch() skips if already loading', async () => {
    const user = new User({ id: 1 })
    ;(user as any).loading = true
    const result = await user.onFetch()
    expect(result).toBe(1) // REQUEST_SKIP
  })

  it('onFetch() continues and sets loading', async () => {
    const user = new User({ id: 1 })
    const result = await user.onFetch()
    expect(result).toBe(0) // REQUEST_CONTINUE
    expect(user.loading).toBe(true)
  })

  it('onSave() skips if already saving', async () => {
    const user = new User({ id: 1, name: 'John' })
    ;(user as any).saving = true
    const result = await user.onSave()
    expect(result).toBe(1) // REQUEST_SKIP
  })

  it('onSave() returns REDUNDANT if no changes and saveUnchanged=false', async () => {
    class StrictUser extends Model {
      defaults() { return { id: null, name: '' } }
      routes() { return { save: '/api/users' } }
      options() { return { saveUnchanged: false } }
    }
    const user = new StrictUser({ id: 1, name: 'John' })
    user.sync()
    const result = await user.onSave()
    expect(result).toBe(2) // REQUEST_REDUNDANT
  })

  it('onDelete() skips if already deleting', async () => {
    const user = new User({ id: 1 })
    ;(user as any).deleting = true
    const result = await user.onDelete()
    expect(result).toBe(1) // REQUEST_SKIP
  })

  it('onDelete() continues and sets deleting', async () => {
    const user = new User({ id: 1 })
    const result = await user.onDelete()
    expect(result).toBe(0) // REQUEST_CONTINUE
    expect(user.deleting).toBe(true)
  })
})

// --- State flags ---

describe('Model HTTP: state flags', () => {
  it('loading defaults to false', () => {
    const user = new User()
    expect(user.loading).toBe(false)
  })

  it('saving defaults to false', () => {
    const user = new User()
    expect(user.saving).toBe(false)
  })

  it('deleting defaults to false', () => {
    const user = new User()
    expect(user.deleting).toBe(false)
  })

  it('fatal defaults to false', () => {
    const user = new User()
    expect(user.fatal).toBe(false)
  })
})

// --- Headers / Query ---

describe('Model HTTP: headers and query', () => {
  it('getDefaultHeaders() returns empty object', () => {
    const user = new User()
    expect(user.getDefaultHeaders()).toEqual({})
  })

  it('getFetchHeaders() can be overridden', () => {
    class AuthUser extends Model {
      defaults() { return { id: null } }
      routes() { return { fetch: '/api/users/{id}' } }
      getFetchHeaders() { return { Authorization: 'Bearer token' } }
    }
    const user = new AuthUser({ id: 1 })
    expect(user.getFetchHeaders()).toEqual({ Authorization: 'Bearer token' })
  })

  it('getFetchQuery() returns empty object by default', () => {
    const user = new User()
    expect(user.getFetchQuery()).toEqual({})
  })
})

// --- RequestOperation constants ---

describe('Model HTTP: RequestOperation', () => {
  it('exposes REQUEST_CONTINUE = 0', () => {
    expect(Model.REQUEST_CONTINUE).toBe(0)
  })

  it('exposes REQUEST_SKIP = 1', () => {
    expect(Model.REQUEST_SKIP).toBe(1)
  })

  it('exposes REQUEST_REDUNDANT = 2', () => {
    expect(Model.REQUEST_REDUNDANT).toBe(2)
  })
})

// --- Validation errors from backend ---

describe('Model HTTP: backend validation', () => {
  it('isBackendValidationError() checks status 422', () => {
    const user = new User()
    const error = { response: { getStatus: () => 422 } }
    expect(user.isBackendValidationError(error)).toBe(true)
  })

  it('isBackendValidationError() returns false for other status', () => {
    const user = new User()
    const error = { response: { getStatus: () => 500 } }
    expect(user.isBackendValidationError(error)).toBe(false)
  })
})

// --- Upload ---

describe('Model HTTP: upload', () => {
  it('upload() converts data to FormData', () => {
    const user = new User({ id: 1, name: 'John', email: 'j@t.com' })
    const formData = user.convertObjectToFormData(user.getSaveData())
    expect(formData).toBeInstanceOf(FormData)
    expect(formData.get('name')).toBe('John')
  })
})
