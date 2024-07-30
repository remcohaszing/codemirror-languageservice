import { EditorView, type Tooltip } from '@codemirror/view'
import { createHoverTooltipSource, getTextDocument, textDocument } from 'codemirror-languageservice'
import { expect, test } from 'vitest'
import { type Position } from 'vscode-languageserver-protocol'
import { type TextDocument } from 'vscode-languageserver-textdocument'

import { markdownToDom } from './utils.js'

test('hover args', async () => {
  let document: TextDocument | undefined
  let position: Position | undefined

  const view = new EditorView({
    doc: 'Text\n',
    extensions: [textDocument()]
  })

  const hoverTooltipSource = createHoverTooltipSource({
    markdownToDom,
    doHover(doc, pos) {
      document = doc
      position = pos
    }
  })

  const tooltip = await hoverTooltipSource(view, 2, 1)

  expect(document).toBe(getTextDocument(view.state))
  expect(position).toStrictEqual({ line: 0, character: 2 })
  expect(tooltip).toBeNull()
})

test('ignore outdated document', async () => {
  const view = new EditorView({
    doc: 'Text\n',
    extensions: [textDocument()]
  })

  const hoverTooltipSource = createHoverTooltipSource({
    markdownToDom,
    doHover() {
      view.dispatch({ changes: [{ from: 0, to: 4, insert: 'Updated' }] })
      return {
        contents: 'Hover content'
      }
    }
  })

  const tooltip = await hoverTooltipSource(view, 2, 1)

  expect(tooltip).toBeNull()
})

test('without range', async () => {
  const view = new EditorView({
    doc: 'Text\nText\n',
    extensions: [textDocument()]
  })

  const hoverTooltipSource = createHoverTooltipSource({
    markdownToDom,
    doHover() {
      return {
        contents: 'Hover content'
      }
    }
  })

  const tooltip = await hoverTooltipSource(view, 7, 1)

  expect(tooltip).toStrictEqual({
    pos: 7,
    end: undefined,
    create: expect.any(Function)
  })

  const content = (tooltip as unknown as Tooltip).create(view)
  expect(content.dom).toMatchInlineSnapshot(`
    <div>
      <p>
        Hover content
      </p>
    </div>
  `)
})

test('with range', async () => {
  const view = new EditorView({
    doc: 'Text\nText\n',
    extensions: [textDocument()]
  })

  const hoverTooltipSource = createHoverTooltipSource({
    markdownToDom,
    doHover() {
      return {
        contents: 'Hover content',
        range: {
          start: { line: 1, character: 0 },
          end: { line: 1, character: 4 }
        }
      }
    }
  })

  const tooltip = await hoverTooltipSource(view, 7, 1)

  expect(tooltip).toStrictEqual({
    pos: 5,
    end: 9,
    create: expect.any(Function)
  })

  const content = (tooltip as unknown as Tooltip).create(view)
  expect(content.dom).toMatchInlineSnapshot(`
    <div>
      <p>
        Hover content
      </p>
    </div>
  `)
})
