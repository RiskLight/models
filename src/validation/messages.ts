// @risklight/models — Validation message localization

const _locales: Record<string, Record<string, string>> = {}
let _currentLocale: string = 'en'

const _defaults: Record<string, string> = {
  after: 'Must be after {0}',
  alpha: 'Must contain only letters',
  alphanumeric: 'Must contain only letters and numbers',
  array: 'Must be an array',
  ascii: 'Must contain only ASCII characters',
  base64: 'Must be valid base64',
  before: 'Must be before {0}',
  between: 'Must be between {0} and {1}',
  boolean: 'Must be a boolean',
  creditcard: 'Must be a valid credit card number',
  date: 'Must be a valid date',
  dateformat: 'Must match date format {0}',
  defined: 'Value must be defined',
  email: 'Must be a valid email',
  empty: 'Value must be empty',
  equal: 'Must equal {0}',
  equals: 'Must equal {0}',
  gt: 'Must be greater than {0}',
  gte: 'Must be greater than or equal to {0}',
  integer: 'Must be an integer',
  ip: 'Must be a valid IP',
  isblank: 'Must be blank',
  isnil: 'Must be nil',
  isnull: 'Must be null',
  iso8601: 'Must be a valid ISO 8601 date',
  json: 'Must be valid JSON',
  length: 'Length must be between {0} and {1}',
  lt: 'Must be less than {0}',
  lte: 'Must be less than or equal to {0}',
  match: 'Must match pattern {0}',
  max: 'Must be at most {0}',
  min: 'Must be at least {0}',
  negative: 'Must be negative',
  not: 'Must not be one of: {0}',
  numeric: 'Must be numeric',
  object: 'Must be an object',
  positive: 'Must be positive',
  required: 'Value is required',
  same: 'Must be the same as {0}',
  string: 'Must be a string',
  url: 'Must be a valid URL',
  uuid: 'Must be a valid UUID',
}

/**
 * Register messages for a locale.
 */
export function register(locale: string, messages: Record<string, string>): void {
  _locales[locale] = { ..._locales[locale], ...messages }
}

/**
 * Set or get the current locale.
 */
export function locale(name?: string): string {
  if (name !== undefined) {
    _currentLocale = name
  }
  return _currentLocale
}

/**
 * Get a message by key, with optional parameter substitution.
 * Looks up: current locale → 'en' locale → built-in defaults.
 */
export function getMessage(key: string, ...params: any[]): string {
  const localeMessages = _locales[_currentLocale]
  const enMessages = _locales['en']

  let message = localeMessages?.[key] || enMessages?.[key] || _defaults[key] || key

  // Substitute {0}, {1}, etc.
  params.forEach((param, i) => {
    message = message.replace(`{${i}}`, String(param))
  })

  return message
}

/**
 * Get all messages for the current locale (merged with defaults).
 */
export function getMessages(): Record<string, string> {
  return { ..._defaults, ..._locales['en'], ..._locales[_currentLocale] }
}

/**
 * Reset to defaults (useful for testing).
 */
export function resetMessages(): void {
  for (const key of Object.keys(_locales)) {
    delete _locales[key]
  }
  _currentLocale = 'en'
}
