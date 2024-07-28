import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    alias: {
      'codemirror-languageservice': fileURLToPath(
        new URL('src/codemirror-languageservice', import.meta.url)
      )
    },
    browser: {
      enabled: true,
      headless: true,
      name: 'chromium',
      provider: 'playwright'
    },
    coverage: {
      enabled: true,
      include: ['src'],
      provider: 'istanbul'
    }
  }
})
