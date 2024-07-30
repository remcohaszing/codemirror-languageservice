import {
  CompletionContext,
  type CompletionInfo,
  hasNextSnippetField
} from '@codemirror/autocomplete'
import { EditorView } from '@codemirror/view'
import { createCompletionSource, getTextDocument, textDocument } from 'codemirror-languageservice'
import { expect, test } from 'vitest'
import {
  CompletionItemKind,
  CompletionTriggerKind,
  InsertTextFormat,
  type CompletionContext as LspCompletionContext,
  type Position
} from 'vscode-languageserver-protocol'
import { type TextDocument } from 'vscode-languageserver-textdocument'

import { markdownToDom } from './utils.js'

test('completion args explicit', async () => {
  let document: TextDocument | undefined
  let position: Position | undefined
  let context: LspCompletionContext | undefined

  const view = new EditorView({
    doc: 'Text\n',
    extensions: [textDocument()]
  })

  const completionSource = createCompletionSource({
    markdownToDom,
    doComplete(doc, pos, ctx) {
      document = doc
      position = pos
      context = ctx
    }
  })

  await completionSource(new CompletionContext(view.state, 3, true))

  expect(document).toBe(getTextDocument(view.state))
  expect(position).toStrictEqual({ line: 0, character: 3 })
  expect(context).toStrictEqual({ triggerKind: CompletionTriggerKind.Invoked })
})

test('completion args implicit', async () => {
  let document: TextDocument | undefined
  let position: Position | undefined
  let context: LspCompletionContext | undefined

  const view = new EditorView({
    doc: 'Text\n',
    extensions: [textDocument()]
  })

  const completionSource = createCompletionSource({
    markdownToDom,
    doComplete(doc, pos, ctx) {
      document = doc
      position = pos
      context = ctx
    }
  })

  await completionSource(new CompletionContext(view.state, 3, false))

  expect(document).toBe(getTextDocument(view.state))
  expect(position).toStrictEqual({ line: 0, character: 3 })
  expect(context).toStrictEqual({
    triggerCharacter: 'x',
    triggerKind: CompletionTriggerKind.TriggerCharacter
  })
})

test('ignore null', async () => {
  const view = new EditorView({
    doc: 'Text\n',
    extensions: [textDocument()]
  })

  const completionSource = createCompletionSource({
    markdownToDom,
    doComplete() {
      return null
    }
  })

  const completions = await completionSource(new CompletionContext(view.state, 3, false))

  expect(completions).toBeNull()
})

test('ignore undefined', async () => {
  const view = new EditorView({
    doc: 'Text\n',
    extensions: [textDocument()]
  })

  const completionSource = createCompletionSource({
    markdownToDom,
    doComplete() {
      // Do nothing
    }
  })

  const completions = await completionSource(new CompletionContext(view.state, 3, false))

  expect(completions).toBeNull()
})

test('ignore outdated', async () => {
  const view = new EditorView({
    doc: 'Text\n',
    extensions: [textDocument()]
  })

  const completionSource = createCompletionSource({
    markdownToDom,
    doComplete() {
      view.dispatch({ changes: [{ from: 0, to: 4, insert: 'Updated' }] })
      return []
    }
  })

  const completions = await completionSource(new CompletionContext(view.state, 3, false, view))

  expect(completions).toBeNull()
})

test('minimal meta', async () => {
  const view = new EditorView({
    doc: 'Com\n',
    extensions: [textDocument()]
  })

  const completionSource = createCompletionSource({
    markdownToDom,
    *doComplete() {
      yield {
        label: 'pletion'
      }
    }
  })

  const completions = await completionSource(new CompletionContext(view.state, 4, false))

  expect(completions).toStrictEqual({
    commitCharacters: undefined,
    from: 4,
    options: [
      {
        commitCharacters: undefined,
        detail: undefined,
        info: undefined,
        label: 'pletion',
        section: undefined,
        type: undefined
      }
    ]
  })
})

test('full meta', async () => {
  const view = new EditorView({
    doc: 'Com\n',
    extensions: [textDocument()]
  })

  const completionSource = createCompletionSource({
    markdownToDom,
    *doComplete() {
      yield {
        commitCharacters: ['p'],
        detail: 'word',
        documentation: 'Autocomplete to “Completion”',
        label: 'pletion'
      }
    }
  })

  const completions = await completionSource(new CompletionContext(view.state, 3, false))

  expect(completions).toStrictEqual({
    commitCharacters: undefined,
    from: 3,
    options: [
      {
        commitCharacters: ['p'],
        detail: 'word',
        info: expect.any(Function),
        label: 'pletion',
        section: undefined,
        type: undefined
      }
    ]
  })

  const completion = completions!.options[0]!
  const info = (completion.info as () => CompletionInfo)()
  expect(info).toMatchInlineSnapshot(`
    <DocumentFragment>
      <p>
        Autocomplete to “Completion”
      </p>
    </DocumentFragment>
  `)
})

test('completion item kinds', async () => {
  const view = new EditorView({
    doc: 'Comp\n',
    extensions: [textDocument()]
  })

  const completionSource = createCompletionSource({
    markdownToDom,
    *doComplete() {
      yield {
        label: 'Text',
        kind: CompletionItemKind.Text
      }
      yield {
        label: 'Method',
        kind: CompletionItemKind.Method
      }
      yield {
        label: 'Function',
        kind: CompletionItemKind.Function
      }
      yield {
        label: 'Constructor',
        kind: CompletionItemKind.Constructor
      }
      yield {
        label: 'Field',
        kind: CompletionItemKind.Field
      }
      yield {
        label: 'Variable',
        kind: CompletionItemKind.Variable
      }
      yield {
        label: 'Class',
        kind: CompletionItemKind.Class
      }
      yield {
        label: 'Interface',
        kind: CompletionItemKind.Interface
      }
      yield {
        label: 'Module',
        kind: CompletionItemKind.Module
      }
      yield {
        label: 'Property',
        kind: CompletionItemKind.Property
      }
      yield {
        label: 'Unit',
        kind: CompletionItemKind.Unit
      }
      yield {
        label: 'Value',
        kind: CompletionItemKind.Value
      }
      yield {
        label: 'Enum',
        kind: CompletionItemKind.Enum
      }
      yield {
        label: 'Keyword',
        kind: CompletionItemKind.Keyword
      }
      yield {
        label: 'Snippet',
        kind: CompletionItemKind.Snippet
      }
      yield {
        label: 'Color',
        kind: CompletionItemKind.Color
      }
      yield {
        label: 'File',
        kind: CompletionItemKind.File
      }
      yield {
        label: 'Reference',
        kind: CompletionItemKind.Reference
      }
      yield {
        label: 'Folder',
        kind: CompletionItemKind.Folder
      }
      yield {
        label: 'EnumMember',
        kind: CompletionItemKind.EnumMember
      }
      yield {
        label: 'Constant',
        kind: CompletionItemKind.Constant
      }
      yield {
        label: 'Struct',
        kind: CompletionItemKind.Struct
      }
      yield {
        label: 'Event',
        kind: CompletionItemKind.Event
      }
      yield {
        label: 'Operator',
        kind: CompletionItemKind.Operator
      }
      yield {
        label: 'TypeParameter',
        kind: CompletionItemKind.TypeParameter
      }
    }
  })

  const completions = await completionSource(new CompletionContext(view.state, 3, false))

  expect(completions).toStrictEqual({
    commitCharacters: undefined,
    from: 3,
    options: [
      {
        commitCharacters: undefined,
        detail: undefined,
        info: undefined,
        label: 'Text',
        section: undefined,
        type: 'text'
      },
      {
        commitCharacters: undefined,
        detail: undefined,
        info: undefined,
        label: 'Method',
        section: undefined,
        type: 'method'
      },
      {
        commitCharacters: undefined,
        detail: undefined,
        info: undefined,
        label: 'Function',
        section: undefined,
        type: 'function'
      },
      {
        commitCharacters: undefined,
        detail: undefined,
        info: undefined,
        label: 'Constructor',
        section: undefined,
        type: 'class'
      },
      {
        commitCharacters: undefined,
        detail: undefined,
        info: undefined,
        label: 'Field',
        section: undefined,
        type: 'property'
      },
      {
        commitCharacters: undefined,
        detail: undefined,
        info: undefined,
        label: 'Variable',
        section: undefined,
        type: 'variable'
      },
      {
        commitCharacters: undefined,
        detail: undefined,
        info: undefined,
        label: 'Class',
        section: undefined,
        type: 'class'
      },
      {
        commitCharacters: undefined,
        detail: undefined,
        info: undefined,
        label: 'Interface',
        section: undefined,
        type: 'type'
      },
      {
        commitCharacters: undefined,
        detail: undefined,
        info: undefined,
        label: 'Module',
        section: undefined,
        type: 'namespace'
      },
      {
        commitCharacters: undefined,
        detail: undefined,
        info: undefined,
        label: 'Property',
        section: undefined,
        type: 'property'
      },
      {
        commitCharacters: undefined,
        detail: undefined,
        info: undefined,
        label: 'Unit',
        section: undefined,
        type: 'keyword'
      },
      {
        commitCharacters: undefined,
        detail: undefined,
        info: undefined,
        label: 'Value',
        section: undefined,
        type: 'variable'
      },
      {
        commitCharacters: undefined,
        detail: undefined,
        info: undefined,
        label: 'Enum',
        section: undefined,
        type: 'enum'
      },
      {
        commitCharacters: undefined,
        detail: undefined,
        info: undefined,
        label: 'Keyword',
        section: undefined,
        type: 'keyword'
      },
      {
        commitCharacters: undefined,
        detail: undefined,
        info: undefined,
        label: 'Snippet',
        section: undefined,
        type: 'text'
      },
      {
        commitCharacters: undefined,
        detail: undefined,
        info: undefined,
        label: 'Color',
        section: undefined,
        type: 'constant'
      },
      {
        commitCharacters: undefined,
        detail: undefined,
        info: undefined,
        label: 'File',
        section: undefined,
        type: undefined
      },
      {
        commitCharacters: undefined,
        detail: undefined,
        info: undefined,
        label: 'Reference',
        section: undefined,
        type: 'variable'
      },
      {
        commitCharacters: undefined,
        detail: undefined,
        info: undefined,
        label: 'Folder',
        section: undefined,
        type: undefined
      },
      {
        commitCharacters: undefined,
        detail: undefined,
        info: undefined,
        label: 'EnumMember',
        section: undefined,
        type: 'enum'
      },
      {
        commitCharacters: undefined,
        detail: undefined,
        info: undefined,
        label: 'Constant',
        section: undefined,
        type: 'constant'
      },
      {
        commitCharacters: undefined,
        detail: undefined,
        info: undefined,
        label: 'Struct',
        section: undefined,
        type: 'type'
      },
      {
        commitCharacters: undefined,
        detail: undefined,
        info: undefined,
        label: 'Event',
        section: undefined,
        type: 'variable'
      },
      {
        commitCharacters: undefined,
        detail: undefined,
        info: undefined,
        label: 'Operator',
        section: undefined,
        type: 'keyword'
      },
      {
        commitCharacters: undefined,
        detail: undefined,
        info: undefined,
        label: 'TypeParameter',
        section: undefined,
        type: 'type'
      }
    ]
  })
})

test('textEditText', async () => {
  const view = new EditorView({
    doc: 'Com\n',
    extensions: [textDocument()]
  })

  const completionSource = createCompletionSource({
    markdownToDom,
    *doComplete() {
      yield {
        label: 'completion',
        textEditText: 'pletion'
      }
    }
  })

  const completions = await completionSource(new CompletionContext(view.state, 3, false))

  expect(completions).toStrictEqual({
    commitCharacters: undefined,
    from: 3,
    options: [
      {
        apply: 'pletion',
        commitCharacters: undefined,
        detail: undefined,
        info: undefined,
        label: 'completion',
        section: undefined,
        type: undefined
      }
    ]
  })
})

test('textEdit plain text', async () => {
  const view = new EditorView({
    doc: 'Commm\n',
    extensions: [textDocument()]
  })

  const completionSource = createCompletionSource({
    markdownToDom,
    *doComplete() {
      yield {
        label: 'completion',
        textEdit: {
          newText: 'pletion',
          range: {
            start: { line: 0, character: 3 },
            end: { line: 0, character: 5 }
          }
        }
      }
    }
  })

  const completions = await completionSource(new CompletionContext(view.state, 3, false))

  const apply = completions!.options[0]!.apply as (v: EditorView) => unknown
  apply(view)

  expect(String(view.state.doc)).toBe('Completion\n')
})

test('textEdit snippet', async () => {
  const view = new EditorView({
    doc: '\n',
    extensions: [textDocument()]
  })

  const completionSource = createCompletionSource({
    markdownToDom,
    *doComplete() {
      yield {
        label: 'loop',
        insertTextFormat: InsertTextFormat.Snippet,
        textEdit: {
          newText: 'for (let ${0} = 0; ${0} < ${1}; $0++) { ${1} }',
          insert: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 }
          },
          replace: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 }
          }
        }
      }
    }
  })

  const completions = await completionSource(new CompletionContext(view.state, 3, false))

  const apply = completions!.options[0]!.apply as (v: EditorView) => unknown
  apply(view)
  expect(hasNextSnippetField(view.state)).toBe(true)
  expect(String(view.state.doc)).toBe('for (let  = 0;  < ; ++) {  }\n')
})

test('itemDefaults', async () => {
  const view = new EditorView({
    doc: '\n',
    extensions: [textDocument()]
  })

  const completionSource = createCompletionSource({
    markdownToDom,
    doComplete() {
      return {
        isIncomplete: false,
        itemDefaults: {
          commitCharacters: ['a'],
          insertTextFormat: InsertTextFormat.Snippet
        },
        items: [
          {
            label: 'loop',
            textEdit: {
              newText: 'for (let ${0} = 0; ${0} < ${1}; $0++) { ${1} }',
              range: {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 0 }
              }
            }
          }
        ]
      }
    }
  })

  const completions = await completionSource(new CompletionContext(view.state, 3, false))

  const apply = completions!.options[0]!.apply as (v: EditorView) => unknown
  apply(view)
  expect(hasNextSnippetField(view.state)).toBe(true)
  expect(String(view.state.doc)).toBe('for (let  = 0;  < ; ++) {  }\n')
})
