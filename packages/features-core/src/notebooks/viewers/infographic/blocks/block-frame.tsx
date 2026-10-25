"use client"

import type { InfographicBlock } from "@ihsp/api"
import { cn } from "@ihsp/ui"
import type { CSSProperties, ReactNode } from "react"

/** Block types that take a whole row of the grid. */
const FULL_ROW: ReadonlySet<InfographicBlock["type"]> = new Set(["steps", "comparison", "timeline", "callout"])

type BlockFrameProps = {
  block: InfographicBlock
  /** The title above the content; defaults to `block.title`. Empty: none. */
  title?: string
  /** Position of the block, for the tiles of themes with several card colours. */
  index: number
  tones: readonly string[]
  /** The block is a banner in the accent colour. */
  accent?: boolean
  children: ReactNode
}

/** The card around a block: themed border, radius and fill, and the small title in the accent colour. */
export function BlockFrame({ block, title = block.title, index, tones, accent = false, children }: BlockFrameProps) {
  const style: CSSProperties = { gridColumn: FULL_ROW.has(block.type) ? "1 / -1" : "span 1" }
  const tone = tones.length > 0 ? tones[index % tones.length] : undefined
  if (tone) (style as Record<string, string>)["--ig-card"] = tone
  return (
    <section
      data-block={block.type}
      style={style}
      className={cn(
        "flex min-w-0 flex-col gap-[12px] rounded-(--ig-radius) border-(length:--ig-line-width) border-(--ig-line) p-[22px]",
        "[border-style:var(--ig-line-style)] [box-shadow:var(--ig-shadow)]",
        accent ? "bg-(--ig-accent) text-(--ig-accent-ink)" : "bg-(--ig-card) text-(--ig-ink)",
      )}
    >
      {title ? (
        <h3
          className={cn(
            "text-[15px] leading-[1.2] font-bold tracking-[0.08em] uppercase",
            accent ? "text-(--ig-accent-ink)" : "text-(--ig-accent)",
          )}
        >
          {title}
        </h3>
      ) : null}
      {children}
    </section>
  )
}
