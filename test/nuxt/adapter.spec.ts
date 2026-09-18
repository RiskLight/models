import { describe, it, expect, beforeEach, vi } from 'vitest'
import { isReactive } from 'vue'
import { configureNuxtModels, resetNuxtModels, NuxtModel, NuxtCollection } from '../../src/nuxt'
import type { NuxtRequestConfig } from '../../src/nuxt'
import { RequestError } from '../../src'

interface GenreAttrs { _id?: string; name: string; description?: string }

class Genre extends NuxtModel<GenreAttrs> {
  static route = '/api/genre'
  defaults(): Partial<GenreAttrs> { return { _id: '', name: '', description: '' } }
}

class Genres extends NuxtCollection<Genre> {
  model() { return Genre }
}

const calls: NuxtRequestConfig[] = []
const fetcher = vi.fn(async (config: NuxtRequestConfig) => {
  calls.push(config)
  if (config.method === 'GET' && config.url === '/api/genre') {
    return { data: { success: true, data: [{ _id: 'a1', name: 'landscape' }, { _id: 'b2', name: 'portrait' }] }, status: 200 }
  }
  if (config.method === 'GET' && config.url === '/api/genre/a1') {
    return { data: { success: true, data: { _id: 'a1', name: 'landscape', description: 'nature' } }, status: 200 }
  }
  if (config.method === 'POST') {
    return { data: { success: true, data: { _id: 'new1', ...(config.data as object) } }, status: 200 }
  }
  if (config.method === 'PUT') {
    return { data: { success: true, data: config.data }, status: 200 }
  }
  if (config.method === 'DELETE') {
    return { data: { success: true }, status: 200 }
  }
  const error: any = new Error('Not found')
  error.status = 404
  error.data = { message: 'Not found' }
  throw error
})

beforeEach(() => {
  calls.length = 0
  fetcher.mockClear()
  resetNuxtModels()
  configureNuxtModels({ fetcher })
})

describe('configuration', () => {
  it('throws a clear error when the fetcher is not configured', async () => {
    resetNuxtModels()
    const genre = new Genre()
    await expect(genre.fetchOne('a1')).rejects.toThrow(/configureNuxtModels/)
  })
})

describe('NuxtModel', () => {
  it('uses _id as identifier and builds routes from the static route', () => {
    const genre = new Genre({ _id: 'a1' })
    expect(genre.isNew()).toBe(false)
    expect(genre.getFetchURL()).toBe('/api/genre/a1')
    expect(genre.getDeleteURL()).toBe('/api/genre/a1')
    expect(genre.getSaveURL()).toBe('/api/genre/a1')
    expect(new Genre().getSaveURL()).toBe('/api/genre')
  })

  it('fetchOne sets the id, GETs the resource and unwraps { data }', async () => {
    const genre = new Genre()
    await genre.fetchOne('a1')
    expect(calls[0]).toMatchObject({ method: 'GET', url: '/api/genre/a1' })
    expect(genre.name).toBe('landscape')
    expect(genre.description).toBe('nature')
  })

  it('save on a new model POSTs without _id and adopts the server id', async () => {
    const genre = new Genre({ name: 'marine' })
    await genre.save()
    expect(calls[0].method).toBe('POST')
    expect(calls[0].url).toBe('/api/genre')
    expect(calls[0].data).not.toHaveProperty('_id')
    expect(genre._id).toBe('new1')
    expect(genre.isNew()).toBe(false)
  })

  it('save on an existing model PUTs to /{route}/{_id}', async () => {
    const genre = new Genre({ _id: 'a1', name: 'landscape' })
    genre.name = 'landscapes'
    await genre.save()
    expect(calls[0]).toMatchObject({ method: 'PUT', url: '/api/genre/a1' })
    expect((calls[0].data as any)._id).toBe('a1')
  })

  it('delete sends DELETE to /{route}/{_id}', async () => {
    const genre = new Genre({ _id: 'b2' })
    await genre.delete()
    expect(calls[0]).toMatchObject({ method: 'DELETE', url: '/api/genre/b2' })
  })

  it('wraps fetch failures in RequestError with the response status', async () => {
    const genre = new Genre()
    await expect(genre.fetchOne('missing')).rejects.toBeInstanceOf(RequestError)
    try {
      await genre.fetchOne('missing')
    } catch (error: any) {
      expect(error.response.getStatus()).toBe(404)
    }
  })

  it('static fetchAll and fetchById return unwrapped envelopes', async () => {
    const all = await Genre.fetchAll<GenreAttrs>()
    expect(all.data.map(g => g.name)).toEqual(['landscape', 'portrait'])
    const one = await Genre.fetchById<GenreAttrs>('a1')
    expect(one.data.description).toBe('nature')
  })

  it('exposes _id through dot access despite the private-underscore proxy rule', () => {
    const genre = new Genre({ _id: 'a1', name: 'x' })
    expect(genre._id).toBe('a1')
    expect(genre.get('_id')).toBe('a1')
    expect(new Genre()._id).toBe('')
  })

  it('attributes are Vue-reactive (vue adapter is loaded)', () => {
    const genre = new Genre()
    expect(isReactive(genre._attributes)).toBe(true)
  })

  it('does not warn about declared attributes in debug:false mode', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const genre = new Genre()
    genre.name = 'x'
    ;(genre as any).undeclared = 1
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })
})

describe('NuxtCollection', () => {
  it('fetchAll GETs the model route and exposes plain items', async () => {
    const genres = new Genres()
    const items = await genres.fetchAll()
    expect(calls[0]).toMatchObject({ method: 'GET', url: '/api/genre' })
    expect(genres.models).toHaveLength(2)
    expect(genres.models[0]).toBeInstanceOf(Genre)
    expect(items).toEqual([
      { _id: 'a1', name: 'landscape', description: '' },
      { _id: 'b2', name: 'portrait', description: '' },
    ])
  })
})

describe('custom unwrap and identifier', () => {
  class Post extends NuxtModel<{ id?: string; title: string }> {
    static route = '/posts'
    defaults() { return { id: '', title: '' } }
  }

  it('honours a custom envelope and primary key', async () => {
    resetNuxtModels()
    configureNuxtModels({
      identifier: 'id',
      unwrap: (payload: any) => payload.result,
      fetcher: async () => ({ data: { result: { id: 'p9', title: 'hello' } }, status: 200 }),
    })
    const post = new Post()
    await post.fetchOne('p9')
    expect(post.getFetchURL()).toBe('/posts/p9')
    expect(post.title).toBe('hello')
  })
})

describe('type exports', () => {
  it('root re-exports the adapter types (compile-time check)', async () => {
    const root = await import('../../src')
    const nuxt = await import('../../src/nuxt')
    type Row = import('../../src').Attributes<InstanceType<typeof nuxt.NuxtModel>>
    const row: Row = { _id: 'x' }
    expect(row._id).toBe('x')
    expect(typeof root.Model).toBe('function')
  })
})
