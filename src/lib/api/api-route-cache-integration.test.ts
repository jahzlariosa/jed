import { readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it, vi, beforeEach } from 'vitest'

import { getDomainOperations } from '#/domain/registry'
import {
  handleApiV1MethodNotAllowed,
  handleApiV1Request,
  handleHealthRequest,
  handleOpenApiRequest,
} from '#/lib/api/http.server'
import { applyMcpCacheHeaders, mcpCacheHeaders } from '#/lib/http-cache.server'

vi.mock('#/domain/execute.server', () => ({
  executeDomainOperation: vi.fn(async () => ({
    body: { ok: true },
    status: 200,
  })),
}))

vi.mock('#/lib/api-runtime-cache.server', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('#/lib/api-runtime-cache.server')>()
  return {
    ...actual,
    readRuntimeCache: vi.fn(async () => null),
    writeRuntimeCache: vi.fn(async () => undefined),
  }
})

const API_ROUTE_ALLOWLIST = new Set([
  'mcp.ts',
  'mcp/oauth.ts',
  'v1/$.ts',
  'v1/health.ts',
  'v1/openapi[.]json.ts',
])

function listApiRouteRelativePaths(): string[] {
  const root = join(process.cwd(), 'src/routes/api')
  const paths: string[] = []
  const walk = (dir: string, prefix: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.isDirectory()) {
        walk(join(dir, entry.name), rel)
      } else if (entry.name.endsWith('.ts')) {
        paths.push(rel)
      }
    }
  }
  walk(root, '')
  return paths.sort()
}

function expectPrivateApiCache(response: Response) {
  expect(response.headers.get('Cache-Control')).toBe('private, no-store')
  expect(response.headers.get('Vary')).toBe('Authorization, Cookie')
  expect(response.headers.get('ETag')).toBeNull()
}

const BEARER = { Authorization: 'Bearer amn_live_abcdefghijklmnopqrst' }

describe('API route files vs allowlist', () => {
  it('matches every file under src/routes/api', () => {
    const files = listApiRouteRelativePaths()
    expect(files.length).toBeGreaterThan(0)
    for (const file of files) {
      expect(API_ROUTE_ALLOWLIST.has(file)).toBe(true)
    }
    for (const allowed of API_ROUTE_ALLOWLIST) {
      expect(files).toContain(allowed)
    }
  })
})

describe('API v1 handler cache headers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('covers health, openapi, catch-all methods, and every domain operation', async () => {
    const health = handleHealthRequest(
      new Request('https://example.com/api/v1/health'),
    )
    expectPrivateApiCache(health)

    const healthAuthed = handleHealthRequest(
      new Request('https://example.com/api/v1/health', { headers: BEARER }),
    )
    expectPrivateApiCache(healthAuthed)

    const openapi = await handleOpenApiRequest(
      new Request('https://example.com/api/v1/openapi.json'),
    )
    expect(openapi.headers.get('Cache-Control')).toContain('public')
    expect(openapi.headers.get('Vary')).toBe('Accept-Encoding, Authorization')

    const openapiAuthed = await handleOpenApiRequest(
      new Request('https://example.com/api/v1/openapi.json', {
        headers: BEARER,
      }),
    )
    expectPrivateApiCache(openapiAuthed)

    const notAllowed = handleApiV1MethodNotAllowed(
      new Request('https://example.com/api/v1/me', { method: 'OPTIONS' }),
    )
    expect(notAllowed.status).toBe(405)
    expectPrivateApiCache(notAllowed)

    for (const operation of getDomainOperations()) {
      const url = `https://example.com/api/v1${operation.path}`
      const anon = await handleApiV1Request(
        new Request(url, { method: operation.method }),
      )
      if (operation.method === 'GET' && operation.id === 'search_public') {
        expect(anon.headers.get('Cache-Control')).toContain('public')
      } else {
        expectPrivateApiCache(anon)
      }

      const authed = await handleApiV1Request(
        new Request(url, { method: operation.method, headers: BEARER }),
      )
      expectPrivateApiCache(authed)
    }
  })
})

describe('MCP cache headers on route handlers', () => {
  it('applies no-store for OPTIONS and JSON error shells', () => {
    const options = applyMcpCacheHeaders(new Response(null, { status: 204 }))
    expect(options.headers.get('Cache-Control')).toBe('private, no-store')
    expect(options.headers.get('Pragma')).toBe('no-cache')

    const headers = mcpCacheHeaders()
    expect(headers['Cache-Control']).toBe('private, no-store')
  })
})
