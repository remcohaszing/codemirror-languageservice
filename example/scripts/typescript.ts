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
import { createLanguageServiceHost, createSys, resolveFileLanguageId } from '@volar/typescript'
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

globalThis.process = {
  cwd() {
    return '/'
  }
} as NodeJS.Process

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

const docUri = 'file:///example.tsx'
const docText = `import { ChangeEventHandler, ReactNode, useState } from 'react'

export namespace Greeting {
  export interface Props {
    /**
     * The name of the person to greet.
     */
    name: string
  }
}

/**
 * Render a greeting for a person.
 */
export function Greeting({ name }: Greeting.Props): ReactNode {
  console.log('Hello', \`$\{name}!\`)

  return (
    <div>
      Hello <strong>{name}</strong>!
    </div>
  )
}

/**
 * Render the app.
 */
export function App(): ReactNode {
  const [name, setName] = useState('Volar')

  const handleChange: ChangeEventHandler = (event) => {
    setName(event.currentTarget.name)
  }

  return (
    <div>
      <input defaultValue={name} onChange={handleChange} />
      <Greeting name={name} />
    </div>
  )
}
`

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
const syncDocuments =
  createUriMap<[TextDocument, number | undefined, ts.IScriptSnapshot | undefined]>()
const fsFileSnapshots = createUriMap<[number | undefined, ts.IScriptSnapshot | undefined]>()
const language = createLanguage(
  [
    {
      getLanguageId: (uri) => syncDocuments.get(uri)?.[0].languageId
    },
    {
      getLanguageId: (uri) => resolveFileLanguageId(uri.path)
    }
  ],
  createUriMap<SourceScript<URI>>(false),
  (uri, includeFsFiles) => {
    let snapshot: ts.IScriptSnapshot | undefined

    const syncDocument = syncDocuments.get(uri)
    if (syncDocument) {
      if (!syncDocument[2] || syncDocument[0].version !== syncDocument[1]) {
        syncDocument[1] = syncDocument[0].version
        syncDocument[2] = ts.ScriptSnapshot.fromString(syncDocument[0].getText())
      }
      snapshot = syncDocument[2]
    } else if (includeFsFiles) {
      const cache = fsFileSnapshots.get(uri)
      const fileName = uriConverter.asFileName(uri)
      const modifiedTime = sys.getModifiedTime?.(fileName)?.valueOf()
      if (!cache || cache[0] !== modifiedTime) {
        if (sys.fileExists(fileName)) {
          const text = sys.readFile(fileName)
          fsFileSnapshots.set(uri, [
            modifiedTime,
            text === undefined ? undefined : ts.ScriptSnapshot.fromString(text)
          ])
        } else {
          fsFileSnapshots.set(uri, [modifiedTime, undefined])
        }
      }
      snapshot = fsFileSnapshots.get(uri)?.[1]
    }

    if (snapshot) {
      language.scripts.set(uri, snapshot)
    } else {
      language.scripts.delete(uri)
    }
  }
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
        return [docUri.slice('file://'.length)]
      }
    })
  }
}
const languageService = createLanguageService(
  language,
  createTypeScriptPlugins(ts, {}),
  env,
  project
)

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
  if (syncDocuments.has(uri)) {
    syncDocuments.get(uri)![0] = document
  } else {
    syncDocuments.set(uri, [document, undefined, undefined])
  }
  return uri
}

const completionOptions: createCompletionSource.Options = {
  section: 'TypeScript',
  markdownToDom,
  triggerCharacters: '":',
  doComplete(document, position) {
    return languageService.getCompletionItems(sync(document), position)
  }
}

const hoverTooltipOptions: createHoverTooltipSource.Options = {
  markdownToDom,
  doHover(document, position) {
    return languageService.getHover(sync(document), position)
  }
}

const lintOptions: createLintSource.Options = {
  doDiagnostics(document) {
    return languageService.getDiagnostics(sync(document))
  }
}

const view = new EditorView({
  doc: docText,
  parent: document.body,
  extensions: [
    textDocument(docUri),
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
  const edits = await languageService.getDocumentFormattingEdits(
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
