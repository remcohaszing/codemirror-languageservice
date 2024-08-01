import { expect, test } from 'vitest'

import { markdownToDom } from './utils.js'
import { fromMarkupContent } from '../src/markup-content.js'

test('string', () => {
  const fragment = fromMarkupContent(
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

test('MarkedString', () => {
  const fragment = fromMarkupContent(
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

test('array', () => {
  const fragment = fromMarkupContent(
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

test('MarkupContent markdown', () => {
  const fragment = fromMarkupContent(
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

test('MarkupContent plaintext', () => {
  const fragment = fromMarkupContent(
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

test('markdownToDom iterable', () => {
  const fragment = fromMarkupContent(
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

test('markdownToDom null', () => {
  const fragment = fromMarkupContent(
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

test('markdownToDom undefined', () => {
  const fragment = fromMarkupContent(
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
