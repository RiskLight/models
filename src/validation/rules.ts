// @risklight/models — Validation rules
// Each rule backed by Zod or simple JS. Chaining via .and()/.or()/.format()

import { z } from 'zod'

// --- Rule class ---

export class Rule {
  _test: (value: any, attribute?: string, model?: any) => boolean
  private _message: string

  constructor(test: (value: any, attribute?: string, model?: any) => boolean, message: string = 'Invalid value') {
    this._test = test
    this._message = message
  }

  test(value: any, attribute?: string, model?: any): boolean {
    return this._test(value, attribute, model)
  }

  validate(value: any, attribute?: string, model?: any): true | string {
    return this._test(value, attribute, model) ? true : this._message
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

  copy(): Rule {
    return new Rule(this._test, this._message)
  }

  get message(): string {
    return this._message
  }
}

// --- Helpers ---

function zodTest(schema: z.ZodType): (value: any) => boolean {
  return (value) => schema.safeParse(value).success
}

function isString(v: any): v is string {
  return typeof v === 'string'
}

function deburr(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
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
  (v) => isString(v) && /^[a-zA-Z]+$/.test(deburr(v)),
  'Must contain only letters',
)

export const alphanumeric = new Rule(
  (v) => isString(v) && /^[a-zA-Z0-9]+$/.test(deburr(v)),
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

// Alias for equals (vue-mc compat)
export const equal = equals

// --- Date rules ---

export function after(date: string | Date): Rule {
  const d = new Date(date)
  return new Rule(
    (v) => new Date(v) > d,
    `Must be after ${d.toISOString()}`,
  )
}

export function before(date: string | Date): Rule {
  const d = new Date(date)
  return new Rule(
    (v) => new Date(v) < d,
    `Must be before ${d.toISOString()}`,
  )
}

export const date = new Rule(
  (v) => !isNaN(new Date(v).getTime()),
  'Must be a valid date',
)

export function dateformat(format: string): Rule {
  // Basic format check — validates common patterns like YYYY-MM-DD
  return new Rule(
    (v) => {
      if (!isString(v)) return false
      const pattern = format
        .replace('YYYY', '\\d{4}')
        .replace('MM', '\\d{2}')
        .replace('DD', '\\d{2}')
        .replace('HH', '\\d{2}')
        .replace('mm', '\\d{2}')
        .replace('ss', '\\d{2}')
      return new RegExp(`^${pattern}$`).test(v)
    },
    `Must match date format ${format}`,
  )
}

// --- String rules ---

export const ascii = new Rule(
  // eslint-disable-next-line no-control-regex
  (v) => isString(v) && /^[\u0000-\u007F]*$/.test(v),
  'Must contain only ASCII characters',
)

export function match(pattern: RegExp): Rule {
  return new Rule(
    (v) => isString(v) && pattern.test(v),
    `Must match pattern ${pattern}`,
  )
}

// --- Nullness rules ---

export const isnil = new Rule(
  (v) => v === null || v === undefined,
  'Must be nil',
)

export const isnull = new Rule(
  (v) => v === null,
  'Must be null',
)

export const isblank = new Rule(
  (v) => v === null || v === undefined || (isString(v) && v.trim() === ''),
  'Must be blank',
)

// --- Number rules ---

export const negative = new Rule(
  (v) => typeof v === 'number' && v < 0,
  'Must be negative',
)

export const positive = new Rule(
  (v) => typeof v === 'number' && v > 0,
  'Must be positive',
)

// --- Exclusion ---

export function not(...values: any[]): Rule {
  return new Rule(
    (v) => !values.includes(v),
    `Must not be one of: ${values.join(', ')}`,
  )
}

// --- Same attribute (needs model context, simplified) ---

export function same(otherAttribute: string): Rule {
  return new Rule(
    (v, _attr, model) => model ? v === model.get(otherAttribute) : true,
    `Must be the same as ${otherAttribute}`,
  )
}
