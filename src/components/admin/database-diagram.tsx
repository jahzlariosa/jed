import { useMemo } from 'react'

import type { DatabaseDiagramDto } from '#/lib/admin/database/types'

const NODE_WIDTH = 168
const NODE_HEIGHT = 44
const GAP_X = 48
const GAP_Y = 56

type NodeLayout = {
  id: string
  x: number
  y: number
}

function layoutNodes(tables: string[]): NodeLayout[] {
  const columns = Math.max(1, Math.ceil(Math.sqrt(tables.length)))
  return tables.map((name, index) => {
    const row = Math.floor(index / columns)
    const col = index % columns
    return {
      id: name,
      x: col * (NODE_WIDTH + GAP_X),
      y: row * (NODE_HEIGHT + GAP_Y),
    }
  })
}

export function DatabaseDiagram({ diagram }: { diagram: DatabaseDiagramDto }) {
  const nodes = useMemo(() => layoutNodes(diagram.tables), [diagram.tables])
  const nodeById = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes],
  )

  const width =
    nodes.reduce((max, node) => Math.max(max, node.x + NODE_WIDTH), 0) + 24
  const height =
    nodes.reduce((max, node) => Math.max(max, node.y + NODE_HEIGHT), 0) + 24

  if (diagram.tables.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No public tables were found for this schema.
      </p>
    )
  }

  return (
    <div className="admin-card overflow-auto p-4">
      <svg
        role="img"
        aria-label="Entity relationship diagram of public tables"
        viewBox={`0 0 ${width} ${height}`}
        className="min-h-[320px] w-full text-foreground"
      >
        {diagram.relationships.map((rel) => {
          const from = nodeById.get(rel.fromTable)
          const to = nodeById.get(rel.toTable)
          if (!from || !to) {
            return null
          }
          const x1 = from.x + NODE_WIDTH
          const y1 = from.y + NODE_HEIGHT / 2
          const x2 = to.x
          const y2 = to.y + NODE_HEIGHT / 2
          const midX = (x1 + x2) / 2
          return (
            <path
              key={`${rel.fromTable}.${rel.fromColumn}-${rel.toTable}.${rel.toColumn}`}
              d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.35}
              strokeWidth={1.5}
            />
          )
        })}
        {nodes.map((node) => (
          <g key={node.id} transform={`translate(${node.x} ${node.y})`}>
            <rect
              width={NODE_WIDTH}
              height={NODE_HEIGHT}
              rx={8}
              fill="var(--card)"
              stroke="currentColor"
              strokeOpacity={0.2}
            />
            <text
              x={NODE_WIDTH / 2}
              y={NODE_HEIGHT / 2}
              dominantBaseline="middle"
              textAnchor="middle"
              className="fill-current text-[11px] font-medium"
            >
              {node.id}
            </text>
          </g>
        ))}
      </svg>
      {diagram.relationships.length > 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Lines follow foreign keys between public tables.
        </p>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          No foreign keys were found in the public schema.
        </p>
      )}
    </div>
  )
}
