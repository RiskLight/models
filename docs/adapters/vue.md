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
