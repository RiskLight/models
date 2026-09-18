// @risklight/models — Model

import { get, set as _set, defaults as _defaults, pick, flow, castArray, isFunction, isPlainObject, isEmpty, isUndefined, isEqual } from 'lodash-es'
import { Request } from './Request.js'
import { Response } from './Response.js'
import { RequestError, ResponseError, ValidationError } from './errors.js'


type Listener = (context: Record<string, any>) => void
type Mutation = (value: any) => any

let _uidCounter = 0



export class Model<A extends Record<string, any> = Record<string, any>> {
  [key: string]: any

  // --- Internal state ---
  _attributes: Record<string, any> = {}
  _reference: Record<string, any> = {}
  _listeners: Record<string, Set<Listener>> = {}
  _signals: Record<string, Set<Function>> = {}
  _mutations: Record<string, Mutation> = {}
  _options: Record<string, any> = {}
  _errors: Record<string, any> = {}
  _collections: any[] = []
  _cache: Record<string, any> = {}
  _uid: string
  _wasNew: boolean = false
  _booted: boolean = false

  // --- HTTP: state flags ---
  loading: boolean = false
  saving: boolean = false
  deleting: boolean = false
  fatal: boolean = false

  // --- HTTP: RequestOperation constants ---
  static REQUEST_CONTINUE = 0
  static REQUEST_SKIP = 1
  static REQUEST_REDUNDANT = 2

  constructor(attributes?: Partial<A> & Record<string, any>, collection?: any, options?: Record<string, any>) {
    this._uid = `m${++_uidCounter}`

    // Merge options: class defaults < getDefaultOptions < options() < constructor options
    this._options = _defaults({}, options, this.options(), this.getDefaultOptions())

    // Register collection
    if (collection) {
      this.registerCollection(collection)
    }

    // Memoize expensive methods
    this.memoize()

    // Compile mutations
    this.compileMutators()

    // Set default attributes
    const defs = this.defaults()
    for (const [key, val] of Object.entries(defs)) {
      this._attributes[key] = val
    }

    // Apply initial attributes over defaults
    if (attributes) {
      for (const [key, val] of Object.entries(attributes)) {
        this._attributes[key] = val
      }
    }

    // Apply mutations to initial attributes
    this.mutate()

    // Sync initial state
    this._reference = JSON.parse(JSON.stringify(this._attributes))

    // Boot hook
    this.boot()
    // Delay _booted so subclass field initializers (protected backendBaseURL = ...)
    // run before we start warning about undeclared attributes
    queueMicrotask(() => { this._booted = true })

    // Return Proxy that intercepts ALL property access
    const STATE_PROPS = ['loading', 'saving', 'deleting', 'fatal']
    // An "_"-prefixed key is an attribute only when the model declares it in defaults()
    // and it does not collide with an internal field (e.g. Mongo's _id).
    const isDeclaredUnderscoreAttribute = (target: any, key: string) =>
      key.startsWith('_') &&
      !(key in target) &&
      target._cache?.defaults != null &&
      Object.prototype.hasOwnProperty.call(target._cache.defaults, key)

    return new Proxy(this, {
      set(target, key: string | symbol, value) {
        if (typeof key !== 'string') {
          (target as any)[key] = value
          return true
        }

        if (isDeclaredUnderscoreAttribute(target, key)) {
          target._setAttribute(key, value)
          return true
        }

        // Internal/private properties, prototype methods, state flags
        if (key.startsWith('_') || key in target.constructor.prototype || STATE_PROPS.includes(key)) {
          (target as any)[key] = value
          return true
        }

        // If key is a known attribute (from defaults), go through setAttribute
        if (key in target._attributes) {
          target._setAttribute(key, value)
          return true
        }

        // Before boot completes: class field initialization — put on target silently
        if (!target._booted) {
          (target as any)[key] = value
          return true
        }

        // After boot: undeclared attribute via dot notation — warn and put in _attributes
        target._setAttribute(key, value)
        return true
      },

      get(target, key: string | symbol) {
        if (typeof key !== 'string') {
          return (target as any)[key]
        }

        if (isDeclaredUnderscoreAttribute(target, key)) {
          target._trackSignal(key)
          return target._attributes[key]
        }

        // Internal/private, methods, known non-attribute properties
        if (key.startsWith('_') || key in target.constructor.prototype || STATE_PROPS.includes(key)) {
          return (target as any)[key]
        }

        // If it's a known attribute, return from _attributes
        if (key in target._attributes) {
          target._trackSignal(key)
          return target._attributes[key]
        }

        // Own instance property (class fields like backendBaseURL)
        if (Object.prototype.hasOwnProperty.call(target, key)) {
          return (target as any)[key]
        }

        return undefined
      },
    })
  }

  // --- Overridable configuration ---

  defaults(): Partial<A> { return {} }
  schema(): any { return null }
  validation(): Record<string, any> { return {} }
  mutations(): Record<string, any> { return {} }
  routes(): Record<string, string> { return {} }
  options(): Record<string, any> { return {} }
  boot(): void {}

  memoize(): void {
    this._cache.defaults = this.defaults()
    this._cache.validation = this.validation()
    this._cache.routes = this.routes()
  }

  getDefaultOptions(): Record<string, any> {
    return {
      identifier: 'id',
      overwriteIdentifier: false,
      patch: false,
      saveUnchanged: true,
      useFirstErrorOnly: false,
      validateOnChange: false,
      validateRecursively: true,
      mutateOnChange: false,
      mutateBeforeSync: true,
      mutateBeforeSave: true,
      debug: true,
      routeParameterPattern: this.getDefaultRouteParameterPattern(),
      validationErrorStatus: 422,
      methods: this.getDefaultMethods(),
      paramsSerializer: null, // function(params) => string, e.g. qs.stringify
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

  getParamsSerializer(): ((params: Record<string, any>) => string) | null {
    return this.getOption('paramsSerializer') || null
  }

  // --- Internal: attribute management ---

  _setAttribute(key: string, value: any): void {
    const debug = this.getOption('debug')

    // Warn on undeclared attributes
    if (debug && !(key in (this._cache.defaults || this.defaults()))) {
      const msg = `[models] Undeclared "${key}" on ${this.constructor.name}`
      if (debug === 'strict') {
        throw new Error(msg)
      }
      console.warn(msg)
    }

    // Apply mutation on change if enabled
    if (this.getOption('mutateOnChange')) {
      value = this.mutated(key, value)
    }

    const previous = this._attributes[key]
    this._attributes[key] = value

    if (!isEqual(previous, value)) {
      // Auto-validate on change if enabled
      if (this.getOption('validateOnChange')) {
        this.validate(key)
      }

      this._notifySignal(key, value, previous)
      this.emit('change', { attribute: key, value, previous })
      this.emit(`change:${key}`, { value, previous })
    }
  }

  _trackSignal(_key: string): void {
    // Hook point for framework adapters
  }

  _notifySignal(key: string, value: any, previous: any): void {
    // Per-property subscribers
    this._signals[key]?.forEach(fn => fn(value, previous))
    // Wildcard subscribers
    this._signals['*']?.forEach(fn => fn(key, value, previous))
  }

  // --- Attribute access ---

  get<K extends keyof A>(key: K, fallback?: A[K]): A[K]
  get(key: string, fallback?: any): any
  get(key: string, fallback?: any): any {
    return key in this._attributes ? this._attributes[key] : fallback
  }

  set<K extends keyof A>(key: K, value: A[K]): A[K]
  set(key: string | Record<string, any>, value?: any): any
  set(key: string | Record<string, any>, value?: any): any {
    if (isPlainObject(key)) {
      for (const [k, v] of Object.entries(key as Record<string, any>)) {
        this._setAttribute(k, v)
      }
      return
    }
    this._setAttribute(key as string, value)
    return value
  }

  has(attribute: string): boolean {
    return attribute in this._attributes
  }

  // --- Saved state ---

  saved<K extends keyof A>(key: K, fallback?: A[K]): A[K] | undefined
  saved(key: string, fallback?: any): any
  saved(key: string, fallback?: any): any {
    return key in this._reference ? this._reference[key] : fallback
  }

  get $(): Partial<A> & Record<string, any> {
    return { ...this._reference } as Partial<A> & Record<string, any>
  }

  // --- Sync / Reset / Changed ---

  sync(attribute?: string | string[]): void {
    if (this.getOption('mutateBeforeSync')) {
      this.mutate(attribute)
    }

    if (isUndefined(attribute)) {
      this._reference = JSON.parse(JSON.stringify(this._attributes))
    } else {
      for (const key of castArray(attribute)) {
        this._reference[key] = this._attributes[key]
      }
    }

    this.emit('sync', {})
  }

  reset(attribute?: string | string[]): void {
    const ref = JSON.parse(JSON.stringify(this._reference))
    if (isUndefined(attribute)) {
      // Mutate in place to preserve Vue reactivity
      for (const key of Object.keys(this._attributes)) {
        this._attributes[key] = ref[key]
      }
    } else {
      for (const key of castArray(attribute)) {
        this._attributes[key] = ref[key]
      }
    }

    this.clearErrors()
    this.emit('reset', {})
  }

  changed(): string[] | false {
    const changed: string[] = []
    for (const key of Object.keys(this._attributes)) {
      if (!isEqual(this._attributes[key], this._reference[key])) {
        changed.push(key)
      }
    }
    return changed.length > 0 ? changed : false
  }

  unset(attribute?: string | string[]): void {
    const defs = this._cache.defaults || this.defaults()
    if (isUndefined(attribute)) {
      for (const key of Object.keys(this._attributes)) {
        this._attributes[key] = defs[key]
      }
    } else {
      for (const key of castArray(attribute)) {
        this._attributes[key] = defs[key]
      }
    }
  }

  clearAttributes(): void {
    this.unset()
  }

  clear(): void {
    this.clearAttributes()
    this.clearErrors()
    this.loading = false
    this.saving = false
    this.deleting = false
    this.fatal = false
  }

  assign(attributes: Partial<A> & Record<string, any>): void {
    const defs = this._cache.defaults || this.defaults()
    const merged = { ...defs, ...attributes }

    // Set each attribute through _setAttribute for signals/events
    for (const [key, value] of Object.entries(merged)) {
      const previous = this._attributes[key]
      this._attributes[key] = value
      if (!isEqual(previous, value)) {
        this._notifySignal(key, value, previous)
      }
    }

    // Sync reference state
    this._reference = JSON.parse(JSON.stringify(this._attributes))
  }

  // --- Identity ---

  identifier(): any {
    const key = this.getOption('identifier')
    return key in this._attributes ? this._attributes[key] : this._reference[key]
  }

  isNew(): boolean {
    const id = this.identifier()
    return id === null || id === undefined || id === '' || id === 0
  }

  isExisting(): boolean {
    return !this.isNew()
  }

  // --- Events / Signals ---

  on(event: string, callback: Function): void {
    // Check if this is a signal (per-property) or event
    // Comma-separated events
    const events = event.split(',').map(e => e.trim())
    for (const evt of events) {
      // Signals: property names + wildcard '*'
      if (evt === '*' || (evt in this._attributes)) {
        if (!this._signals[evt]) {
          this._signals[evt] = new Set()
        }
        this._signals[evt].add(callback)
      }
      // Events
      if (!this._listeners[evt]) {
        this._listeners[evt] = new Set()
      }
      this._listeners[evt].add(callback as Listener)
    }
  }

  off(event: string, callback: Function): void {
    const events = event.split(',').map(e => e.trim())
    for (const evt of events) {
      this._signals[evt]?.delete(callback)
      this._listeners[evt]?.delete(callback as Listener)
    }
  }

  emit(event: string, context: Record<string, any> = {}): void {
    this._listeners[event]?.forEach(fn => fn(context))
  }

  // --- Validation ---

  async validate(attributes?: string | string[]): Promise<Record<string, any>> {
    const schema = this.schema()
    const rules = this._cache.validation || this.validation()

    // schema() takes priority over validation()
    if (schema) {
      await this._validateWithZod(schema, attributes)
    } else if (!isEmpty(rules)) {
      await this._validateWithRules(rules, attributes)
    } else {
      this._errors = {}
    }

    // Recursively validate nested models/collections
    if (this.getOption('validateRecursively') && !attributes) {
      await this._validateNested()
    }

    return this._errors
  }

  private async _validateNested(): Promise<void> {
    for (const value of Object.values(this._attributes)) {
      if (value instanceof Model) {
        await value.validate()
      } else if (value && typeof value === 'object' && '_models' in value && Array.isArray(value._models)) {
        await value.validate()
      }
    }
  }

  private async _validateWithZod(schema: any, attributes?: string | string[]): Promise<void> {
    const data = attributes
      ? pick(this._attributes, castArray(attributes))
      : this._attributes

    const result = schema.safeParse(data)

    if (result.success) {
      this._errors = {}
      return
    }

    // Convert Zod errors to vue-mc format
    const errors: Record<string, string | string[]> = {}
    for (const issue of result.error.issues) {
      const key = issue.path[0] as string
      if (key) {
        if (this.getOption('useFirstErrorOnly')) {
          if (!errors[key]) errors[key] = issue.message
        } else {
          if (!errors[key]) errors[key] = []
          ;(errors[key] as string[]).push(issue.message)
        }
      }
    }

    this._errors = errors
  }

  private async _validateWithRules(rules: Record<string, any>, attributes?: string | string[]): Promise<void> {
    const keys = attributes ? castArray(attributes) : Object.keys(rules)
    const errors: Record<string, string | string[]> = {}

    for (const key of keys) {
      const rule = rules[key]
      if (!rule) continue

      const value = this._attributes[key]
      const result = rule.validate ? rule.validate(value, key, this) : true

      if (result !== true) {
        if (this.getOption('useFirstErrorOnly')) {
          errors[key] = result
        } else {
          errors[key] = [result]
        }
      }
    }

    this._errors = errors
  }

  get errors(): Record<string, any> {
    return this._errors
  }

  setErrors(errors: Record<string, any>): void {
    this._errors = errors
  }

  clearErrors(): void {
    this._errors = {}
    this.fatal = false
  }

  // --- Options ---

  getOption(path: string, fallback?: any): any {
    return get(this._options, path, fallback)
  }

  setOption(path: string, value: any): void {
    _set(this._options, path, value)
  }

  getOptions(): Record<string, any> {
    return this._options
  }

  setOptions(...options: Record<string, any>[]): void {
    this._options = _defaults(this._options, ...options)
  }

  // --- Clone / Serialization ---

  clone(): this {
    const Constructor = this.constructor as any
    return new Constructor({ ...this._attributes }, undefined, { ...this._options })
  }

  toJSON(): A & Record<string, any> {
    return { ...this._attributes } as A & Record<string, any>
  }

  // --- HTTP: route resolution ---

  getRoute(key: string, fallback?: string): string {
    return (this._cache.routes || this.routes())[key] || fallback || ''
  }

  getRouteParameters(): Record<string, any> {
    return { ...this._attributes }
  }

  getRouteParameterPattern(): RegExp | string {
    return this.getOption('routeParameterPattern')
  }

  getURL(route: string, parameters?: Record<string, any>): string {
    const resolver = this.getRouteResolver()
    return resolver(route, parameters || this.getRouteParameters())
  }

  getRouteResolver(): (route: string, parameters: Record<string, any>) => string {
    return this.getDefaultRouteResolver()
  }

  getDefaultRouteResolver(): (route: string, parameters: Record<string, any>) => string {
    return (route: string, params: Record<string, any>) => {
      const pattern = this.getRouteParameterPattern()
      const regex = new RegExp(pattern instanceof RegExp ? pattern.source : pattern, 'g')
      return route.replace(regex, (_match, key) => {
        const value = params[key]
        return value !== null && value !== undefined ? String(value) : ''
      })
    }
  }

  getFetchURL(): string { return this.getURL(this.getFetchRoute()) }
  getSaveURL(): string { return this.getURL(this.getSaveRoute()) }
  getDeleteURL(): string { return this.getURL(this.getDeleteRoute()) }

  getFetchRoute(): string { return this.getRoute('fetch') }
  getDeleteRoute(): string { return this.getRoute('delete') }

  getSaveRoute(): string {
    if (this.isNew()) return this.getCreateRoute()
    return this.getUpdateRoute()
  }

  getCreateRoute(): string { return this.getRoute('save') }
  getUpdateRoute(): string { return this.getRoute('save') }
  getPatchRoute(): string { return this.getRoute('save') }

  // --- HTTP: methods ---

  getFetchMethod(): string { return this.getOption('methods.fetch') }
  getCreateMethod(): string { return this.getOption('methods.create') }
  getDeleteMethod(): string { return this.getOption('methods.delete') }
  getPatchMethod(): string { return this.getOption('methods.patch') }

  getUpdateMethod(): string {
    if (this.shouldPatch()) return this.getPatchMethod()
    return this.getOption('methods.update')
  }

  getSaveMethod(): string {
    if (this.isNew()) return this.getCreateMethod()
    return this.getUpdateMethod()
  }

  shouldPatch(): boolean {
    return this.getOption('patch') === true
  }

  // --- HTTP: headers / query ---

  getDefaultHeaders(): Record<string, any> { return {} }
  getFetchHeaders(): Record<string, any> { return this.getDefaultHeaders() }
  getSaveHeaders(): Record<string, any> { return this.getDefaultHeaders() }
  getDeleteHeaders(): Record<string, any> { return this.getDefaultHeaders() }
  getFetchQuery(): Record<string, any> { return {} }
  getSaveQuery(): Record<string, any> { return {} }
  getDeleteQuery(): Record<string, any> { return {} }
  getDeleteBody(): any { return {} }

  // --- HTTP: save data ---

  getSaveData(): Record<string, any> {
    if (this.isExisting() && this.shouldPatch()) {
      const changed = this.changed()
      if (changed) {
        const idKey = this.getOption('identifier')
        return pick(this._attributes, [...changed, idKey])
      }
    }
    return { ...this._attributes }
  }

  // --- HTTP: lifecycle hooks ---

  onFetch(): Promise<number> {
    return new Promise((resolve) => {
      if (this.loading) return resolve(Model.REQUEST_SKIP)
      this.loading = true
      resolve(Model.REQUEST_CONTINUE)
    })
  }

  onFetchSuccess(response: any): void {
    const data = response?.getData?.()
    if (data && !isEmpty(data)) {
      this.assign(data)
    }
    this.fatal = false
    this.loading = false
    this.emit('fetch', { error: null })
  }

  onFetchFailure(error: any, _response?: any): void {
    this.fatal = true
    this.loading = false
    this.emit('fetch', { error })
  }

  onSave(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.emit('save', { error: null })

      if (this.saving) return resolve(Model.REQUEST_SKIP)

      if (!this.getOption('saveUnchanged') && !this.changed()) {
        return resolve(Model.REQUEST_REDUNDANT)
      }

      this.saving = true
      this._wasNew = this.isNew()

      if (this.getOption('mutateBeforeSave')) {
        this.mutate()
      }

      this.validate().then(() => {
        if (isEmpty(this._errors)) return resolve(Model.REQUEST_CONTINUE)
        this.saving = false
        reject(this.createValidationError(this._errors))
      })
    })
  }

  onSaveSuccess(response: any): void {
    this.clearErrors()
    if (response) {
      const data = response.getData?.()
      if (isPlainObject(data)) {
        const newId = this.parseIdentifier(data)
        const currentId = this.identifier()

        if (this.isValidIdentifier(newId)) {
          if (this.shouldAllowIdentifierOverwrite(currentId, newId)) {
            this.assign(data)
          } else {
            // Update all except identifier
            const idKey = this.getOption('identifier')
            const { [idKey]: _id, ...rest } = data
            for (const [k, v] of Object.entries(rest)) {
              this._attributes[k] = v
            }
          }
        } else {
          this.assign(data)
        }
      }
    }
    // Detect create vs update
    let action = this._wasNew ? 'create' : 'update'
    if (response) {
      const status = response.getStatus?.()
      if (status === 201) action = 'create'
    }

    this.saving = false
    this.fatal = false
    this.sync()
    this.addToAllCollections()
    this.emit('save.success', { error: null })
    this.emit(action, { error: null })
  }

  onSaveFailure(error: any, response?: any): void {
    if (this.isBackendValidationError(error)) {
      this.onSaveValidationFailure(error, response)
    } else {
      this.onFatalSaveFailure(error, response)
    }

    this.saving = false
    this.emit('save.failure', { error })
  }

  onSaveValidationFailure(error: any, response?: any): void {
    const validationErrors = response?.getValidationErrors?.() || error?.response?.getValidationErrors?.()
    if (validationErrors) {
      this.setErrors(validationErrors)
    }
  }

  onFatalSaveFailure(_error: any, _response?: any): void {
    this.fatal = true
  }

  onDelete(): Promise<number> {
    return new Promise((resolve) => {
      if (this.deleting) return resolve(Model.REQUEST_SKIP)
      this.deleting = true
      resolve(Model.REQUEST_CONTINUE)
    })
  }

  onDeleteSuccess(_response: any): void {
    this.clear()
    this.removeFromAllCollections()
    this.deleting = false
    this.fatal = false
    this.emit('delete', { error: null })
  }

  onDeleteFailure(error: any, _response?: any): void {
    this.fatal = true
    this.deleting = false
    this.emit('delete', { error })
  }

  // --- HTTP: request ---

  request(config: any, onRequest: () => Promise<number>, onSuccess: (r: any) => void, onFailure: (e: any, r?: any) => void): Promise<any> {
    return new Promise((resolve, reject) => {
      onRequest.call(this).then((status: number) => {
        switch (status) {
          case Model.REQUEST_SKIP:
            resolve(null)
            return
          case Model.REQUEST_REDUNDANT:
            onSuccess.call(this, null)
            resolve(null)
            return
        }

        const cfg = isFunction(config) ? config() : config

        if (this.getOption('debug') === 'verbose') {
          console.log(`[models] ${cfg.method} ${cfg.url}`, cfg.data || '')
        }

        this.createRequest(cfg)
          .send()
          .then((response: any) => {
            if (this.getOption('debug') === 'verbose') {
              console.log(`[models] ${cfg.method} ${cfg.url} →`, response?.getStatus?.(), response?.getData?.())
            }
            onSuccess.call(this, response)
            resolve(response)
          })
          .catch((error: any) => {
            if (this.getOption('debug') === 'verbose') {
              console.log(`[models] ${cfg.method} ${cfg.url} FAILED`, error?.message)
            }
            onFailure.call(this, error, error.response)
            reject(error)
          })
      }).catch(reject)
    })
  }

  fetch(options: Record<string, any> = {}): Promise<any> {
    const config = () => {
      const cfg: Record<string, any> = {
        url: options.url || this.getFetchURL(),
        method: options.method || this.getFetchMethod(),
        params: _defaults({}, options.params, this.getFetchQuery()),
        headers: _defaults({}, options.headers, this.getFetchHeaders()),
      }
      const serializer = this.getParamsSerializer()
      if (serializer) cfg.paramsSerializer = serializer
      return cfg
    }
    return this.request(config, this.onFetch, this.onFetchSuccess, this.onFetchFailure)
  }

  save(options: Record<string, any> = {}): Promise<any> {
    const config = () => {
      const cfg: Record<string, any> = {
        url: options.url || this.getSaveURL(),
        method: options.method || this.getSaveMethod(),
        data: options.data || this.getSaveData(),
        params: _defaults({}, options.params, this.getSaveQuery()),
        headers: _defaults({}, options.headers, this.getSaveHeaders()),
      }
      const serializer = this.getParamsSerializer()
      if (serializer) cfg.paramsSerializer = serializer
      return cfg
    }
    return this.request(config, this.onSave, this.onSaveSuccess, this.onSaveFailure)
  }

  delete(options: Record<string, any> = {}): Promise<any> {
    const config = () => {
      const cfg: Record<string, any> = {
        url: options.url || this.getDeleteURL(),
        method: options.method || this.getDeleteMethod(),
        data: options.data || this.getDeleteBody(),
        params: _defaults({}, options.params, this.getDeleteQuery()),
        headers: _defaults({}, options.headers, this.getDeleteHeaders()),
      }
      const serializer = this.getParamsSerializer()
      if (serializer) cfg.paramsSerializer = serializer
      return cfg
    }
    return this.request(config, this.onDelete, this.onDeleteSuccess, this.onDeleteFailure)
  }

  upload(options: Record<string, any> = {}): Promise<any> {
    const data = options.data || this.getSaveData()
    return this.save({ ...options, data: this.convertObjectToFormData(data) })
  }

  createRequest(config: any): Request {
    return new Request(config)
  }

  // --- HTTP: validation errors ---

  isBackendValidationError(error: any): boolean {
    return error?.response?.getStatus?.() === this.getValidationErrorStatus()
  }

  getValidationErrorStatus(): number {
    return this.getOption('validationErrorStatus')
  }

  // --- HTTP: FormData ---

  convertObjectToFormData(data: Record<string, any>, form?: FormData, prefix?: string): FormData {
    form = form || new FormData()

    for (const [key, value] of Object.entries(data)) {
      const formKey = prefix ? `${prefix}[${key}]` : key

      if (value === null || value === undefined) {
        form.append(formKey, '')
      } else if (value instanceof File || value instanceof Blob) {
        form.append(formKey, value)
      } else if (Array.isArray(value)) {
        value.forEach((item, i) => {
          if (typeof item === 'object' && item !== null) {
            this.convertObjectToFormData(item, form, `${formKey}[${i}]`)
          } else {
            form!.append(`${formKey}[${i}]`, String(item))
          }
        })
      } else if (typeof value === 'object') {
        this.convertObjectToFormData(value, form, formKey)
      } else {
        form.append(formKey, String(value))
      }
    }

    return form
  }

  // --- HTTP: response update ---

  update(data: any): void {
    if (isEmpty(data)) {
      // Empty response — just sync
      return
    }

    if (isPlainObject(data)) {
      this.assign(data)
      return
    }

    // If data is a scalar, treat as identifier
    if (this.isValidIdentifier(data)) {
      const idKey = this.getOption('identifier')
      this._attributes[idKey] = data
      this._reference[idKey] = data
    }
  }

  // --- Identifier logic ---

  parseIdentifier(data: Record<string, any>): any {
    return data[this.getOption('identifier')]
  }

  isValidIdentifier(id: any): boolean {
    return id !== null && id !== undefined && id !== '' && id !== 0
  }

  shouldAllowIdentifierOverwrite(currentId: any, _newId: any): boolean {
    if (this.getOption('overwriteIdentifier')) return true
    // Allow if current is "new" (no valid id)
    return !this.isValidIdentifier(currentId)
  }

  // --- Mutations ---

  compileMutators(): void {
    const mutations = this.mutations()
    const compiled: Record<string, Mutation> = {}
    for (const [key, m] of Object.entries(mutations)) {
      compiled[key] = Array.isArray(m) ? flow(m) : m
    }
    this._mutations = compiled
  }

  mutated(attribute: string, value: any): any {
    const mutator = this._mutations[attribute]
    return mutator ? mutator(value) : value
  }

  mutate(attribute?: string | string[]): void {
    if (isUndefined(attribute)) {
      for (const key of Object.keys(this._attributes)) {
        this._attributes[key] = this.mutated(key, this._attributes[key])
      }
    } else {
      for (const key of castArray(attribute)) {
        this._attributes[key] = this.mutated(key, this._attributes[key])
      }
    }
  }

  // --- Collections ---

  registerCollection(collection: any | any[]): void {
    for (const c of castArray(collection)) {
      if (!this._collections.includes(c)) {
        this._collections.push(c)
      }
    }
  }

  unregisterCollection(collection: any | any[]): void {
    for (const c of castArray(collection)) {
      const idx = this._collections.indexOf(c)
      if (idx !== -1) this._collections.splice(idx, 1)
    }
  }

  addToAllCollections(): void {
    for (const c of this._collections) {
      c.add?.(this)
    }
  }

  removeFromAllCollections(): void {
    for (const c of this._collections) {
      c.remove?.(this)
    }
  }

  get collections(): any[] {
    return this._collections
  }

  // --- Compat: vue-mc API ---

  get $class(): string {
    return this.constructor.name
  }

  get attributes(): Record<string, any> {
    return { ...this._attributes }
  }

  toString(): string {
    return `<${this.constructor.name} #${this._uid}>`
  }

  setAttributeErrors(attribute: string, errors: string | string[]): void {
    this._errors[attribute] = errors
  }

  getErrors(): Record<string, any> {
    return this._errors
  }

  getValidateRules(attribute: string): any[] {
    const rules = this._cache.validation || this.validation()
    const rule = rules[attribute]
    return rule ? [rule] : []
  }

  async validateAttribute(attribute: string): Promise<Record<string, any>> {
    return this.validate(attribute)
  }

  // --- Deep serialization ---

  toPlainObject(): Record<string, any> {
    const result: Record<string, any> = {}
    for (const [key, value] of Object.entries(this._attributes)) {
      if (value instanceof Model) {
        result[key] = value.toPlainObject()
      } else if (value && typeof value === 'object' && '_models' in value && Array.isArray(value._models)) {
        result[key] = value._models.map((m: Model) => m.toPlainObject())
      } else {
        result[key] = value
      }
    }
    return result
  }

  // --- Error factories (overridable) ---

  createValidationError(errors: any, message?: string): ValidationError {
    return new ValidationError(errors, message)
  }

  createRequestError(error: any, response: Response): RequestError {
    return new RequestError(error?.message || 'Request failed', error, response)
  }

  createResponseError(message: string, response?: Response): ResponseError {
    return new ResponseError(message, response)
  }
}
