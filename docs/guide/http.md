# HTTP

HTTP goes through `createRequest()`: axios by default, or whatever the adapter provides (the Nuxt adapter uses the fetcher you configure). Override `createRequest()` on a model or collection to plug in anything else.

## Model

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

## Collection

```ts
const users = new Users()
await users.fetch()       // GET /api/users
users.models              // User[]
users.size()              // number
```

## Pagination

```ts
const users = new Users()
users.page(1)
await users.fetch()       // GET /api/users?page=1

users.page(2)
await users.fetch()       // GET /api/users?page=2

users.isLastPage()        // true/false
```

## File upload

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

## Backend validation (422)

When the server returns 422, errors are automatically parsed into `model.errors`:

```ts
try {
  await user.save()
} catch (e) {
  console.log(user.errors)
  // { name: ['Name is required'], email: ['Invalid email'] }
}
```

## Bulk operations

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

## Customization

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

## Custom query string serializer

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
