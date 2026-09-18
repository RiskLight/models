<script setup lang="ts">
import { ref, computed } from 'vue'
import { Model, required, email, between } from '@risklight/models'
import '@risklight/models/vue'

interface UserAttrs {
  name: string
  email: string
  age: number
}

class User extends Model<UserAttrs> {
  defaults(): Partial<UserAttrs> {
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

const user = ref(new User({ name: 'Ada', email: 'ada@example.com', age: 36 }))
user.value.sync()

const errors = ref<Record<string, string[]>>({})
const changed = computed(() => user.value.changed() || [])
const log = ref<string[]>([])

user.value.on('change', ({ attribute, value }: any) => {
  log.value.unshift(`change: ${attribute} = ${JSON.stringify(value)}`)
  log.value.splice(8)
})

const validate = async () => {
  errors.value = await user.value.validate()
}

const reset = () => {
  user.value.reset()
  errors.value = {}
}

const sync = () => {
  user.value.sync()
  errors.value = {}
}
</script>

<template>
  <div class="demo">
    <div class="demo-form">
      <label>
        <span>name</span>
        <input v-model="user.name" />
        <small v-if="errors.name">{{ errors.name[0] }}</small>
      </label>
      <label>
        <span>email</span>
        <input v-model="user.email" />
        <small v-if="errors.email">{{ errors.email[0] }}</small>
      </label>
      <label>
        <span>age</span>
        <input v-model.number="user.age" type="number" />
        <small v-if="errors.age">{{ errors.age[0] }}</small>
      </label>
      <div class="demo-actions">
        <button @click="validate">validate()</button>
        <button @click="reset">reset()</button>
        <button @click="sync">sync()</button>
      </div>
    </div>
    <div class="demo-state">
      <div><code>changed()</code> → <code>{{ changed.length ? changed : 'false' }}</code></div>
      <div><code>toJSON()</code> → <code>{{ user.toJSON() }}</code></div>
      <div><code>saved('name')</code> → <code>{{ user.saved('name') }}</code></div>
      <div class="demo-log">
        <div v-for="(line, i) in log" :key="i">{{ line }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.demo {
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr 1fr;
  padding: 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  margin: 16px 0;
}
@media (max-width: 720px) {
  .demo { grid-template-columns: 1fr; }
}
.demo-form { display: flex; flex-direction: column; gap: 10px; }
label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
label span { color: var(--vp-c-text-2); }
input {
  padding: 6px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}
small { color: var(--vp-c-danger-1); }
.demo-actions { display: flex; gap: 8px; margin-top: 4px; }
button {
  padding: 6px 12px;
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 6px;
  color: var(--vp-c-brand-1);
  font-size: 13px;
}
button:hover { background: var(--vp-c-brand-soft); }
.demo-state { display: flex; flex-direction: column; gap: 8px; font-size: 13px; }
.demo-log {
  margin-top: 8px;
  padding: 8px;
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  min-height: 60px;
  color: var(--vp-c-text-2);
}
</style>
