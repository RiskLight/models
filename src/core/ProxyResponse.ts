// @risklight/models — ProxyResponse
// TDD: implement to pass test/core/Request.spec.ts

export class ProxyResponse {
  private data: Record<string, any>
  private headers: Record<string, any>
  private status: number

  constructor(status: number, data: Record<string, any> = {}, headers: Record<string, any> = {}) {
    this.data = data ?? {}
    this.headers = headers ?? {}
    this.status = status
  }

  getData(): Record<string, any> {
    return this.data
  }

  getStatus(): number {
    return this.status
  }

  getHeaders(): Record<string, any> {
    return this.headers
  }

  getValidationErrors(): Record<string, any> {
    return this.data
  }
}
