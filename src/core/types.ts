import type { ModelBase } from './Model.js'

export type Routes = Record<string, string>

export type Options = Record<string, any>

export type RequestOptions = {
  url?: string
  method?: string
  data?: any
  params?: Record<string, any>
  headers?: Record<string, any>
  withCredentials?: boolean
  [key: string]: any
}

export type RequestSuccessCallback = (response: any) => void

export type RequestFailureCallback = (error: any, response?: any) => void

export type Listener = (context: Record<string, any>) => void

export type Mutation = (value: any) => any

export type RouteResolver = (route: string, parameters: Record<string, any>) => string

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface Identified {
  _id?: string
}

export type Attributes<M extends ModelBase<any>> = ReturnType<M['toJSON']>
