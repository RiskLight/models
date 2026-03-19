// @risklight/models/react — React adapter
// Exposes subscribe/getSnapshot for useSyncExternalStore compatibility.

import { Model } from '../core/Model'

export function useModel<T extends typeof Model>(ModelClass: T): T {
  return class extends (ModelClass as any) {
    _subscribers: Set<() => void> = new Set()
    _snapshot: Record<string, any> | null = null

    constructor(...args: any[]) {
      super(...args)

      // Invalidate snapshot on any attribute change
      this.on('*', () => {
        this._snapshot = null
        this._subscribers.forEach(fn => fn())
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
