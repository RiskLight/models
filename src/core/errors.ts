// @risklight/models — Error classes
// TDD: implement to pass test/core/Request.spec.ts

import { Response } from './Response.js'

export class RequestError extends Error {
  private error: any
  private response: Response

  constructor(message: string, error: any, response: Response) {
    super(message)
    this.error = error
    this.response = response
  }

  getError(): any {
    return this.error
  }

  getResponse(): Response {
    return this.response
  }
}

export class ResponseError extends Error {
  private response?: Response

  constructor(message: string, response?: Response) {
    super(message)
    this.response = response
  }

  getResponse(): Response | undefined {
    return this.response
  }
}

export class ValidationError extends Error {
  private errors: any

  constructor(errors: any, message: string = 'Validation failed') {
    super(message)
    this.errors = errors
  }

  getValidationErrors(): any {
    return this.errors
  }
}
