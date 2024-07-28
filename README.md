# codemirror-languageservice

[![github actions](https://github.com/remcohaszing/codemirror-languageservice/actions/workflows/ci.yaml/badge.svg)](https://github.com/remcohaszing/codemirror-languageservice/actions/workflows/ci.yaml)
[![codecov](https://codecov.io/gh/remcohaszing/codemirror-languageservice/branch/main/graph/badge.svg)](https://codecov.io/gh/remcohaszing/codemirror-languageservice)
[![npm version](https://img.shields.io/npm/v/codemirror-languageservice)](https://www.npmjs.com/package/codemirror-languageservice)
[![npm downloads](https://img.shields.io/npm/dm/codemirror-languageservice)](https://www.npmjs.com/package/codemirror-languageservice)

Integrate an [Language Server Protocol][lsp] compatible language service into [CodeMirror][].

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
  - [`createCompletionSource(options)`](#createcompletionsourceoptions)
  - [`createHoverTooltipSource(options)`](#createhovertooltipsourceoptions)
  - [`createLintSource(options)`](#createlintsourceoptions)
  - [`dispatchTextEdits(view, edits)`](#dispatchtexteditsview-edits)
  - [`getTextDocument(state)`](#gettextdocumentstate)
  - [`textDocument(uri?)`](#textdocumenturi)
- [Example](#example)
- [Compatibility](#compatibility)
- [Contributing](#contributing)
- [Related projects](#related-projects)
- [License](#license)

## Installation

This package has peer dependencies on the following packages:

- [`@codemirror/autocomplete`](https://www.npmjs.com/package/@codemirror/autocomplete)
- [`@codemirror/language`](https://www.npmjs.com/package/@codemirror/language)
- [`@codemirror/lint`](https://www.npmjs.com/package/@codemirror/lint)
- [`@codemirror/state`](https://www.npmjs.com/package/@codemirror/state)
- [`@codemirror/view`](https://www.npmjs.com/package/@codemirror/view)

Since you will probably import these directly yourself, it’s recommended to install all of them
explicitly.

```sh
npm install \
  @codemirror/autocomplete \
  @codemirror/language \
  @codemirror/lint \
  @codemirror/state \
  @codemirror/view \
  codemirror-languageservice
```

## Usage

- First, create a [CodeMirror][] `EditorView` as usual.
- Since [LSP][] is based on heavily on files and URIs, you need to add the `textDocument()`
  extension to your editor. It’s recommended to pass a file URI. If none is given, a URI is
  generated that uses the `inmemory://` protocol.
- It’s recommended to add a language extension. This is used to detect the `languageId` for text
  documents. If this isn’t available, the `plaintext` language is used.
- Since [LSP][] uses markdown, you need to provide a function to convert markdown to DOM. A good
  option is to combine [`hast-util-to-dom`](https://github.com/syntax-tree/hast-util-to-dom),
  [`mdast-util-from-markdown`](https://github.com/syntax-tree/mdast-util-from-markdown), and
  [`mdast-util-to-hast`](https://github.com/syntax-tree/mdast-util-to-hast).
- Add your language service integrations.

```js
import { autocompletion } from '@codemirror/autocomplete'
import { json } from '@codemirror/lang-json'
import { linter } from '@codemirror/lint'
import { EditorView, hoverTooltip } from '@codemirror/view'
import {
  createCompletionSource,
  createHoverTooltipSource,
  createLintSource,
  textDocument
} from 'codemirror-languageservice'
import { toDom } from 'hast-util-to-dom'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { toHast } from 'mdast-util-to-hast'

import { doComplete, doDiagnostics, doHover } from './my-language-service.js'

function markdownToDom(markdown) {
  const mdast = fromMarkdown(markdown)
  const hast = toHast(mdast)
  return toDom(hast, { fragment: true })
}

const view = new EditorView({
  doc: '',
  parent: document.getElementById('my-editor'),
  extensions: [
    json(),
    textDocument('file:///example.txt'),
    autocompletion({
      override: [createCompletionSource({ doComplete, markdownToDom })]
    }),
    hoverTooltip(createHoverTooltipSource({ doHover, markdownToDom })),
    linter(createLintSource({ doDiagnostics }))
  ]
})
```

## API

### `createCompletionSource(options)`

Create an LSP based completion source.

#### Options

- `doComplete` (`Function`) — Provide LSP completions items.
- `markdownToDom` (`Function`) — Convert a markdown string to DOM.
- `fromCompletionItemKind` (`Function`, optional) — Convert an LSP completion item kind to a
  CodeMirror completion type.
- `section` (`string`, optional) — The section to use for completions.

#### Returns

A CodeMirror completion source that uses LSP based completions.
([`CompletionSource`](https://codemirror.net/docs/ref/#autocomplete.CompletionSource))

### `createHoverTooltipSource(options)`

Create an LSP based hover tooltip provider.

#### Options

- `doHover` (`Function`) — Provide LSP hover info
- `markdownToDom` (`Function`) — Convert a markdown string to DOM.

#### Returns

A CodeMirror hover tooltip source that uses LSP based hover information.
([`HoverTooltipSource`](https://codemirror.net/docs/ref/#view.HoverTooltipSource))

### `createLintSource(options)`

Create an LSP based lint source.

By default CodeMirror provides styling for the `cm-lintRange-hint`, `cm-lintRange-info`,
`cm-lintRange-warning`, and `cm-lintRange-error` classes. This extension also uses the
`cm-lintRange-deprecated` and `cm-lintRange-unnecessary` classes which you may want to style. For
example:

```css
.cm-lintRange-deprecated {
  background-image: none !important;
  text-decoration: line-through;
}

.cm-lintRange-unnecessary {
  background-repeat: no-repeat !important;
  opacity: 0.4;
}
```

#### Options

- `doDiagnostics` (`Function`) — Provide LSP diagnostics
- `formatSource` (`Function`, optional) — Format the source of a diagnostic.
- `markClass` (`string`, optional) — An additional class for all diagnostics provided by this
  validation.

#### Returns

A CodeMirror lint source that uses LSP based diagnostics.
([`LintSource`](https://codemirror.net/docs/ref/#lint.LintSource))

### `dispatchTextEdits(view, edits)`

Apply LSP text edits to an CodeMirror `EditorView`.

#### Parameters

- `view` ([`EditorView`](https://codemirror.net/docs/ref/#view.EditorView)) — The view to dispatch
  the changes to.
- `edits`
  ([`TextEdit[]`](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#textEditArray))
  — The edits that should be applied.

### `getTextDocument(state)`

Get the text document for a CodeMirror editor state.

#### Parameters

- `state` ([`EditorState`](https://codemirror.net/docs/ref/#state.EditorState)) — The editor state
  to get the text document for.

#### Returns

The text document.
([`TextDocument`](https://github.com/microsoft/vscode-languageserver-node/tree/main/textDocument))

### `textDocument(uri?)`

Assign a text document to an editor state.

This text document is used by other extensions provided by `codemirror-languageservice`.

The language ID is determined from the name of the [language](https://codemirror.net/#languages)
used. If this isn’t found, the language ID defaults to `plaintext`.

#### Parameters

- `uri` (`string`) —The URI to use for the text document. If this is left unspecified, an
  auto-incremented `inmemory://` URI is used.

#### Returns

A CodeMirror extension. ([`Extension`](https://codemirror.net/docs/ref/#state.Extension))

## Example

There’s an example available in the
[`example`](https://github.com/remcohaszing/codemirror-languageservice/blob/main/example) directory.

## Compatibility

This project is compatible with [evergreen](https://www.w3.org/2001/tag/doc/evergreen-web) browsers.

## Contributing

This project provides [LSP][] based integrations for [CodeMirror][]. However, not all LSP features
map well to CodeMirror. The goal is only to provide integrations that make sense for CodeMirror. If
you have a pragmatic idea to integrate another LSP method, feel free to open a
[new issue](https://github.com/remcohaszing/codemirror-languageservice/issues/new).

On top of that, see my general
[contributing guidelines](https://github.com/remcohaszing/.github/blob/main/CONTRIBUTING.md).

## Related projects

- [CodeMirror][] — CodeMirror is a code editor component for the web.
- [Language Server Protocol][LSP] — The Language Server Protocol (LSP) defines the protocol used
  between an editor or IDE and a language server that provides language features like auto complete,
  go to definition, find all references etc.

Known language services that you could use this for:

- [`vscode-css-languageservice`](https://github.com/microsoft/vscode-css-languageservice) — CSS,
  LESS & SCSS language service extracted from VSCode to be reused.
- [`vscode-html-languageservice`](https://github.com/microsoft/vscode-html-languageservice) —
  Language services for HTML.
- [`vscode-json-languageservice`](https://github.com/microsoft/vscode-json-languageservice) — JSON
  language service extracted from VSCode to be reused.
- [`vscode-markdown-languageservice`](https://github.com/microsoft/vscode-markdown-languageservice)
  — The language service that powers VS Code’s Markdown support.
- [`yaml-language-server`](https://github.com/redhat-developer/yaml-language-server) — Language
  Server for YAML Files.
- [`@tailwindcss/language-service`](https://github.com/tailwindlabs/tailwindcss-intellisense) —
  About Intelligent Tailwind CSS tooling.
- [`@volar/language-service`](https://volarjs.dev) — The Embedded Language Tooling Framework.

## License

[MIT](LICENSE.md) © [Remco Haszing](https://github.com/remcohaszing)

[codemirror]: https://codemirror.net
[lsp]: https://microsoft.github.io/language-server-protocol
