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
export function useModelState(model: InstanceType<typeof Model>): Record<string, any> {
  const subscribe = (callback: () => void) => {
    const handler = () => callback()
    model.on('change', handler)
    model.on('sync', handler)
    model.on('reset', handler)
    model.on('fetch', handler)
    model.on('save.success', handler)
    model.on('delete', handler)
    return () => {
      model.off('change', handler)
      model.off('sync', handler)
      model.off('reset', handler)
      model.off('fetch', handler)
      model.off('save.success', handler)
      model.off('delete', handler)
    }
  }

  let snapshot: Record<string, any> = { ...model._attributes }

  const getSnapshot = () => {
    const current = { ...model._attributes }
    // Return same reference if nothing changed (React optimization)
    if (JSON.stringify(current) !== JSON.stringify(snapshot)) {
      snapshot = current
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
