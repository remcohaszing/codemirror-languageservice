import { type ChangeSpec, type Text } from '@codemirror/state'
import { type EditorView } from '@codemirror/view'
import { type Position, type TextEdit } from 'vscode-languageserver-protocol'

/**
 * Get the character offset of a CodeMirror text document from an LSP position.
 *
 * @param doc
 *   The CodeMirror text document for which to get the offset.
 * @param position
 *   The LSP position to get the offset of.
 * @returns
 *   The offset
 */
function getOffset(doc: Text, position: Position): number {
  const line = doc.line(position.line + 1)
  return line.from + Math.min(position.character, line.length)
}

/**
 * Apply LSP text edits to an CodeMirror {@link EditorView}.
 *
 * @param view
 *   The view to dispatch the changes to.
 * @param edits
 *   The edits that should be applied.
 */
export function dispatchTextEdits(view: EditorView, edits: Iterable<TextEdit>): undefined {
  const changes: ChangeSpec[] = []
  const { doc } = view.state

  for (const edit of edits) {
    changes.push({
      from: getOffset(doc, edit.range.start),
      to: getOffset(doc, edit.range.end),
      insert: edit.newText
    })
  }

  view.dispatch({ changes })
}
