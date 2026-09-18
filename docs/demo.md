# Live demo

A `User` model with three validation rules, running in this page against the library source. Edit the fields, then call `validate()`, `reset()` or `sync()` and watch `changed()` and the event log.

<ModelDemo />

```ts
class User extends Model<UserAttrs> {
  defaults() {
    return { name: '', email: '', age: 18 }
  }

  validation() {
    return {
      name: required,
      email: required.and(email),
      age: required.and(between(18, 120))
    }
  }
}

const user = new User({ name: 'Ada', email: 'ada@example.com', age: 36 })
user.sync()

user.on('change', ({ attribute, value }) => console.log(attribute, value))
await user.validate()   // { email: ['Invalid email'] } when the address is broken
user.changed()          // ['name'] after you edit the name
user.reset()            // back to the synced state
```
