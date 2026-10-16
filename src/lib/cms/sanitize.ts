import sanitizeHtml from 'sanitize-html'

import { isAllowedCmsImageSrc } from '#/lib/url-security'

export { CMS_PUBLIC_MEDIA_PATH, isAllowedCmsImageSrc } from '#/lib/url-security'

const ALLOWED_TAGS = [
  'div',
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'del',
  'h1',
  'h2',
  'h3',
  'h4',
  'ul',
  'ol',
  'li',
  'a',
  'blockquote',
  'pre',
  'code',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'img',
  'figure',
  'figcaption',
  'hr',
  'iframe',
  'span',
]

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions['allowedAttributes'] = {
  a: ['href', 'target', 'rel'],
  img: ['src', 'alt', 'title', 'width', 'height'],
  iframe: ['src', 'title', 'allow', 'allowfullscreen', 'referrerpolicy'],
  th: ['colspan', 'rowspan'],
  td: ['colspan', 'rowspan'],
  div: [
    'class',
    'data-node-type',
    'data-id',
    'data-content-type',
    'data-level',
    'data-text-alignment',
    'data-checked',
  ],
  p: ['class', 'data-text-alignment'],
  h1: ['class', 'data-text-alignment'],
  h2: ['class', 'data-text-alignment'],
  h3: ['class', 'data-text-alignment'],
  span: ['class', 'style', 'data-text-color'],
  code: ['class'],
  pre: ['class'],
  li: ['class', 'data-checked'],
  figure: ['class'],
  figcaption: ['class'],
}

const ALLOWED_CLASSES = {
  div: [/^bn-/],
  p: [/^bn-/],
  h1: [/^bn-/],
  h2: [/^bn-/],
  h3: [/^bn-/],
  span: [/^bn-/],
  code: [/^bn-/],
  pre: [/^bn-/],
  li: [/^bn-/],
  figure: [/^bn-/],
  figcaption: [/^bn-/],
}

const RGB_STYLE =
  /^rgb\(\s*(?:\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\s*,\s*(?:\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\s*,\s*(?:\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\s*\)$/i

const ALLOWED_STYLES = {
  span: {
    color: [/^#[0-9a-f]{3,8}$/i, RGB_STYLE],
    'background-color': [/^#[0-9a-f]{3,8}$/i, RGB_STYLE],
    'text-align': [/^(left|right|center|justify)$/],
  },
  p: {
    'text-align': [/^(left|right|center|justify)$/],
  },
  h1: { 'text-align': [/^(left|right|center|justify)$/] },
  h2: { 'text-align': [/^(left|right|center|justify)$/] },
  h3: { 'text-align': [/^(left|right|center|justify)$/] },
}

function isAllowedEmbed(src: string): boolean {
  try {
    const url = new URL(src)
    if (url.protocol !== 'https:') {
      return false
    }
    const host = url.hostname.replace(/^www\./, '')
    return (
      host === 'youtube.com' ||
      host === 'youtube-nocookie.com' ||
      host === 'youtu.be' ||
      host.endsWith('.youtube.com')
    )
  } catch {
    return false
  }
}

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: ALLOWED_ATTRIBUTES,
  allowedClasses: ALLOWED_CLASSES,
  allowedStyles: ALLOWED_STYLES,
  allowedSchemes: ['http', 'https', 'mailto'],
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) => {
      const next = { ...attribs }
      if (next.target === '_blank') {
        next.rel = 'noopener noreferrer'
      }
      return { tagName, attribs: next }
    },
    img: (tagName, attribs) => {
      const src = attribs.src ?? ''
      if (!isAllowedCmsImageSrc(src)) {
        return {
          tagName: 'p',
          attribs: {} as Record<string, string>,
        }
      }
      return { tagName, attribs }
    },
    iframe: (tagName, attribs) => {
      const src = attribs.src ?? ''
      if (!isAllowedEmbed(src)) {
        return {
          tagName: 'p',
          attribs: {} as Record<string, string>,
        }
      }
      return {
        tagName,
        attribs: {
          src,
          title: attribs.title ?? 'Embedded video',
          allow:
            'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          allowfullscreen: 'true',
          referrerpolicy: 'strict-origin-when-cross-origin',
        },
      }
    },
  },
}

export function sanitizeRichHtml(html: string): string {
  return sanitizeHtml(html, sanitizeOptions)
}
