# Validation

## With rules

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

## With Zod

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

## Rule combinators

```ts
// AND — both must pass
required.and(email)

// OR — at least one must pass
required.or(email)

// Custom message
required.format('This field cannot be empty')
```

## Available rules

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

## Localization

```ts
import { register, locale } from '@risklight/models'

register('de', {
  required: 'Pflichtfeld',
  email:    'Ungueltige E-Mail',
})

locale('de')
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
