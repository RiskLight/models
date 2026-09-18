import '../vue/index.js'
import { ModelBase } from '../core/Model.js'
import { Collection } from '../core/Collection.js'
import { Response } from '../core/Response.js'
import { RequestError } from '../core/errors.js'
import type { Identified, Attributes } from '../core/types.js'

export type { Identified, Attributes }

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
  fetcher: NuxtFetcher
  unwrap?: (payload: unknown) => unknown
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

export class NuxtModelBase<A extends Record<string, any> = Identified> extends ModelBase<A> {
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
    return (this.constructor as typeof NuxtModelBase).route
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

export class NuxtCollection<M extends NuxtModelBase<any>> extends Collection<M> {
  routes() {
    return { fetch: (this.model() as unknown as { route: string }).route }
  }

  createRequest(config: any): any {
    return new NuxtRequest(config)
  }

  get items(): Attributes<M>[] {
    return this.models.map((model) => model.toJSON() as Attributes<M>)
  }

  async fetchAll(): Promise<Attributes<M>[]> {
    await this.fetch()
    return this.items
  }
}

type NuxtModelStatics = { [K in keyof typeof NuxtModelBase]: (typeof NuxtModelBase)[K] }

export interface NuxtModelConstructor extends NuxtModelStatics {
  new <A extends Record<string, any> = Identified>(
    attributes?: Partial<A> & Record<string, any>,
    collection?: any,
    options?: Record<string, any>,
  ): NuxtModelBase<A> & A
}

export const NuxtModel: NuxtModelConstructor = NuxtModelBase as unknown as NuxtModelConstructor

export type NuxtModel<A extends Record<string, any> = Identified> = NuxtModelBase<A> & A
