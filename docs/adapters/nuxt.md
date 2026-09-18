# Nuxt

`@risklight/models/nuxt` binds models to a REST resource by a static `route` and routes HTTP through a fetcher you provide, so SSR (`$fetch`) and client (`$csrfFetch`, cookies, CSRF headers) both work without axios. Vue reactivity is enabled automatically.

```ts
// plugins/models.ts
import { configureNuxtModels } from '@risklight/models/nuxt'

export default defineNuxtPlugin((nuxtApp) => {
  configureNuxtModels({
    fetcher: async ({ url, method, data, params, headers }) => {
      const fetcher = import.meta.server ? $fetch : (nuxtApp.$csrfFetch as typeof $fetch)
      const res = await fetcher.raw(url, { method: method as any, body: data as any, query: params, headers })
      return { data: res._data, status: res.status, headers: Object.fromEntries(res.headers.entries()) }
    },
    // unwrap: (payload) => payload.data   // default: unwraps { data } envelopes
    // identifier: '_id'                   // default
  })
})
```

```ts
import { NuxtModel, NuxtCollection } from '@risklight/models/nuxt'

interface GenreAttrs { _id?: string; name: string; description?: string }

class Genre extends NuxtModel<GenreAttrs> {
  static route = '/api/genre'
  defaults(): Partial<GenreAttrs> { return { _id: '', name: '', description: '' } }
}

class Genres extends NuxtCollection<Genre> {
  model() { return Genre }
}

const genre = new Genre()
await genre.fetchOne('a1')        // GET  /api/genre/a1
genre.name = 'Landscape'
await genre.save()                // PUT  /api/genre/a1   (POST /api/genre when new)
await genre.delete()              // DELETE /api/genre/a1

const genres = new Genres()
await genres.fetchAll()           // GET /api/genre → genres.models / genres.items (plain objects)
await Genre.fetchAll()            // { data: GenreAttrs[] } without instantiating models
```

Routes: `fetch`/`update`/`delete` use `{route}/{identifier}`, `save` on a new model posts to `{route}`. The identifier defaults to `_id`; pass `identifier` to `configureNuxtModels()` for `id` or anything else.
