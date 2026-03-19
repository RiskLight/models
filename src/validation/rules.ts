// @risklight/models — Validation rules
// Each rule backed by Zod or simple JS. Chaining via .and()/.or()/.format()

import { z } from 'zod'

// --- Rule class ---

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
    const test = this._test
    return new Rule(
      (v) => test(v) && other.test(v),
      this._message,
    )
  }

  or(other: Rule): Rule {
    const test = this._test
    return new Rule(
      (v) => test(v) || other.test(v),
      this._message,
    )
  }

  format(message: string): Rule {
    return new Rule(this._test, message)
  }
}

// --- Helpers ---

function zodTest(schema: z.ZodType): (value: any) => boolean {
  return (value) => schema.safeParse(value).success
}

function isString(v: any): v is string {
  return typeof v === 'string'
}

// --- Presence rules ---

export const required = new Rule(
  (v) => v !== null && v !== undefined && v !== '',
  'Value is required',
)

export const defined = new Rule(
  (v) => v !== undefined,
  'Value must be defined',
)

export const empty = new Rule(
  (v) => v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0),
  'Value must be empty',
)

// --- Type rules ---

export const integer = new Rule(
  (v) => typeof v === 'number' && Number.isInteger(v),
  'Must be an integer',
)

export const numeric = new Rule(
  (v) => typeof v === 'number' || (isString(v) && v !== '' && !isNaN(Number(v))),
  'Must be numeric',
)

const booleanRule = new Rule(
  (v) => typeof v === 'boolean',
  'Must be a boolean',
)
export { booleanRule as boolean }

const stringRule = new Rule(
  (v) => isString(v),
  'Must be a string',
)
export { stringRule as string }

export const array = new Rule(
  (v) => Array.isArray(v),
  'Must be an array',
)

export const object = new Rule(
  (v) => v !== null && typeof v === 'object' && !Array.isArray(v),
  'Must be an object',
)

// --- Format rules (Zod-backed where possible) ---

export const email = new Rule(
  zodTest(z.string().email()),
  'Must be a valid email',
)

export const url = new Rule(
  zodTest(z.string().url()),
  'Must be a valid URL',
)

export const uuid = new Rule(
  zodTest(z.string().uuid()),
  'Must be a valid UUID',
)

export const ip = new Rule(
  (v) => isString(v) && (z.string().ipv4().safeParse(v).success || z.string().ipv6().safeParse(v).success),
  'Must be a valid IP',
)

export const iso8601 = new Rule(
  zodTest(z.string().datetime()),
  'Must be a valid ISO 8601 date',
)

export const alpha = new Rule(
  (v) => isString(v) && /^[a-zA-Z]+$/.test(v),
  'Must contain only letters',
)

export const alphanumeric = new Rule(
  (v) => isString(v) && /^[a-zA-Z0-9]+$/.test(v),
  'Must contain only letters and numbers',
)

export const base64 = new Rule(
  (v) => isString(v) && /^[A-Za-z0-9+/]*={0,2}$/.test(v) && v.length % 4 === 0,
  'Must be valid base64',
)

export const creditcard = new Rule(
  (v) => {
    if (!isString(v) || !/^\d{13,19}$/.test(v)) return false
    // Luhn algorithm
    let sum = 0
    let alt = false
    for (let i = v.length - 1; i >= 0; i--) {
      let n = parseInt(v[i], 10)
      if (alt) {
        n *= 2
        if (n > 9) n -= 9
      }
      sum += n
      alt = !alt
    }
    return sum % 10 === 0
  },
  'Must be a valid credit card number',
)

export const json = new Rule(
  (v) => {
    if (!isString(v)) return false
    try { JSON.parse(v); return true } catch { return false }
  },
  'Must be valid JSON',
)

// --- Comparison rules ---

export function between(min: number, max: number, _inclusive?: boolean): Rule {
  return new Rule(
    (v) => typeof v === 'number' && v >= min && v <= max,
    `Must be between ${min} and ${max}`,
  )
}

export function min(n: number): Rule {
  return new Rule(
    (v) => typeof v === 'number' && v >= n,
    `Must be at least ${n}`,
  )
}

export function max(n: number): Rule {
  return new Rule(
    (v) => typeof v === 'number' && v <= n,
    `Must be at most ${n}`,
  )
}

export function gt(n: number): Rule {
  return new Rule(
    (v) => typeof v === 'number' && v > n,
    `Must be greater than ${n}`,
  )
}

export function gte(n: number): Rule {
  return new Rule(
    (v) => typeof v === 'number' && v >= n,
    `Must be greater than or equal to ${n}`,
  )
}

export function lt(n: number): Rule {
  return new Rule(
    (v) => typeof v === 'number' && v < n,
    `Must be less than ${n}`,
  )
}

export function lte(n: number): Rule {
  return new Rule(
    (v) => typeof v === 'number' && v <= n,
    `Must be less than or equal to ${n}`,
  )
}

export function length(minLen: number, maxLen?: number): Rule {
  return new Rule(
    (v) => {
      const len = isString(v) ? v.length : (Array.isArray(v) ? v.length : 0)
      if (maxLen !== undefined) return len >= minLen && len <= maxLen
      return len >= minLen
    },
    maxLen !== undefined ? `Length must be between ${minLen} and ${maxLen}` : `Length must be at least ${minLen}`,
  )
}

export function equals(value: any): Rule {
  return new Rule(
    (v) => v === value,
    `Must equal ${value}`,
  )
}
