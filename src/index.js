import { plugins } from '@citation-js/core'
import { parse, format } from './mapping.js'

plugins.add('@hayagriva', {
  input: {
    '@hayagriva/file': {
      parse (file) {
        if (plugins.input.type(file) !== '@else/yaml') {
          throw new SyntaxError('Expected a YAML file as input')
        }
        return parse(plugins.input.chainLink(file))
      }
    },
    '@hayagriva/records': {
      parse
    }
  },
  output: {
    hayagriva: format
  }
})
