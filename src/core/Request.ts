// @risklight/models — Request

import axios from 'axios'
import type { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { Response } from './Response.js'
import { RequestError } from './errors.js'

export class Request {
  config: AxiosRequestConfig

  constructor(config: AxiosRequestConfig) {
    this.config = config
  }

  createResponse(axiosResponse?: AxiosResponse): Response {
    return new Response(
      axiosResponse
        ? { data: axiosResponse.data, status: axiosResponse.status, headers: axiosResponse.headers as Record<string, any> }
        : undefined,
    )
  }

  createError(axiosError: AxiosError): RequestError {
    const response = this.createResponse(axiosError.response)
    return new RequestError(axiosError.message || 'Request failed', axiosError, response)
  }

  send(): Promise<Response> {
    return axios
      .request(this.config)
      .then((response) => this.createResponse(response))
      .catch((error: AxiosError) => {
        throw this.createError(error)
      })
  }
}
