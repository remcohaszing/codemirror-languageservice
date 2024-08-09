import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

function resolve(path: string): string {
  return fileURLToPath(new URL(path, import.meta.url))
}

export default defineConfig({
  root: resolve('example'),
  build: {
    emptyOutDir: true,
    outDir: resolve('build'),
    rollupOptions: {
      input: [resolve('example/index.html'), resolve('example/json.html')]
    }
  },
  resolve: {
    alias: {
      'codemirror-languageservice': resolve('src/codemirror-languageservice')
    }
  },
  test: {
    root: resolve('./'),
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
