"use client"

import { memo } from "react"
import { FONT_SIZE, LINE_HEIGHT, PAD_Y } from "./node-metrics"
import type { PlacedBlock } from "./positions"

type MindMapBlockProps = {
  block: PlacedBlock
  onEdit: (id: string) => void
}

/** A free text block: a dashed card that hangs on the canvas, is dragged like a pill and edited with a double click. */
export const MindMapBlock = memo(function MindMapBlock({ block, onEdit }: MindMapBlockProps) {
  return (
    <g
      data-block-id={block.id}
      role="group"
      aria-label={block.text}
      className="cursor-pointer"
      transform={`translate(${block.x} ${block.y})`}
      onDoubleClick={() => onEdit(block.id)}
    >
      <rect
        width={block.width}
        height={block.height}
        rx={8}
        strokeWidth={1.5}
        strokeDasharray="5 4"
        className="fill-card stroke-muted-foreground"
      />
      {block.lines.map((line, index) => (
        <text
          // Lines of one block never reorder.
          key={index}
          x={block.width / 2}
          y={PAD_Y + index * LINE_HEIGHT + LINE_HEIGHT * 0.72}
          textAnchor="middle"
          fontSize={FONT_SIZE}
          className="fill-foreground pointer-events-none select-none"
        >
          {line}
        </text>
      ))}
    </g>
  )
})
