"use client"

import { cn } from "@ihsp/ui"
import { memo, useMemo } from "react"
import { branchColor } from "./branch-colors"
import type { PositionedNode } from "./layout"
import { FONT_SIZE, TOGGLE_RADIUS, lineBaselines, linesOf } from "./node-metrics"

type MindMapNodeProps = {
  item: PositionedNode
  /** The node that owns the roving tab stop. */
  active: boolean
  /** The node whose details are open. */
  selected: boolean
  onSelect: (id: string) => void
  onToggle: (id: string) => void
  onFocusNode: (id: string) => void
  registerNode: (id: string, element: SVGGElement | null) => void
}

/**
 * One node of the map: a rounded pill (a tree item with `aria-expanded` on branches) and, on branches, the round
 * expand/collapse control on its right edge. The control is a pointer shortcut: keyboard and assistive technology
 * use Enter and the arrow keys on the item, or the button in the details.
 */
export const MindMapNode = memo(function MindMapNode({
  item,
  active,
  selected,
  onSelect,
  onToggle,
  onFocusNode,
  registerNode,
}: MindMapNodeProps) {
  const isRoot = item.branch === null
  const colour = branchColor(item.branch)
  const radius = Math.min(item.height / 2, 18)
  const lines = useMemo(() => linesOf(item.node), [item.node])
  const baselines = lineBaselines(lines.length, item.height)

  return (
    <g
      ref={(element) => registerNode(item.id, element)}
      role="treeitem"
      aria-label={item.node.label}
      aria-level={item.depth + 1}
      aria-posinset={item.position}
      aria-setsize={item.siblings}
      aria-expanded={item.hasChildren ? !item.collapsed : undefined}
      tabIndex={active ? 0 : -1}
      data-node-id={item.id}
      data-branch={item.branch ?? "root"}
      className="group/node cursor-pointer outline-none"
      transform={`translate(${item.x} ${item.y})`}
      onClick={() => onSelect(item.id)}
      onFocus={() => onFocusNode(item.id)}
    >
      <rect
        className="stroke-ring pointer-events-none fill-none opacity-0 group-focus-visible/node:opacity-100"
        x={-4}
        y={-4}
        width={item.width + 8}
        height={item.height + 8}
        rx={radius + 4}
        strokeWidth={2.5}
      />
      <rect
        data-slot="mind-map-pill"
        width={item.width}
        height={item.height}
        rx={radius}
        strokeWidth={selected ? 3 : 1.5}
        // Theme tokens go through `style`: `var()` is not reliable in SVG presentation attributes.
        style={{ fill: colour, fillOpacity: isRoot ? 1 : 0.18, stroke: colour }}
      />
      {lines.map((line, index) => (
        <text
          // Lines of one label never reorder.
          key={index}
          x={item.width / 2}
          y={baselines[index]}
          textAnchor="middle"
          fontSize={FONT_SIZE}
          className={cn(
            "pointer-events-none select-none",
            isRoot ? "fill-primary-foreground font-semibold" : "fill-foreground font-medium",
          )}
        >
          {line}
        </text>
      ))}
      {item.hasChildren ? (
        <g
          data-slot="mind-map-toggle"
          data-expanded={!item.collapsed}
          aria-hidden="true"
          transform={`translate(${item.width} ${item.height / 2})`}
          onClick={(event) => {
            event.stopPropagation()
            onToggle(item.id)
          }}
        >
          {/* A larger, invisible target keeps the small control easy to hit. */}
          <circle r={TOGGLE_RADIUS + 8} fill="transparent" />
          <circle className="fill-background" r={TOGGLE_RADIUS} strokeWidth={1.5} style={{ stroke: colour }} />
          <path
            className="stroke-foreground motion-safe:transition-transform"
            d="M -2 -4 L 2 0 L -2 4"
            fill="none"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: item.collapsed ? "none" : "rotate(180deg)" }}
          />
        </g>
      ) : null}
    </g>
  )
})
