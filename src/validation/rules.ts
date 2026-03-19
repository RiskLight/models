// @risklight/models — Validation rules
// TDD: implement to pass test/validation/rules.spec.ts
//
// Architecture: each rule is a thin wrapper that uses Zod internally.
// Rules that Zod covers natively (email, url, uuid, ip) map directly.
// Rules without Zod analogue (creditcard, base64, alpha) use z.string().refine().
// Chaining (.and, .or, .format) wraps rules in composite patterns.

// --- Rule class with chaining support ---

export class Rule {
  private _test: (value: any) => boolean
  private _message: string

  constructor(test: (value: any) => boolean, message: string = 'Invalid value') {
    this._test = test
    this._message = message
  }

  test(value: any): boolean {
    return this._test(value)
  }

  validate(value: any): true | string {
    return this._test(value) ? true : this._message
  }

  and(other: Rule): Rule {
    return new Rule(
      (v) => this.test(v) && other.test(v),
      this._message,
    )
  }

  or(other: Rule): Rule {
    return new Rule(
      (v) => this.test(v) || other.test(v),
      this._message,
    )
  }

  format(message: string): Rule {
    return new Rule(this._test, message)
  }
}

// --- Presence rules ---
export const required = new Rule(() => { throw new Error('Not implemented') }, 'Value is required')
export const defined = new Rule(() => { throw new Error('Not implemented') }, 'Value must be defined')
export const empty = new Rule(() => { throw new Error('Not implemented') }, 'Value must be empty')

// --- Type rules ---
export const integer = new Rule(() => { throw new Error('Not implemented') }, 'Must be an integer')
export const numeric = new Rule(() => { throw new Error('Not implemented') }, 'Must be numeric')
export const boolean = new Rule(() => { throw new Error('Not implemented') }, 'Must be a boolean')
export const string = new Rule(() => { throw new Error('Not implemented') }, 'Must be a string')
export const array = new Rule(() => { throw new Error('Not implemented') }, 'Must be an array')
export const object = new Rule(() => { throw new Error('Not implemented') }, 'Must be an object')

// --- Format rules (Zod-backed) ---
export const email = new Rule(() => { throw new Error('Not implemented') }, 'Must be a valid email')
export const url = new Rule(() => { throw new Error('Not implemented') }, 'Must be a valid URL')
export const uuid = new Rule(() => { throw new Error('Not implemented') }, 'Must be a valid UUID')
export const ip = new Rule(() => { throw new Error('Not implemented') }, 'Must be a valid IP')
export const iso8601 = new Rule(() => { throw new Error('Not implemented') }, 'Must be a valid ISO 8601 date')
export const alpha = new Rule(() => { throw new Error('Not implemented') }, 'Must contain only letters')
export const alphanumeric = new Rule(() => { throw new Error('Not implemented') }, 'Must contain only letters and numbers')
export const base64 = new Rule(() => { throw new Error('Not implemented') }, 'Must be valid base64')
export const creditcard = new Rule(() => { throw new Error('Not implemented') }, 'Must be a valid credit card number')
export const json = new Rule(() => { throw new Error('Not implemented') }, 'Must be valid JSON')

// --- Comparison rules (factory functions) ---
export function between(_min: number, _max: number, _inclusive?: boolean): Rule {
  throw new Error('Not implemented')
}
export function min(_n: number): Rule { throw new Error('Not implemented') }
export function max(_n: number): Rule { throw new Error('Not implemented') }
export function gt(_n: number): Rule { throw new Error('Not implemented') }
export function gte(_n: number): Rule { throw new Error('Not implemented') }
export function lt(_n: number): Rule { throw new Error('Not implemented') }
export function lte(_n: number): Rule { throw new Error('Not implemented') }
export function length(_min: number, _max?: number): Rule { throw new Error('Not implemented') }
export function equals(_value: any): Rule { throw new Error('Not implemented') }
