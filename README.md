# @risklight/models

Framework-agnostic Model/Collection library with Proxy-based reactivity, HTTP layer (axios), Zod validation, and first-class TypeScript generics. Works standalone, with Vue 3, or with React.

Drop-in replacement for [vue-mc](https://github.com/FiguredLimited/vue-mc) — same API, no framework lock-in.

## Install

```bash
npm install @risklight/models
```

## Quick start

### TypeScript

```ts
import { Model, Collection } from '@risklight/models'
import { required, email, between } from '@risklight/models'

interface UserAttrs {
  id: number
  name: string
  email: string
  age: number
}

class User extends Model<UserAttrs> {
  defaults(): Partial<UserAttrs> {
    return { id: 0, name: '', email: '', age: 0 }
  }

  routes() {
    return {
      fetch: '/api/users/{id}',
      save:  '/api/users',
    }
  }

  validation() {
    return {
      name:  required,
      email: required.and(email),
      age:   required.and(between(18, 120)),
    }
  }
}

class Users extends Collection<User> {
  model() { return User }
  routes() { return { fetch: '/api/users' } }
}
```

### JavaScript

```js
import { Model, Collection, required, email, between } from '@risklight/models'

class User extends Model {
  defaults() {
    return { id: 0, name: '', email: '', age: 0 }
  }

  routes() {
    return {
      fetch: '/api/users/{id}',
      save:  '/api/users',
    }
  }

  validation() {
    return {
      name:  required,
      email: required.and(email),
      age:   required.and(between(18, 120)),
    }
  }
}

class Users extends Collection {
  model() { return User }
  routes() { return { fetch: '/api/users' } }
}
```

## Attribute access

Models use a Proxy — read/write attributes with dot notation:

```ts
const user = new User({ name: 'John', email: 'john@test.com' })

user.name              // 'John'
user.name = 'Jane'     // sets attribute, emits 'change' event
user.get('name')       // typed: string (with generics)
user.set('name', 'Bob')
user.set({ name: 'Bob', email: 'bob@test.com' })
```

## State management

```ts
user.sync()                  // mark current state as "saved"
user.name = 'changed'
user.changed()               // ['name']
user.saved('name')           // 'Bob' (last synced value)
user.reset()                 // revert to synced state
user.changed()               // false
```

## Nested models

Cast attributes to model instances via mutations:

```ts
interface AddressAttrs {
  street: string
  city: string
  zip: string
}

class Address extends Model<AddressAttrs> {
  defaults() { return { street: '', city: '', zip: '' } }
}

class User extends Model {
  defaults() {
    return { name: '', address: {} }
  }

  mutations() {
    return {
      address: (v: any) => new Address(v),
    }
  }
}

const user = new User({ name: 'John', address: { street: '123 Main', city: 'Berlin', zip: '10115' } })
user.address.city  // 'Berlin'
user.address.city = 'Munich'
```

## Validation

### With rules

```ts
import { required, email, min, max, length, match, integer } from '@risklight/models'

class User extends Model {
  validation() {
    return {
      name:  required.and(length(2, 50)),
      email: required.and(email),
      age:   required.and(integer).and(min(18)),
      phone: match(/^\+\d{10,15}$/),
    }
  }
}

const user = new User()
const errors = await user.validate()
// { name: 'Required', email: 'Required', age: 'Required' }
```

### With Zod

Zod schemas take priority over `validation()` rules:

```ts
import { z } from 'zod'

class User extends Model {
  defaults() { return { name: '', email: '' } }
  schema() {
    return z.object({
      name: z.string().min(2),
      email: z.string().email(),
    })
  }
}
```

### Rule combinators

```ts
// AND — both must pass
required.and(email)

// OR — at least one must pass
required.or(email)

// Custom message
required.format('This field cannot be empty')
```

### Available rules

| Rule | Description |
|---|---|
| `required` | Not null/undefined/empty |
| `email` | Valid email |
| `url` | Valid URL |
| `uuid` | Valid UUID |
| `integer` | Integer number |
| `numeric` | Number or numeric string |
| `boolean` | Boolean value |
| `string` | String value |
| `array` | Array value |
| `object` | Plain object |
| `min(n)` | Number >= n |
| `max(n)` | Number <= n |
| `between(a, b)` | Number between a and b |
| `gt(n)`, `gte(n)`, `lt(n)`, `lte(n)` | Comparisons |
| `length(min, max?)` | String/array length |
| `match(regex)` | Matches pattern |
| `equals(value)` | Strictly equal |
| `date` | Valid date |
| `after(date)`, `before(date)` | Date comparisons |
| `alpha`, `alphanumeric` | Letter/number only |
| `ip`, `iso8601`, `base64`, `ascii` | Format checks |
| `creditcard` | Luhn algorithm check |
| `json` | Valid JSON string |
| `positive`, `negative` | Sign checks |
| `not(...values)` | Exclusion |
| `same(attr)` | Same as another attribute |

### Localization

```ts
import { register, locale } from '@risklight/models'

register('de', {
  required: 'Pflichtfeld',
  email:    'Ungueltige E-Mail',
})

locale('de')
```

## HTTP (CRUD)

All HTTP is done via axios under the hood.

### Model

```ts
class User extends Model {
  defaults() { return { id: null, name: '', email: '' } }
  routes() {
    return {
      fetch:  '/api/users/{id}',
      save:   '/api/users',
      delete: '/api/users/{id}',
    }
  }
}

// Create
const user = new User({ name: 'John', email: 'john@test.com' })
await user.save()         // POST /api/users
console.log(user.id)      // server-assigned ID

// Read
const user2 = new User({ id: 5 })
await user2.fetch()       // GET /api/users/5

// Update
user.name = 'Jane'
await user.save()         // PUT /api/users/5

// Delete
await user.delete()       // DELETE /api/users/5
```

### Collection

```ts
const users = new Users()
await users.fetch()       // GET /api/users
users.models              // User[]
users.size()              // number
```

### Pagination

```ts
const users = new Users()
users.page(1)
await users.fetch()       // GET /api/users?page=1

users.page(2)
await users.fetch()       // GET /api/users?page=2

users.isLastPage()        // true/false
```

### File upload

```ts
class Avatar extends Model {
  defaults() { return { id: null, filename: '' } }
  routes() { return { save: '/api/upload' } }
}

const model = new Avatar()
await model.upload({
  data: { file: fileInput.files[0], field: 'avatar' }
})
```

### Backend validation (422)

When the server returns 422, errors are automatically parsed into `model.errors`:

```ts
try {
  await user.save()
} catch (e) {
  console.log(user.errors)
  // { name: ['Name is required'], email: ['Invalid email'] }
}
```

### Bulk operations

```ts
// Bulk save — saves all changed models in one request
for (const user of users.models) {
  user.name = user.name.toUpperCase()
}
await users.save()

// Bulk delete — mark models then delete
users.models[0].deleting = true
users.models[2].deleting = true
await users.delete()
```

## Options

```ts
class User extends Model {
  options() {
    return {
      identifier:          'id',       // primary key attribute
      patch:               false,      // use PATCH instead of PUT for updates
      saveUnchanged:       true,       // send unchanged models to server
      useFirstErrorOnly:   false,      // single error string vs array per field
      validateOnChange:    false,      // auto-validate on attribute change
      validateRecursively: true,       // validate nested models
      mutateOnChange:      false,      // apply mutations on change
      mutateBeforeSync:    true,       // mutate before syncing state
      mutateBeforeSave:    true,       // mutate before save request
    }
  }
}
```

## Events

```ts
const user = new User({ name: 'John' })
user.sync()

// Attribute changes
user.on('change', (ctx) => {
  console.log(ctx.attribute, ctx.value, ctx.previous)
})

user.on('change:name', (ctx) => {
  console.log('name changed to', ctx.value)
})

// Lifecycle
user.on('save',         () => console.log('save started'))
user.on('save.success', () => console.log('saved'))
user.on('save.failure', () => console.log('save failed'))
user.on('fetch',        () => console.log('fetched'))
user.on('delete',       () => console.log('deleted'))
user.on('sync',         () => console.log('synced'))
user.on('reset',        () => console.log('reset'))

// Property signals
user.on('name', (value, previous) => {
  console.log(`name: ${previous} -> ${value}`)
})

// Wildcard
user.on('*', (key, value, previous) => {
  console.log(`${key} changed`)
})

// Unsubscribe
const handler = () => {}
user.on('change', handler)
user.off('change', handler)
```

## Collection API

```ts
const users = new Users()

// Add/remove
users.add({ name: 'John', email: 'j@t.com' })
users.add(new User({ name: 'Jane' }))
users.remove(user)
users.clear()

// Query
users.find(u => u.name === 'John')    // User | undefined
users.where(u => u.age > 18)          // User[]
users.filter(u => u.age > 18)         // new Collection<User>
users.has(user)                       // boolean

// Array-like
users.models       // User[]
users.size()        // number
users.isEmpty()     // boolean
users.first()       // User | undefined
users.last()        // User | undefined
users.map(u => u.name)
users.each(u => console.log(u.name))
users.sort('name')

// Iteration
for (const user of users) {
  console.log(user.name)
}

// Serialization
users.toJSON()      // plain object array
users.clone()       // new collection with cloned models
```

## HTTP customization

Override methods for custom behavior:

```ts
class User extends Model {
  // Custom headers
  getDefaultHeaders() {
    return { Authorization: `Bearer ${getToken()}` }
  }

  // Custom query params
  getFetchQuery() {
    return { include: 'posts,comments' }
  }

  // Custom save data (e.g. wrap in root key)
  getSaveData() {
    return { user: this.attributes }
  }

  // Custom URL logic
  getFetchURL() {
    return `/api/v2/users/${this.id}`
  }

  // PATCH mode
  options() {
    return { patch: true }
  }
}
```

### Custom query string serializer

For nested params (e.g. with `qs`):

```ts
import qs from 'qs'

class User extends Model {
  options() {
    return {
      paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'brackets' }),
    }
  }
}
```

## Lifecycle hooks

Override these to customize request behavior:

```ts
class User extends Model {
  async onSave() {
    // Return REQUEST_CONTINUE, REQUEST_SKIP, or REQUEST_REDUNDANT
    if (this.loading) return Model.REQUEST_SKIP
    return super.onSave()
  }

  onSaveSuccess(response) {
    super.onSaveSuccess(response)
    console.log('Saved!', response.getData())
  }

  onSaveFailure(error) {
    super.onSaveFailure(error)
    notify('Save failed')
  }

  onFetchSuccess(response) {
    super.onFetchSuccess(response)
    // Transform response data
  }
}
```

## Framework adapters

### Vue 3

Import the adapter once in your `main.ts` — all Model instances become Vue-reactive automatically:

```ts
// main.ts
import '@risklight/models/vue'
```

```vue
<script setup>
import { ref } from 'vue'
import { User } from './models/User'

const user = ref(new User({ name: 'John' }))
// user.value.name is reactive in templates
</script>

<template>
  <input v-model="user.name" />
  <p>{{ user.name }}</p>
</template>
```

### React

Use the `useModelState` hook for reactive re-renders:

```tsx
import { useMemo } from 'react'
import { useModelState } from '@risklight/models/react'
import { User } from './models/User'

function UserForm() {
  const user = useMemo(() => new User({ name: 'John' }), [])
  const state = useModelState(user)

  return (
    <>
      <input
        value={state.name}
        onChange={e => user.name = e.target.value}
      />
      <p>{state.name}</p>
    </>
  )
}
```

`useModelState` returns a reactive snapshot of model attributes. It re-renders on:
- attribute changes (including nested models)
- `sync`, `reset`, `fetch`, `save.success`, `delete`

### Vanilla JS / Node.js

Works without any adapter:

```js
import { Model } from '@risklight/models'

class User extends Model {
  defaults() { return { name: '' } }
  routes() { return { save: '/api/users' } }
}

const user = new User({ name: 'John' })
user.on('change', (ctx) => console.log(ctx.attribute, ctx.value))
user.name = 'Jane'  // logs: 'name' 'Jane'
await user.save()
```

## Exported types

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

## Error handling

```ts
import { ValidationError, RequestError, ResponseError } from '@risklight/models'

try {
  await user.save()
} catch (e) {
  if (e instanceof ValidationError) {
    // Client-side validation failed
    console.log(e.getValidationErrors())
  }
  if (e instanceof ResponseError) {
    // Server returned error (e.g. 422)
    console.log(e.getResponse()?.getStatus())
  }
  if (e instanceof RequestError) {
    // Network/request error
    console.log(e.getError())
  }
}
```

## License

MIT
