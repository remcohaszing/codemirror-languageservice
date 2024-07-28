import { type Diagnostic as CodeMirrorDiagnostic, type LintSource } from '@codemirror/lint'
import { type Diagnostic, type DiagnosticTag } from 'vscode-languageserver-protocol'
import { type TextDocument } from 'vscode-languageserver-textdocument'

import { getTextDocument } from './text-document.js'
import { type LSPResult } from './types.js'

const defaultFormatSource: NonNullable<createLintSource.Options['formatSource']> = (diagnostic) => {
  let result = diagnostic.source ?? ''
  if (diagnostic.code) {
    if (result) {
      result += ':'
    }
    return result + diagnostic.code
  }
  if (result) {
    return result
  }
}

export declare namespace createLintSource {
  interface Options {
    /**
     * Provide LSP diagnostics.
     *
     * @param textDocument
     *   The text document for which to provide diagnostics.
     * @returns
     *   An array of LSP diagnostics.
     */
    doDiagnostics: (textDocument: TextDocument) => LSPResult<Iterable<Diagnostic>>

    /**
     * Format the source of a diagnostic.
     *
     * @param diagnostic
     *   The diagnostic for which to format the source.
     * @returns
     *   The formatted source
     */
    formatSource?: (diagnostic: Diagnostic) => string | undefined

    /**
     * An additional class for all diagnostics provided by this validation.
     */
    markClass?: string
  }
}

/**
 * Create an LSP based lint source.
 *
 * By default CodeMirror provides styling for the `cm-lintRange-hint`, `cm-lintRange-info`,
 * `cm-lintRange-warning`, and `cm-lintRange-error` classes. This extension also uses the
 * `cm-lintRange-deprecated` and `cm-lintRange-unnecessary` classes which you may want to style. For
 * example:
 *
 * ```css
 *.cm-lintRange-deprecated {
 *   background-image: none !important;
 *   text-decoration: line-through;
 * }
 *
 * .cm-lintRange-unnecessary {
 *   background-repeat: no-repeat !important;
 *   opacity: 0.4;
 * }
 * ```
 *
 * @param options
 *   Options to configure the linting.
 * @returns
 *   A CodeMirror lint source that uses LSP based diagnostics.
 */
export function createLintSource(options: createLintSource.Options): LintSource {
  const formatSource = options.formatSource ?? defaultFormatSource

  return async (view) => {
    const textDocument = getTextDocument(view.state)

    const diagnostics = await options.doDiagnostics(textDocument)
    const results: CodeMirrorDiagnostic[] = []

    if (!diagnostics) {
      return results
    }

    if (textDocument.version !== getTextDocument(view.state).version) {
      return results
    }

    for (const diagnostic of diagnostics) {
      const { codeDescription, message, range, severity, tags } = diagnostic
      let markClass = options.markClass ?? ''
      if (tags?.includes(1 satisfies typeof DiagnosticTag.Unnecessary)) {
        markClass += ' cm-lintRange-unnecessary'
      }

      if (tags?.includes(2 satisfies typeof DiagnosticTag.Deprecated)) {
        markClass += ' cm-lintRange-deprecated'
      }

      results.push({
        message,
        from: textDocument.offsetAt(range.start),
        to: textDocument.offsetAt(range.end),
        markClass,
        source: formatSource(diagnostic),
        renderMessage: codeDescription
          ? () => {
              const fragment = document.createDocumentFragment()
              const anchor = document.createElement('a')
              anchor.href = codeDescription.href
              anchor.textContent = codeDescription.href
              fragment.append(message, document.createElement('br'), anchor)
              return fragment
            }
          : undefined,
        severity:
          severity === 4 ? 'hint' : severity === 3 ? 'info' : severity === 2 ? 'warning' : 'error'
      })
    }

    return results
  }
}
