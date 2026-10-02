const NEVER_CAPITALIZE = [
  'a',
  'above',
  'across',
  'against',
  'among',
  'an',
  'and',
  'around',
  'as',
  'at',
  'behind',
  'below',
  'beneath',
  'beside',
  'between',
  'but',
  'by',
  'during',
  'for',
  'from',
  'front',
  'in',
  'inside',
  'into',
  'm',
  'n',
  'near',
  'nor',
  'of',
  'on',
  'onto',
  'or',
  'over',
  's',
  'since',
  'so',
  't',
  'the',
  'to',
  'toward',
  'under',
  'underneath',
  'until',
  'with',
  'within',
  'yet'
]

const SENTENCE_RESTART_PATTERN = /[:;]/

function capitalize (word) {
  return word[0].toUpperCase() + word.slice(1).toLowerCase()
}

function toTitleCase (word, sentenceStart) {
  if (word === '') {
    return word
  } else if (NEVER_CAPITALIZE.includes(word) && !sentenceStart) {
    return word.toLowerCase()
  }
  return capitalize(word)
}

function toSentenceCase (word, sentenceStart) {
  if (sentenceStart) {
    return capitalize(word)
  }
  return word.toLowerCase()
}

function parseDeprecatedTitle (value, context) {
  const tokens = value.split(/(\p{L}+)/gu)
  const protectTokenCase = Array(tokens.length).fill(false)

  if (context['sentence-case']) {
    const caseTokens = context['sentence-case'].split(/(\p{L}+)/gu)
    if (tokens.length === caseTokens.length) {
      let sentenceStart = true
      for (let i = 0; i < tokens.length; i++) {
        if (i % 2) {
          if (toSentenceCase(tokens[i], sentenceStart) !== caseTokens[i]) {
            protectTokenCase[i] = true
          }
          sentenceStart = false
        } else if (tokens[i].match(SENTENCE_RESTART_PATTERN)) {
          sentenceStart = true
        }
      }
    }
  }

  if (context['title-case']) {
    const caseTokens = context['title-case'].split(/(\p{L}+)/gu)
    if (tokens.length === caseTokens.length) {
      let sentenceStart = true
      for (let i = 0; i < tokens.length; i++) {
        if (i % 2) {
          if (toTitleCase(tokens[i], sentenceStart) !== caseTokens[i]) {
            protectTokenCase[i] = true
          }
          sentenceStart = false
        } else if (tokens[i].match(SENTENCE_RESTART_PATTERN)) {
          sentenceStart = true
        }
      }
    }
  }

  let title = ''
  for (let i = 0; i < tokens.length; i++) {
    if (i % 2 === 0) {
      title += tokens[i]
      continue
    }

    if (protectTokenCase[i] && !protectTokenCase[i - 2]) {
      title += START_NOCASE
    }

    title += tokens[i]

    if (protectTokenCase[i] && !protectTokenCase[i + 2]) {
      title += '</span>'
    }
  }

  return title
}

const START_NOCASE = '<span class="nocase">'
const END_NOCASE = '</span>'

export function parseTitle (value, context) {
  if (context['sentence-case'] || context['title-case']) {
    // Deprecated, removed in 0.4.0
    return parseDeprecatedTitle(value, context)
  } else if (context.verbatim) {
    return `${START_NOCASE}${value}${END_NOCASE}`
  } else {
    return value.replace(/\{/g, START_NOCASE).replace(/\}/g, END_NOCASE)
  }
}

export function formatTitle (value) {
  const tokens = value.split(/(<\/?(?:span|i|b|sup|sub).*?>)/g)
  let output = ''

  const stack = []
  for (let i = 0; i < tokens.length; i++) {
    if (i % 2 === 0) {
      output += tokens[i]
    } else if (tokens[i][1] === '/') {
      const openTag = stack.pop()
      if (openTag === START_NOCASE) {
        output += '}'
      }
    } else {
      stack.push(tokens[i])
      if (tokens[i] === START_NOCASE) {
        output += '{'
      }
    }
  }

  return output
}
