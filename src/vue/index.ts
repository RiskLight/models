// @risklight/models/vue — Vue 3 adapter
// Import this module to enable Vue reactivity on all Model instances.
// Usage: import '@risklight/models/vue' (once in main.ts)

import { reactive } from 'vue'
import { Model } from '../core/Model.js'

// Patch _setAttribute to trigger Vue reactivity
const originalSetAttribute = Model.prototype._setAttribute

Model.prototype._setAttribute = function (key: string, value: any) {
  originalSetAttribute.call(this, key, value)

  // Trigger Vue reactivity if _vueState exists
  if (this._vueState) {
    this._vueState[key] = value
  }
}

// Patch assign to trigger Vue reactivity
const originalAssign = Model.prototype.assign

Model.prototype.assign = function (attributes: Record<string, any>) {
  originalAssign.call(this, attributes)

  if (this._vueState) {
    for (const [key, val] of Object.entries(this._attributes)) {
      this._vueState[key] = val
    }
  }
}

// Hook into boot() to setup Vue reactive state
const originalBoot = Model.prototype.boot

Model.prototype.boot = function () {
  // Create reactive mirror of attributes
  this._vueState = reactive({ ...this._attributes })

  originalBoot.call(this)
}

/**
 * useModel wraps a Model class for Vue reactivity.
 * Can still be used for explicit wrapping if preferred.
 */
export function useModel<T extends typeof Model>(ModelClass: T): T {
  return ModelClass // no-op now, reactivity is automatic via import
}

/**
 * useReactive returns a reactive reference to model attributes.
 * Use in setup(): const state = useReactive(model)
 * Then in template: {{ state.name }}
 */
export function useReactive(model: InstanceType<typeof Model>): Record<string, any> {
  if (!model._vueState) {
    model._vueState = reactive({ ...model._attributes })
    // Subscribe to future changes
    model.on('*', (key: string, value: any) => {
      model._vueState[key] = value
    })
  }
  return model._vueState
}
