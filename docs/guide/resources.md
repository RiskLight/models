# REST resources

`ResourceModel` and `ResourceCollection` bind a model to a REST resource by a static `route` and route HTTP through a transport you configure once. They work in any framework: plain JS, Vue, React or Nuxt. Without `configureTransport()` they fall back to the default axios request.

```ts
import { ResourceModel, ResourceCollection, configureTransport } from '@risklight/models'
import type { Identified } from '@risklight/models'

configureTransport({
  fetcher: async ({ url, method, data, params, headers }) => {
    const res = await fetch(url + '?' + new URLSearchParams(params as any), { method, body: data ? JSON.stringify(data) : undefined, headers })
    return { data: await res.json(), status: res.status }
  },
  // unwrap: (payload) => payload.data   // default: unwraps { data } envelopes
  // identifier: '_id'                   // default
})

interface GenreAttrs extends Identified { name: string; description?: string }

class Genre extends ResourceModel<GenreAttrs> {
  static route = '/api/genre'
  defaults(): Partial<GenreAttrs> { return { _id: '', name: '', description: '' } }
}

class Genres extends ResourceCollection<Genre> {
  model() { return Genre }
}

const genre = new Genre()
await genre.fetchOne('a1')        // GET  /api/genre/a1
genre.name = 'Landscape'
await genre.save()                // PUT  /api/genre/a1   (POST /api/genre when new, without the identifier)
await genre.delete()              // DELETE /api/genre/a1

const genres = new Genres()
await genres.fetchAll()           // GET /api/genre → genres.models / genres.items (plain objects)
await Genre.fetchAll()            // { data: GenreAttrs[] } without instantiating models
```

Routes: `fetch`/`update`/`delete` use `{route}/{identifier}`, `save` on a new model posts to `{route}`. The identifier defaults to `_id`; pass `identifier` to `configureTransport()` for `id` or anything else.

