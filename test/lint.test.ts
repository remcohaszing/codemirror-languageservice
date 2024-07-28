import { EditorView } from '@codemirror/view'
import { createLintSource, getTextDocument, textDocument } from 'codemirror-languageservice'
import { expect, test } from 'vitest'
import { DiagnosticSeverity, DiagnosticTag } from 'vscode-languageserver-protocol'
import { type TextDocument } from 'vscode-languageserver-textdocument'

test('diagnostics args', async () => {
  let document: TextDocument | undefined

  const view = new EditorView({
    doc: 'Text\n',
    extensions: [textDocument()]
  })

  const lintSource = createLintSource({
    doDiagnostics(doc) {
      document = doc
    }
  })

  await lintSource(view)

  expect(document).toBe(
    getTextDocument(
      // @ts-expect-error EditorView is not assignable to EditorView?
      view.state
    )
  )
})

test('ignore outdated document', async () => {
  const view = new EditorView({
    doc: 'Text\n',
    extensions: [textDocument()]
  })

  const lintSource = createLintSource({
    doDiagnostics() {
      view.dispatch({ changes: [{ from: 0, to: 4, insert: 'Updated' }] })

      return [
        {
          message: 'This is outdated',
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 }
          }
        }
      ]
    }
  })

  const diagnostics = await lintSource(view)

  expect(diagnostics).toStrictEqual([])
})

test('handle null', async () => {
  const view = new EditorView({
    doc: 'Text\n',
    extensions: [textDocument()]
  })

  const lintSource = createLintSource({
    doDiagnostics() {
      return null
    }
  })

  const diagnostics = await lintSource(view)

  expect(diagnostics).toStrictEqual([])
})

test('handle undefined', async () => {
  const view = new EditorView({
    doc: 'Text\n',
    extensions: [textDocument()]
  })

  const lintSource = createLintSource({
    doDiagnostics() {
      // Do nothing
    }
  })

  const diagnostics = await lintSource(view)

  expect(diagnostics).toStrictEqual([])
})

test('severity', async () => {
  const view = new EditorView({
    doc: 'Default\nError\nWarning\nInfo\nHint\n',
    extensions: [textDocument()]
  })

  const lintSource = createLintSource({
    *doDiagnostics() {
      yield {
        message: 'Default severity',
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 1000 }
        }
      }
      yield {
        message: 'Error severity',
        severity: DiagnosticSeverity.Error,
        range: {
          start: { line: 1, character: 0 },
          end: { line: 1, character: 1000 }
        }
      }
      yield {
        message: 'Warning severity',
        severity: DiagnosticSeverity.Warning,
        range: {
          start: { line: 2, character: 0 },
          end: { line: 2, character: 1000 }
        }
      }
      yield {
        message: 'Info severity',
        severity: DiagnosticSeverity.Information,
        range: {
          start: { line: 3, character: 0 },
          end: { line: 3, character: 1000 }
        }
      }
      yield {
        message: 'Hint severity',
        severity: DiagnosticSeverity.Hint,
        range: {
          start: { line: 4, character: 0 },
          end: { line: 4, character: 1000 }
        }
      }
    }
  })

  const diagnostics = await lintSource(view)

  expect(diagnostics).toStrictEqual([
    {
      from: 0,
      markClass: '',
      message: 'Default severity',
      renderMessage: undefined,
      severity: 'error',
      source: undefined,
      to: 8
    },
    {
      from: 8,
      markClass: '',
      message: 'Error severity',
      renderMessage: undefined,
      severity: 'error',
      source: undefined,
      to: 14
    },
    {
      from: 14,
      markClass: '',
      message: 'Warning severity',
      renderMessage: undefined,
      severity: 'warning',
      source: undefined,
      to: 22
    },
    {
      from: 22,
      markClass: '',
      message: 'Info severity',
      renderMessage: undefined,
      severity: 'info',
      source: undefined,
      to: 27
    },
    {
      from: 27,
      markClass: '',
      message: 'Hint severity',
      renderMessage: undefined,
      severity: 'hint',
      source: undefined,
      to: 32
    }
  ])
})

test('tags', async () => {
  const view = new EditorView({
    doc: 'Unnecessary\nDeprecated\n',
    extensions: [textDocument()]
  })

  const lintSource = createLintSource({
    *doDiagnostics() {
      yield {
        message: 'Unnecessary',
        tags: [DiagnosticTag.Unnecessary],
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 1000 }
        }
      }
      yield {
        message: 'Deprecated',
        tags: [DiagnosticTag.Deprecated],
        range: {
          start: { line: 1, character: 0 },
          end: { line: 1, character: 1000 }
        }
      }
    }
  })

  const diagnostics = await lintSource(view)

  expect(diagnostics).toStrictEqual([
    {
      from: 0,
      markClass: ' cm-lintRange-unnecessary',
      message: 'Unnecessary',
      renderMessage: undefined,
      severity: 'error',
      source: undefined,
      to: 12
    },
    {
      from: 12,
      markClass: ' cm-lintRange-deprecated',
      message: 'Deprecated',
      renderMessage: undefined,
      severity: 'error',
      source: undefined,
      to: 23
    }
  ])
})

test('custom markClass', async () => {
  const view = new EditorView({
    doc: 'Text\n',
    extensions: [textDocument()]
  })

  const lintSource = createLintSource({
    markClass: 'custom-class',
    *doDiagnostics() {
      yield {
        message: 'Diagnostic',
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 4 }
        }
      }
    }
  })

  const diagnostics = await lintSource(view)

  expect(diagnostics).toStrictEqual([
    {
      from: 0,
      markClass: 'custom-class',
      message: 'Diagnostic',
      renderMessage: undefined,
      severity: 'error',
      source: undefined,
      to: 4
    }
  ])
})

test('source', async () => {
  const view = new EditorView({
    doc: 'Wrod\n',
    extensions: [textDocument()]
  })

  const lintSource = createLintSource({
    *doDiagnostics() {
      yield {
        message: 'Misspelled word “wrod”',
        source: 'spell',
        code: 'incorrect',
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 4 }
        }
      }
    }
  })

  const diagnostics = await lintSource(view)

  expect(diagnostics).toStrictEqual([
    {
      from: 0,
      markClass: '',
      message: 'Misspelled word “wrod”',
      renderMessage: undefined,
      severity: 'error',
      source: 'spell:incorrect',
      to: 4
    }
  ])
})

test('source only source', async () => {
  const view = new EditorView({
    doc: 'Wrod\n',
    extensions: [textDocument()]
  })

  const lintSource = createLintSource({
    *doDiagnostics() {
      yield {
        message: 'Misspelled word “wrod”',
        source: 'spell',
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 4 }
        }
      }
    }
  })

  const diagnostics = await lintSource(view)

  expect(diagnostics).toStrictEqual([
    {
      from: 0,
      markClass: '',
      message: 'Misspelled word “wrod”',
      renderMessage: undefined,
      severity: 'error',
      source: 'spell',
      to: 4
    }
  ])
})

test('source only code', async () => {
  const view = new EditorView({
    doc: 'Wrod\n',
    extensions: [textDocument()]
  })

  const lintSource = createLintSource({
    *doDiagnostics() {
      yield {
        message: 'Misspelled word “wrod”',
        code: 'misspell',
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 4 }
        }
      }
    }
  })

  const diagnostics = await lintSource(view)

  expect(diagnostics).toStrictEqual([
    {
      from: 0,
      markClass: '',
      message: 'Misspelled word “wrod”',
      renderMessage: undefined,
      severity: 'error',
      source: 'misspell',
      to: 4
    }
  ])
})

test('source custom format', async () => {
  const view = new EditorView({
    doc: 'Wrod\n',
    extensions: [textDocument()]
  })

  const lintSource = createLintSource({
    formatSource(diagnostic) {
      return `${diagnostic.source}(${diagnostic.code})`
    },
    *doDiagnostics() {
      yield {
        message: 'Misspelled word “wrod”',
        source: 'spell',
        code: 'incorrect',
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 4 }
        }
      }
    }
  })

  const diagnostics = await lintSource(view)

  expect(diagnostics).toStrictEqual([
    {
      from: 0,
      markClass: '',
      message: 'Misspelled word “wrod”',
      renderMessage: undefined,
      severity: 'error',
      source: 'spell(incorrect)',
      to: 4
    }
  ])
})

test('codeDescription', async () => {
  const view = new EditorView({
    doc: 'Wrod\n',
    extensions: [textDocument()]
  })

  const lintSource = createLintSource({
    formatSource(diagnostic) {
      return `${diagnostic.source}(${diagnostic.code})`
    },
    *doDiagnostics() {
      yield {
        message: 'Misspelled word “wrod”',
        codeDescription: { href: 'https://example.com' },
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 4 }
        }
      }
    }
  })

  const diagnostics = await lintSource(view)

  expect(diagnostics[0].renderMessage!(view)).toMatchInlineSnapshot(`
    <DocumentFragment>
      Misspelled word “wrod”
      <br />
      <a
        href="https://example.com"
      >
        https://example.com
      </a>
    </DocumentFragment>
  `)
})
