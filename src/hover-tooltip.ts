import { type HoverTooltipSource } from '@codemirror/view'
import { type Hover, type Position } from 'vscode-languageserver-protocol'
import { type TextDocument } from 'vscode-languageserver-textdocument'

import { fromMarkupContent } from './markup-content.js'
import { getTextDocument } from './text-document.js'
import { type LSPResult } from './types.js'

export declare namespace createHoverTooltipSource {
  interface Options extends fromMarkupContent.Options {
    /**
     * Provide LSP hover info.
     *
     * @param textDocument
     *   The text document for which to provide hover info.
     * @param position
     *   The position for which to provide hover info.
     * @returns
     *   The hover info for the given document and position.
     */
    doHover: (textDocument: TextDocument, position: Position) => LSPResult<Hover>
  }
}

/**
 * Create an LSP based hover tooltip provider.
 *
 * @param options
 *   Options to configure the hover tooltips.
 * @returns
 *   A CodeMirror hover tooltip source that uses LSP based hover information.
 */
export function createHoverTooltipSource(
  options: createHoverTooltipSource.Options
): HoverTooltipSource {
  return async (view, pos) => {
    const textDocument = getTextDocument(view.state)

    const info = await options.doHover(textDocument, textDocument.positionAt(pos))

    if (!info) {
      return null
    }

    if (textDocument.version !== getTextDocument(view.state).version) {
      return null
    }

    let start = pos
    let end: number | undefined
    const { contents, range } = info

    if (range) {
      start = textDocument.offsetAt(range.start)
      end = textDocument.offsetAt(range.end)
    }

    return {
      pos: start,
      end,
      create: () => ({ dom: fromMarkupContent(contents, document.createElement('div'), options) })
    }
  }
}
