import { type MarkedString, type MarkupContent } from 'vscode-languageserver-protocol'

/**
 * Process markdown into a DOM.
 *
 * @param parent
 *   The container DOM element to append the DOM nodes to.
 * @param markdown
 *   The markdown to process.
 * @param options
 *   Additional options.
 */
function processMarkdown(
  parent: ParentNode,
  markdown: string,
  options: fromMarkupContent.Options
): undefined {
  const nodes = options.markdownToDom(markdown)
  if (typeof nodes !== 'string' && Symbol.iterator in nodes) {
    parent.append(...nodes)
  } else {
    parent.append(nodes)
  }
}

export declare namespace fromMarkupContent {
  interface Options {
    /**
     * Convert a markdown string to DOM.
     *
     * @param markdown
     *   The markdown to convert
     * @returns
     *   DOM nodes or text to append to the resulting DOM container.
     */
    markdownToDom: (markdown: string) => Iterable<Node | string> | Node | string
  }
}

/**
 * Convert LSP markup content or a marked string into a DOM.
 *
 * @param contents
 *   The LSP contents to process.
 * @param parent
 *   The container node to append the DOM nodes to.
 * @param options
 *   Additional options.
 * @returns
 *   The parent container.
 */
export function fromMarkupContent<Parent extends ParentNode>(
  contents: MarkedString | MarkedString[] | MarkupContent,
  parent: Parent,
  options: fromMarkupContent.Options
): Parent {
  if (Array.isArray(contents)) {
    for (const content of contents) {
      fromMarkupContent(content, parent, options)
    }
  } else if (typeof contents === 'string') {
    processMarkdown(parent, contents, options)
  } else if ('kind' in contents) {
    if (contents.kind === 'markdown') {
      processMarkdown(parent, contents.value, options)
    } else {
      const paragraph = document.createElement('p')
      paragraph.append(contents.value)
      parent.append(paragraph)
    }
  } else {
    const pre = document.createElement('pre')
    const code = document.createElement('code')
    code.classList.add(`language-${contents.language}`)
    code.append(contents.value)
    pre.append(code)
    parent.append(pre)
  }

  return parent
}
