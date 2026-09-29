import { reactive } from 'vue'
import { Model } from '../core/Model.js'

const REACTIVE_STATE = ['_errors', 'loading', 'saving', 'deleting', 'fatal'] as const

const originalBoot = Model.prototype.boot

Model.prototype.boot = function () {
  this._attributes = reactive(this._attributes)
  this._reference = { ...this._attributes }

  const self = this as any
  const state = reactive(Object.fromEntries(REACTIVE_STATE.map(key => [key, self[key]])))
  for (const key of REACTIVE_STATE) {
    Object.defineProperty(self, key, {
      configurable: true,
      enumerable: true,
      get: () => state[key],
      set: (value) => { state[key] = value },
    })
  }

  originalBoot.call(this)
}

export function useModel<T extends typeof Model>(ModelClass: T): T {
  return ModelClass
}
