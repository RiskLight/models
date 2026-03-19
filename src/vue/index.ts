// @risklight/models/vue — Vue 3 adapter
// Import this module to enable Vue reactivity on all Model instances.
// Usage: import '@risklight/models/vue' (once in main.ts)

import { reactive } from 'vue'
import { Model } from '../core/Model.js'

// Patch boot() to make _attributes reactive via Vue
const originalBoot = Model.prototype.boot

Model.prototype.boot = function () {
  // Replace _attributes with a Vue reactive proxy
  // This makes all reads in Vue templates trigger dependency tracking
  this._attributes = reactive(this._attributes)

  // Also sync _reference with current state
  this._reference = { ...this._attributes }

  originalBoot.call(this)
}

/**
 * useModel — no-op when adapter is imported via side-effect.
 * Kept for backward compat.
 */
export function useModel<T extends typeof Model>(ModelClass: T): T {
  return ModelClass
}
