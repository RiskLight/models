# Vanilla JS / Node.js

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
