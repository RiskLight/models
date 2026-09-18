import '../vue/index.js'

export {
  ResourceModel as NuxtModel,
  ResourceModelBase as NuxtModelBase,
  ResourceCollection as NuxtCollection,
} from '../core/Resource.js'
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
