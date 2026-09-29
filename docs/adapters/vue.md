# Vue 3

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

Validation errors and the `loading`, `saving`, `deleting` and `fatal` flags are reactive too, whether the model sits in `ref()`, `reactive()` or a plain variable, so a template can show the message for a field as soon as `validate()` or `save()` fills it:

```vue
<template>
  <input v-model="genre.name" />
  <p v-if="genre.errors.name">{{ genre.errors.name[0] }}</p>
  <button :disabled="genre.saving" @click="genre.save()">Save</button>
</template>
```
