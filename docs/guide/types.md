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

### Base classes and constructors

`Model` and `NuxtModel` are typed constructors that return `ModelBase<A> & A` / `NuxtModelBase<A> & A`, which is what gives dot access its types. The underlying classes and constructor types are exported for tooling and generic constraints:

```ts
import type { ModelBase, ModelConstructor } from '@risklight/models'
import type { NuxtModelBase, NuxtModelConstructor } from '@risklight/models/nuxt'

function describe<M extends ModelBase<any>>(model: M) { return model.toJSON() }
```

### Nuxt adapter types

Exported from `@risklight/models/nuxt` and re-exported as types from the root:

```ts
import type { NuxtFetcher, NuxtRequestConfig, NuxtRawResponse, NuxtModelsOptions, Identified, Attributes } from '@risklight/models'

const fetcher: NuxtFetcher = async ({ url, method, data, params, headers }: NuxtRequestConfig): Promise<NuxtRawResponse> => { /* ... */ }

interface GenreAttrs extends Identified { name: string }      // _id?: string comes from Identified
type GenreRow = Attributes<Genre>                             // what NuxtCollection#items yields
```
