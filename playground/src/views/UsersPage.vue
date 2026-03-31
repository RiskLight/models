<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { isEmpty } from 'lodash-es'
import { Users } from '../mc/collections/Users'
import { Positions } from '../mc/collections/Positions'
import { User } from '../mc/models/User'
import { Position } from '../mc/models/Position'

// ============ COLLECTIONS ============

const users = new Users()
const positions = new Positions()
const loading = ref(true)
const log = ref<string[]>([])

const addLog = (msg: string) => {
  log.value.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`)
  if (log.value.length > 50) log.value.pop()
}

const fetchAll = async () => {
  loading.value = true
  try {
    await Promise.all([users.fetch(), positions.fetch()])
    addLog(`Fetched ${users.size()} users, ${positions.size()} positions`)
    console.log(users)
  } catch (e: any) {
    addLog(`Fetch error: ${e.message}`)
  }
  loading.value = false
}

onMounted(fetchAll)

// ============ POSITION HELPERS ============

const getPositionLabel = (pos: any) => {
  if (!pos) return '—'
  if (pos.title) return `${pos.title} (${pos.level})`
  return '—'
}

const setPosition = (posId: number | null) => {
  if (!editModel.value) return
  if (!posId) {
    editModel.value.set('position', null)
    return
  }
  const pos = positions.find((p: Position) => p.id === posId)
  if (pos) {
    editModel.value.set('position', pos.clone())
  }
}

// ============ FORM STATE ============

const editModel = ref<User | null>(null)
const formErrors = ref<Record<string, any>>({})
const saving = ref(false)

const openCreate = () => {
  editModel.value = new User()
  formErrors.value = {}
  addLog('Opened create form')
}

const openEdit = async (user: User) => {
  const model = new User({ id: user.id })
  try {
    await model.fetch()
    model.sync()

    // Test: undeclared field set during form load (not via button click)
    model.set('loadedFlag', true);
    model.runtimeNote = 'set via dot notation on load'

    editModel.value = model
    formErrors.value = {}
    addLog(`Opened edit for "${model.name}" (id: ${model.id})`)
  } catch (e: any) {
    addLog(`Fetch error: ${e.message}`)
  }
}

const closeForm = () => {
  editModel.value = null
  formErrors.value = {}
}

// ============ SAVE ============

const saveModel = async () => {
  if (!editModel.value) return
  saving.value = true
  formErrors.value = {}

  // Validate
  const errors = await editModel.value.validate()
  if (!isEmpty(errors)) {
    formErrors.value = errors
    saving.value = false
    addLog(`Validation failed: ${Object.keys(errors).join(', ')}`)
    return
  }

  try {
    await editModel.value.save()
    addLog(`Saved "${editModel.value.name}" (${editModel.value.isNew() ? 'created' : 'updated'})`)
    closeForm()
    await fetchAll()
  } catch (e: any) {
    addLog(`Save error: ${e.message}`)
    if (e.getValidationErrors) {
      formErrors.value = e.getValidationErrors()
    }
  }
  saving.value = false
}

// ============ DELETE ============

const deleteUser = async (user: User) => {
  if (!confirm(`Delete "${user.name}"?`)) return
  const model = new User({ id: user.id })
  try {
    await model.delete()
    addLog(`Deleted user id: ${user.id}`)
    await fetchAll()
  } catch (e: any) {
    addLog(`Delete error: ${e.message}`)
  }
}

// ============ CLONE TEST ============

const cloneAndEdit = (user: User) => {
  const cloned = user.clone()
  cloned.name = cloned.name + ' (clone)'
  cloned.set('id', null) // make it "new"
  editModel.value = cloned
  formErrors.value = {}
  addLog(`Cloned "${user.name}" → new user`)
}

// ============ TAGS MANAGEMENT ============

const newTag = ref('')
const addTag = () => {
  if (!editModel.value || !newTag.value.trim()) return
  const tags = [...(editModel.value.tags || []), newTag.value.trim()]
  editModel.value.set('tags', tags)
  addLog(`Added tag "${newTag.value.trim()}"`)
  newTag.value = ''
}
const removeTag = (idx: number) => {
  if (!editModel.value) return
  const tags = [...editModel.value.tags]
  tags.splice(idx, 1)
  editModel.value.set('tags', tags)
}

// ============ UNDECLARED ATTR TEST ============

const testUndeclaredSet = () => {
  if (!editModel.value) return
  editModel.value.set('discount', 99.9)
  addLog(`set('discount', 99.9) — check console for warning`)
}

const testUndeclaredDot = () => {
  if (!editModel.value) return
  ;(editModel.value as any).bonus = 50
  addLog(`model.bonus = 50 (dot notation) — check console for warning`)
}

// ============ DEBUG INFO ============

const debugInfo = computed(() => {
  if (!editModel.value) return null
  const m = editModel.value
  return {
    isNew: m.isNew(),
    identifier: m.identifier(),
    changed: m.changed() || [],
    errors: m.errors,
    attributes: m.toJSON(),
    saved: m.$,
  }
})
</script>

<template>
  <div style="max-width: 1200px; margin: 0 auto; padding: 20px; font-family: -apple-system, sans-serif;">
    <h1>@risklight/models — Playground</h1>
    <p style="color: #666;">Testing: CRUD, reactivity, validation, nested objects, arrays, clone</p>

    <!-- ============ TABLE ============ -->
    <div style="display: flex; gap: 10px; margin-bottom: 15px;">
      <button @click="openCreate" style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
        + New User
      </button>
      <button @click="fetchAll" style="padding: 8px 16px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">
        ↻ Refresh
      </button>
    </div>

    <div v-if="loading" style="padding: 40px; text-align: center; color: #999;">Loading...</div>

    <table v-else style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <thead>
        <tr style="background: #f5f5f5;">
          <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">ID</th>
          <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Name</th>
          <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Email</th>
          <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Age</th>
          <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Position</th>
          <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">City</th>
          <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Tags</th>
          <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Active</th>
          <th style="padding: 10px; border-bottom: 2px solid #ddd; width: 200px;">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users.models" :key="user.id" style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px;">{{ user.id }}</td>
          <td style="padding: 8px; font-weight: 500;">{{ user.name }}</td>
          <td style="padding: 8px;">{{ user.email }}</td>
          <td style="padding: 8px;">{{ user.age }}</td>
          <td style="padding: 8px;">{{ getPositionLabel(user.position) }}</td>
          <td style="padding: 8px;">{{ user.address?.city }}</td>
          <td style="padding: 8px;">
            <span v-for="tag in user.tags" :key="tag"
              style="display: inline-block; padding: 2px 8px; margin: 2px; background: #e3f2fd; border-radius: 12px; font-size: 12px;">
              {{ tag }}
            </span>
          </td>
          <td style="padding: 8px;">
            <span :style="{ color: user.active ? 'green' : 'red' }">{{ user.active ? '✓' : '✗' }}</span>
          </td>
          <td style="padding: 8px;">
            <button @click="openEdit(user)" style="margin-right: 4px; cursor: pointer;">Edit</button>
            <button @click="cloneAndEdit(user)" style="margin-right: 4px; cursor: pointer;">Clone</button>
            <button @click="deleteUser(user)" style="color: red; cursor: pointer;">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <p style="color: #666;">Collection: {{ users.size() }} users | {{ positions.size() }} positions</p>

    <!-- ============ FORM MODAL ============ -->
    <div v-if="editModel" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: flex-start; justify-content: center; padding-top: 40px; overflow-y: auto;">
      <div style="background: white; padding: 25px; border-radius: 8px; width: 600px; margin-bottom: 40px;">
        <h2 style="margin-top: 0;">{{ editModel.isNew() ? 'Create User' : `Edit User #${editModel.id}` }}</h2>

        <!-- Name -->
        <div style="margin-bottom: 12px;">
          <label style="display: block; margin-bottom: 4px; font-weight: 600;">Name *</label>
          <input v-model="editModel.name" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;" />
          <span v-if="formErrors.name" style="color: red; font-size: 12px;">{{ formErrors.name }}</span>
        </div>

        <!-- Email -->
        <div style="margin-bottom: 12px;">
          <label style="display: block; margin-bottom: 4px; font-weight: 600;">Email *</label>
          <input v-model="editModel.email" type="email" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;" />
          <span v-if="formErrors.email" style="color: red; font-size: 12px;">{{ formErrors.email }}</span>
        </div>

        <!-- Age -->
        <div style="margin-bottom: 12px;">
          <label style="display: block; margin-bottom: 4px; font-weight: 600;">Age *</label>
          <input v-model.number="editModel.age" type="number" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;" />
          <span v-if="formErrors.age" style="color: red; font-size: 12px;">{{ formErrors.age }}</span>
        </div>

        <!-- Active -->
        <div style="margin-bottom: 12px;">
          <label style="display: flex; align-items: center; gap: 8px;">
            <input v-model="editModel.active" type="checkbox" />
            <span style="font-weight: 600;">Active</span>
          </label>
        </div>

        <!-- Position (nested model) -->
        <div style="margin-bottom: 12px;">
          <label style="display: block; margin-bottom: 4px; font-weight: 600;">Position * (nested model)</label>
          <select :value="editModel.position?.id" @change="setPosition(Number(($event.target as HTMLSelectElement).value) || null)" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <option :value="null">— Select —</option>
            <option v-for="pos in positions.models" :key="pos.id" :value="pos.id">
              {{ pos.title }} ({{ pos.level }}) — {{ pos.department }}
            </option>
          </select>
          <div v-if="editModel.position" style="margin-top: 4px; padding: 6px 10px; background: #f0f7ff; border-radius: 4px; font-size: 12px;">
            Nested model: {{ editModel.position.title }} | level: {{ editModel.position.level }} | dept: {{ editModel.position.department }}
          </div>
          <span v-if="formErrors.position" style="color: red; font-size: 12px;">{{ formErrors.position }}</span>
        </div>

        <!-- Address (nested object) -->
        <fieldset style="margin-bottom: 12px; padding: 12px; border: 1px solid #ddd; border-radius: 4px;">
          <legend style="font-weight: 600;">Address (nested object)</legend>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div>
              <label style="font-size: 12px;">Street</label>
              <input v-model="editModel.address.street" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;" />
            </div>
            <div>
              <label style="font-size: 12px;">City</label>
              <input v-model="editModel.address.city" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;" />
            </div>
            <div>
              <label style="font-size: 12px;">ZIP</label>
              <input v-model="editModel.address.zip" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;" />
            </div>
            <div>
              <label style="font-size: 12px;">Country</label>
              <input v-model="editModel.address.country" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;" />
            </div>
          </div>
        </fieldset>

        <!-- Settings (nested object) -->
        <fieldset style="margin-bottom: 12px; padding: 12px; border: 1px solid #ddd; border-radius: 4px;">
          <legend style="font-weight: 600;">Settings (nested object)</legend>
          <div style="display: flex; gap: 12px; align-items: center;">
            <label>Theme:
              <select v-model="editModel.settings.theme" style="padding: 4px;">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
            <label>Lang:
              <select v-model="editModel.settings.language" style="padding: 4px;">
                <option value="en">EN</option>
                <option value="de">DE</option>
                <option value="uk">UK</option>
              </select>
            </label>
            <label>
              <input v-model="editModel.settings.notifications" type="checkbox" />
              Notifications
            </label>
          </div>
        </fieldset>

        <!-- Tags (array) -->
        <fieldset style="margin-bottom: 12px; padding: 12px; border: 1px solid #ddd; border-radius: 4px;">
          <legend style="font-weight: 600;">Tags (array)</legend>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px;">
            <span v-for="(tag, idx) in editModel.tags" :key="idx"
              style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: #e3f2fd; border-radius: 12px; font-size: 13px;">
              {{ tag }}
              <button @click="removeTag(idx)" style="border: none; background: none; cursor: pointer; color: red; font-size: 14px;">×</button>
            </span>
            <span v-if="!editModel.tags?.length" style="color: #999; font-size: 13px;">No tags</span>
          </div>
          <div style="display: flex; gap: 6px;">
            <input v-model="newTag" @keyup.enter="addTag" placeholder="Add tag..." style="flex: 1; padding: 6px; border: 1px solid #ddd; border-radius: 4px;" />
            <button @click="addTag" style="padding: 6px 12px; cursor: pointer;">Add</button>
          </div>
          <span v-if="formErrors.tags" style="color: red; font-size: 12px;">{{ formErrors.tags }}</span>
        </fieldset>

        <!-- Debug panel -->
        <details style="margin-bottom: 12px;">
          <summary style="cursor: pointer; font-weight: 600; color: #666;">Debug Info</summary>
          <div style="display: flex; gap: 8px; margin: 8px 0;">
            <button @click="testUndeclaredSet" style="padding: 6px 12px; background: #ff9800; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Test: set('discount', 99.9)
            </button>
            <button @click="testUndeclaredDot" style="padding: 6px 12px; background: #e91e63; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Test: model.bonus = 50 (dot)
            </button>
          </div>
          <pre v-if="debugInfo" style="background: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 11px; overflow-x: auto; max-height: 300px;">{{ JSON.stringify(debugInfo, null, 2) }}</pre>
        </details>

        <!-- Actions -->
        <div style="display: flex; gap: 10px; margin-top: 15px;">
          <button @click="saveModel" :disabled="saving"
            style="padding: 10px 24px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
            {{ saving ? 'Saving...' : (editModel.isNew() ? 'Create' : 'Save') }}
          </button>
          <button @click="closeForm"
            style="padding: 10px 24px; background: #eee; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- ============ LOG ============ -->
    <details open style="margin-top: 20px;">
      <summary style="cursor: pointer; font-weight: 600;">Activity Log</summary>
      <div style="background: #1e1e1e; color: #d4d4d4; padding: 12px; border-radius: 4px; max-height: 200px; overflow-y: auto; font-family: monospace; font-size: 12px; margin-top: 8px;">
        <div v-for="(entry, i) in log" :key="i">{{ entry }}</div>
        <div v-if="!log.length" style="color: #666;">No activity yet</div>
      </div>
    </details>
  </div>
</template>
