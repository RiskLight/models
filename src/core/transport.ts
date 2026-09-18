import { Response } from './Response.js'
import { RequestError } from './errors.js'

export interface RequestConfig {
  url: string
  method: string
  data?: unknown
  params?: Record<string, unknown>
  headers?: Record<string, string>
}

export interface RawResponse {
  data: unknown
  status: number
  headers?: Record<string, string>
}

export type Fetcher = (config: RequestConfig) => Promise<RawResponse>

export interface TransportOptions {
  fetcher: Fetcher
  unwrap?: (payload: unknown) => unknown
  identifier?: string
}

const unwrapEnvelope = (payload: unknown) => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: unknown }).data
  }
  return payload
}

let options: Required<TransportOptions> | null = null

export function configureTransport(config: TransportOptions): void {
  options = { unwrap: unwrapEnvelope, identifier: '_id', ...config } as Required<TransportOptions>
}

export function resetTransport(): void {
  options = null
}

export function hasTransport(): boolean {
  return options !== null
}

export function transportIdentifier(): string {
  return options?.identifier ?? '_id'
}

export function transport(): Required<TransportOptions> {
  if (!options) {
    throw new Error('[models] configureTransport() must be called before using ResourceModel/ResourceCollection')
  }
  return options
}

export class TransportRequest {
  constructor(private config: RequestConfig) {}

  async send(): Promise<Response> {
    const { fetcher, unwrap } = transport()
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
