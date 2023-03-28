import { plugins, util } from '@citation-js/core'
import { parse as parseDate } from '@citation-js/date'
import { parseName, formatName } from './name.js'
import { parseTitle, formatTitle } from './title.js'

// Format: Hayagriva
// Version: 0.1.1
// Specification: https://github.com/typst/hayagriva/blob/v0.1.1/docs/file-format.md

// https://regex101.com/r/sEIbDo/1
const TIMESTAMP_PATTERN = /^([1-9][0-9]*)?[0-9][0-9]:(([0-1][0-9]:|[2][0-3]:)?[0-5][0-9]:)?[0-5][0-9](,[0-9]{4})?$/
const LANGUAGE_PATTERN = /^[a-z][a-z][a-z]?(-[A-Za-z]+)*$/
const PAGE_PATTERN = /^\d+(-\d+)?$/

const TYPES = {
  toTarget: {
    article: 'article',
    chapter: 'chapter',
    entry: 'entry',
    anthos: 'chapter', // also standalone poems, short stories; in this context cited as book sections
    report: 'report',
    thesis: 'thesis',
    web: 'webpage',
    scene: 'motion_picture',
    artwork: 'graphic',
    patent: 'patent',
    case: 'legal_case',
    newspaper: 'periodical',
    legislation: 'legislation',
    manuscript: 'manuscript',
    tweet: 'post',
    misc: 'document',
    periodical: 'periodical',
    proceedings: 'book',
    book: 'book',
    blog: 'webpage',
    reference: 'document',
    conference: 'event',
    anthology: 'book',
    repository: 'software', // can also be other types of repositories, but this works for most top-level entries
    thread: 'post', // actually a collection of posts
    video: 'motion_picture',
    audio: 'song',
    exhibition: 'event'
  },
  toSource: {
    article: 'article',
    'article-journal': 'article',
    'article-magazine': 'article',
    'article-newspaper': 'article',
    bill: 'legislation',
    book: 'book',
    broadcast: 'misc', // could be video or audio
    chapter: 'chapter',
    classic: 'misc',
    collection: 'repository',
    dataset: 'repository',
    document: 'misc',
    entry: 'entry',
    'entry-dictionary': 'entry',
    'entry-encyclopedia': 'entry',
    event: 'misc',
    figure: 'artwork',
    graphic: 'artwork',
    hearing: 'case',
    interview: 'audio',
    legal_case: 'case',
    legislation: 'legislation',
    manuscript: 'manuscript',
    map: 'misc',
    motion_picture: 'video',
    musical_score: 'audio',
    pamphlet: 'misc',
    'paper-conference': 'article',
    patent: 'patent',
    performance: 'video', // not necessarily a recording, but at least audiovisual
    periodical: 'periodical',
    personal_communication: 'misc',
    post: 'tweet',
    'post-weblog': 'article',
    regulation: 'legislation',
    report: 'report',
    review: 'article',
    'review-book': 'article',
    software: 'repository',
    song: 'audio',
    speech: 'video', // not necessarily a recording, but at least audiovisual
    standard: 'reference',
    thesis: 'thesis',
    treaty: 'legislation',
    webpage: 'web'
  }
}

const DEFAULT_PARENT_TYPES = {
  article: 'periodical',
  chapter: 'book',
  entry: 'reference',
  anthos: 'anthology',
  report: null,
  thesis: null,
  web: 'web',
  scene: 'video',
  artwork: 'exhibition',
  patent: null,
  case: null,
  newspaper: null,
  legislation: 'anthology',
  manuscript: null,
  tweet: 'tweet',
  misc: null,
  periodical: null,
  proceedings: null,
  book: null,
  blog: null,
  reference: null,
  conference: null,
  anthology: null,
  repository: null,
  thread: null,
  video: 'video',
  audio: 'audio',
  exhibition: null
}

const NON_STANDALONE_TYPES = [
  'article',
  'article-journal',
  'article-magazine',
  'article-newspaper',
  'chapter',
  'paper-conference'
]

const ROLES = {
  toTarget: {
    translator: 'translator',
    afterword: 'contributor',
    foreword: 'contributor',
    introduction: 'contributor',
    annotator: 'contributor',
    commentator: 'contributor',
    holder: null,
    compiler: 'compiler',
    founder: 'series-creator',
    collaborator: 'contributor',
    organizer: 'organizer',
    'cast-member': 'performer',
    composer: 'composer',
    producer: 'producer',
    'executive-producer': 'executive-producer',
    writer: 'script-writer',
    cinematography: 'contributor',
    director: 'director',
    illustrator: 'illustrator',
    narrator: 'narrator'
  },
  toSource: {
    compiler: 'compiler',
    composer: 'composer',
    contributor: 'collaborator',
    director: 'director',
    'executive-producer': 'executive-producer',
    illustrator: 'illustrator',
    narrator: 'narrator',
    organizer: 'organizer',
    performer: 'cast-member',
    producer: 'producer',
    'script-writer': 'writer',
    'series-creator': 'founder',
    translator: 'translator'
  }
}

const CONVERTERS = {
  NAMES: {
    toTarget (names) {
      return [].concat(names).map(parseName)
    },
    toSource (names) {
      names = names.map(formatName)
      return names.length === 1 ? names[0] : names
    }
  },
  DATE: {
    toTarget (date) {
      return parseDate(date instanceof Date ? date.toISOString() : date.toString())
    },
    toSource (date) {
      if (date.raw) {
        return date.raw
      }
      const [year, month, day] = date['date-parts'][0]
      if (day) {
        return new Date(Date.UTC(year, month - 1, day))
      } else if (month) {
        return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}`
      } else {
        return year
      }
    }
  },
  TITLE: {
    toTarget (title) {
      if (typeof title === 'string') {
        return [title]
      } else if (title.translation) {
        return [parseTitle(title.translation, title), title.shorthand, title.value]
      } else {
        return [parseTitle(title.value, title), title.shorthand]
      }
    },
    toSource (title, shortTitle, originalTitle) {
      const output = formatTitle(title)
      if (shortTitle) {
        output.shorthand = formatTitle(shortTitle).value
      }
      if (originalTitle) {
        output.translation = output.value
        output.value = formatTitle(originalTitle).value
      }
      return Object.keys(output).length === 1 ? output.value : output
    }
  },
  FORMATTABLE_STRING: {
    toTarget (value) {
      return typeof value === 'string' ? value : value.value
    },
    toSource (value) {
      return value
    }
  }
}

const MAPPING = [
  {
    source: 'title',
    target: ['title', 'title-short', 'original-title'],
    convert: CONVERTERS.TITLE
  },
  {
    source: 'author',
    target: 'author',
    convert: CONVERTERS.NAMES
  },
  {
    source: 'date',
    target: 'issued',
    convert: CONVERTERS.DATE,
    when: {
      target: { type (type) { return type !== 'chapter' } }
    }
  },
  {
    source: 'parent_date',
    target: 'issued',
    convert: CONVERTERS.DATE,
    when: {
      source: { date: false },
      target: { type: 'chapter' }
    }
  },
  {
    source: 'editor',
    target: 'editor',
    convert: CONVERTERS.NAMES,
    when: {
      target: { type (type) { return type !== 'chapter' } }
    }
  },
  {
    source: 'parent_editor',
    target: 'editor',
    convert: CONVERTERS.NAMES,
    when: {
      source: { type: ['chapter', 'anthos'], editor: false },
      target: { type: 'chapter' }
    }
  },
  {
    source: 'affiliated',
    target: [
      'compiler',
      'composer',
      'contributor',
      'director',
      'executive-producer',
      'illustrator',
      'narrator',
      'organizer',
      'performer',
      'producer',
      'script-writer',
      'series-creator',
      'translator'
    ],
    convert: {
      toTarget (roles) {
        const output = {}
        for (const { role, names } of [].concat(roles)) {
          const targetRole = ROLES.toTarget[role]
          if (targetRole in output) {
            output[targetRole].push(...CONVERTERS.NAMES.toTarget(names))
          } else if (targetRole) {
            output[targetRole] = CONVERTERS.NAMES.toTarget(names)
          }
        }

        return Object.keys(ROLES.toSource).map(role => output[role])
      },
      toSource (...roles) {
        return roles.map((names, index) => {
          return names && {
            role: Object.values(ROLES.toSource)[index],
            names: CONVERTERS.NAMES.toSource(names)
          }
        }).filter(Boolean)
      }
    }
  },
  {
    source: 'publisher',
    target: 'publisher',
    convert: CONVERTERS.FORMATTABLE_STRING,
    when: {
      source: { organization: false },
      target: { type (type) { return !NON_STANDALONE_TYPES.includes(type) } }
    }
  },
  {
    source: 'parent_publisher',
    target: 'publisher',
    convert: CONVERTERS.FORMATTABLE_STRING,
    when: {
      source: { publisher: false, organization: false },
      target: { type: NON_STANDALONE_TYPES }
    }
  },
  {
    source: 'location',
    target: 'publisher-place',
    convert: CONVERTERS.FORMATTABLE_STRING,
    when: {
      target: { type (type) { return !NON_STANDALONE_TYPES.includes(type) } }
    }
  },
  {
    source: 'parent_location',
    target: 'publisher-place',
    convert: CONVERTERS.FORMATTABLE_STRING,
    when: {
      source: { location: false },
      target: { type: NON_STANDALONE_TYPES }
    }
  },
  {
    source: 'organization',
    target: 'publisher',
    convert: CONVERTERS.FORMATTABLE_STRING,
    when: {
      target: false
    }
  },
  {
    source: 'parent_organization',
    target: 'publisher',
    convert: CONVERTERS.FORMATTABLE_STRING,
    when: {
      source: { organization: false },
      target: false
    }
  },
  {
    source: 'issue',
    target: 'issue',
    when: {
      target: { type (type) { return !NON_STANDALONE_TYPES.includes(type) } }
    }
  },
  {
    source: 'parent_issue',
    target: 'issue',
    when: {
      source: { issue: false },
      target: { type: NON_STANDALONE_TYPES }
    }
  },
  {
    source: 'volume',
    target: 'volume',
    when: {
      target: { type (type) { return !NON_STANDALONE_TYPES.includes(type) } }
    }
  },
  {
    source: 'parent_volume',
    target: 'volume',
    when: {
      source: { volume: false },
      target: { type: NON_STANDALONE_TYPES }
    }
  },
  {
    source: 'volume-total',
    target: 'number-of-volumes',
    when: {
      target: { type (type) { return type !== 'chapter' } }
    }
  },
  {
    source: 'parent_volume-total',
    target: 'number-of-volumes',
    when: {
      source: { 'volume-total': false },
      target: { type: 'chapter' }
    }
  },
  {
    source: 'edition',
    target: 'edition',
    when: {
      target: { type (type) { return type !== 'chapter' } }
    }
  },
  {
    source: 'parent_edition',
    target: 'edition',
    when: {
      source: { edition: false },
      target: { type: 'chapter' }
    }
  },
  {
    source: 'page-range',
    target: 'page',
    when: {
      target: {
        page (page) {
          return typeof page === 'number' || (typeof page === 'string' && page.match(PAGE_PATTERN))
        }
      }
    }
  },
  {
    source: 'page-total',
    target: 'number-of-pages',
    when: {
      target: { type (type) { return type !== 'chapter' } }
    }
  },
  {
    source: 'parent_page-total',
    target: 'number-of-pages',
    when: {
      source: { 'page-total': false },
      target: { type: 'chapter' }
    }
  },
  {
    // TODO: check if locator allowed
    source: 'time-range',
    target: 'locator',
    when: {
      target: {
        locator (locator) {
          if (typeof locator === 'string') {
            const parts = locator.split('-')
            if (parts.length === 2 && parts.every(part => part.match(TIMESTAMP_PATTERN))) {
              return true
            }
          }
          return false
        }
      }
    }
  },
  {
    source: 'runtime',
    target: 'dimensions',
    when: {
      target: {
        dimensions (dimensions) {
          return typeof dimensions === 'string' && dimensions.match(TIMESTAMP_PATTERN)
        }
      }
    }
  },
  {
    source: 'url',
    target: ['URL', 'accessed'],
    convert: {
      toTarget (url) {
        return typeof url === 'string' ? [url] : [url.value, CONVERTERS.DATE.toTarget(url.date)]
      },
      toSource (url, accessed) {
        return url && accessed ? { value: url, date: CONVERTERS.DATE.toSource(accessed) } : url
      }
    }
  },
  {
    source: 'doi',
    target: 'DOI'
  },
  {
    source: 'serial-number',
    target: ['number', 'PMID', 'PMCID'],
    convert: {
      toTarget (number) {
        return [number]
      },
      toSource (number, pmid, pmcid) {
        return number || pmid || pmcid
      }
    }
  },
  {
    source: 'isbn',
    target: 'ISBN',
    when: {
      target: { type (type) { return !NON_STANDALONE_TYPES.includes(type) } }
    }
  },
  {
    source: 'parent_isbn',
    target: 'ISBN',
    when: {
      source: { type: ['chapter', 'anthos'], isbn: false },
      target: { type: NON_STANDALONE_TYPES }
    }
  },
  {
    source: 'issn',
    target: 'ISSN',
    when: {
      target: { type (type) { return !NON_STANDALONE_TYPES.includes(type) } }
    }
  },
  {
    source: 'parent_issn',
    target: 'ISSN',
    when: {
      source: { issn: false },
      target: { type: NON_STANDALONE_TYPES }
    }
  },
  {
    source: 'language',
    target: 'language',
    when: {
      target: {
        language (language) {
          return language && language.match(LANGUAGE_PATTERN)
        }
      }
    }
  },
  {
    source: 'archive',
    target: 'archive',
    convert: CONVERTERS.FORMATTABLE_STRING
  },
  {
    source: 'archive-location',
    target: 'archive-place',
    convert: CONVERTERS.FORMATTABLE_STRING
  },
  // Hayagriva does not have dedicated fields for the genre (subtype) and medium
  // of records. Since these are all plain-text fields, the input cannot be distinguished.
  {
    source: 'note',
    target: ['annote', 'genre', 'medium'],
    convert: {
      toTarget (note) {
        return [note]
      },
      toSource (note, genre, medium) {
        return genre || medium || note
      }
    }
  },
  // Handling parent entries (badly)
  {
    source: ['type', 'parent_type', 'parent_parent_type'],
    target: 'type',
    convert: {
      toTarget (type, ...parents) {
        if (type === 'article') {
          if (parents.includes('newspaper')) {
            return 'article-newspaper'
          } else if (parents.includes('periodical')) {
            return 'article-journal'
          } else if (parents.includes('blog')) {
            return 'post-weblog'
          } else if (parents.includes('proceedings') || parents.includes('conference')) {
            return 'paper-conference'
          }
        }

        return TYPES.toTarget[type]
      },
      toSource (type) {
        if (type === 'article-newspaper') {
          return ['article', 'newspaper']
        } else if (type === 'article-journal') {
          return ['article', 'periodical']
        } else if (type === 'post-weblog') {
          return ['article', 'blog']
        } else if (type === 'paper-conference') {
          return ['article', 'proceedings', 'conference']
        } else if (type === 'speech') {
          return ['video', 'proceedings', 'conference']
        } else if (type === 'entry' || type === 'entry-dictionary' || type === 'entry-encyclopedia') {
          return ['entry', 'reference']
        } else if (type === 'chapter') {
          return ['chapter', 'book']
        }

        return [TYPES.toSource[type]]
      }
    }
  },
  {
    source: 'parent_title',
    target: ['container-title', 'container-title-short', 'original-container-title'],
    convert: CONVERTERS.TITLE,
    when: {
      source: { parent_type (type) { return type !== 'conference' } }
    }
  },
  {
    source: 'parent_parent_title',
    target: ['container-title', 'container-title-short', 'original-container-title'],
    convert: CONVERTERS.TITLE,
    when: {
      source: { parent_title: false, parent_parent_type (type) { return type !== 'conference' } },
      target: false
    }
  },
  {
    source: 'parent_parent_title',
    target: ['collection-title', 'collection-title-short', 'original-collection-title'],
    convert: CONVERTERS.TITLE,
    when: {
      source: { parent_title: true, parent_parent_type: ['book', 'anthology'] }
    }
  },
  {
    source: 'parent_author',
    target: 'container-author',
    convert: CONVERTERS.NAMES,
    when: {
      source: { parent_title: true },
      target: { 'container-title': true }
    }
  },
  {
    source: 'parent_parent_author',
    target: 'container-author',
    convert: CONVERTERS.NAMES,
    when: {
      source: { parent_parent_title: true, parent_author: false },
      target: false
    }
  },
  {
    source: 'parent_title',
    target: ['event-title', 'event-title-short', 'original-event-title'],
    convert: CONVERTERS.TITLE,
    when: {
      source: { parent_type: 'conference' },
      target: false
    }
  },
  {
    source: 'parent_parent_title',
    target: ['event-title', 'event-title-short', 'original-event-title'],
    convert: CONVERTERS.TITLE,
    when: {
      source: { parent_parent_type: 'conference' }
    }
  },
  {
    source: 'parent_date',
    target: 'event-date',
    convert: CONVERTERS.DATE,
    when: {
      source: { parent_type: 'conference' },
      target: false
    }
  },
  {
    source: 'parent_parent_date',
    target: 'event-date',
    convert: CONVERTERS.DATE,
    when: {
      source: { parent_parent_type: 'conference' }
    }
  }
]

// TODO repository-source

const converter = new util.Translator(MAPPING)

function flattenRecord (record) {
  record = { ...record }
  if (record.type) {
    record.type = record.type.toLowerCase()
  }
  if (record.parent) {
    const parent = flattenRecord([].concat(record.parent).shift())
    for (const key in parent) {
      record['parent_' + key] = parent[key]
    }
    if (DEFAULT_PARENT_TYPES[record.type] !== null && !record.parent_type) {
      record.parent_type = DEFAULT_PARENT_TYPES[record.type]
    }
  }
  return record
}

function parseRecord (record, key) {
  const data = converter.convertToTarget(flattenRecord(record))
  data['citation-key'] = key
  return data
}

function unflattenRecord (record) {
  let hasParent = false

  const parent = {}
  for (const key in record) {
    if (key.startsWith('parent_')) {
      hasParent = true
      parent[key.slice(7)] = record[key]
      delete record[key]
    }
  }

  if (hasParent) {
    if (!parent.type) {
      if (['web', 'audio', 'video'].includes(record.type)) {
        parent.type = record.type
      } else {
        parent.type = 'misc'
      }
    }
    record.parent = unflattenRecord(parent)
  }

  return record
}

function formatRecord (record) {
  return unflattenRecord(converter.convertToSource(record))
}

export function parse (file) {
  const data = []
  for (const key in file) {
    const record = parseRecord(file[key], key)
    data.push(record)
  }
  return data
}

export function format (records, options = {}) {
  const data = {}
  for (const record of records) {
    const key = record['citation-key'] || record.id
    data[key] = formatRecord(record)
  }
  return options.asObject === true ? data : plugins.output.format('yaml', data)
}
