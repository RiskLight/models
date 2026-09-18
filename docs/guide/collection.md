# Collection

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
