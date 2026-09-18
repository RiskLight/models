import { describe, it, expect, expectTypeOf } from 'vitest'
import { Model, Collection } from '../../src'
import { NuxtModel, NuxtCollection, configureNuxtModels, type Attributes } from '../../src/nuxt'

interface UserAttrs { id: number; name: string; email: string; tags: string[] }

class User extends Model<UserAttrs> {
  override defaults(): Partial<UserAttrs> { return { id: 0, name: '', email: '', tags: [] } }
  greet() { return `hi ${this.name}` }
}

class Users extends Collection<User> {
  override model() { return User }
}

interface GenreAttrs { _id?: string; name: string }
class Genre extends NuxtModel<GenreAttrs> {
  static override route = '/api/genre'
  override defaults(): Partial<GenreAttrs> { return { _id: '', name: '' } }
}
class Genres extends NuxtCollection<Genre> {
  override model() { return Genre }
}

describe('typed attribute access', () => {
  it('instances expose attributes with their declared types', () => {
    const user = new User({ name: 'Ada', tags: ['x'] })
    expectTypeOf(user.name).toEqualTypeOf<string>()
    expectTypeOf(user.id).toEqualTypeOf<number>()
    expectTypeOf(user.tags).toEqualTypeOf<string[]>()
    expectTypeOf(user.greet()).toEqualTypeOf<string>()
    expect(user.greet()).toBe('hi Ada')
    user.name = 'Grace'
    expect(user.name).toBe('Grace')
  })

  it('collections and toJSON keep the attribute type', () => {
    const users = new Users([{ name: 'a' }])
    expectTypeOf(users.models[0]!.email).toEqualTypeOf<string>()
    expectTypeOf(users.models[0]!.toJSON().name).toEqualTypeOf<string>()
    expect(users.models[0]!.name).toBe('a')
  })

  it('nuxt models and collections are typed the same way', () => {
    configureNuxtModels({ fetcher: async () => ({ data: { data: [] }, status: 200 }) })
    const genre = new Genre({ name: 'x' })
    expectTypeOf(genre.name).toEqualTypeOf<string>()
    expectTypeOf(genre._id).toEqualTypeOf<string | undefined>()
    const rows: Attributes<Genre>[] = new Genres().items
    expectTypeOf(rows).toEqualTypeOf<(GenreAttrs & Record<string, any>)[]>()
    expect(rows).toEqual([])
  })

  it('untyped models still allow any attribute', () => {
    class Loose extends Model {
      override defaults() { return { a: 1 } }
    }
    const loose = new Loose()
    loose.whatever = 2
    expect(loose.a).toBe(1)
  })
})
