// @risklight/models/nuxt — Nuxt 3/4 adapter
// Framework-agnostic on purpose: nothing from `nuxt/app` is imported here.
// The app wires its fetcher once (usually in a Nuxt plugin), then extends NuxtModel / NuxtCollection.

import '../vue/index.js'
import { Model } from '../core/Model.js'
import { Collection } from '../core/Collection.js'
import { Response } from '../core/Response.js'
import { RequestError } from '../core/errors.js'

export interface NuxtRequestConfig {
  url: string
  method: string
  data?: unknown
  params?: Record<string, unknown>
  headers?: Record<string, string>
}

export interface NuxtRawResponse {
  data: unknown
  status: number
  headers?: Record<string, string>
}

export type NuxtFetcher = (config: NuxtRequestConfig) => Promise<NuxtRawResponse>

export interface NuxtModelsOptions {
  /** Performs the HTTP call. Typically wraps `$fetch.raw` on the server and `$csrfFetch.raw` on the client. */
  fetcher: NuxtFetcher
  /** Extracts the payload the models should consume. Default unwraps `{ data }` envelopes. */
  unwrap?: (payload: unknown) => unknown
  /** Primary key attribute. Default `_id` (Mongo). */
  identifier?: string
}

const defaultUnwrap = (payload: unknown) => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: unknown }).data
  }
  return payload
}

let options: NuxtModelsOptions | null = null

export function configureNuxtModels(config: NuxtModelsOptions): void {
  options = { unwrap: defaultUnwrap, identifier: '_id', ...config }
}

export function resetNuxtModels(): void {
  options = null
}

function settings(): Required<NuxtModelsOptions> {
  if (!options) {
    throw new Error('[models/nuxt] configureNuxtModels() must be called before using NuxtModel/NuxtCollection')
  }
  return options as Required<NuxtModelsOptions>
}

export class NuxtRequest {
  constructor(private config: NuxtRequestConfig) {}

  async send(): Promise<Response> {
    const { fetcher, unwrap } = settings()
    try {
      const raw = await fetcher(this.config)
      return new Response({ data: unwrap(raw.data), status: raw.status, headers: raw.headers ?? {} })
    } catch (error: any) {
      const response = new Response({
        data: error?.data ?? null,
        status: error?.status ?? error?.statusCode ?? 0,
        headers: {},
      })
      throw new RequestError(error?.message || 'Request failed', error, response)
    }
  }
}

export interface Identified {
  _id?: string
}

/**
 * Model bound to a REST resource by a static `route`:
 *   fetch  GET    {route}/{_id}
 *   create POST   {route}
 *   update PUT    {route}/{_id}
 *   delete DELETE {route}/{_id}
 */
export class NuxtModel<A extends Identified = Identified> extends Model<A> {
  static route = ''

  static async fetchAll<T>(this: { route: string }): Promise<{ data: T[] }> {
    const { fetcher, unwrap } = settings()
    const raw = await fetcher({ url: this.route, method: 'GET' })
    return { data: unwrap(raw.data) as T[] }
  }

  static async fetchById<T>(this: { route: string }, id: string): Promise<{ data: T }> {
    const { fetcher, unwrap } = settings()
    const raw = await fetcher({ url: `${this.route}/${id}`, method: 'GET' })
    return { data: unwrap(raw.data) as T }
  }

  protected get modelRoute(): string {
    return (this.constructor as typeof NuxtModel).route
  }

  /**
   * The core Proxy treats every "_"-prefixed key as a private field, so `model._id`
   * would bypass the attribute store. Expose the identifier as a real accessor instead.
   */
  get _id(): string | undefined {
    return this.get(this.identifierKey)
  }

  set _id(value: string | undefined) {
    if (!this._booted) return
    this.set(this.identifierKey, value)
  }

  routes() {
    return {
      fetch: `${this.modelRoute}/{${this.identifierKey}}`,
      save: this.modelRoute,
      update: `${this.modelRoute}/{${this.identifierKey}}`,
      delete: `${this.modelRoute}/{${this.identifierKey}}`,
    }
  }

  protected get identifierKey(): string {
    return options?.identifier ?? '_id'
  }

  options() {
    return {
      identifier: this.identifierKey,
      debug: false,
    }
  }

  getUpdateRoute(): string {
    return this.getRoute('update')
  }

  getSaveData(): Record<string, any> {
    const data = super.getSaveData()
    if (!this.isNew()) return data
    const { [this.identifierKey]: _id, ...rest } = data
    return rest
  }

  createRequest(config: any): any {
    return new NuxtRequest(config)
  }

  async fetchOne(id: string): Promise<void> {
    this.set(this.identifierKey, id)
    await this.fetch()
  }
}

export class NuxtCollection<M extends NuxtModel<any>> extends Collection<M> {
  routes() {
    return { fetch: (this.model() as unknown as { route: string }).route }
  }

  createRequest(config: any): any {
    return new NuxtRequest(config)
  }

  get items(): ReturnType<M['toJSON']>[] {
    return this.models.map((model) => model.toJSON() as ReturnType<M['toJSON']>)
  }

  async fetchAll(): Promise<ReturnType<M['toJSON']>[]> {
    await this.fetch()
    return this.items
  }
}
