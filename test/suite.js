import assert from 'node:assert'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { describe, it } from 'node:test'

import { plugins } from '@citation-js/core'
import '../src/index.js'

import data from './data.js'

async function readFile (filePath) {
  return fs.readFile(path.join(import.meta.dirname, filePath), 'utf8').then(file => file.split('\n\n'))
}

const input = await readFile('input.yml')
const output = await readFile('output.yml')

describe('hayagriva', function () {
  describe('parsing', function () {
    const n = Math.max(input.length, data.length)
    for (let i = 0; i < n; i++) {
      it(data[i] ? data[i]['citation-key'] : 'test-' + i, function () {
        const parsed = plugins.input.chain(input[i], { forceType: '@hayagriva/file', generateGraph: false })
        assert.deepStrictEqual(parsed[0], data[i])
      })
    }
  })

  describe('formatting', function () {
    for (let i = 0; i < data.length; i++) {
      it(data[i]['citation-key'], function () {
        const formatted = plugins.output.format('hayagriva', [data[i]], { asObject: true })
        assert.deepStrictEqual(formatted, plugins.input.chainLink(output[i]))
      })
    }
  })
})
