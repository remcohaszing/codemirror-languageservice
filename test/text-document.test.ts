import { json } from '@codemirror/lang-json'
import { StateEffect } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { getTextDocument, textDocument } from 'codemirror-languageservice'
import { expect, test } from 'vitest'

test('inmemory://', () => {
  const view = new EditorView({
    doc: 'Initial text\n',
    extensions: [textDocument()]
  })

  const document = getTextDocument(
    // @ts-expect-error EditorView is not assignable to EditorView?
    view.state
  )
  expect(document.uri).toBe('inmemory://1')
  expect(document.version).toBe(0)
  expect(document.getText()).toBe('Initial text\n')
})

test('uri', () => {
  const view = new EditorView({
    doc: 'Initial text\n',
    extensions: [textDocument('file:///original.txt')]
  })

  const original = getTextDocument(
    // @ts-expect-error EditorView is not assignable to EditorView?
    view.state
  )
  expect(original.uri).toBe('file:///original.txt')
  expect(original.version).toBe(0)
  expect(original.languageId).toBe('plaintext')
  expect(original.getText()).toBe('Initial text\n')

  view.dispatch({ effects: StateEffect.reconfigure.of(textDocument('file:///updated.txt')) })

  const updated = getTextDocument(
    // @ts-expect-error EditorView is not assignable to EditorView?
    view.state
  )
  expect(updated.uri).toBe('file:///updated.txt')
  expect(updated.version).toBe(0)
  expect(updated.languageId).toBe('plaintext')
  expect(updated.getText()).toBe('Initial text\n')
})

test('language ID', () => {
  const view = new EditorView({
    doc: '{}\n',
    extensions: [textDocument()]
  })

  const original = getTextDocument(
    // @ts-expect-error EditorView is not assignable to EditorView?
    view.state
  )
  expect(original.version).toBe(0)
  expect(original.languageId).toBe('plaintext')
  expect(original.getText()).toBe('{}\n')

  view.dispatch({ effects: StateEffect.appendConfig.of(json()) })

  const updated = getTextDocument(
    // @ts-expect-error EditorView is not assignable to EditorView?
    view.state
  )
  expect(updated.version).toBe(1)
  expect(updated.languageId).toBe('json')
  expect(updated.getText()).toBe('{}\n')
})

test('update reuse', () => {
  const view = new EditorView({
    doc: 'Initial text\n',
    extensions: [textDocument()]
  })
  const original = getTextDocument(
    // @ts-expect-error EditorView is not assignable to EditorView?
    view.state
  )

  view.dispatch({ effects: StateEffect.appendConfig.of([]) })

  const updated = getTextDocument(
    // @ts-expect-error EditorView is not assignable to EditorView?
    view.state
  )
  expect(updated).toBe(original)
})
