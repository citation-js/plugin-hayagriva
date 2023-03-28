import { orderNamePieces, getStringCase } from '@citation-js/plugin-bibtex/lib/input/name.js'

function tokenizeName (name) {
  const pieces = []
  const tokens = name.replace(/^[ -]+|[ -]$/g, '').match(/([ -]|[^ -]+)/g)
  for (let i = 0; i < tokens.length; i += 2) {
    pieces.push({
      value: tokens[i],
      hyphenated: tokens[i + 1] === '-',
      upperCase: getStringCase(tokens[i])
    })
  }
  return pieces
}

export function parseName (name) {
  if (typeof name === 'object') {
    if (!name.prefix && !name.suffix && !name['given-name']) {
      return { literal: name.name }
    }

    const nameParts = [
      tokenizeName(name.name)
    ]
    if (name.suffix && name['given-name']) {
      nameParts.push(tokenizeName(name.suffix))
    } else if (name['given-name']) {
      nameParts.push(tokenizeName(name['given-name']))
    }

    // Returns a parsed BibTeX name
    const output = orderNamePieces(nameParts)
    // However, in a parsed BibTeX name, 'prefix' is the prefix of the family
    // name, different from the 'prefix' in Hayagriva names.
    if (output.prefix) {
      output['non-dropping-particle'] = output.prefix
      delete output.prefix
    }

    // Add prefix, also suffix if no given name
    if (name.prefix) {
      output['dropping-particle'] = name.prefix
    }
    if (name.suffix && !name['given-name']) {
      output.suffix = name.suffix
    }

    return output
  }

  if (!name.includes(',') && name.includes(' ')) {
    return { literal: name }
  }

  return orderNamePieces(name.split(', ').map(tokenizeName))
}

export function formatName (name) {
  if (name.literal) {
    return name.literal.includes(',') ? { name: name.literal } : name.literal
  }

  const output = {}
  if (name['non-dropping-particle']) {
    output.name = `${name['non-dropping-particle']} ${name.family}`
  } else {
    output.name = name.family
  }
  if (name.given) {
    output['given-name'] = name.given
  }
  if (name['dropping-particle']) {
    output.prefix = name['dropping-particle']
  }
  if (name.suffix) {
    output.suffix = name.suffix
  }

  if (output.name.includes(',') || (output['given-name'] && output['given-name'].includes(',')) || output.suffix || output.prefix) {
    return output
  } else {
    return output['given-name'] ? `${output.name}, ${output['given-name']}` : output.name
  }
}
