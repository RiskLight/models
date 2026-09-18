# Exported types

```ts
import type {
  Routes,
  Options,
  RequestOptions,
  Listener,
  Mutation,
  RouteResolver,
  HttpMethod,
  ResponseData,
  RequestSuccessCallback,
  RequestFailureCallback,
} from '@risklight/models'
```

### Nuxt adapter types

Exported from `@risklight/models/nuxt` and re-exported as types from the root:

```ts
import type { NuxtFetcher, NuxtRequestConfig, NuxtRawResponse, NuxtModelsOptions, Identified, Attributes } from '@risklight/models'

const fetcher: NuxtFetcher = async ({ url, method, data, params, headers }: NuxtRequestConfig): Promise<NuxtRawResponse> => { /* ... */ }

interface GenreAttrs extends Identified { name: string }      // _id?: string comes from Identified
type GenreRow = Attributes<Genre>                             // what NuxtCollection#items yields
```
