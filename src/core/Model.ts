// @risklight/models — Model
// TDD: implement to pass test/core/Model.spec.ts

export class Model {
  [key: string]: any

  constructor(_attributes?: Record<string, any>, _collection?: any, _options?: Record<string, any>) {
    throw new Error('Not implemented')
  }

  defaults(): Record<string, any> {
    return {}
  }

  schema(): any {
    return null
  }

  validation(): Record<string, any> {
    return {}
  }

  mutations(): Record<string, any> {
    return {}
  }

  routes(): Record<string, string> {
    return {}
  }

  options(): Record<string, any> {
    return {}
  }

  // --- Attribute access ---
  get(_key: string, _fallback?: any): any { throw new Error('Not implemented') }
  set(_key: string | Record<string, any>, _value?: any): any { throw new Error('Not implemented') }
  has(_attribute: string): boolean { throw new Error('Not implemented') }

  // --- Saved state ---
  saved(_key: string, _fallback?: any): any { throw new Error('Not implemented') }
  get $(): Record<string, any> { throw new Error('Not implemented') }

  // --- Sync / Reset / Changed ---
  sync(_attribute?: string | string[]): void { throw new Error('Not implemented') }
  reset(_attribute?: string | string[]): void { throw new Error('Not implemented') }
  changed(): string[] | false { throw new Error('Not implemented') }
  unset(_attribute?: string | string[]): void { throw new Error('Not implemented') }
  clearAttributes(): void { throw new Error('Not implemented') }
  clear(): void { throw new Error('Not implemented') }
  assign(_attributes: Record<string, any>): void { throw new Error('Not implemented') }

  // --- Identity ---
  identifier(): any { throw new Error('Not implemented') }
  isNew(): boolean { throw new Error('Not implemented') }
  isExisting(): boolean { throw new Error('Not implemented') }

  // --- Signals (per-property change tracking) ---
  on(_event: string, _callback: Function): void { throw new Error('Not implemented') }
  off(_event: string, _callback: Function): void { throw new Error('Not implemented') }
  emit(_event: string, _context?: Record<string, any>): void { throw new Error('Not implemented') }

  // --- Validation ---
  validate(_attributes?: string | string[]): Promise<boolean> { throw new Error('Not implemented') }
  get errors(): Record<string, any> { throw new Error('Not implemented') }
  setErrors(_errors: Record<string, any>): void { throw new Error('Not implemented') }
  clearErrors(): void { throw new Error('Not implemented') }

  // --- Options ---
  getOption(_path: string, _fallback?: any): any { throw new Error('Not implemented') }
  setOption(_path: string, _value: any): void { throw new Error('Not implemented') }
  getOptions(): Record<string, any> { throw new Error('Not implemented') }

  // --- Clone / Serialization ---
  clone(): this { throw new Error('Not implemented') }
  toJSON(): Record<string, any> { throw new Error('Not implemented') }

  // --- HTTP: state flags ---
  loading: boolean = false
  saving: boolean = false
  deleting: boolean = false
  fatal: boolean = false

  // --- HTTP: RequestOperation constants ---
  static REQUEST_CONTINUE = 0
  static REQUEST_SKIP = 1
  static REQUEST_REDUNDANT = 2

  // --- HTTP: route resolution ---
  getRoute(_key: string, _fallback?: string): string { throw new Error('Not implemented') }
  getURL(_route: string, _parameters?: Record<string, any>): string { throw new Error('Not implemented') }
  getFetchURL(): string { throw new Error('Not implemented') }
  getSaveURL(): string { throw new Error('Not implemented') }
  getDeleteURL(): string { throw new Error('Not implemented') }
  getRouteParameters(): Record<string, any> { throw new Error('Not implemented') }
  getRouteParameterPattern(): RegExp | string { throw new Error('Not implemented') }

  // --- HTTP: methods ---
  getFetchMethod(): string { throw new Error('Not implemented') }
  getSaveMethod(): string { throw new Error('Not implemented') }
  getCreateMethod(): string { throw new Error('Not implemented') }
  getUpdateMethod(): string { throw new Error('Not implemented') }
  getPatchMethod(): string { throw new Error('Not implemented') }
  getDeleteMethod(): string { throw new Error('Not implemented') }

  // --- HTTP: headers / query ---
  getDefaultHeaders(): Record<string, any> { throw new Error('Not implemented') }
  getFetchHeaders(): Record<string, any> { throw new Error('Not implemented') }
  getSaveHeaders(): Record<string, any> { throw new Error('Not implemented') }
  getDeleteHeaders(): Record<string, any> { throw new Error('Not implemented') }
  getFetchQuery(): Record<string, any> { throw new Error('Not implemented') }
  getSaveQuery(): Record<string, any> { throw new Error('Not implemented') }
  getDeleteQuery(): Record<string, any> { throw new Error('Not implemented') }
  getDeleteBody(): any { throw new Error('Not implemented') }

  // --- HTTP: save data ---
  getSaveData(): Record<string, any> { throw new Error('Not implemented') }
  shouldPatch(): boolean { throw new Error('Not implemented') }

  // --- HTTP: lifecycle hooks ---
  onFetch(): Promise<number> { throw new Error('Not implemented') }
  onFetchSuccess(_response: any): void { throw new Error('Not implemented') }
  onFetchFailure(_error: any, _response?: any): void { throw new Error('Not implemented') }
  onSave(): Promise<number> { throw new Error('Not implemented') }
  onSaveSuccess(_response: any): void { throw new Error('Not implemented') }
  onSaveFailure(_error: any, _response?: any): void { throw new Error('Not implemented') }
  onDelete(): Promise<number> { throw new Error('Not implemented') }
  onDeleteSuccess(_response: any): void { throw new Error('Not implemented') }
  onDeleteFailure(_error: any, _response?: any): void { throw new Error('Not implemented') }

  // --- HTTP: request ---
  fetch(_options?: any): Promise<any> { throw new Error('Not implemented') }
  save(_options?: any): Promise<any> { throw new Error('Not implemented') }
  delete(_options?: any): Promise<any> { throw new Error('Not implemented') }
  upload(_options?: any): Promise<any> { throw new Error('Not implemented') }
  request(_config: any, _onRequest: any, _onSuccess: any, _onFailure: any): Promise<any> { throw new Error('Not implemented') }
  createRequest(_config: any): any { throw new Error('Not implemented') }

  // --- HTTP: validation errors ---
  isBackendValidationError(_error: any): boolean { throw new Error('Not implemented') }
  getValidationErrorStatus(): number { throw new Error('Not implemented') }

  // --- HTTP: FormData ---
  convertObjectToFormData(_data: Record<string, any>): FormData { throw new Error('Not implemented') }

  // --- Mutations ---
  mutated(_attribute: string, _value: any): any { throw new Error('Not implemented') }
  mutate(_attribute?: string | string[]): void { throw new Error('Not implemented') }
  compileMutators(): void { throw new Error('Not implemented') }
}
