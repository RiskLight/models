import { ModelBase } from './Model.js'
import { Collection } from './Collection.js'
import { TransportRequest, transport, hasTransport, transportIdentifier } from './transport.js'
import type { Identified, Attributes } from './types.js'

export class ResourceModelBase<A extends Record<string, any> = Identified> extends ModelBase<A> {
  static route = ''

  static async fetchAll<T>(this: { route: string }): Promise<{ data: T[] }> {
    const { fetcher, unwrap } = transport()
    const raw = await fetcher({ url: this.route, method: 'GET' })
    return { data: unwrap(raw.data) as T[] }
  }

  static async fetchById<T>(this: { route: string }, id: string): Promise<{ data: T }> {
    const { fetcher, unwrap } = transport()
    const raw = await fetcher({ url: `${this.route}/${id}`, method: 'GET' })
    return { data: unwrap(raw.data) as T }
  }

  protected get modelRoute(): string {
    return (this.constructor as typeof ResourceModelBase).route
  }

  protected get identifierKey(): string {
    return transportIdentifier()
  }

  routes() {
    return {
      fetch: `${this.modelRoute}/{${this.identifierKey}}`,
      save: this.modelRoute,
      update: `${this.modelRoute}/{${this.identifierKey}}`,
      delete: `${this.modelRoute}/{${this.identifierKey}}`,
    }
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
    return hasTransport() ? new TransportRequest(config) : super.createRequest(config)
  }

  async fetchOne(id: string): Promise<void> {
    this.set(this.identifierKey, id)
    await this.fetch()
  }
}

export class ResourceCollection<M extends ResourceModelBase<any>> extends Collection<M> {
  routes() {
    return { fetch: (this.model() as unknown as { route: string }).route }
  }

  createRequest(config: any): any {
    return hasTransport() ? new TransportRequest(config) : super.createRequest(config)
  }

  get items(): Attributes<M>[] {
    return this.models.map((model) => model.toJSON() as Attributes<M>)
  }

  async fetchAll(): Promise<Attributes<M>[]> {
    await this.fetch()
    return this.items
  }
}

type ResourceModelStatics = { [K in keyof typeof ResourceModelBase]: (typeof ResourceModelBase)[K] }

export interface ResourceModelConstructor extends ResourceModelStatics {
  new <A extends Record<string, any> = Identified>(
    attributes?: Partial<A> & Record<string, any>,
    collection?: any,
    options?: Record<string, any>,
  ): ResourceModelBase<A> & A
}

export const ResourceModel: ResourceModelConstructor = ResourceModelBase as unknown as ResourceModelConstructor

export type ResourceModel<A extends Record<string, any> = Identified> = ResourceModelBase<A> & A
