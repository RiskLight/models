import { describe, it, expect, vi } from 'vitest'
import { Model } from '../../src'

// --- Construction & Defaults ---

describe('Model: construction', () => {
  class User extends Model {
    defaults() {
      return { name: '', email: '', age: 0 }
    }
  }

  it('creates instance with default values', () => {
    const user = new User()
    expect(user.name).toBe('')
    expect(user.email).toBe('')
    expect(user.age).toBe(0)
  })

  it('accepts initial attributes', () => {
    const user = new User({ name: 'John', email: 'john@test.com' })
    expect(user.name).toBe('John')
    expect(user.email).toBe('john@test.com')
    expect(user.age).toBe(0) // default
  })

  it('has unique _uid per instance', () => {
    const a = new User()
    const b = new User()
    expect(a._uid).toBeDefined()
    expect(b._uid).toBeDefined()
    expect(a._uid).not.toBe(b._uid)
  })
})

// --- Proxy: attribute access via dot notation ---

describe('Model: proxy attribute access', () => {
  class User extends Model {
    defaults() {
      return { name: '', email: '' }
    }
  }

  it('reads attributes via dot notation', () => {
    const user = new User({ name: 'John' })
    expect(user.name).toBe('John')
  })

  it('writes attributes via dot notation', () => {
    const user = new User()
    user.name = 'John'
    expect(user.name).toBe('John')
  })

  it('get() and set() work the same as dot notation', () => {
    const user = new User()
    user.set('name', 'John')
    expect(user.get('name')).toBe('John')
    expect(user.name).toBe('John')
  })

  it('set() accepts object for bulk assignment', () => {
    const user = new User()
    user.set({ name: 'John', email: 'john@test.com' })
    expect(user.name).toBe('John')
    expect(user.email).toBe('john@test.com')
  })

  it('has() returns true for declared attributes', () => {
    const user = new User()
    expect(user.has('name')).toBe(true)
    expect(user.has('unknown')).toBe(false)
  })
})

// --- Proxy: undeclared attributes (the key feature) ---

describe('Model: undeclared attributes', () => {
  class User extends Model {
    defaults() {
      return { name: '' }
    }
  }

  it('catches writes to undeclared attributes', () => {
    const user = new User()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    ;(user as any).discount = 5

    expect((user as any).discount).toBe(5)
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Undeclared')
    )
    warn.mockRestore()
  })

  it('stores undeclared attributes in _attributes', () => {
    const user = new User()
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    ;(user as any).discount = 5
    expect(user.get('discount')).toBe(5)

    vi.restoreAllMocks()
  })

  it('warns with model class name and attribute name', () => {
    const user = new User()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    ;(user as any).discount = 5

    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/Undeclared.*"discount".*User/)
    )
    warn.mockRestore()
  })

  it('warns on set() with undeclared attribute', () => {
    const user = new User()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    user.set('discount', 5)

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Undeclared')
    )
    warn.mockRestore()
  })

  it('warns on set() with object containing undeclared attributes', () => {
    const user = new User()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    user.set({ discount: 5, bonus: 10 })

    expect(warn).toHaveBeenCalledTimes(2)
    warn.mockRestore()
  })
})

// --- Debug mode ---

describe('Model: debug option', () => {
  class User extends Model {
    defaults() {
      return { name: '' }
    }
  }

  it('debug=true shows warnings for undeclared attributes (default)', () => {
    const user = new User(undefined, undefined, { debug: true })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    ;(user as any).discount = 5
    expect(warn).toHaveBeenCalled()

    warn.mockRestore()
  })

  it('debug=false suppresses undeclared attribute warnings', () => {
    const user = new User(undefined, undefined, { debug: false })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    ;(user as any).discount = 5
    expect(warn).not.toHaveBeenCalled()

    warn.mockRestore()
  })

  it('debug=true warns on read of undeclared attribute', () => {
    const user = new User(undefined, undefined, { debug: true })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const _value = (user as any).discount

    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/Access.*undeclared.*"discount".*User/)
    )
    warn.mockRestore()
  })

  it('debug=false does not warn on read of undeclared attribute', () => {
    const user = new User(undefined, undefined, { debug: false })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const _value = (user as any).discount

    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('debug mode can be toggled at class level', () => {
    class DebugUser extends Model {
      defaults() { return { name: '' } }
      options() { return { debug: true } }
    }
    class SilentUser extends Model {
      defaults() { return { name: '' } }
      options() { return { debug: false } }
    }

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    ;(new DebugUser() as any).x = 1
    expect(warn).toHaveBeenCalled()

    warn.mockClear()

    ;(new SilentUser() as any).x = 1
    expect(warn).not.toHaveBeenCalled()

    warn.mockRestore()
  })

  it('debug: "strict" throws error instead of warning', () => {
    const user = new User(undefined, undefined, { debug: 'strict' })

    expect(() => {
      ;(user as any).discount = 5
    }).toThrow(/Undeclared.*"discount".*User/)
  })

  it('undeclared attributes still work functionally regardless of debug mode', () => {
    const user = new User(undefined, undefined, { debug: false })

    ;(user as any).discount = 5
    expect((user as any).discount).toBe(5)
    expect(user.get('discount')).toBe(5)
  })
})

// --- Signals: per-property change tracking ---

describe('Model: signals', () => {
  class User extends Model {
    defaults() {
      return { name: '', email: '' }
    }
  }

  it('on() subscribes to property changes', () => {
    const user = new User()
    const cb = vi.fn()

    user.on('name', cb)
    user.name = 'John'

    expect(cb).toHaveBeenCalledWith('John', '')
  })

  it('does not fire signal when value unchanged', () => {
    const user = new User({ name: 'John' })
    const cb = vi.fn()

    user.on('name', cb)
    user.name = 'John'

    expect(cb).not.toHaveBeenCalled()
  })

  it('wildcard * subscribes to all changes', () => {
    const user = new User()
    const cb = vi.fn()

    user.on('*', cb)
    user.name = 'John'
    user.email = 'john@test.com'

    expect(cb).toHaveBeenCalledTimes(2)
    expect(cb).toHaveBeenCalledWith('name', 'John', '')
    expect(cb).toHaveBeenCalledWith('email', 'john@test.com', '')
  })

  it('off() unsubscribes', () => {
    const user = new User()
    const cb = vi.fn()

    user.on('name', cb)
    user.off('name', cb)
    user.name = 'John'

    expect(cb).not.toHaveBeenCalled()
  })
})

// --- Events: vue-mc compatible event system ---

describe('Model: events', () => {
  class User extends Model {
    defaults() {
      return { name: '' }
    }
  }

  it('emit() fires registered listeners', () => {
    const user = new User()
    const cb = vi.fn()

    user.on('change', cb)
    user.name = 'John'

    expect(cb).toHaveBeenCalledWith(
      expect.objectContaining({ attribute: 'name', value: 'John', previous: '' })
    )
  })

  it('supports comma-separated event registration', () => {
    const user = new User()
    const cb = vi.fn()

    user.on('save, delete', cb)
    user.emit('save', {})
    user.emit('delete', {})

    expect(cb).toHaveBeenCalledTimes(2)
  })
})

// --- Sync / Reset / Changed ---

describe('Model: sync and reset', () => {
  class User extends Model {
    defaults() {
      return { name: '', email: '' }
    }
  }

  it('changed() returns false when no changes', () => {
    const user = new User({ name: 'John' })
    user.sync()
    expect(user.changed()).toBe(false)
  })

  it('changed() returns array of changed attribute names', () => {
    const user = new User({ name: 'John' })
    user.sync()
    user.name = 'Jane'
    expect(user.changed()).toEqual(['name'])
  })

  it('sync() saves current state as reference', () => {
    const user = new User({ name: 'John' })
    user.sync()
    user.name = 'Jane'
    user.sync()
    expect(user.changed()).toBe(false)
  })

  it('reset() reverts to synced state', () => {
    const user = new User({ name: 'John' })
    user.sync()
    user.name = 'Jane'
    user.reset()
    expect(user.name).toBe('John')
  })

  it('saved() returns reference attribute value', () => {
    const user = new User({ name: 'John' })
    user.sync()
    user.name = 'Jane'
    expect(user.saved('name')).toBe('John')
    expect(user.name).toBe('Jane')
  })

  it('$ returns all saved attributes', () => {
    const user = new User({ name: 'John', email: 'j@t.com' })
    user.sync()
    user.name = 'Jane'
    expect(user.$).toEqual({ name: 'John', email: 'j@t.com' })
  })
})

// --- Identity ---

describe('Model: identity', () => {
  class User extends Model {
    defaults() {
      return { id: null, name: '' }
    }
  }

  it('isNew() returns true when no identifier', () => {
    const user = new User()
    expect(user.isNew()).toBe(true)
  })

  it('isNew() returns false when identifier set', () => {
    const user = new User({ id: 1 })
    expect(user.isNew()).toBe(false)
  })

  it('identifier() returns the id value', () => {
    const user = new User({ id: 42 })
    expect(user.identifier()).toBe(42)
  })
})

// --- Options ---

describe('Model: options', () => {
  class User extends Model {
    defaults() {
      return { id: null, name: '' }
    }
    options() {
      return { identifier: 'id', patch: true }
    }
  }

  it('getOption() returns option value', () => {
    const user = new User()
    expect(user.getOption('identifier')).toBe('id')
    expect(user.getOption('patch')).toBe(true)
  })

  it('setOption() changes option', () => {
    const user = new User()
    user.setOption('patch', false)
    expect(user.getOption('patch')).toBe(false)
  })
})

// --- Clone ---

describe('Model: clone', () => {
  class User extends Model {
    defaults() {
      return { name: '', email: '' }
    }
  }

  it('clone() creates independent copy', () => {
    const user = new User({ name: 'John', email: 'j@t.com' })
    const clone = user.clone()

    expect(clone.name).toBe('John')
    expect(clone.email).toBe('j@t.com')

    clone.name = 'Jane'
    expect(user.name).toBe('John')
    expect(clone.name).toBe('Jane')
  })
})

// --- toJSON ---

describe('Model: serialization', () => {
  class User extends Model {
    defaults() {
      return { name: '', email: '' }
    }
  }

  it('toJSON() returns plain attributes object', () => {
    const user = new User({ name: 'John', email: 'j@t.com' })
    expect(user.toJSON()).toEqual({ name: 'John', email: 'j@t.com' })
  })

  it('JSON.stringify works', () => {
    const user = new User({ name: 'John', email: 'j@t.com' })
    const json = JSON.parse(JSON.stringify(user))
    expect(json).toEqual({ name: 'John', email: 'j@t.com' })
  })
})
