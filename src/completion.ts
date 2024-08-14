import {
  type Completion,
  type CompletionSource,
  insertCompletionText,
  snippet
} from '@codemirror/autocomplete'
import {
  type CompletionContext,
  type CompletionItem,
  type CompletionItemKind,
  type CompletionList,
  type CompletionTriggerKind,
  type InsertTextFormat,
  type Position
} from 'vscode-languageserver-protocol'
import { type TextDocument } from 'vscode-languageserver-textdocument'

import { fromMarkupContent } from './markup-content.js'
import { getTextDocument } from './text-document.js'
import { type LSPResult } from './types.js'

let alphabet = 'abcdefghijklmnopqrstuvwxyz'
alphabet += alphabet.toUpperCase()

const defaultFromCompletionItemKind: NonNullable<
  createCompletionSource.Options['fromCompletionItemKind']
> = (kind) => {
  switch (kind) {
    case 1 satisfies typeof CompletionItemKind.Text:
    case 15 satisfies typeof CompletionItemKind.Snippet:
      return 'text'

    case 2 satisfies typeof CompletionItemKind.Method:
      return 'method'

    case 3 satisfies typeof CompletionItemKind.Function:
      return 'function'

    case 4 satisfies typeof CompletionItemKind.Constructor:
    case 7 satisfies typeof CompletionItemKind.Class:
      return 'class'

    case 5 satisfies typeof CompletionItemKind.Field:
    case 10 satisfies typeof CompletionItemKind.Property:
      return 'property'

    case 6 satisfies typeof CompletionItemKind.Variable:
    case 12 satisfies typeof CompletionItemKind.Value:
    case 18 satisfies typeof CompletionItemKind.Reference:
    case 23 satisfies typeof CompletionItemKind.Event:
      return 'variable'

    case 8 satisfies typeof CompletionItemKind.Interface:
    case 22 satisfies typeof CompletionItemKind.Struct:
    case 25 satisfies typeof CompletionItemKind.TypeParameter:
      return 'type'

    case 9 satisfies typeof CompletionItemKind.Module:
      return 'namespace'

    case 13 satisfies typeof CompletionItemKind.Enum:
      return 'enum'

    case 11 satisfies typeof CompletionItemKind.Unit:
    case 14 satisfies typeof CompletionItemKind.Keyword:
    case 24 satisfies typeof CompletionItemKind.Operator:
      return 'keyword'

    case 16 satisfies typeof CompletionItemKind.Color:
    case 21 satisfies typeof CompletionItemKind.Constant:
      return 'constant'

    case 20 satisfies typeof CompletionItemKind.EnumMember:
      return 'enum'

    default:
  }
}

export declare namespace createCompletionSource {
  interface Options extends fromMarkupContent.Options {
    /**
     * Convert an LSP completion item kind to a CodeMirror completion type.
     *
     * @param kind
     *   The LSP completion item kind to convert
     * @returns
     *   The CodeMirror completion type.
     */
    fromCompletionItemKind?: (kind: CompletionItemKind | undefined) => string | undefined

    /**
     * Provide LSP completions items.
     *
     * @param textDocument
     *   The text document for which to provide completion items.
     * @param position
     *   The position for which to provide completion items.
     * @param context
     *   The completion context.
     * @returns
     *   A completion list, or just the items as an iterable.
     */
    doComplete: (
      textDocument: TextDocument,
      position: Position,
      context: CompletionContext
    ) => LSPResult<CompletionList | Iterable<CompletionItem>>

    /**
     * The section to use for completions.
     */
    section?: string

    /**
     * Only trigger completions automatically when one of these characters is typed.
     */
    triggerCharacters?: string
  }
}

/**
 * Create an LSP based completion source.
 *
 * @param options
 *   Options to configure the completion.
 * @returns
 *   A CodeMirror completion source that uses LSP based completions.
 */
export function createCompletionSource(options: createCompletionSource.Options): CompletionSource {
  const fromCompletionItemKind = options.fromCompletionItemKind ?? defaultFromCompletionItemKind
  let triggerCharacters = alphabet
  if (options.triggerCharacters) {
    triggerCharacters += options.triggerCharacters
  }

  return async (context) => {
    const textDocument = getTextDocument(context.state)

    let completionContext: CompletionContext
    if (context.explicit) {
      completionContext = {
        triggerKind: 1 satisfies typeof CompletionTriggerKind.Invoked
      }
    } else {
      const triggerCharacter = context.state.sliceDoc(context.pos - 1, context.pos)
      if (!triggerCharacters.includes(triggerCharacter)) {
        return null
      }

      completionContext = {
        triggerCharacter,
        triggerKind: 2 satisfies typeof CompletionTriggerKind.TriggerCharacter
      }
    }

    const completions = await options.doComplete(
      textDocument,
      textDocument.positionAt(context.pos),
      completionContext
    )

    if (!completions) {
      return null
    }

    if (textDocument.version !== getTextDocument(context.view?.state ?? context.state).version) {
      return null
    }

    let items: Iterable<CompletionItem>
    let itemDefaults: CompletionList['itemDefaults']
    if (Symbol.iterator in completions) {
      items = completions
    } else {
      items = completions.items
      itemDefaults = completions.itemDefaults
    }

    const completionOptions: Completion[] = []
    let minFrom = context.pos
    let maxTo = context.pos

    for (const item of items) {
      const { commitCharacters, detail, documentation, kind, label, textEdit, textEditText } = item
      const completion: Completion = {
        commitCharacters,
        detail,
        info:
          documentation &&
          (() => fromMarkupContent(documentation, document.createDocumentFragment(), options)),
        label,
        section: options.section,
        type: fromCompletionItemKind(kind)
      }

      if (textEdit) {
        const range = 'range' in textEdit ? textEdit.range : textEdit.replace
        const from = textDocument.offsetAt(range.start)
        const to = textDocument.offsetAt(range.end)
        if (from < minFrom) {
          minFrom = from
        }
        if (to > maxTo) {
          maxTo = to
        }
        const insert = textEdit.newText
        const insertTextFormat = item.insertTextFormat ?? itemDefaults?.insertTextFormat

        completion.apply = (view) =>
          insertTextFormat === (2 satisfies typeof InsertTextFormat.Snippet)
            ? snippet(insert.replaceAll(/\$(\d+)/g, '$${$1}'))(view, completion, from, to)
            : view.dispatch(insertCompletionText(view.state, insert, from, to))
      } else if (textEditText) {
        completion.apply = textEditText
      }

      completionOptions.push(completion)
    }

    return {
      from: minFrom,
      to: maxTo,
      commitCharacters: itemDefaults?.commitCharacters,
      options: completionOptions
    }
  }
}
