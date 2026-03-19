// @risklight/models — Request
// TDD: implement to pass test/core/Request.spec.ts

import type { AxiosRequestConfig } from 'axios'

export class Request {
  config: AxiosRequestConfig

  constructor(config: AxiosRequestConfig) {
    this.config = config
  }

  send(): Promise<any> {
    throw new Error('Not implemented')
  }

  createResponse(_axiosResponse?: any): any {
    throw new Error('Not implemented')
  }

  createError(_axiosError: any): any {
    throw new Error('Not implemented')
  }
}
