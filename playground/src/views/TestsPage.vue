<script setup lang="ts">
import { ref } from 'vue'
import { isEmpty } from 'lodash-es'
import { Model, Collection } from '@risklight/models'
import { required, string, email as emailRule } from '@risklight/models/validation'
import { User } from '../mc/models/User'
import { Users } from '../mc/collections/Users'

const API = 'http://localhost:3001'
const log = ref<string[]>([])

const addLog = (msg: string) => {
  log.value.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`)
  if (log.value.length > 100) log.value.pop()
}

// ============================================
// TEST 1: UPLOAD (FormData)
// ============================================

class UploadModel extends Model {
  defaults() {
    return { id: null, filename: '', path: '' }
  }
  routes() {
    return { save: `${API}/upload` }
  }
  options() {
    return { identifier: 'id' }
  }
}

const selectedFile = ref<File | null>(null)
const uploadResult = ref<any>(null)
const uploading = ref(false)

const onFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement
  selectedFile.value = input.files?.[0] || null
}

const testUpload = async () => {
  if (!selectedFile.value) {
    addLog('No file selected')
    return
  }
  uploading.value = true

  const model = new UploadModel()
  try {
    await model.upload({ data: { file: selectedFile.value, field: 'avatar' } })
    uploadResult.value = model.toJSON()
    addLog(`Upload OK: ${JSON.stringify(uploadResult.value)}`)
  } catch (e: any) {
    addLog(`Upload FAIL: ${e.message}`)
  }
  uploading.value = false
}

// ============================================
// TEST 2: BACKEND VALIDATION (422)
// ============================================

class ValidatedModel extends Model {
  defaults() {
    return { id: null, name: '', email: '', age: 0 }
  }
  routes() {
    return { save: `${API}/test-validation` }
  }
  options() {
    return { identifier: 'id', saveUnchanged: true }
  }
  getSaveMethod() { return 'POST' }
  getSaveURL() { return `${API}/test-validation` }
}

const backendModel = ref(new ValidatedModel())
const backendErrors = ref<Record<string, any>>({})
const backendSaving = ref(false)

const testBackendValidation = async () => {
  backendSaving.value = true
  backendErrors.value = {}

  try {
    await backendModel.value.save()
    addLog('Backend validation: OK (no errors)')
    backendErrors.value = {}
  } catch (e: any) {
    addLog(`Backend validation: 422 errors received`)
    // Check if model.errors got populated from onSaveFailure
    if (!isEmpty(backendModel.value.errors)) {
      backendErrors.value = backendModel.value.errors
      addLog(`Errors: ${JSON.stringify(backendModel.value.errors)}`)
    } else {
      addLog(`Error object: ${JSON.stringify(e)}`)
    }
  }
  backendSaving.value = false
}

const resetBackendModel = () => {
  backendModel.value = new ValidatedModel()
  backendErrors.value = {}
}

// ============================================
// TEST 3: BULK OPERATIONS
// ============================================

const bulkCollection = new Users()
const bulkLoading = ref(false)

const fetchBulk = async () => {
  bulkLoading.value = true
  try {
    await bulkCollection.fetch()
    addLog(`Bulk: fetched ${bulkCollection.size()} users`)
  } catch (e: any) {
    addLog(`Bulk fetch error: ${e.message}`)
  }
  bulkLoading.value = false
}

const bulkDeleteSelected = ref<number[]>([])

const toggleBulkSelect = (id: number) => {
  const idx = bulkDeleteSelected.value.indexOf(id)
  if (idx === -1) {
    bulkDeleteSelected.value.push(id)
  } else {
    bulkDeleteSelected.value.splice(idx, 1)
  }
}

const testBulkDelete = async () => {
  if (bulkDeleteSelected.value.length === 0) {
    addLog('Bulk delete: no items selected')
    return
  }

  // Mark models for deletion
  for (const model of bulkCollection.models) {
    if (bulkDeleteSelected.value.includes(model.id as number)) {
      model.deleting = true
    }
  }

  try {
    await bulkCollection.delete()
    addLog(`Bulk delete: removed ${bulkDeleteSelected.value.length} items`)
    bulkDeleteSelected.value = []
    await fetchBulk()
  } catch (e: any) {
    addLog(`Bulk delete error: ${e.message}`)
  }
}

// ============================================
// TEST 4: EVENTS
// ============================================

const eventLog = ref<string[]>([])

const testEvents = () => {
  eventLog.value = []

  const user = new User({ id: 1, name: 'John', email: 'john@test.com' })
  user.sync()

  // Subscribe to events
  user.on('change', (ctx: any) => {
    eventLog.value.push(`change: ${ctx.attribute} = "${ctx.value}" (was "${ctx.previous}")`)
  })

  user.on('change:name', (ctx: any) => {
    eventLog.value.push(`change:name: "${ctx.value}"`)
  })

  user.on('sync', () => {
    eventLog.value.push('sync')
  })

  user.on('reset', () => {
    eventLog.value.push('reset')
  })

  // Trigger events
  user.name = 'Jane'        // → change, change:name
  user.email = 'jane@t.com' // → change
  user.sync()               // → sync
  user.name = 'Bob'         // → change, change:name
  user.reset()              // → reset

  addLog(`Events test: ${eventLog.value.length} events fired`)
}

const testSaveEvents = async () => {
  eventLog.value = []

  const user = new User({ name: 'Test', email: 'test@test.com', age: 25, tags: ['test'] })

  user.on('save', () => eventLog.value.push('save'))
  user.on('save.success', () => eventLog.value.push('save.success'))
  user.on('save.failure', () => eventLog.value.push('save.failure'))
  user.on('create', () => eventLog.value.push('create (new model)'))
  user.on('update', () => eventLog.value.push('update (existing model)'))

  try {
    await user.save()
    addLog(`Save events: ${eventLog.value.join(' → ')}`)
  } catch (e: any) {
    addLog(`Save events (with error): ${eventLog.value.join(' → ')}`)
  }
}

const formatError = (err: any): string => {
  if (!err) return ''
  if (Array.isArray(err)) return err.join(', ')
  return String(err)
}
</script>

<template>
  <div style="max-width: 1200px; margin: 0 auto; padding: 20px; font-family: -apple-system, sans-serif;">
    <h1>@risklight/models — Advanced Tests</h1>
    <p style="color: #666;">Upload, Backend Validation (422), Bulk Operations, Events</p>

    <!-- ============================================ -->
    <!-- TEST 1: UPLOAD -->
    <!-- ============================================ -->
    <fieldset style="margin-bottom: 20px; padding: 15px; border: 2px solid #2196F3; border-radius: 8px;">
      <legend style="font-weight: 700; color: #2196F3; font-size: 16px;">1. File Upload (FormData)</legend>

      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
        <input type="file" @change="onFileSelect" />
        <button @click="testUpload" :disabled="!selectedFile || uploading"
          style="padding: 8px 16px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">
          {{ uploading ? 'Uploading...' : 'Upload' }}
        </button>
      </div>

      <div v-if="uploadResult" style="padding: 10px; background: #e8f5e9; border-radius: 4px; font-size: 13px;">
        Result: {{ JSON.stringify(uploadResult) }}
      </div>
    </fieldset>

    <!-- ============================================ -->
    <!-- TEST 2: BACKEND VALIDATION (422) -->
    <!-- ============================================ -->
    <fieldset style="margin-bottom: 20px; padding: 15px; border: 2px solid #f44336; border-radius: 8px;">
      <legend style="font-weight: 700; color: #f44336; font-size: 16px;">2. Backend Validation (422 errors)</legend>
      <p style="margin: 0 0 10px; font-size: 13px; color: #666;">
        Send empty/invalid data to /test-validation → server returns 422 → model.errors populated
      </p>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 10px;">
        <div>
          <label style="font-size: 12px;">Name</label>
          <input v-model="backendModel.name" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;" />
          <span v-if="backendErrors.name" style="color: red; font-size: 11px;">{{ formatError(backendErrors.name) }}</span>
        </div>
        <div>
          <label style="font-size: 12px;">Email</label>
          <input v-model="backendModel.email" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;" />
          <span v-if="backendErrors.email" style="color: red; font-size: 11px;">{{ formatError(backendErrors.email) }}</span>
        </div>
        <div>
          <label style="font-size: 12px;">Age</label>
          <input v-model.number="backendModel.age" type="number" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;" />
          <span v-if="backendErrors.age" style="color: red; font-size: 11px;">{{ formatError(backendErrors.age) }}</span>
        </div>
      </div>

      <div style="display: flex; gap: 8px;">
        <button @click="testBackendValidation" :disabled="backendSaving"
          style="padding: 8px 16px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">
          {{ backendSaving ? 'Saving...' : 'Send (trigger 422)' }}
        </button>
        <button @click="resetBackendModel"
          style="padding: 8px 16px; background: #eee; border: none; border-radius: 4px; cursor: pointer;">
          Reset
        </button>
      </div>

      <div v-if="!isEmpty(backendModel.errors)" style="margin-top: 10px; padding: 10px; background: #ffebee; border-radius: 4px; font-size: 12px;">
        model.errors: {{ JSON.stringify(backendModel.errors) }}
      </div>
    </fieldset>

    <!-- ============================================ -->
    <!-- TEST 3: BULK OPERATIONS -->
    <!-- ============================================ -->
    <fieldset style="margin-bottom: 20px; padding: 15px; border: 2px solid #ff9800; border-radius: 8px;">
      <legend style="font-weight: 700; color: #ff9800; font-size: 16px;">3. Bulk Operations</legend>

      <div style="display: flex; gap: 8px; margin-bottom: 10px;">
        <button @click="fetchBulk"
          style="padding: 8px 16px; background: #ff9800; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Fetch Users
        </button>
        <button @click="testBulkDelete" :disabled="bulkDeleteSelected.length === 0"
          style="padding: 8px 16px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Delete Selected ({{ bulkDeleteSelected.length }})
        </button>
      </div>

      <div v-if="bulkLoading" style="color: #999;">Loading...</div>
      <table v-else-if="bulkCollection.size() > 0" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #fff3e0;">
            <th style="padding: 6px; width: 30px;"></th>
            <th style="padding: 6px; text-align: left;">ID</th>
            <th style="padding: 6px; text-align: left;">Name</th>
            <th style="padding: 6px; text-align: left;">Email</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in bulkCollection.models" :key="user.id" style="border-bottom: 1px solid #eee;">
            <td style="padding: 6px;">
              <input type="checkbox" :checked="bulkDeleteSelected.includes(user.id as number)" @change="toggleBulkSelect(user.id as number)" />
            </td>
            <td style="padding: 6px;">{{ user.id }}</td>
            <td style="padding: 6px;">{{ user.name }}</td>
            <td style="padding: 6px;">{{ user.email }}</td>
          </tr>
        </tbody>
      </table>
    </fieldset>

    <!-- ============================================ -->
    <!-- TEST 4: EVENTS -->
    <!-- ============================================ -->
    <fieldset style="margin-bottom: 20px; padding: 15px; border: 2px solid #4CAF50; border-radius: 8px;">
      <legend style="font-weight: 700; color: #4CAF50; font-size: 16px;">4. Events (on/emit)</legend>

      <div style="display: flex; gap: 8px; margin-bottom: 10px;">
        <button @click="testEvents"
          style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Test: change / sync / reset
        </button>
        <button @click="testSaveEvents"
          style="padding: 8px 16px; background: #009688; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Test: save / create events
        </button>
      </div>

      <div v-if="eventLog.length > 0" style="background: #e8f5e9; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px;">
        <div v-for="(entry, i) in eventLog" :key="i">{{ i + 1 }}. {{ entry }}</div>
      </div>
    </fieldset>

    <!-- ============================================ -->
    <!-- LOG -->
    <!-- ============================================ -->
    <details open>
      <summary style="cursor: pointer; font-weight: 600;">Activity Log</summary>
      <div style="background: #1e1e1e; color: #d4d4d4; padding: 12px; border-radius: 4px; max-height: 200px; overflow-y: auto; font-family: monospace; font-size: 12px; margin-top: 8px;">
        <div v-for="(entry, i) in log" :key="i">{{ entry }}</div>
        <div v-if="!log.length" style="color: #666;">No activity yet</div>
      </div>
    </details>
  </div>
</template>
