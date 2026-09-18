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

`Model` and `ResourceModel` are typed constructors that return `ModelBase<A> & A` / `ResourceModelBase<A> & A`, which is what gives dot access its types. The underlying classes and constructor types are exported for tooling and generic constraints:

```ts
import type { ModelBase, ModelConstructor } from '@risklight/models'
import type { ResourceModelBase, ResourceModelConstructor } from '@risklight/models'

function describe<M extends ModelBase<any>>(model: M) { return model.toJSON() }
```

### Transport and resource types

```ts
import type { Fetcher, RequestConfig, RawResponse, TransportOptions, Identified, Attributes } from '@risklight/models'
import type { ResourceModelConstructor } from '@risklight/models'

const fetcher: Fetcher = async (config: RequestConfig): Promise<RawResponse> => { /* ... */ }

interface GenreAttrs extends Identified { name: string }      // Identified is { _id?: string }
type GenreRow = Attributes<Genre>                             // toJSON() shape of any model; what ResourceCollection#items yields
```
