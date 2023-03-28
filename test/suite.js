/* eslint-env mocha */

const path = require('path')
const assert = require('assert')
const fs = require('fs')
const { plugins } = require('@citation-js/core')
require('@citation-js/plugin-yaml')

require('@babel/register')
require('../src/')

const input = fs.readFileSync(path.join(__dirname, 'input.yml'), 'utf8').split('\n\n')
const output = fs.readFileSync(path.join(__dirname, 'output.yml'), 'utf8').split('\n\n')
const data = require('./data.js')

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
