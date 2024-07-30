import { autocompletion, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { json } from '@codemirror/lang-json'
import { foldGutter, foldKeymap } from '@codemirror/language'
import { linter, lintKeymap } from '@codemirror/lint'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView, hoverTooltip, keymap, lineNumbers } from '@codemirror/view'
import {
  createCompletionSource,
  createHoverTooltipSource,
  createLintSource,
  dispatchTextEdits,
  getTextDocument,
  textDocument
} from 'codemirror-languageservice'
import { toDom } from 'hast-util-to-dom'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { toHast } from 'mdast-util-to-hast'
import {
  CompletionItemKind,
  DiagnosticSeverity,
  DiagnosticTag,
  InsertTextFormat
} from 'vscode-languageserver-types'

/**
 * Convert markdown content to a DOM node.
 *
 * @param markdown
 *   The markdown content.
 * @returns
 *   The DOM node that represents the markdown.
 */
function markdownToDom(markdown: string): Node {
  const mdast = fromMarkdown(markdown)
  const hast = toHast(mdast)
  return toDom(hast, { fragment: true })
}

const completionOptions: createCompletionSource.Options = {
  section: 'Word completion',
  markdownToDom,
  *doComplete(document, position, context) {
    const text = document.getText()
    const start = document.positionAt(document.offsetAt(position) - 1)

    if (!context.triggerCharacter) {
      return
    }

    for (const match of text.matchAll(/\b\S+\b/g)) {
      const [word] = match

      if (!word.startsWith(context.triggerCharacter)) {
        continue
      }

      yield {
        label: word,
        kind: CompletionItemKind.Text,
        insertTextFormat: InsertTextFormat.Snippet,
        detail: 'text',
        documentation: `Insert the text _“${word}”_ here`,
        textEdit: {
          newText: word,
          range: {
            start,
            end: position
          }
        }
      }
    }
  }
}

const hoverTooltipOptions: createHoverTooltipSource.Options = {
  markdownToDom,
  doHover(document, position) {
    const text = document.getText()
    const offset = document.offsetAt(position)

    for (const match of text.matchAll(/\b\S+\b/g)) {
      const [word] = match
      const start = match.index
      const end = start + word.length

      if (offset >= start && offset <= end) {
        return {
          contents: `You are hovering the word _“${word}”_`,
          range: {
            start: document.positionAt(start),
            end: document.positionAt(end)
          }
        }
      }
    }
  }
}

const lintOptions: createLintSource.Options = {
  *doDiagnostics(document) {
    const text = document.getText()

    for (const match of text.matchAll(/deprecated|hint|info|warning|error|unnecessary/gi)) {
      const [word] = match
      const start = match.index
      const end = start + word.length
      const tags: DiagnosticTag[] = []
      const lower = word.toLowerCase()

      if (lower === 'deprecated') {
        tags.push(DiagnosticTag.Deprecated)
      } else if (lower === 'unnecessary') {
        tags.push(DiagnosticTag.Unnecessary)
      }

      yield {
        message: `Invalid word “${word}”`,
        severity:
          lower === 'error'
            ? DiagnosticSeverity.Error
            : lower === 'warning'
              ? DiagnosticSeverity.Warning
              : lower === 'info'
                ? DiagnosticSeverity.Information
                : DiagnosticSeverity.Hint,
        source: 'regexp',
        code: lower,
        codeDescription: {
          href: 'https://example.com'
        },
        tags,
        range: {
          start: document.positionAt(start),
          end: document.positionAt(end)
        }
      }
    }
  }
}

const doc = `This demo shows how you can integrate an LSP based language service
into CodeMirror.

The completion source autocompletes words based on the words in the document and
the character typed.

The hovert tooltip source shows a tooltip which displays the word you’re
hovering over.

The lint source shows diagnostics for the words hint, info, warning, error,
unnecessary, and deprecated.

CodeMirror doesn’t have a builtin formatter, but you can apply your own
formatting solution. The “Lowercase” button applies LSP compatible text edits to
make all text lowercase, whereas the “Uppercase” button applies LSP compatible
text edits to make all text uppercase.
`

const view = new EditorView({
  doc,
  parent: document.body,
  extensions: [
    textDocument('file:///example.txt'),
    lineNumbers(),
    oneDark,
    foldGutter(),
    history(),
    autocompletion({
      override: [createCompletionSource(completionOptions)]
    }),
    json(),
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...completionKeymap,
      ...lintKeymap
    ]),
    hoverTooltip(createHoverTooltipSource(hoverTooltipOptions)),
    linter(createLintSource(lintOptions))
  ]
})

document.getElementById('lowercase-button')!.addEventListener('click', () => {
  const document = getTextDocument(view.state)
  const text = document.getText()

  dispatchTextEdits(view, [
    {
      newText: text.toLowerCase(),
      range: {
        start: document.positionAt(0),
        end: document.positionAt(text.length)
      }
    }
  ])
})

document.getElementById('uppercase-button')!.addEventListener('click', () => {
  const document = getTextDocument(view.state)
  const text = document.getText()

  dispatchTextEdits(view, [
    {
      newText: text.toUpperCase(),
      range: {
        start: document.positionAt(0),
        end: document.positionAt(text.length)
      }
    }
  ])
})
