import { language } from '@codemirror/language'
import { type EditorState, type Extension, Facet, StateField } from '@codemirror/state'
import { TextDocument } from 'vscode-languageserver-textdocument'

let inmemoryDocumentCounter = 0

/**
 * Get the first value of an array of strings.
 *
 * @param values
 *   The input array.
 * @returns
 *   The first value of the input array.
 */
function combine(values: readonly string[]): string {
  return values.at(-1)!
}

/**
 * A CodeMirror {@link Facet} used to track the text document URI.
 */
const uriFacet = Facet.define({
  combine
})

/**
 * A CodeMirror {@link StateField} used to track the {@link TextDocument}.
 */
const textDocumentField = StateField.define<TextDocument>({
  create(state) {
    const stateUri = state.facet(uriFacet)
    const stateLanguage = state.facet(language)
    const languageId = stateLanguage?.name || 'plaintext'

    return TextDocument.create(stateUri, languageId, 0, String(state.doc))
  },

  update(value, transaction) {
    const stateUri = transaction.state.facet(uriFacet)
    const stateLanguage = transaction.state.facet(language)
    const languageId = stateLanguage?.name || 'plaintext'

    if (stateUri !== value.uri) {
      return TextDocument.create(stateUri, languageId, 0, String(transaction.newDoc))
    }

    if (transaction.docChanged || languageId !== value.languageId) {
      return TextDocument.create(
        stateUri,
        languageId,
        value.version + 1,
        String(transaction.newDoc)
      )
    }

    return value
  }
})

/**
 * Assign a {@link TextDocument} to an editor state.
 *
 * This text document is used by other extensions provided by `codemirror-languageservice`.
 *
 * The language ID is determined from the name of the
 * [language](https://codemirror.net/#languages) used. If this isn’t found, the language ID defaults
 * to `plaintext`.
 *
 * @param uri
 *   The URI to use for the text document. If this is left unspecified, an auto-incremented
 *   `inmemory://` URI is used.
 * @returns
 *   A CodeMirror {@link Extension}.
 * @example
 *   ```ts
 *   import { json } from '@codemirror/lang-json'
 *   import { EditorState } from '@codemirror/state'
 *   import { textDocument } from 'codemirror-languageservice'
 *
 *   const state = EditorState.create({
 *     doc: 'console.log("Hello world!")\n',
 *     extensions: [
 *       json(),
 *       textDocument('file:///example.js')
 *     ]
 *   })
 *   ```
 */
export function textDocument(uri?: string): Extension {
  let realUri = uri
  if (!realUri) {
    inmemoryDocumentCounter += 1
    realUri = `inmemory://${inmemoryDocumentCounter}`
  }
  return [uriFacet.of(realUri), textDocumentField]
}

/**
 * Get the {@link TextDocument} for a CodeMirror {@link EditorState}.
 *
 * @param state
 *   The editor state to get the text document for.
 * @returns
 *   The text document.
 */
export function getTextDocument(state: EditorState): TextDocument {
  return state.field(textDocumentField)
}
