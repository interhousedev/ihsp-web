"use client"

import type { ReactNode } from "react"
import { spanOf, type Widget } from "../model"

/** Rows of a list the tile has room for. */
export function listRows(widget: Widget): number {
  return Math.max(0, spanOf(widget.size).rows * 2 - 1)
}

export function BigNumber({ value, label }: { value: ReactNode; label?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-3xl leading-none font-semibold tabular-nums" data-testid="widget-number">
        {value}
      </span>
      {label ? <span className="text-xs opacity-80">{label}</span> : null}
    </div>
  )
}

export function Lines({ items }: { items: ReactNode[] }) {
  return (
    <ul className="flex min-h-0 flex-col gap-0.5 text-xs">
      {items.map((item, index) => (
        <li key={index} className="truncate">
          {item}
        </li>
      ))}
    </ul>
  )
}
