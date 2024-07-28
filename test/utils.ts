import { toDom } from 'hast-util-to-dom'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { toHast } from 'mdast-util-to-hast'

/**
 * Convert markdown content to a DOM node.
 *
 * @param markdown
 *   The markdown content.
 * @returns
 *   The DOM node that represents the markdown.
 */
export function markdownToDom(markdown: string): Node {
  const mdast = fromMarkdown(markdown)
  const hast = toHast(mdast)
  return toDom(hast, { fragment: true })
}
