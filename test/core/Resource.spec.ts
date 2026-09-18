import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ResourceModel, ResourceCollection, configureTransport, resetTransport, hasTransport, RequestError, Request } from '../../src'
import type { RequestConfig, Identified } from '../../src'

interface GenreAttrs extends Identified { name: string; description?: string }

class Genre extends ResourceModel<GenreAttrs> {
  static override route = '/api/genre'
  override defaults(): Partial<GenreAttrs> { return { _id: '', name: '', description: '' } }
}

class Genres extends ResourceCollection<Genre> {
  override model() { return Genre }
}

const calls: RequestConfig[] = []
const fetcher = vi.fn(async (config: RequestConfig) => {
  calls.push(config)
  if (config.method === 'GET' && config.url === '/api/genre') {
    return { data: { data: [{ _id: 'a1', name: 'landscape' }, { _id: 'b2', name: 'portrait' }] }, status: 200 }
  }
  if (config.method === 'GET' && config.url === '/api/genre/a1') {
    return { data: { data: { _id: 'a1', name: 'landscape', description: 'nature' } }, status: 200 }
  }
  if (config.method === 'POST') return { data: { data: { _id: 'new1', ...(config.data as object) } }, status: 200 }
  if (config.method === 'PUT') return { data: { data: config.data }, status: 200 }
  if (config.method === 'DELETE') return { data: { success: true }, status: 200 }
  const error: any = new Error('Not found'); error.status = 404
  throw error
})

beforeEach(() => {
  calls.length = 0
  resetTransport()
  configureTransport({ fetcher })
})

describe('ResourceModel (framework-free)', () => {
  it('derives routes from the static route and _id', () => {
    const genre = new Genre({ _id: 'a1' })
    expect(genre.getFetchURL()).toBe('/api/genre/a1')
    expect(genre.getSaveURL()).toBe('/api/genre/a1')
    expect(new Genre().getSaveURL()).toBe('/api/genre')
  })

  it('fetchOne, save, delete go through the configured transport', async () => {
    const genre = new Genre()
    await genre.fetchOne('a1')
    expect(genre.description).toBe('nature')
    genre.name = 'x'
    await genre.save()
    expect(calls.at(-1)).toMatchObject({ method: 'PUT', url: '/api/genre/a1' })
    await genre.delete()
    expect(calls.at(-1)).toMatchObject({ method: 'DELETE', url: '/api/genre/a1' })
  })

  it('a new model POSTs without _id and adopts the server id', async () => {
    const genre = new Genre({ name: 'marine' })
    await genre.save()
    expect(calls[0].data).not.toHaveProperty('_id')
    expect(genre._id).toBe('new1')
  })

  it('wraps failures in RequestError with the status', async () => {
    await expect(new Genre().fetchOne('missing')).rejects.toBeInstanceOf(RequestError)
  })

  it('collection fetchAll yields plain rows', async () => {
    const rows = await new Genres().fetchAll()
    expect(rows.map(r => r.name)).toEqual(['landscape', 'portrait'])
  })

  it('falls back to the default axios Request when no transport is configured', () => {
    resetTransport()
    expect(hasTransport()).toBe(false)
    expect(new Genre().createRequest({ url: '/x', method: 'GET' })).toBeInstanceOf(Request)
  })

  it('honours a custom identifier and envelope', async () => {
    class Post extends ResourceModel<{ id?: string; title: string }> {
      static override route = '/posts'
      override defaults() { return { id: '', title: '' } }
    }
    resetTransport()
    configureTransport({ identifier: 'id', unwrap: (p: any) => p.result, fetcher: async () => ({ data: { result: { id: 'p9', title: 'hello' } }, status: 200 }) })
    const post = new Post()
    await post.fetchOne('p9')
    expect(post.getFetchURL()).toBe('/posts/p9')
    expect(post.title).toBe('hello')
  })
})
