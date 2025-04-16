import { expect, test } from 'vitest'

import { fromMarkupContent } from '../src/markup-content.js'
import { markdownToDom } from './utils.js'

test('string', async () => {
  const fragment = await fromMarkupContent(
    '[markdown](https://commonmark.org)',
    document.createDocumentFragment(),
    { markdownToDom }
  )

  expect(fragment).toMatchInlineSnapshot(`
    <DocumentFragment>
      <p>
        <a
          href="https://commonmark.org"
        >
          markdown
        </a>
      </p>
    </DocumentFragment>
  `)
})

test('empty string', async () => {
  const fragment = await fromMarkupContent('', document.createDocumentFragment(), { markdownToDom })

  expect(fragment).toMatchInlineSnapshot(`
    <DocumentFragment />
  `)
})

test('MarkedString', async () => {
  const fragment = await fromMarkupContent(
    { language: 'javascript', value: 'console.log("Hello!")\n' },
    document.createDocumentFragment(),
    { markdownToDom }
  )

  expect(fragment).toMatchInlineSnapshot(`
    <DocumentFragment>
      <pre>
        <code
          class="language-javascript"
        >
          console.log("Hello!")

        </code>
      </pre>
    </DocumentFragment>
  `)
})

test('array', async () => {
  const fragment = await fromMarkupContent(
    [
      '[markdown](https://commonmark.org)',
      { language: 'javascript', value: 'console.log("Hello!")\n' }
    ],
    document.createDocumentFragment(),
    { markdownToDom }
  )

  expect(fragment).toMatchInlineSnapshot(`
    <DocumentFragment>
      <p>
        <a
          href="https://commonmark.org"
        >
          markdown
        </a>
      </p>
      <pre>
        <code
          class="language-javascript"
        >
          console.log("Hello!")

        </code>
      </pre>
    </DocumentFragment>
  `)
})

test('MarkupContent markdown', async () => {
  const fragment = await fromMarkupContent(
    { kind: 'markdown', value: '[markdown](https://commonmark.org)' },
    document.createDocumentFragment(),
    { markdownToDom }
  )

  expect(fragment).toMatchInlineSnapshot(`
    <DocumentFragment>
      <p>
        <a
          href="https://commonmark.org"
        >
          markdown
        </a>
      </p>
    </DocumentFragment>
  `)
})

test('MarkupContent plaintext', async () => {
  const fragment = await fromMarkupContent(
    { kind: 'plaintext', value: '[markdown](https://commonmark.org)' },
    document.createDocumentFragment(),
    { markdownToDom }
  )

  expect(fragment).toMatchInlineSnapshot(`
    <DocumentFragment>
      <p>
        [markdown](https://commonmark.org)
      </p>
    </DocumentFragment>
  `)
})

test('markdownToDom iterable', async () => {
  const fragment = await fromMarkupContent(
    { kind: 'markdown', value: '[markdown](https://commonmark.org)' },
    document.createDocumentFragment(),
    {
      *markdownToDom(markdown) {
        yield markdownToDom(markdown)
      }
    }
  )

  expect(fragment).toMatchInlineSnapshot(`
    <DocumentFragment>
      <p>
        <a
          href="https://commonmark.org"
        >
          markdown
        </a>
      </p>
    </DocumentFragment>
  `)
})

test('markdownToDom iterable promise', async () => {
  const fragment = await fromMarkupContent(
    { kind: 'markdown', value: '[markdown](https://commonmark.org)' },
    document.createDocumentFragment(),
    {
      markdownToDom(markdown) {
        return Promise.resolve([markdownToDom(markdown)])
      }
    }
  )

  expect(fragment).toMatchInlineSnapshot(`
    <DocumentFragment>
      <p>
        <a
          href="https://commonmark.org"
        >
          markdown
        </a>
      </p>
    </DocumentFragment>
  `)
})

test('markdownToDom null', async () => {
  const fragment = await fromMarkupContent(
    { kind: 'markdown', value: '[markdown](https://commonmark.org)' },
    document.createDocumentFragment(),
    {
      markdownToDom() {
        return null
      }
    }
  )

  expect(fragment).toMatchInlineSnapshot('<DocumentFragment />')
})

test('markdownToDom null promise', async () => {
  const fragment = await fromMarkupContent(
    { kind: 'markdown', value: '[markdown](https://commonmark.org)' },
    document.createDocumentFragment(),
    {
      markdownToDom() {
        return Promise.resolve(null)
      }
    }
  )

  expect(fragment).toMatchInlineSnapshot('<DocumentFragment />')
})

test('markdownToDom undefined', async () => {
  const fragment = await fromMarkupContent(
    { kind: 'markdown', value: '[markdown](https://commonmark.org)' },
    document.createDocumentFragment(),
    {
      markdownToDom() {
        // Do nothing
      }
    }
  )

  expect(fragment).toMatchInlineSnapshot('<DocumentFragment />')
})

test('markdownToDom undefined promise', async () => {
  const fragment = await fromMarkupContent(
    { kind: 'markdown', value: '[markdown](https://commonmark.org)' },
    document.createDocumentFragment(),
    {
      markdownToDom() {
        return Promise.resolve()
      }
    }
  )

  expect(fragment).toMatchInlineSnapshot('<DocumentFragment />')
})
