import { autocompletion, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { javascript } from '@codemirror/lang-javascript'
import { foldGutter, foldKeymap } from '@codemirror/language'
import { linter, lintKeymap } from '@codemirror/lint'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView, hoverTooltip, keymap, lineNumbers } from '@codemirror/view'
import { createNpmFileSystem } from '@volar/jsdelivr'
import {
  createLanguage,
  createLanguageService,
  createUriMap,
  type LanguageServiceEnvironment,
  type ProjectContext,
  type SourceScript
} from '@volar/language-service'
import { createLanguageServiceHost, createSys } from '@volar/typescript'
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
import * as ts from 'typescript'
import { create as createTypeScriptPlugins } from 'volar-service-typescript'
import { type TextDocument } from 'vscode-languageserver-textdocument'
import { URI } from 'vscode-uri'

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
  const html = toDom(hast, { fragment: true })
  return html
}

/**
 * Do nothing
 */
function noop(): undefined {
  // Do nothing
}

const fileName = '/example.tsx'
const env: LanguageServiceEnvironment = {
  fs: createNpmFileSystem(),
  workspaceFolders: []
}
const uriConverter = {
  asUri: URI.file,
  asFileName(uri: URI) {
    return uri.path
  }
}
const sys = createSys(ts.sys, env, () => '', uriConverter)
const documents = new Map<URI, TextDocument>()
const language = createLanguage(
  [
    {
      getLanguageId(scriptId) {
        const document = documents.get(scriptId)
        return document?.languageId
      }
    }
  ],
  createUriMap<SourceScript<URI>>(false),
  noop
)
const project: ProjectContext = {
  typescript: {
    configFileName: '',
    sys,
    uriConverter,
    ...createLanguageServiceHost(ts, sys, language, URI.file, {
      getCompilationSettings() {
        return {
          checkJs: true,
          jsx: ts.JsxEmit.ReactJSX,
          module: ts.ModuleKind.Preserve,
          target: ts.ScriptTarget.ESNext
        }
      },
      getCurrentDirectory() {
        return sys.getCurrentDirectory()
      },
      getScriptFileNames() {
        return [fileName]
      }
    })
  }
}
const ls = createLanguageService(language, createTypeScriptPlugins(ts, {}), env, project)

/**
 * Synchronize a document from CodeMirror into Volar.
 *
 * @param document
 *   The document to synchronize.
 * @returns
 *   The URI that matches the document.
 */
function sync(document: TextDocument): URI {
  const uri = URI.parse(document.uri)
  documents.set(uri, document)
  language.scripts.set(uri, {
    getChangeRange: noop,
    getLength() {
      return document.getText().length
    },
    getText(start, end) {
      return document.getText({
        start: document.positionAt(start),
        end: document.positionAt(end)
      })
    }
  })
  return uri
}

const completionOptions: createCompletionSource.Options = {
  section: 'TypeScript',
  markdownToDom,
  triggerCharacters: '":',
  doComplete(document, position) {
    return ls.getCompletionItems(sync(document), position)
  }
}

const hoverTooltipOptions: createHoverTooltipSource.Options = {
  markdownToDom,
  doHover(document, position) {
    return ls.getHover(sync(document), position)
  }
}

const lintOptions: createLintSource.Options = {
  doDiagnostics(document) {
    return ls.getDiagnostics(sync(document))
  }
}

const doc = `import {} from 'react'

console.log('hi!')

foo(
`

const view = new EditorView({
  doc,
  parent: document.body,
  extensions: [
    textDocument(String(URI.file(fileName))),
    javascript(),
    lineNumbers(),
    oneDark,
    foldGutter(),
    history(),
    autocompletion({
      override: [createCompletionSource(completionOptions)]
    }),
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

document.getElementById('format-button')!.addEventListener('click', async () => {
  const document = getTextDocument(view.state)
  const text = document.getText()
  const start = document.positionAt(0)
  const end = document.positionAt(text.length)
  const edits = await ls.getDocumentFormattingEdits(
    URI.parse(document.uri),
    { insertSpaces: true, tabSize: 2 },
    { start, end },
    // eslint-disable-next-line unicorn/no-useless-undefined
    undefined
  )

  if (edits) {
    dispatchTextEdits(view, edits)
  }
})
