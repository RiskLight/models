import '../vue/index.js'
import { ResourceModel } from '../core/Resource.js'
import type { ResourceModelBase } from '../core/Resource.js'
import type { Identified } from '../core/types.js'

export { ResourceModelBase as NuxtModelBase, ResourceCollection as NuxtCollection } from '../core/Resource.js'
export type { ResourceModelConstructor as NuxtModelConstructor } from '../core/Resource.js'
export {
  configureTransport as configureNuxtModels,
  resetTransport as resetNuxtModels,
  TransportRequest as NuxtRequest,
} from '../core/transport.js'
export type {
  RequestConfig as NuxtRequestConfig,
  RawResponse as NuxtRawResponse,
  Fetcher as NuxtFetcher,
  TransportOptions as NuxtModelsOptions,
} from '../core/transport.js'

export const NuxtModel = ResourceModel

export type NuxtModel<A extends Record<string, any> = Identified> = ResourceModelBase<A> & A
