# Nuxt

`@risklight/models/nuxt` is `ResourceModel`/`ResourceCollection` plus the Vue adapter, exported under Nuxt names (`NuxtModel`, `NuxtCollection`, `configureNuxtModels`). The only Nuxt-specific piece is the fetcher, which lives in your app because it needs `$fetch` and `useNuxtApp()`:

```ts
// plugins/models.ts
import { configureNuxtModels } from '@risklight/models/nuxt'

export default defineNuxtPlugin(() => {
  configureNuxtModels({
    fetcher: async ({ url, method, data, params, headers }) => {
      const fetcher = import.meta.server ? $fetch : (useNuxtApp().$csrfFetch as typeof $fetch)
      const res = await fetcher.raw(url, { method: method as any, body: data as any, query: params, headers })
      return { data: res._data, status: res.status, headers: Object.fromEntries(res.headers.entries()) }
    }
  })
})
```

```ts
import { NuxtModel, NuxtCollection } from '@risklight/models/nuxt'
import type { Identified } from '@risklight/models'

class Genre extends NuxtModel<GenreAttrs> {
  static route = '/api/genre'
  defaults(): Partial<GenreAttrs> { return { _id: '', name: '', description: '' } }
}
```

SSR goes through `$fetch`, the client through `$csrfFetch` with cookies and CSRF headers. See [REST resources](/guide/resources) for the full API.

