# Getting started

```bash
npm install @risklight/models
```

## TypeScript

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

## JavaScript

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
