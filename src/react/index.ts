// @risklight/models/react — React adapter
// Provides useModelState hook for React components.

import { useSyncExternalStore } from 'react'
import { Model } from '../core/Model.js'

/**
 * React hook — subscribes to model changes and returns reactive attributes.
 *
 * Usage:
 *   const user = useMemo(() => new User({ id: 1 }), [])
 *   const state = useModelState(user)
 *   return <div>{state.name}</div>
 */
export function useModelState<A extends Record<string, any> = Record<string, any>>(model: Model<A>): A & Record<string, any> {
  const subscribe = (callback: () => void) => {
    const handler = () => callback()
    const events = ['change', 'sync', 'reset', 'fetch', 'save.success', 'delete']
    const cleanups: (() => void)[] = []

    // Subscribe to parent model events
    for (const event of events) {
      model.on(event, handler)
      cleanups.push(() => model.off(event, handler))
    }

    // Subscribe to nested model events (e.g. address.change triggers parent re-render)
    for (const value of Object.values(model._attributes)) {
      if (value && typeof value === 'object' && typeof value.on === 'function') {
        value.on('change', handler)
        cleanups.push(() => value.off('change', handler))
      }
    }

    return () => cleanups.forEach(fn => fn())
  }

  // Deep serialize for snapshot comparison — catches nested object mutations
  let lastJson = ''
  let snapshot: A & Record<string, any> = {} as A & Record<string, any>

  const getSnapshot = () => {
    const json = JSON.stringify(model._attributes, (_key, value) => {
      // Serialize nested models via toJSON
      if (value && typeof value === 'object' && typeof value.toJSON === 'function' && value !== model) {
        return value.toJSON()
      }
      return value
    })

    if (json !== lastJson) {
      lastJson = json
      snapshot = JSON.parse(json)
    }
    return snapshot
  }

  return useSyncExternalStore(subscribe, getSnapshot)
}

/**
 * useModel — wraps a Model class with subscribe/getSnapshot for manual usage.
 * Kept for backward compat.
 */
export function useModel<T extends typeof Model>(ModelClass: T): T {
  return class extends (ModelClass as any) {
    _subscribers: Set<() => void> = new Set()
    _snapshot: Record<string, any> | null = null

    constructor(...args: any[]) {
      super(...args)
      this.on('*', () => {
        this._snapshot = null
        this._subscribers.forEach((fn: () => void) => fn())
      })
    }

    subscribe(callback: () => void): () => void {
      this._subscribers.add(callback)
      return () => this._subscribers.delete(callback)
    }

    getSnapshot(): Record<string, any> {
      if (!this._snapshot) {
        this._snapshot = { ...this._attributes }
      }
      return this._snapshot!
    }
  } as any
}
