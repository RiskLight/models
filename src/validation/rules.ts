// @risklight/models — Validation rules
// Each rule backed by Zod or simple JS. Chaining via .and()/.or()/.format()

import { z } from 'zod'
import { getMessage } from './messages.js'

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
  getMessage('required'),
)

export const defined = new Rule(
  (v) => v !== undefined,
  getMessage('defined'),
)

export const empty = new Rule(
  (v) => v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0),
  getMessage('empty'),
)

// --- Type rules ---

export const integer = new Rule(
  (v) => typeof v === 'number' && Number.isInteger(v),
  getMessage('integer'),
)

export const numeric = new Rule(
  (v) => typeof v === 'number' || (isString(v) && v !== '' && !isNaN(Number(v))),
  getMessage('numeric'),
)

const booleanRule = new Rule(
  (v) => typeof v === 'boolean',
  getMessage('boolean'),
)
export { booleanRule as boolean }

const stringRule = new Rule(
  (v) => isString(v),
  getMessage('string'),
)
export { stringRule as string }

export const array = new Rule(
  (v) => Array.isArray(v),
  getMessage('array'),
)

export const object = new Rule(
  (v) => v !== null && typeof v === 'object' && !Array.isArray(v),
  getMessage('object'),
)

// --- Format rules (Zod-backed where possible) ---

export const email = new Rule(zodTest(z.string().email()), getMessage('email'))
export const url = new Rule(zodTest(z.string().url()), getMessage('url'))
export const uuid = new Rule(zodTest(z.string().uuid()), getMessage('uuid'))

export const ip = new Rule(
  (v) => isString(v) && (z.string().ipv4().safeParse(v).success || z.string().ipv6().safeParse(v).success),
  getMessage('ip'),
)

export const iso8601 = new Rule(
  (v) => isString(v) && (z.string().datetime().safeParse(v).success || z.string().datetime({ offset: true }).safeParse(v).success),
  getMessage('iso8601'),
)

export const alpha = new Rule(
  (v) => isString(v) && /^[a-zA-Z]+$/.test(deburr(v)),
  getMessage('alpha'),
)

export const alphanumeric = new Rule(
  (v) => isString(v) && /^[a-zA-Z0-9]+$/.test(deburr(v)),
  getMessage('alphanumeric'),
)

export const base64 = new Rule(
  (v) => isString(v) && /^[A-Za-z0-9+/]*={0,2}$/.test(v) && v.length % 4 === 0,
  getMessage('base64'),
)

export const creditcard = new Rule(
  (v) => {
    if (!isString(v) || !/^\d{13,19}$/.test(v)) return false
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
  getMessage('creditcard'),
)

export const json = new Rule(
  (v) => {
    if (!isString(v)) return false
    try { JSON.parse(v); return true } catch { return false }
  },
  getMessage('json'),
)

// --- Comparison rules ---

export function between(minVal: number, maxVal: number, _inclusive?: boolean): Rule {
  return new Rule(
    (v) => typeof v === 'number' && v >= minVal && v <= maxVal,
    getMessage('between', minVal, maxVal),
  )
}

export function min(n: number): Rule {
  return new Rule((v) => typeof v === 'number' && v >= n, getMessage('min', n))
}

export function max(n: number): Rule {
  return new Rule((v) => typeof v === 'number' && v <= n, getMessage('max', n))
}

export function gt(n: number): Rule {
  return new Rule((v) => typeof v === 'number' && v > n, getMessage('gt', n))
}

export function gte(n: number): Rule {
  return new Rule((v) => typeof v === 'number' && v >= n, getMessage('gte', n))
}

export function lt(n: number): Rule {
  return new Rule((v) => typeof v === 'number' && v < n, getMessage('lt', n))
}

export function lte(n: number): Rule {
  return new Rule((v) => typeof v === 'number' && v <= n, getMessage('lte', n))
}

export function length(minLen: number, maxLen?: number): Rule {
  return new Rule(
    (v) => {
      const len = isString(v) ? v.length : (Array.isArray(v) ? v.length : 0)
      if (maxLen !== undefined) return len >= minLen && len <= maxLen
      return len >= minLen
    },
    getMessage('length', minLen, maxLen ?? ''),
  )
}

export function equals(value: any): Rule {
  return new Rule((v) => v === value, getMessage('equals', value))
}

export const equal = equals

// --- Date rules ---

export function after(d: string | Date): Rule {
  const dt = new Date(d)
  return new Rule((v) => new Date(v) > dt, getMessage('after', dt.toISOString()))
}

export function before(d: string | Date): Rule {
  const dt = new Date(d)
  return new Rule((v) => new Date(v) < dt, getMessage('before', dt.toISOString()))
}

export const date = new Rule(
  (v) => !isNaN(new Date(v).getTime()),
  getMessage('date'),
)

export function dateformat(format: string): Rule {
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
    getMessage('dateformat', format),
  )
}

// --- String rules ---

export const ascii = new Rule(
  // eslint-disable-next-line no-control-regex
  (v) => isString(v) && /^[\u0000-\u007F]*$/.test(v),
  getMessage('ascii'),
)

export function match(pattern: RegExp): Rule {
  return new Rule((v) => isString(v) && pattern.test(v), getMessage('match', pattern))
}

// --- Nullness rules ---

export const isnil = new Rule((v) => v === null || v === undefined, getMessage('isnil'))
export const isnull = new Rule((v) => v === null, getMessage('isnull'))

export const isblank = new Rule(
  (v) => v === null || v === undefined || (isString(v) && v.trim() === ''),
  getMessage('isblank'),
)

// --- Number rules ---

export const negative = new Rule((v) => typeof v === 'number' && v < 0, getMessage('negative'))
export const positive = new Rule((v) => typeof v === 'number' && v > 0, getMessage('positive'))

// --- Exclusion ---

export function not(...values: any[]): Rule {
  return new Rule((v) => !values.includes(v), getMessage('not', values.join(', ')))
}

// --- Same attribute ---

export function same(otherAttribute: string): Rule {
  return new Rule(
    (v, _attr, model) => model ? v === model.get(otherAttribute) : true,
    getMessage('same', otherAttribute),
  )
}
