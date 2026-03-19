// @risklight/models/vue — Vue 3 adapter
// Creates shallowRef per attribute, subscribes to model signals.

import { shallowRef } from 'vue'
import { Model } from '../core/Model'

export function useModel<T extends typeof Model>(ModelClass: T): T {
  return class extends (ModelClass as any) {
    _refs: Record<string, any> = {}

    constructor(...args: any[]) {
      super(...args)

      // Create a shallowRef per known attribute
      for (const key of Object.keys(this._attributes)) {
        this._refs[key] = shallowRef(this._attributes[key])
      }

      // Subscribe to all changes via wildcard signal
      this.on('*', (key: string, value: any) => {
        if (this._refs[key]) {
          this._refs[key].value = value
        } else {
          // Undeclared attribute — create ref on the fly
          this._refs[key] = shallowRef(value)
        }
      })
    }
  } as any
}
