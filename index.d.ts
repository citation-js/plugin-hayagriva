import type { CSL } from '@citation-js/core'

type HayagrivaType =
  | 'article'
  | 'chapter'
  | 'entry'
  | 'anthos'
  | 'report'
  | 'thesis'
  | 'web'
  | 'scene'
  | 'artwork'
  | 'patent'
  | 'case'
  | 'newspaper'
  | 'legislation'
  | 'manuscript'
  | 'original'
  | 'post'
  | 'misc'
  | 'performance'
  | 'periodical'
  | 'proceedings'
  | 'book'
  | 'blog'
  | 'reference'
  | 'conference'
  | 'anthology'
  | 'repository'
  | 'thread'
  | 'video'
  | 'audio'
  | 'exhibition'

interface HayagrivaName {
  name: string
  'given-name'?: string
  prefix?: string
  suffix?: string
  alias?: string
}

interface HayagrivaContributor {
  role: string
  names: string|string[]
}

interface HayagrivaPublisher {
  name?: string|HayagrivaFormattableString
  location?: string|HayagrivaFormattableString
}

interface HayagrivaUrl {
  value?: string
  date?: Date
}

interface HayagrivaFormattableString {
  value?: string
  short?: string
  verbatim?: boolean
}

interface HayagrivaRecord {
  type?: HayagrivaType
  title?: string|HayagrivaFormattableString
  author?: string[]
  date?: Date
  parent?: HayagrivaRecord
  abstract?: string|HayagrivaFormattableString
  genre?: string|HayagrivaFormattableString
  editor?: string[]
  affiliated?: HayagrivaContributor[]
  'call-number'?: string|HayagrivaFormattableString
  publisher?: string|HayagrivaPublisher
  location?: string|HayagrivaFormattableString
  organization?: string|HayagrivaFormattableString
  issue?: string|number
  volume?: string|number
  'volume-total'?: number
  chapter?: string|number
  edition?: string|number
  'page-range'?: string|number
  'page-total'?: number
  'time-range'?: string // TODO ?
  runtime?: string // TODO ?
  url?: string|HayagrivaUrl
  'serial-number'?: string|Record<string, string>
  language?: string
  archive?: string|HayagrivaFormattableString
  'archive-location'?: string|HayagrivaFormattableString
  note?: string|HayagrivaFormattableString
}

declare module '@citation-js/core' {
  namespace plugins {
    namespace input {
      interface Formats {
        '@hayagriva/file': (input: string) => Array<HayagrivaRecord>
        '@hayagriva/record': (input: HayagrivaRecord) => CSL
      }
    }

    namespace output {
      interface Formats {
        hayagriva:
          | ((options: { asObject: true }) => Array<HayagrivaRecord>)
          | ((options?: { asObject?: false }) => string)
      }
    }

    namespace config {
      export function get (ref: '@bibtex'): BibtexConfig
    }
  }
}
