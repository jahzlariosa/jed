import '@tanstack/react-start/server-only'

import { setResponseStatus } from '@tanstack/react-start/server'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { ZodError, type ZodTypeAny } from 'zod'

import { UNAUTHORIZED_MESSAGE } from '#/auth/errors'
import { executeDomainOperation } from '#/domain/execute.server'
import { getDomainOperations } from '#/domain/registry'
import type { DomainOperation } from '#/domain/types'
import { requireBearerAuth } from '#/lib/api/bearer-auth.server'
import { applyMcpCacheHeaders } from '#/lib/http-cache.server'

function pathParamsFromInput(
  operation: DomainOperation<unknown, unknown>,
  input: Record<string, unknown>,
): Record<string, string> {
  const params: Record<string, string> = {}
  for (const segment of operation.path.split('/')) {
    if (!segment.startsWith(':')) {
      continue
    }
    const name = segment.slice(1)
    const value = input[name]
    if (value !== undefined && value !== null) {
      params[name] = String(value)
    }
  }
  return params
}

function stripMcpControlFields(input: Record<string, unknown>) {
  const { confirm: _confirm, idempotencyKey, ...rest } = input
  return {
    payload: rest,
    idempotencyKey: typeof idempotencyKey === 'string' ? idempotencyKey : null,
  }
}

const MCP_JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
}

function mcpJsonError(status: number, message: string): Response {
  if (status === 401) {
    try {
      setResponseStatus(401)
    } catch {
      /* unit tests */
    }
  }
  return applyMcpCacheHeaders(
    new Response(JSON.stringify({ error: message }), {
      status,
      headers: MCP_JSON_HEADERS,
    }),
  )
}

export async function handleMcpHttpRequest(
  request: Request,
): Promise<Response> {
  try {
    await requireBearerAuth(request)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : UNAUTHORIZED_MESSAGE
    if (message === UNAUTHORIZED_MESSAGE) {
      return mcpJsonError(401, UNAUTHORIZED_MESSAGE)
    }
    console.error(error)
    return mcpJsonError(500, 'Unable to complete request')
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  })
  const server = new McpServer({
    name: 'jed',
    version: '1.0.0',
  })

  const registerTool = server.registerTool.bind(server) as (
    name: string,
    config: { description: string; inputSchema: ZodTypeAny },
    handler: (args: unknown) => Promise<{
      content: Array<{ type: 'text'; text: string }>
      isError?: boolean
    }>,
  ) => void

  for (const operation of getDomainOperations()) {
    registerTool(
      operation.mcpToolName,
      {
        description: operation.summary,
        inputSchema: operation.mcpInputSchema as ZodTypeAny,
      },
      async (args) => {
        try {
          const mcpParsed = operation.mcpInputSchema.parse(
            args ?? {},
          ) as Record<string, unknown>
          const { payload, idempotencyKey } = operation.destructive
            ? stripMcpControlFields(mcpParsed)
            : stripMcpControlFields(mcpParsed)
          const params = pathParamsFromInput(operation, payload)
          const { body } = await executeDomainOperation(
            request,
            operation,
            params,
            {
              directInput: payload,
              idempotencyKey,
            },
          )
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(body, null, 2),
              },
            ],
          }
        } catch (error) {
          if (error instanceof ZodError) {
            const message = error.issues[0]?.message ?? 'Invalid tool arguments'
            return {
              isError: true,
              content: [
                {
                  type: 'text',
                  text: message,
                },
              ],
            }
          }
          const message =
            error instanceof Error
              ? error.message
              : 'Unable to complete request'
          return {
            isError: true,
            content: [{ type: 'text', text: message }],
          }
        }
      },
    )
  }

  try {
    await server.connect(transport)
    const response = await transport.handleRequest(request)
    return applyMcpCacheHeaders(response)
  } catch (error) {
    console.error(error)
    return mcpJsonError(500, 'Unable to complete request')
  }
}
