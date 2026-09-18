# Model

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

## Undeclared attribute protection

Writing to an attribute not declared in `defaults()` triggers a console warning:

```ts
class User extends Model {
  defaults() { return { name: '', email: '' } }
}

const user = new User()
user.phone = '123'  // ⚠ [models] Undeclared "phone" on User
```

The attribute is still stored — but the warning helps catch typos and unintended properties. Control this via the `debug` option:

```ts
class User extends Model {
  options() {
    return {
      debug: true,       // console.warn (default)
      // debug: 'strict', // throw Error instead
      // debug: false,    // silent
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
