export * from './rules.js'
export { register, locale, getMessage, getMessages, resetMessages } from './messages.js'

// --- vue-mc compat: rule() factory and messages object ---

import { Rule } from './rules.js'
import { register, getMessage } from './messages.js'

interface RuleConfig {
  name: string
  test: (value: any, attribute?: string, model?: any) => boolean
  data?: Record<string, any>
}

/**
 * vue-mc compatible rule factory.
 * Usage: rule({ name: 'myRule', test: (v) => v > 0 })
 */
export function rule(config: RuleConfig): Rule {
  return new Rule(config.test, getMessage(config.name))
}

/**
 * vue-mc compatible messages object.
 * Usage: messages.set('myRule', 'Must be valid', 'en')
 */
export const messages = {
  set(name: string, template: string, _locale?: string): void {
    // Convert ${var} template to plain string (vue-mc uses lodash template)
    const locale = _locale?.replace('-us', '') || 'en'
    register(locale, { [name]: template })
  },

  get(name: string): string {
    return getMessage(name)
  },
}
