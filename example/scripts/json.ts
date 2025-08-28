import type { JSONDocument, TextDocument } from 'vscode-json-languageservice'

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
import rehypeStarryNight from 'rehype-starry-night'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { getLanguageService } from 'vscode-json-languageservice'

import pkg from '../../package.json'

const processor = unified().use(remarkParse).use(remarkRehype).use(rehypeStarryNight)

/**
 * Convert markdown content to a DOM node.
 *
 * @param markdown
 *   The markdown content.
 * @returns
 *   The DOM node that represents the markdown.
 */
async function markdownToDom(markdown: string): Promise<Node> {
  const mdast = processor.parse(markdown)
  const hast = await processor.run(mdast)
  const html = toDom(hast, { fragment: true })
  return html
}

const ls = getLanguageService({
  async schemaRequestService(url) {
    const response = await fetch(url)

    if (response.ok) {
      return response.text()
    }

    throw new Error(await response.text(), { cause: response })
  }
})

const jsonDocuments = new WeakMap<TextDocument, JSONDocument>()

/**
 * Get a cached JSON document from a text document.
 *
 * @param document
 *   The text document to get the matching JSON document for.
 * @returns
 *   The JSON document matching the text document.
 */
function getJSONDocument(document: TextDocument): JSONDocument {
  let jsonDocument = jsonDocuments.get(document)
  if (!jsonDocument) {
    jsonDocument = ls.parseJSONDocument(document)
    jsonDocuments.set(document, jsonDocument)
  }
  return jsonDocument
}

const completionOptions: createCompletionSource.Options = {
  section: 'Word completion',
  markdownToDom,
  triggerCharacters: '":',
  doComplete(document, position) {
    return ls.doComplete(document, position, getJSONDocument(document))
  }
}

const hoverTooltipOptions: createHoverTooltipSource.Options = {
  markdownToDom,
  doHover(document, position) {
    return ls.doHover(document, position, getJSONDocument(document))
  }
}

const lintOptions: createLintSource.Options = {
  doDiagnostics(document) {
    return ls.doValidation(document, getJSONDocument(document))
  }
}

const doc = JSON.stringify(
  {
    $schema: 'https://json.schemastore.org/package.json',
    ...pkg
  },
  undefined,
  2
)

const view = new EditorView({
  doc,
  parent: document.body,
  extensions: [
    textDocument('file:///example.json'),
    json(),
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

document.getElementById('format-button')!.addEventListener('click', () => {
  const document = getTextDocument(view.state)
  const text = document.getText()
  const start = document.positionAt(0)
  const end = document.positionAt(text.length)
  const edits = ls.format(document, { start, end }, { insertSpaces: true, tabSize: 2 })

  dispatchTextEdits(view, edits)
})
