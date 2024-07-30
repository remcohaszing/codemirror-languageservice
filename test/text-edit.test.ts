import { EditorView } from '@codemirror/view'
import { dispatchTextEdits } from 'codemirror-languageservice'
import { expect, test } from 'vitest'

test('single edit', () => {
  const view = new EditorView({
    doc: 'Initial text\n'
  })

  dispatchTextEdits(view, [
    {
      newText: 'Updated',
      range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 7 }
      }
    }
  ])

  expect(String(view.state.doc)).toBe('Updated text\n')
})

test('multiple edits start to end', () => {
  const view = new EditorView({
    doc: 'Initial text\n'
  })

  dispatchTextEdits(view, [
    {
      newText: 'Updated',
      range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 7 }
      }
    },
    {
      newText: 'content',
      range: {
        start: { line: 0, character: 8 },
        end: { line: 0, character: 12 }
      }
    }
  ])

  expect(String(view.state.doc)).toBe('Updated content\n')
})

test('multiple edits end to start', () => {
  const view = new EditorView({
    doc: 'Initial text\n'
  })

  dispatchTextEdits(view, [
    {
      newText: 'content',
      range: {
        start: { line: 0, character: 8 },
        end: { line: 0, character: 12 }
      }
    },
    {
      newText: 'Updated',
      range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 7 }
      }
    }
  ])

  expect(String(view.state.doc)).toBe('Updated content\n')
})

test('end character exceeds line', () => {
  const view = new EditorView({
    doc: 'line1\nline2\nline3\n'
  })

  dispatchTextEdits(view, [
    {
      newText: '|',
      range: {
        start: { line: 1, character: 0 },
        end: { line: 1, character: 1000 }
      }
    }
  ])

  expect(String(view.state.doc)).toBe('line1\n|\nline3\n')
})

test('end character exceeds line', () => {
  const view = new EditorView({
    doc: 'line1\nline2\nline3\n'
  })

  dispatchTextEdits(view, [
    {
      newText: '|',
      range: {
        start: { line: 0, character: 1000 },
        end: { line: 1, character: 0 }
      }
    }
  ])

  expect(String(view.state.doc)).toBe('line1|line2\nline3\n')
})
