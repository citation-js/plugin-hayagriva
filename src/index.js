import { plugins } from '@citation-js/core'
import { parse, format } from './mapping.js'

plugins.add('@hayagriva', {
  input: {
    '@hayagriva/file': {
      parse
    }
  },
  output: {
    hayagriva: format
  }
})
