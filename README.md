Citation.js plugin for the [Hayagriva](https://github.com/typst/hayagriva)
YAML format (v0.1.1) used in [Typst](https://typst.app/).

[![NPM version](https://img.shields.io/npm/v/@citation-js/plugin-hayagriva.svg)](https://npmjs.org/package/@citation-js/plugin-hayagriva)
[![Codecov](https://img.shields.io/codecov/c/gh/citation-js/plugin-hayagriva)](https://app.codecov.io/gh/citation-js/plugin-hayagriva)
[![NPM total downloads](https://img.shields.io/npm/dt/@citation-js/plugin-hayagriva.svg)](https://npmcharts.com/compare/@citation-js%2Fplugin-hayagriva?minimal=true)
![License](https://img.shields.io/npm/l/@citation-js/plugin-hayagriva.svg)

## Install

```js
npm install @citation-js/plugin-hayagriva
```

## Use

Install the plugin by `require`-ing it:

```js
require('@citation-js/plugin-hayagriva')
```

## Formats

Formats and other features added by this plugin.

### Input

Because Hayagriva has no distinguishing characteristics (compared to other
bibliographical formats) that can be expected to occur in (nearly) all records,
types have to be indicates manually:

```js
const input = `citation-js:
    type: article
    title: "Citation.js: a format-independent, modular bibliography tool for the browser and command line"
    author: Willighagen, Lars G.
    date: 2019-08-12
    doi: 10.7717/peerj-cs.214
    serial-number: e214
    parent:
      type: periodical
      title:
        value: PeerJ Computer Science
        verbatim: true
      volume: 5
      issn: 2376-5992`

Cite(input, { forceType: '@hayagriva/file' })

{
  type: 'article-journal',
  title: 'Citation.js: a format-independent, modular bibliography tool for the browser and command line',
  author: [{ family: 'Willighagen', given: 'Lars G.' }],
  issued: [{ 'date-parts': [[2019, 8, 12]] }],
  number: 'e214',
  volume: 5,
  'container-title': '<span class="nocase">PeerJ Computer Science</span>',
  DOI: '10.7717/peerj-cs.214',
  ISSN: '2376-5992'
}
```

### Output

```js
Cite(...).format('hayagriva', { asObject: false /* or true */ })
```

## License

The code and most other contents in this repository is [licensed MIT](LICENSE).
`test/input.yml` contains [examples from the Hayagriva repository](https://github.com/typst/hayagriva/blob/v0.1.1/tests/basic.yml),
dual-licensed under [MIT](https://github.com/typst/hayagriva/blob/v0.1.1/LICENSE-MIT).
