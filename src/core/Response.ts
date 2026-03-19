// @risklight/models — Response
// TDD: implement to pass test/core/Request.spec.ts

export interface ResponseData {
  data: any
  status: number
  headers: Record<string, any>
}

export class Response {
  private response?: ResponseData

  constructor(response?: ResponseData) {
    this.response = response
  }

  getData(): any {
    return this.response?.data ?? null
  }

  getStatus(): number {
    return this.response?.status ?? 0
  }

  getHeaders(): Record<string, any> {
    return this.response?.headers ?? {}
  }

  getValidationErrors(): any {
    return this.response?.data ?? null
  }
}
