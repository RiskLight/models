import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '@risklight/models',
  description: 'Framework-agnostic Model/Collection with Proxy-based reactivity, HTTP layer and Zod validation',
  base: '/models/',
  cleanUrls: true,
  lastUpdated: true,
  head: [['link', { rel: 'icon', href: '/models/favicon.svg' }]],
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Adapters', link: '/adapters/vue' },
      { text: 'Demo', link: '/demo' },
      { text: 'npm', link: 'https://www.npmjs.com/package/@risklight/models' }
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting started', link: '/guide/getting-started' },
          { text: 'Model', link: '/guide/model' },
          { text: 'Collection', link: '/guide/collection' },
          { text: 'Validation', link: '/guide/validation' },
          { text: 'HTTP', link: '/guide/http' },
          { text: 'Exported types', link: '/guide/types' }
        ]
      },
      {
        text: 'Framework adapters',
        items: [
          { text: 'Vue 3', link: '/adapters/vue' },
          { text: 'React', link: '/adapters/react' },
          { text: 'Nuxt', link: '/adapters/nuxt' },
          { text: 'Vanilla JS / Node.js', link: '/adapters/vanilla' }
        ]
      },
      { text: 'Live demo', link: '/demo' }
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/RiskLight/models' }],
    search: { provider: 'local' },
    editLink: { pattern: 'https://github.com/RiskLight/models/edit/main/docs/:path' },
    footer: { message: 'Released under the MIT License.' }
  },
  vite: {
    resolve: {
      alias: [
        { find: '@risklight/models/vue', replacement: new URL('../../src/vue/index.ts', import.meta.url).pathname },
        { find: '@risklight/models', replacement: new URL('../../src/index.ts', import.meta.url).pathname }
      ]
    }
  }
})
