// @risklight/models — Collection

import { get, set as _set, defaults as _defaults, isEmpty, isFunction } from 'lodash-es'
import { Model } from './Model.js'
import { Request } from './Request.js'
import { ProxyResponse } from './ProxyResponse.js'

type Listener = (context: Record<string, any>) => void

export class Collection<M extends Model = Model> {
  [key: string]: any

  _models: M[] = []
  _attributes: Record<string, any> = {}
  _listeners: Record<string, Set<Listener>> = {}
  _options: Record<string, any> = {}
  _page: number | null = null
  _lastPage: boolean = false
  _registry: Set<string> = new Set()

  // --- HTTP: state flags ---
  loading: boolean = false
  saving: boolean = false
  deleting: boolean = false
  fatal: boolean = false

  // --- RequestOperation constants ---
  static REQUEST_CONTINUE = 0
  static REQUEST_SKIP = 1
  static REQUEST_REDUNDANT = 2

  constructor(models?: (M | Record<string, any>)[], options?: Record<string, any>, attributes?: Record<string, any>) {
    this._options = _defaults({}, options, this.getDefaultOptions())
    this._attributes = { ...this.defaults(), ...attributes }

    if (models && models.length) {
      for (const m of models) {
        this._addModel(m, false)
      }
    }

    this.boot()
  }

  // --- Configuration ---
  model(): new (...args: any[]) => M { return Model as any }
  defaults(): Record<string, any> { return {} }
  routes(): Record<string, string> { return {} }
  options(): Record<string, any> { return {} }
  boot(): void {}
  onAdd(_model: M): void {}
  onRemove(_model: M): void {}

  getDefaultOptions(): Record<string, any> {
    return {
      useDeleteBody: true,
      routeParameterPattern: this.getDefaultRouteParameterPattern(),
      validationErrorStatus: 422,
      methods: this.getDefaultMethods(),
    }
  }

  getDefaultMethods(): Record<string, string> {
    return {
      fetch: 'GET',
      save: 'POST',
      update: 'PUT',
      create: 'POST',
      patch: 'PATCH',
      delete: 'DELETE',
    }
  }

  getDefaultRouteParameterPattern(): RegExp {
    return /\{([^}]+)}/
  }

  // --- Options ---

  getOption(path: string, fallback?: any): any {
    return get(this._options, path, fallback)
  }

  setOption(path: string, value: any): void {
    _set(this._options, path, value)
  }

  setOptions(...options: Record<string, any>[]): void {
    this._options = _defaults(this._options, ...options)
  }

  getOptions(): Record<string, any> {
    return this._options
  }

  // --- HTTP: methods ---

  getFetchMethod(): string { return this.getOption('methods.fetch') }
  getSaveMethod(): string { return this.getOption('methods.save') }
  getDeleteMethod(): string { return this.getOption('methods.delete') }

  // --- HTTP: headers ---

  getDefaultHeaders(): Record<string, any> { return {} }
  getFetchHeaders(): Record<string, any> { return this.getDefaultHeaders() }
  getSaveHeaders(): Record<string, any> { return this.getDefaultHeaders() }
  getDeleteHeaders(): Record<string, any> { return this.getDefaultHeaders() }

  // --- HTTP: query ---

  getFetchQuery(): Record<string, any> { return {} }
  getSaveQuery(): Record<string, any> { return {} }
  getDeleteBody(): any {
    if (this._options.useDeleteBody) {
      return this.getIdentifiers(this.getDeletingModels())
    }
    return {}
  }

  // --- HTTP: validation ---

  isBackendValidationError(error: any): boolean {
    return error?.response?.getStatus?.() === this.getOption('validationErrorStatus')
  }

  getValidationErrorStatus(): number {
    return this.getOption('validationErrorStatus')
  }

  createRequest(config: any): Request {
    return new Request(config)
  }

  // --- Models array ---
  get models(): M[] { return this._models }
  get length(): number { return this._models.length }

  [Symbol.iterator](): Iterator<M> {
    return this._models[Symbol.iterator]()
  }

  // --- Internal ---

  private _addModel(modelOrAttrs: M | Record<string, any>, emitEvent: boolean = true): M {
    let m: M
    if (modelOrAttrs instanceof Model) {
      m = modelOrAttrs as M
    } else {
      m = this.createModel(modelOrAttrs)
    }
    m.registerCollection(this)
    this._models.push(m)
    if (emitEvent) {
      this.onAdd(m)
      this.emit('add', { model: m })
    }
    return m
  }

  // --- Add / Remove ---

  add(model: M | M[] | Record<string, any> | Record<string, any>[]): any {
    if (Array.isArray(model)) {
      return model.map(m => this._addModel(m))
    }
    return this._addModel(model)
  }

  remove(model: M | M[] | ((model: M) => boolean)): any {
    if (isFunction(model)) {
      const predicate = model as (model: M) => boolean
      const toRemove = this._models.filter(predicate)
      for (const m of toRemove) {
        this._removeModel(m)
      }
      return toRemove
    }
    if (Array.isArray(model)) {
      return model.map(m => this._removeModel(m))
    }
    return this._removeModel(model as M)
  }

  private _removeModel(model: M): M {
    const idx = this._models.indexOf(model)
    if (idx !== -1) {
      this._models.splice(idx, 1)
      model.unregisterCollection(this)
      this.onRemove(model)
      this.emit('remove', { model })
    }
    return model
  }

  clear(): void {
    this.clearModels()
    this.clearState()
  }

  clearModels(): void {
    const models = this._models.slice()
    this._models = []
    for (const m of models) {
      this.onRemove(m)
      m.unregisterCollection(this)
    }
  }

  clearState(): void {
    this.loading = false
    this.saving = false
    this.deleting = false
    this.fatal = false
  }

  clearErrors(): void {
    for (const m of this._models) m.clearErrors()
  }

  setErrors(errors: any[] | Record<string, any>): void {
    if (Array.isArray(errors)) {
      // Array: errors[i] applies to models[i]
      errors.forEach((err, i) => {
        if (this._models[i]) this._models[i].setErrors(err || {})
      })
    } else {
      // Object: keyed by model identifier
      for (const m of this._models) {
        const id = m.identifier()
        if (id != null && errors[id]) {
          m.setErrors(errors[id])
        }
      }
    }
  }

  replace(models: M | M[]): void {
    this.clearModels()
    const arr = Array.isArray(models) ? models : [models]
    for (const m of arr) {
      this._addModel(m, false)
    }
  }

  createModel(attributes: Record<string, any>): M {
    const ModelClass = this.model()
    return new ModelClass(attributes, this)
  }

  // --- Querying ---

  size(): number { return this._models.length }
  isEmpty(): boolean { return this._models.length === 0 }

  find(predicate: (model: M) => boolean): M | undefined {
    return this._models.find(predicate)
  }

  where(predicate: (model: M) => boolean): M[] {
    return this._models.filter(predicate)
  }

  filter(predicate: (model: M) => boolean): Collection<M> {
    const Constructor = this.constructor as any
    const filtered = new Constructor()
    filtered._models = this._models.filter(predicate)
    return filtered
  }

  has(model: M): boolean {
    return this._models.includes(model)
  }

  indexOf(model: M): number {
    return this._models.indexOf(model)
  }

  first(): M | undefined { return this._models[0] }
  last(): M | undefined { return this._models[this._models.length - 1] }

  shift(): M | undefined {
    const m = this._models.shift()
    if (m) this.emit('remove', { model: m })
    return m
  }

  pop(): M | undefined {
    const m = this._models.pop()
    if (m) this.emit('remove', { model: m })
    return m
  }

  // --- Iteration ---

  each(callback: (model: M) => void): void {
    this._models.forEach(callback)
  }

  map<T>(callback: (model: M) => T): T[] {
    return this._models.map(callback)
  }

  reduce<U>(iteratee: (result: U, model: M, index: number) => U, initial?: U): U {
    return this._models.reduce(iteratee, initial as U)
  }

  sum(iteratee: (model: M) => number): number {
    return this._models.reduce((sum, m) => sum + iteratee(m), 0)
  }

  count(iteratee: (model: M) => any): Record<string, number> {
    const result: Record<string, number> = {}
    for (const m of this._models) {
      const key = String(iteratee(m))
      result[key] = (result[key] || 0) + 1
    }
    return result
  }

  sort(comparator: string | ((model: M) => any)): void {
    if (typeof comparator === 'string') {
      const key = comparator
      this._models.sort((a, b) => {
        const va = a.get(key)
        const vb = b.get(key)
        return va < vb ? -1 : va > vb ? 1 : 0
      })
    } else {
      this._models.sort((a, b) => {
        const va = comparator(a)
        const vb = comparator(b)
        return va < vb ? -1 : va > vb ? 1 : 0
      })
    }
  }

  // --- Events ---

  on(event: string, callback: Function): void {
    const events = event.split(',').map(e => e.trim())
    for (const evt of events) {
      if (!this._listeners[evt]) this._listeners[evt] = new Set()
      this._listeners[evt].add(callback as Listener)
    }
  }

  off(event: string, callback: Function): void {
    const events = event.split(',').map(e => e.trim())
    for (const evt of events) {
      this._listeners[evt]?.delete(callback as Listener)
    }
  }

  emit(event: string, context: Record<string, any> = {}): void {
    this._listeners[event]?.forEach(fn => fn(context))
  }

  // --- Pagination ---

  page(page: number | boolean | null): this {
    if (page === false || page === null) {
      this._page = null
    } else {
      this._page = Math.max(0, Math.trunc(page as number))
    }
    return this
  }

  getPage(): number | null { return this._page }
  isPaginated(): boolean { return this._page !== null }
  isLastPage(): boolean { return this._lastPage }

  // --- Validation ---

  async validate(): Promise<any> {
    return Promise.all(this._models.map(m => m.validate()))
  }

  getErrors(): Record<string, any>[] {
    return this._models.map(m => m.errors)
  }

  // --- Sync ---

  sync(): void {
    this._models.forEach(m => m.sync())
  }

  reset(attribute?: string | string[]): void {
    this._models.forEach(m => m.reset(attribute))
  }

  // --- Attributes ---

  get(attribute: string, fallback?: any): any {
    return attribute in this._attributes ? this._attributes[attribute] : fallback
  }

  set(attribute: string | Record<string, any>, value?: any): void {
    if (typeof attribute === 'object') {
      Object.assign(this._attributes, attribute)
    } else {
      this._attributes[attribute] = value
    }
  }

  getAttributes(): Record<string, any> { return { ...this._attributes } }
  getModels(): M[] { return this._models }

  // --- Serialization ---

  toJSON(): any[] {
    return this._models.map(m => m.toJSON())
  }

  toArray(): Record<string, any>[] {
    return this._models.map(m => m.toJSON())
  }

  clone(): Collection<M> {
    const Constructor = this.constructor as any
    const clone = new Constructor([], { ...this._options }, { ...this._attributes })
    clone._models = this._models.slice()
    clone._page = this._page
    clone._lastPage = this._lastPage
    return clone
  }

  isModel(candidate: any): candidate is M {
    return candidate instanceof Model
  }

  hasModelInRegistry(model: M): boolean {
    return this._registry.has(model._uid)
  }

  addModelToRegistry(model: M): void {
    this._registry.add(model._uid)
  }

  removeModelFromRegistry(model: M): void {
    this._registry.delete(model._uid)
  }

  getIdentifiers(models?: M[]): any[] {
    return (models || this._models).map(m => m.identifier()).filter(id => id != null)
  }

  getRouteParameters(): Record<string, any> {
    return { ...this._attributes }
  }

  // --- HTTP: route resolution ---

  getRoute(key: string, fallback?: string): string {
    return this.routes()[key] || fallback || ''
  }

  getRouteParameterPattern(): RegExp | string {
    return this._options.routeParameterPattern || /\{([^}]+)}/
  }

  getURL(route: string, parameters?: Record<string, any>): string {
    const params = parameters || this.getRouteParameters()
    const pattern = this.getRouteParameterPattern()
    const regex = new RegExp(pattern instanceof RegExp ? pattern.source : pattern, 'g')
    return route.replace(regex, (_match, key) => {
      const value = params[key]
      return value !== null && value !== undefined ? String(value) : ''
    })
  }

  getFetchURL(): string { return this.getURL(this.getRoute('fetch')) }
  getSaveURL(): string { return this.getURL(this.getRoute('save')) }
  getDeleteURL(): string { return this.getURL(this.getRoute('delete')) }

  // --- HTTP: lifecycle ---

  onFetch(): Promise<number> {
    return new Promise((resolve) => {
      if (this.isPaginated() && this.isLastPage()) {
        return resolve(Collection.REQUEST_SKIP)
      }
      this.loading = true
      resolve(Collection.REQUEST_CONTINUE)
    })
  }

  onFetchSuccess(response: any): void {
    const data = response?.getData?.()
    const models = this.getModelsFromResponse(response)

    if (Array.isArray(models)) {
      this.replace(models.map((attrs: any) => this.createModel(attrs)))
    }

    // Apply pagination metadata if present
    if (this.isPaginated() && data && typeof data === 'object' && !Array.isArray(data)) {
      this.applyPagination(data)
    }

    this.loading = false
    this.fatal = false
    this.emit('fetch', { error: null })
  }

  applyPagination(data: Record<string, any>): void {
    const currentPage = data.current_page ?? this._page
    const lastPage = data.last_page ?? data.total_pages

    if (currentPage != null) {
      this._page = currentPage
    }
    if (lastPage != null) {
      this._lastPage = currentPage >= lastPage
    }
  }

  onFetchFailure(error: any, _response?: any): void {
    this.fatal = true
    this.loading = false
    this.emit('fetch', { error })
  }

  onSave(): Promise<number> {
    return new Promise((resolve, reject) => {
      if (this.saving) return resolve(Collection.REQUEST_SKIP)

      // Validate each model and call model.onSave() to set saving=true
      let valid = true
      const tasks = this._models.map(m =>
        m.onSave().catch((error: any) => {
          valid = false
          return error
        })
      )

      Promise.all(tasks).then(() => {
        if (!valid) {
          this.saving = false
          return reject(this.getErrors())
        }
        this.saving = true
        resolve(Collection.REQUEST_CONTINUE)
      })
    })
  }

  onSaveSuccess(response: any): void {
    const saved = response ? this.getModelsFromResponse(response) : null
    const saving = this.getSavingModels()

    if (!saved || isEmpty(saved)) {
      // Empty response — just sync all saving models
      saving.forEach(m => {
        m.saving = false
        m.sync()
      })
    } else if (Array.isArray(saved)) {
      // Pair response data with saving models (order matters)
      const headers = response?.getHeaders?.() || {}
      saved.forEach((data: any, index: number) => {
        if (saving[index]) {
          saving[index].onSaveSuccess(new ProxyResponse(200, data, headers))
        }
      })
    }

    this.saving = false
    this.fatal = false
    this.emit('save', { error: null })
  }

  onSaveFailure(error: any, response?: any): void {
    // Check if backend returned validation errors
    const status = response?.getStatus?.() || error?.response?.getStatus?.()
    if (status === 422) {
      this.onSaveValidationFailure(error, response)
    } else {
      this.onFatalSaveFailure(error, response)
    }

    this.saving = false
    this.emit('save', { error })
  }

  onSaveValidationFailure(error: any, response?: any): void {
    const errors = response?.getValidationErrors?.() || error?.response?.getValidationErrors?.()
    if (errors) {
      this.setErrors(errors)
    }
  }

  onFatalSaveFailure(_error: any, _response?: any): void {
    this.fatal = true
  }

  onDelete(): Promise<number> {
    return new Promise((resolve) => {
      if (this.deleting) return resolve(Collection.REQUEST_SKIP)
      this.deleting = true
      resolve(Collection.REQUEST_CONTINUE)
    })
  }

  onDeleteSuccess(_response: any): void {
    const deleting = this.getDeletingModels()
    for (const m of deleting) {
      m.onDeleteSuccess(_response)
    }
    this.deleting = false
    this.fatal = false
    this.emit('delete', { error: null })
  }

  onDeleteFailure(error: any, _response?: any): void {
    this.fatal = true
    this.deleting = false
    this.emit('delete', { error })
  }

  // --- HTTP: save/delete data ---

  getSaveData(): Record<string, any>[] {
    return this.getSavingModels().map(m => m.getSaveData())
  }

  getSavingModels(): M[] {
    return this._models.filter(m => m.saving)
  }

  getDeletingModels(): M[] {
    return this._models.filter(m => m.deleting)
  }

  getDeleteQuery(): Record<string, any> {
    if (!this._options.useDeleteBody) {
      const ids = this.getIdentifiers(this.getDeletingModels())
      return { [this.getDeleteQueryIdentifierKey()]: ids.join(',') }
    }
    return {}
  }

  getDeleteQueryIdentifierKey(): string { return 'id' }

  getPaginationQuery(): Record<string, any> {
    if (this.isPaginated()) return { page: this._page }
    return {}
  }

  getModelsFromResponse(response: any): any {
    const data = response?.getData?.()
    if (data?.data) return data.data // pagination wrapper
    return data
  }

  // --- HTTP: request ---

  request(config: any, onRequest: () => Promise<number>, onSuccess: (r: any) => void, onFailure: (e: any, r?: any) => void): Promise<any> {
    return new Promise((resolve, reject) => {
      onRequest.call(this).then((status: number) => {
        switch (status) {
          case Collection.REQUEST_SKIP:
            resolve(null)
            return
          case Collection.REQUEST_REDUNDANT:
            onSuccess.call(this, null)
            resolve(null)
            return
        }

        const cfg = isFunction(config) ? config() : config

        this.createRequest(cfg)
          .send()
          .then((response: any) => {
            onSuccess.call(this, response)
            resolve(response)
          })
          .catch((error: any) => {
            onFailure.call(this, error, error.response)
            reject(error)
          })
      }).catch(reject)
    })
  }

  fetch(options: Record<string, any> = {}): Promise<any> {
    const config = () => ({
      url: options.url || this.getFetchURL(),
      method: options.method || this._options.methods?.fetch || 'GET',
      params: _defaults({}, options.params, this.getPaginationQuery()),
      headers: options.headers || {},
    })
    return this.request(config, this.onFetch, this.onFetchSuccess, this.onFetchFailure)
  }

  save(options: Record<string, any> = {}): Promise<any> {
    const config = () => ({
      url: options.url || this.getSaveURL(),
      method: options.method || this._options.methods?.save || 'POST',
      data: options.data || this.getSaveData(),
      headers: options.headers || {},
    })
    return this.request(config, this.onSave, this.onSaveSuccess, this.onSaveFailure)
  }

  delete(options: Record<string, any> = {}): Promise<any> {
    const config = () => ({
      url: options.url || this.getDeleteURL(),
      method: options.method || this._options.methods?.delete || 'DELETE',
      data: options.data || this.getDeleteBody(),
      params: _defaults({}, options.params, this.getDeleteQuery()),
      headers: options.headers || {},
    })
    return this.request(config, this.onDelete, this.onDeleteSuccess, this.onDeleteFailure)
  }
}
