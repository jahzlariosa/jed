import '@tanstack/react-start/server-only'

import type { ZodTypeAny } from 'zod'

export function zodSchemaToOpenApi(
  schema: ZodTypeAny,
): Record<string, unknown> {
  const def = schema._def as { typeName?: string; description?: string }
  const typeName = def.typeName
  if (typeName === 'ZodString') {
    return { type: 'string' }
  }
  if (typeName === 'ZodNumber') {
    return { type: 'number' }
  }
  if (typeName === 'ZodBoolean') {
    return { type: 'boolean' }
  }
  if (typeName === 'ZodLiteral') {
    return { type: 'string', enum: [(def as { value?: unknown }).value] }
  }
  if (typeName === 'ZodEnum') {
    return { type: 'string', enum: (def as { values?: string[] }).values }
  }
  if (typeName === 'ZodArray') {
    const inner = (def as { type?: ZodTypeAny }).type
    return {
      type: 'array',
      items: inner ? zodSchemaToOpenApi(inner) : { type: 'object' },
    }
  }
  if (typeName === 'ZodObject') {
    const shape = (
      def as { shape?: () => Record<string, ZodTypeAny> }
    ).shape?.()
    const properties: Record<string, unknown> = {}
    const required: string[] = []
    if (shape) {
      for (const [key, value] of Object.entries(shape)) {
        properties[key] = zodSchemaToOpenApi(value)
        const innerDef = value._def as { typeName?: string }
        if (
          innerDef.typeName !== 'ZodOptional' &&
          innerDef.typeName !== 'ZodDefault'
        ) {
          required.push(key)
        }
      }
    }
    return {
      type: 'object',
      properties,
      ...(required.length > 0 ? { required } : {}),
    }
  }
  if (typeName === 'ZodOptional' || typeName === 'ZodDefault') {
    const inner = (def as { innerType?: ZodTypeAny }).innerType
    return inner ? zodSchemaToOpenApi(inner) : { type: 'string' }
  }
  if (typeName === 'ZodUnion') {
    return { type: 'object' }
  }
  return { type: 'object' }
}
