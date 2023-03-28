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

export function parseTitle (value, context) {
  if (!context['sentence-case'] && !context['title-case']) {
    return context.verbatim === true ? `<span class="nocase">${value}</span>` : value
  }

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
      title += '<span class="nocase">'
    }

    title += tokens[i]

    if (protectTokenCase[i] && !protectTokenCase[i + 2]) {
      title += '</span>'
    }
  }

  return title
}

export function formatTitle (value) {
  const tokens = value.split(/(<\/?(?:span|i|b|sup|sub).*?>|\p{L}+)/gu)
  const output = {
    value: '',
    'sentence-case': '',
    'title-case': ''
  }
  let includeSentenceCase = false
  let includeTitleCase = false

  let sentenceStart = true
  let protectCase = false
  let stack = []
  for (let i = 0; i < tokens.length; i++) {
    if (i % 2 === 0) {
      output.value += tokens[i]
      output['sentence-case'] += tokens[i]
      output['title-case'] += tokens[i]

      if (tokens[i].match(SENTENCE_RESTART_PATTERN)) {
        sentenceStart = true
      }
    } else if (tokens[i].startsWith('<')) {
      if (tokens[i].startsWith('</')) {
        stack.pop()
      } else {
        stack.push(tokens[i])
      }
      protectCase = stack.includes('<span class="nocase">')
    } else {
      output.value += tokens[i]
      output['sentence-case'] += protectCase ? tokens[i] : toSentenceCase(tokens[i], sentenceStart)
      output['title-case'] += protectCase ? tokens[i] : toTitleCase(tokens[i], sentenceStart)
      sentenceStart = false

      if (protectCase && tokens[i] !== toSentenceCase(tokens[i], sentenceStart)) {
        includeSentenceCase = true
      }
      if (protectCase && tokens[i] !== toTitleCase(tokens[i], sentenceStart)) {
        includeTitleCase = true
      }
    }
  }

  if (!includeSentenceCase) {
    delete output['sentence-case']
  }
  if (!includeTitleCase) {
    delete output['title-case']
  }

  return output
}
