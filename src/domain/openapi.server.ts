import '@tanstack/react-start/server-only'

import { getDomainOperations } from './registry'
import { zodSchemaToOpenApi } from './openapi-zod.server'

function openApiPath(routePath: string) {
  return `/api/v1${routePath.replace(/:([a-zA-Z]+)/g, '{$1}')}`
}

export function generateOpenApiDocument(origin: string) {
  const paths: Record<string, Record<string, unknown>> = {}
  for (const operation of getDomainOperations()) {
    const pathKey = openApiPath(operation.path)
    paths[pathKey] ??= {}
    const pathParameters = operation.path
      .split('/')
      .filter((part) => part.startsWith(':'))
      .map((part) => ({
        name: part.slice(1),
        in: 'path',
        required: true,
        schema: { type: 'string' },
      }))

    const isWrite = operation.method !== 'GET'
    const queryParameters: Array<Record<string, unknown>> = []
    if (!isWrite) {
      const querySchema = zodSchemaToOpenApi(operation.inputSchema)
      if (
        querySchema &&
        typeof querySchema === 'object' &&
        'properties' in querySchema
      ) {
        for (const [name, schema] of Object.entries(
          (querySchema as { properties: Record<string, unknown> }).properties,
        )) {
          queryParameters.push({
            name,
            in: 'query',
            required: false,
            schema,
          })
        }
      }
    }

    const headerParameters: Array<Record<string, unknown>> = []
    if (isWrite) {
      headerParameters.push({
        name: 'Idempotency-Key',
        in: 'header',
        required: true,
        schema: { type: 'string', maxLength: 128 },
      })
    }

    paths[pathKey][operation.method.toLowerCase()] = {
      summary: operation.summary,
      operationId: operation.id,
      parameters: [...pathParameters, ...queryParameters, ...headerParameters],
      ...(isWrite
        ? {
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: zodSchemaToOpenApi(operation.inputSchema),
                },
              },
            },
          }
        : {}),
      responses: {
        200: {
          description: 'Success',
          content: {
            'application/json': {
              schema: zodSchemaToOpenApi(operation.outputSchema),
            },
          },
        },
        400: { description: 'Invalid request' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        429: { description: 'Too many requests' },
      },
      security: operation.scopes === 'public' ? [] : [{ bearerAuth: [] }],
    }
  }

  return {
    openapi: '3.0.3',
    info: {
      title: 'JED API',
      version: '1.0.0',
      description:
        'Version 1 REST API for JED. Send Authorization: Bearer <personal_access_token> on private routes. Writes require an Idempotency-Key header.',
    },
    servers: [{ url: `${origin}/api/v1` }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
        },
      },
    },
    paths,
  }
}
